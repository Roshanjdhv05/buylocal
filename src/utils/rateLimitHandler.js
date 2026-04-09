/**
 * rateLimitHandler.js
 * ===================
 * Utility to parse and handle API rate limit errors (HTTP 429).
 *
 * Usage:
 *   try {
 *     await someApiCall();
 *   } catch (err) {
 *     const info = parseRateLimitError(err);
 *     if (info.isRateLimited) {
 *       showError(info.userMessage);
 *     }
 *   }
 */

/**
 * Parses a rate limit error from a Supabase/fetch response or error object.
 *
 * Accepts:
 *   - A raw fetch Response with status 429
 *   - An error object with `.status` and optional `.message`
 *   - A custom error from the Netlify proxy (has `.error === 'rate_limit_exceeded'`)
 *
 * @param {Error|Response|object} error - The error to inspect
 * @returns {{
 *   isRateLimited: boolean,
 *   message: string,
 *   retryAfterSeconds: number,
 *   retryAt: Date | null,
 *   policy: string | null,
 *   userMessage: string,
 * }}
 */
export function parseRateLimitError(error) {
  const NOT_RATE_LIMITED = {
    isRateLimited: false,
    message: '',
    retryAfterSeconds: 0,
    retryAt: null,
    policy: null,
    userMessage: '',
  };

  if (!error) return NOT_RATE_LIMITED;

  // ── Check HTTP status ──────────────────────────────────────────────────────
  const status = error.status || error.statusCode || (error.response?.status);
  if (status !== 429) return NOT_RATE_LIMITED;

  // ── Parse response body ───────────────────────────────────────────────────
  let body = {};
  if (typeof error.data === 'object') {
    body = error.data;
  } else if (typeof error.body === 'object') {
    body = error.body;
  } else if (typeof error.message === 'string') {
    // Supabase errors sometimes embed JSON in the message string
    try {
      body = JSON.parse(error.message);
    } catch {
      body = { message: error.message };
    }
  }

  const retryAfterSeconds = parseInt(
    body.retryAfter ||
    error.headers?.['retry-after'] ||
    error.headers?.['Retry-After'] ||
    '60',
    10
  );

  const retryAt = body.retryAt
    ? new Date(body.retryAt)
    : new Date(Date.now() + retryAfterSeconds * 1000);

  const policy = body.policy || null;
  const serverMessage = body.message || 'Too many requests. Please try again later.';

  return {
    isRateLimited: true,
    message: serverMessage,
    retryAfterSeconds,
    retryAt,
    policy,
    userMessage: formatUserMessage(serverMessage, retryAfterSeconds, retryAt),
  };
}

/**
 * Formats a human-readable countdown message for the user.
 *
 * @param {string} baseMessage      - The server-provided message
 * @param {number} retryAfterSeconds - Seconds until the window resets
 * @param {Date}   retryAt          - Exact time the window resets
 * @returns {string}
 */
export function formatUserMessage(baseMessage, retryAfterSeconds, retryAt) {
  if (!retryAfterSeconds || retryAfterSeconds <= 0) {
    return baseMessage;
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);
  const seconds = retryAfterSeconds % 60;

  let timeStr;
  if (retryAfterSeconds >= 3600) {
    const hours = Math.ceil(retryAfterSeconds / 3600);
    timeStr = `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (retryAfterSeconds >= 60) {
    timeStr = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    timeStr = `${retryAfterSeconds} second${retryAfterSeconds !== 1 ? 's' : ''}`;
  }

  return `${baseMessage} Please try again in ${timeStr}.`;
}

/**
 * Formats a live countdown string (e.g., "2:34") from seconds remaining.
 * Useful for rendering a countdown timer in the UI.
 *
 * @param {number} secondsLeft - Seconds left until the window resets
 * @returns {string}           - Formatted string like "14:23" or "45s"
 */
export function formatCountdown(secondsLeft) {
  if (secondsLeft <= 0) return '';

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

/**
 * Checks if a Supabase error response is a 429 rate limit error.
 * Works with Supabase JS client error objects.
 *
 * @param {object} supabaseError - Error from a Supabase query { error, status }
 * @returns {boolean}
 */
export function isRateLimitError(supabaseError) {
  if (!supabaseError) return false;
  return (
    supabaseError.status === 429 ||
    supabaseError.code === 'rate_limit_exceeded' ||
    supabaseError.message?.toLowerCase().includes('too many requests')
  );
}
