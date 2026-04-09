/**
 * rateLimiter.js
 * ==============
 * Core rate limiting engine using Supabase as distributed state storage.
 *
 * Uses a sliding window counter approach:
 *   - Each unique (identifier + policy) combination has a row in rate_limits
 *   - On each request, if the current window is expired, the counter resets
 *   - If within window, counter increments atomically via Supabase upsert
 *
 * This works correctly across multiple Netlify function invocations
 * (stateless / distributed) because all state lives in Supabase.
 *
 * Authentication: Uses SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security.
 */

const SUPABASE_URL = 'https://ohnumyohkpwlkcogwotj.supabase.co';

/**
 * Checks and updates the rate limit for a given identifier + policy.
 *
 * @param {object} identifier    - { type: 'user'|'apikey'|'ip', id: string }
 * @param {object} policy        - A policy object from rateLimitConfig.js
 * @param {string} serviceRoleKey - Supabase service role key (bypasses RLS)
 * @returns {Promise<{
 *   allowed: boolean,
 *   remaining: number,
 *   limit: number,
 *   resetAt: Date,
 *   identifier: string,
 * }>}
 */
export async function checkRateLimit(identifier, policy, serviceRoleKey) {
  // Build a short, unique composite key for this identifier + policy
  const compositeKey = `${identifier.type}:${identifier.id}:${policy.name}`;
  const nowMs = Date.now();
  const windowStartMs = nowMs - policy.windowMs;
  const windowStartISO = new Date(windowStartMs).toISOString();

  try {
    // ── Step 1: Fetch current record ───────────────────────────────────────
    const fetchRes = await fetch(
      `${SUPABASE_URL}/rest/v1/rate_limits?key=eq.${encodeURIComponent(compositeKey)}&select=count,window_start`,
      {
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!fetchRes.ok) {
      // If we can't check the limit, fail open (allow the request) to avoid
      // blocking legitimate users due to infrastructure issues
      console.error('[RateLimit] Failed to fetch rate limit record:', await fetchRes.text());
      return buildAllowedResult(policy, 1);
    }

    const records = await fetchRes.json();
    const existing = records && records[0];

    // ── Step 2: Determine if window has expired ────────────────────────────
    const isNewWindow = !existing ||
      new Date(existing.window_start).getTime() < windowStartMs;

    if (isNewWindow) {
      // Window expired or no record — start fresh window
      await upsertRecord(compositeKey, 1, new Date(nowMs).toISOString(), serviceRoleKey);
      return buildAllowedResult(policy, 1, new Date(nowMs + policy.windowMs));
    }

    // ── Step 3: Within window — check if limit exceeded ───────────────────
    const currentCount = existing.count || 0;
    const resetAt = new Date(new Date(existing.window_start).getTime() + policy.windowMs);

    if (currentCount >= policy.maxRequests) {
      // Limit exceeded — do NOT increment further, just return blocked
      return {
        allowed: false,
        remaining: 0,
        limit: policy.maxRequests,
        resetAt,
        identifier: compositeKey,
      };
    }

    // ── Step 4: Increment counter ─────────────────────────────────────────
    const newCount = currentCount + 1;
    await upsertRecord(compositeKey, newCount, existing.window_start, serviceRoleKey);

    return {
      allowed: true,
      remaining: policy.maxRequests - newCount,
      limit: policy.maxRequests,
      resetAt,
      identifier: compositeKey,
    };

  } catch (error) {
    // Fail open — never block users due to rate limiter errors
    console.error('[RateLimit] Unexpected error in checkRateLimit:', error.message);
    return buildAllowedResult(policy, 0);
  }
}

/**
 * Upserts a rate limit record in Supabase.
 * On conflict (same key), updates the count and updated_at.
 *
 * @param {string} key          - Composite rate limit key
 * @param {number} count        - New count value
 * @param {string} windowStart  - ISO timestamp of window start
 * @param {string} serviceKey   - Supabase service role key
 */
async function upsertRecord(key, count, windowStart, serviceKey) {
  const body = JSON.stringify({
    key,
    count,
    window_start: windowStart,
    updated_at: new Date().toISOString(),
  });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rate_limits?on_conflict=key`,
    {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('[RateLimit] Upsert failed:', text);
  }
}

/**
 * Helper to build an "allowed" result object.
 */
function buildAllowedResult(policy, usedCount, resetAt = null) {
  return {
    allowed: true,
    remaining: Math.max(0, policy.maxRequests - usedCount),
    limit: policy.maxRequests,
    resetAt: resetAt || new Date(Date.now() + policy.windowMs),
    identifier: null,
  };
}

/**
 * Performs periodic cleanup of stale rate limit records.
 * Call this occasionally (e.g., 1% of requests) to keep the table small.
 * This is a fire-and-forget operation — don't await it in the hot path.
 *
 * @param {string} serviceRoleKey - Supabase service role key
 * @param {number} maxAgeMs       - Delete records older than this (default: 2 hours)
 */
export async function cleanupStaleRecords(serviceRoleKey, maxAgeMs = 2 * 60 * 60 * 1000) {
  try {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    await fetch(
      `${SUPABASE_URL}/rest/v1/rate_limits?window_start=lt.${encodeURIComponent(cutoff)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[RateLimit] Cleanup completed for records older than', new Date(cutoff).toISOString());
  } catch (err) {
    // Non-critical — just log it
    console.warn('[RateLimit] Cleanup failed (non-critical):', err.message);
  }
}
