/**
 * rateLimitClassifier.js
 * ======================
 * Maps incoming request paths and methods to the correct rate limit policy.
 *
 * Classification priority (first match wins):
 *   1. Storage operations
 *   2. Auth operations
 *   3. Password recovery
 *   4. Admin operations
 *   5. Transaction mutations (orders, payments, cart)
 *   6. Other write operations (POST/PATCH/PUT/DELETE)
 *   7. Read operations (GET/HEAD)
 *   8. Default catch-all
 */

/**
 * Returns the policy name for a given request path + HTTP method.
 *
 * @param {string} path       - The incoming request path (after proxy strip)
 * @param {string} httpMethod - HTTP method (GET, POST, etc.)
 * @returns {string}          - Policy name key from RATE_LIMIT_POLICIES
 */
export function classifyRequest(path, httpMethod) {
  const method = (httpMethod || 'GET').toUpperCase();
  const normalizedPath = (path || '').toLowerCase();

  // ── 1. Storage (file uploads / downloads) ───────────────────────────────
  if (normalizedPath.startsWith('/storage/')) {
    return 'storage';
  }

  // ── 2. Auth — Login / Signup / Token exchange ────────────────────────────
  // Supabase auth endpoints
  if (
    normalizedPath.includes('/auth/v1/token') ||        // signInWithPassword, OAuth token
    normalizedPath.includes('/auth/v1/signup') ||       // signUp
    normalizedPath.includes('/auth/v1/magiclink') ||    // magic link
    normalizedPath.includes('/auth/v1/otp')             // OTP login
  ) {
    return 'auth';
  }

  // ── 3. Password Reset / OTP Recovery ────────────────────────────────────
  if (
    normalizedPath.includes('/auth/v1/recover') ||      // resetPasswordForEmail
    normalizedPath.includes('/auth/v1/resend')          // resend confirmation
  ) {
    return 'forgotPassword';
  }

  // ── 4. Admin operations ──────────────────────────────────────────────────
  // Detect admin dashboard requests by custom header or path pattern
  if (
    normalizedPath.includes('/rest/v1/admin_') ||       // admin-prefixed tables
    normalizedPath.includes('/rest/v1/rpc/admin_') ||   // admin RPC calls
    normalizedPath.includes('/rest/v1/careers') ||      // career applications (admin only)
    normalizedPath.includes('/rest/v1/reports')         // reports table
  ) {
    return 'admin';
  }

  // ── 5. Transaction-sensitive mutations ───────────────────────────────────
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    if (
      normalizedPath.includes('/rest/v1/orders') ||
      normalizedPath.includes('/rest/v1/order_items') ||
      normalizedPath.includes('/rest/v1/payments') ||
      normalizedPath.includes('/rest/v1/transactions') ||
      normalizedPath.includes('/rest/v1/cart') ||
      normalizedPath.includes('/rest/v1/subscriptions')
    ) {
      return 'transactions';
    }
  }

  // ── 6. General write operations ──────────────────────────────────────────
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    return 'dataWrite';
  }

  // ── 7. General read operations ───────────────────────────────────────────
  if (['GET', 'HEAD'].includes(method)) {
    return 'dataFetch';
  }

  // ── 8. Catch-all ─────────────────────────────────────────────────────────
  return 'default';
}

/**
 * Extracts the best available identifier for rate limiting, in priority order:
 *   1. Authenticated User ID (from JWT sub claim in Authorization header)
 *   2. API Key (from apikey header — can distinguish SDK clients)
 *   3. Client IP address (from x-forwarded-for — last resort)
 *
 * @param {object} event - Netlify function event object
 * @returns {{ type: string, id: string }} - Identifier type and value
 */
export function extractIdentifier(event) {
  const headers = event.headers || {};

  // ── Priority 1: Authenticated User ID from JWT ──────────────────────────
  const authHeader = headers['authorization'] || headers['Authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7); // Remove "Bearer "
      // JWT is base64url encoded: header.payload.signature
      const payloadPart = token.split('.')[1];
      if (payloadPart) {
        // Pad base64 string to valid length
        const padded = payloadPart + '=='.slice((payloadPart.length % 4) || 4);
        const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
        const sub = decoded?.sub;
        if (sub && sub.length > 0) {
          return { type: 'user', id: sub };
        }
      }
    } catch {
      // Malformed JWT — fall through to next priority
    }
  }

  // ── Priority 2: API Key (could be a vendor/SDK key) ─────────────────────
  const apiKey = headers['apikey'] || headers['x-api-key'] || '';
  if (apiKey && apiKey.length > 10) {
    // Use a hash prefix of the key to avoid logging sensitive data
    // Take first 12 chars as a stable short identifier
    return { type: 'apikey', id: apiKey.substring(0, 12) };
  }

  // ── Priority 3: IP Address ───────────────────────────────────────────────
  const forwarded = headers['x-forwarded-for'] || '';
  const ip = forwarded
    ? forwarded.split(',')[0].trim()    // First IP in chain is the client
    : headers['client-ip'] || 'unknown';

  return { type: 'ip', id: ip };
}
