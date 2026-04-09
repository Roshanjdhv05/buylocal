/**
 * supabase-proxy.js
 * =================
 * Netlify Function: API Gateway + Rate Limiting Middleware
 *
 * Flow:
 *   1. Handle CORS preflight (OPTIONS)
 *   2. Check if rate limiting should be skipped (dev mode, skip paths)
 *   3. Classify request → assign policy
 *   4. Extract identifier (User ID > API Key > IP)
 *   5. Check rate limit → return 429 if exceeded
 *   6. Forward request to Supabase
 *   7. Return response with X-RateLimit-* headers
 */

import { RATE_LIMIT_POLICIES, RATE_LIMIT_SKIP_PATHS, isDevelopmentMode } from './lib/rateLimitConfig.js';
import { classifyRequest, extractIdentifier } from './lib/rateLimitClassifier.js';
import { checkRateLimit, cleanupStaleRecords } from './lib/rateLimiter.js';

const SUPABASE_URL = 'https://ohnumyohkpwlkcogwotj.supabase.co';
const PROXY_PATH = '/api/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// CORS Headers (shared between preflight and actual responses)
// ─────────────────────────────────────────────────────────────────────────────
function buildCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers':
      'Content-Range, X-Supabase-Api-Version, apikey, x-client-info, ' +
      'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build multiValue headers map from a flat object
// ─────────────────────────────────────────────────────────────────────────────
function toMultiValue(headers) {
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    const normalized = key
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join('-');
    result[normalized] = Array.isArray(value) ? value : [String(value)];
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────────────────────
export const handler = async (event, context) => {
  const protocol = event.headers['x-forwarded-proto'] || 'https';
  const PROXY_URL = `${protocol}://${event.headers.host}${PROXY_PATH}`;
  const origin = event.headers.origin || '*';

  // ── Handle CORS Preflight ─────────────────────────────────────────────────
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      multiValueHeaders: toMultiValue(buildCorsHeaders(origin)),
      body: '',
    };
  }

  // ── Build target URL ──────────────────────────────────────────────────────
  const path = event.path.replace(new RegExp(`^${PROXY_PATH}`), '');
  const targetUrl = new URL(path, SUPABASE_URL);

  if (event.queryStringParameters) {
    Object.keys(event.queryStringParameters).forEach(key => {
      targetUrl.searchParams.append(key, event.queryStringParameters[key]);
    });
  }

  console.log(`Proxy: Forwarding ${event.httpMethod} ${event.path} -> ${targetUrl.href}`);

  // ─────────────────────────────────────────────────────────────────────────
  // RATE LIMITING MIDDLEWARE
  // ─────────────────────────────────────────────────────────────────────────
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const devMode = isDevelopmentMode();

  let rateLimitHeaders = {}; // Will be merged into all responses

  const shouldSkip =
    devMode ||
    !serviceRoleKey ||
    RATE_LIMIT_SKIP_PATHS.some(skipPath => path.includes(skipPath));

  if (shouldSkip) {
    if (devMode) {
      console.log('[RateLimit] Skipped: development mode');
    } else if (!serviceRoleKey) {
      console.warn('[RateLimit] Skipped: SUPABASE_SERVICE_ROLE_KEY not set');
    } else {
      console.log('[RateLimit] Skipped: path is in skip list');
    }
  } else {
    // ── Classify & check rate limit ─────────────────────────────────────────
    const policyName = classifyRequest(path, event.httpMethod);
    const policy = RATE_LIMIT_POLICIES[policyName] || RATE_LIMIT_POLICIES.default;
    const identifier = extractIdentifier(event);

    console.log(
      `[RateLimit] Policy: ${policyName} | Identifier: ${identifier.type}:${identifier.id.substring(0, 8)}...`
    );

    const result = await checkRateLimit(identifier, policy, serviceRoleKey);

    // Always include rate limit headers on all responses
    rateLimitHeaders = {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': result.resetAt.toISOString(),
      'X-RateLimit-Policy': policyName,
    };

    // ── Return 429 if limit exceeded ────────────────────────────────────────
    if (!result.allowed) {
      const retryAfter = policy.retryAfterSecs;
      console.warn(
        `[RateLimit] BLOCKED ${identifier.type}:${identifier.id.substring(0, 8)} | Policy: ${policyName}`
      );

      return {
        statusCode: 429,
        multiValueHeaders: toMultiValue({
          ...buildCorsHeaders(origin),
          ...rateLimitHeaders,
          'Retry-After': String(retryAfter),
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          error: 'rate_limit_exceeded',
          message: policy.message,
          retryAfter: retryAfter,
          retryAt: result.resetAt.toISOString(),
          policy: policyName,
        }),
        isBase64Encoded: false,
      };
    }

    // ── Probabilistic cleanup (1% of requests) ─────────────────────────────
    // Fire-and-forget: clean up old records without blocking the response
    if (Math.random() < 0.01) {
      cleanupStaleRecords(serviceRoleKey).catch(() => {});
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PROXY: Forward request to Supabase
  // ─────────────────────────────────────────────────────────────────────────
  const headers = new Headers();
  Object.keys(event.headers).forEach(key => {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, event.headers[key]);
    }
  });

  headers.set('X-Forwarded-Host', event.headers.host || '');
  headers.set('X-Forwarded-Proto', protocol);

  // Handle binary bodies from Netlify (base64 encoded)
  let requestBody = event.body;
  if (event.body && event.isBase64Encoded) {
    requestBody = Buffer.from(event.body, 'base64');
  }

  try {
    const response = await fetch(targetUrl.href, {
      method: event.httpMethod,
      headers: headers,
      body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : requestBody,
      redirect: 'manual',
    });

    const responseHeaders = {
      ...buildCorsHeaders(origin),
      ...rateLimitHeaders, // Attach rate limit info to all successful responses
    };

    const setHeader = (key, value) => {
      const normalized = key
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join('-');
      responseHeaders[normalized] = value;
    };

    // Rewrite Location header for redirects
    if ([301, 302, 307, 308].includes(response.status)) {
      let location = response.headers.get('location');
      if (location) {
        const supOrigin = new URL(SUPABASE_URL).origin;
        console.log(`Proxy: Original Location = ${location}`);
        if (location.startsWith(supOrigin)) {
          location = location.replace(supOrigin, PROXY_URL);
          console.log(`Proxy: Rewritten Location = ${location}`);
        }
        setHeader('Location', location);
      }
    }

    // Robust Cookie Rewriting
    const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    if (setCookies.length > 0) {
      const supHost = new URL(SUPABASE_URL).host;
      const proxHost = event.headers.host;
      const rewrittenCookies = setCookies.map(cookie =>
        cookie.replace(new RegExp(supHost, 'g'), proxHost)
      );
      responseHeaders['Set-Cookie'] = rewrittenCookies;
    }

    for (const [key, value] of response.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (
        ![
          'content-encoding', 'transfer-encoding', 'set-cookie',
          'location', 'content-length', 'connection', 'keep-alive',
          // Don't let Supabase overwrite our rate limit headers
          'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset',
        ].includes(lowerKey)
      ) {
        setHeader(key, value);
      }
    }

    // Build multiValueHeaders from responseHeaders
    const multiValueHeaders = {};
    for (const [key, value] of Object.entries(responseHeaders)) {
      multiValueHeaders[key] = Array.isArray(value) ? value : [String(value)];
    }

    // Handle binary responses (images, videos, files)
    const contentType = response.headers.get('content-type') || '';
    const isBinary =
      contentType.includes('image/') ||
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('pdf');

    if (isBinary) {
      const buffer = await response.arrayBuffer();
      return {
        statusCode: response.status,
        multiValueHeaders,
        body: Buffer.from(buffer).toString('base64'),
        isBase64Encoded: true,
      };
    } else {
      const body = await response.text();
      return {
        statusCode: response.status,
        multiValueHeaders,
        body,
        isBase64Encoded: false,
      };
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      multiValueHeaders: toMultiValue({
        ...buildCorsHeaders(origin),
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        error: 'proxy_error',
        details: error.message,
      }),
      isBase64Encoded: false,
    };
  }
};
