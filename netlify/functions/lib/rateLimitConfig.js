/**
 * rateLimitConfig.js
 * ==================
 * Central configuration for all API rate limit policies.
 *
 * Edit this file to tune limits for any endpoint category.
 * No logic code needs to change — only this config.
 *
 * windowMs       : Duration of the sliding window in milliseconds
 * maxRequests    : Maximum allowed requests per window per identifier
 * message        : User-facing message when limit is exceeded
 * retryAfterSecs : Seconds the client should wait before retrying (sent in Retry-After header)
 * skipAuth       : If true, this policy is applied even if user is authenticated
 */

export const RATE_LIMIT_POLICIES = {

  /**
   * AUTH — Login, signup, token operations
   * Tight limit: brute force protection
   */
  auth: {
    name: 'auth',
    windowMs: 15 * 60 * 1000,    // 15 minutes
    maxRequests: 10,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
    retryAfterSecs: 15 * 60,
  },

  /**
   * FORGOT_PASSWORD — Password reset & OTP requests
   * Very tight: prevent email spam / enumeration
   */
  forgotPassword: {
    name: 'forgotPassword',
    windowMs: 60 * 60 * 1000,    // 1 hour
    maxRequests: 5,
    message: 'Too many password reset requests. Please wait 1 hour before trying again.',
    retryAfterSecs: 60 * 60,
  },

  /**
   * TRANSACTIONS — Orders, payments, cart mutations
   * Moderate: prevent order spam and inventory abuse
   */
  transactions: {
    name: 'transactions',
    windowMs: 60 * 1000,          // 1 minute
    maxRequests: 30,
    message: 'Too many transaction requests. Please slow down and try again shortly.',
    retryAfterSecs: 60,
  },

  /**
   * DATA_FETCH — General read operations (GET requests)
   * Generous: users need to browse products/stores freely
   */
  dataFetch: {
    name: 'dataFetch',
    windowMs: 60 * 1000,          // 1 minute
    maxRequests: 120,
    message: 'You are making too many requests. Please wait a moment.',
    retryAfterSecs: 60,
  },

  /**
   * DATA_WRITE — General write operations (POST/PATCH/DELETE)
   * Moderate: covers reviews, profile updates, store edits, etc.
   */
  dataWrite: {
    name: 'dataWrite',
    windowMs: 60 * 1000,          // 1 minute
    maxRequests: 40,
    message: 'Too many write operations. Please slow down.',
    retryAfterSecs: 60,
  },

  /**
   * ADMIN — Admin dashboard operations
   * Generous: admins perform bulk operations
   */
  admin: {
    name: 'admin',
    windowMs: 60 * 1000,          // 1 minute
    maxRequests: 200,
    message: 'Admin rate limit exceeded. Please wait before making more requests.',
    retryAfterSecs: 60,
  },

  /**
   * STORAGE — File uploads / image operations
   * Tight: prevent storage abuse
   */
  storage: {
    name: 'storage',
    windowMs: 5 * 60 * 1000,      // 5 minutes
    maxRequests: 20,
    message: 'Too many file upload requests. Please wait 5 minutes.',
    retryAfterSecs: 5 * 60,
  },

  /**
   * DEFAULT — Catch-all for any route not matched above
   */
  default: {
    name: 'default',
    windowMs: 60 * 1000,          // 1 minute
    maxRequests: 60,
    message: 'Too many requests. Please try again later.',
    retryAfterSecs: 60,
  },
};

/**
 * Routes that should completely skip rate limiting.
 * Add path substrings here (checked via .includes()).
 */
export const RATE_LIMIT_SKIP_PATHS = [
  '/auth/v1/callback',     // OAuth callbacks — must not be blocked
  '/auth/v1/user',         // Token refresh + user fetch — needed for app boot
];

/**
 * In development mode, skip server-side rate limiting entirely.
 * Set DISABLE_RATE_LIMIT=true in local .env to bypass during testing.
 */
export const isDevelopmentMode = () => {
  return (
    process.env.DISABLE_RATE_LIMIT === 'true' ||
    process.env.CONTEXT === 'dev' ||       // Netlify dev context
    process.env.NODE_ENV === 'development'
  );
};
