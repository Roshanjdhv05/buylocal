/**
 * useRateLimit.js
 * ===============
 * Client-side rate limiting React hook using localStorage.
 *
 * PURPOSE: UX improvement only — not a security control.
 * The backend (Netlify function) is the true enforcement layer.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'rl_';

/**
 * @param {string} key     - Unique identifier for this limit (e.g. 'login', 'forgotPassword')
 * @param {object} policy  - { windowMs: number, maxRequests: number }
 */
export function useRateLimit(key, policy) {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  // ── Read / Write localStorage ─────────────────────────────────────────────
  const readState = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [storageKey]);

  const writeState = useCallback((s) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      // localStorage unavailable — fail silently
    }
  }, [storageKey]);

  // ── Helper: compute current state from localStorage ───────────────────────
  const computeFromStorage = useCallback(() => {
    const state = readState();
    if (!state) {
      return { count: 0, windowStart: null, expired: true };
    }
    const expired = Date.now() > state.windowStart + policy.windowMs;
    return { count: expired ? 0 : state.count, windowStart: state.windowStart, expired };
  }, [readState, policy.windowMs]);

  // ── Core state: use a single object to avoid batching issues ─────────────
  const [rl, setRl] = useState(() => {
    const { count, windowStart, expired } = computeFromStorage();
    const remaining = policy.maxRequests - count;
    const isBlocked = remaining <= 0 && !expired;
    const resetAt = isBlocked && windowStart
      ? new Date(windowStart + policy.windowMs)
      : null;
    return {
      count,
      remaining: Math.max(0, remaining),
      isBlocked,
      resetAt,
      hasAttempted: count > 0 && !expired,
    };
  });

  // ── Countdown: seconds left until window resets ───────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!rl.resetAt) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        // Window expired — reset everything
        writeState(null);
        try { localStorage.removeItem(storageKey); } catch {}
        setRl({
          count: 0,
          remaining: policy.maxRequests,
          isBlocked: false,
          resetAt: null,
          hasAttempted: false,
        });
        setSecondsLeft(0);
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [rl.resetAt, policy.maxRequests, storageKey, writeState]);

  // ── checkLimit: call BEFORE making an API request ─────────────────────────
  const checkLimit = useCallback(() => {
    const now = Date.now();
    const stored = readState();

    let count;
    let windowStart;

    if (!stored || now > stored.windowStart + policy.windowMs) {
      // No record or window expired — fresh start
      count = 1;
      windowStart = now;
    } else {
      count = stored.count + 1;
      windowStart = stored.windowStart;
    }

    // Persist updated count
    writeState({ count, windowStart });

    const remaining = Math.max(0, policy.maxRequests - count);
    const isBlocked = count > policy.maxRequests;
    const resetAt = new Date(windowStart + policy.windowMs);

    // Update all state in a single call (avoids stale-closure batching issue)
    setRl({
      count,
      remaining,
      isBlocked,
      resetAt: isBlocked || remaining === 0 ? resetAt : null,
      hasAttempted: true,
    });

    if (isBlocked) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return { allowed: true, remaining, resetAt: remaining === 0 ? resetAt : null };
  }, [policy, readState, writeState]);

  // ── reset: clear counter after successful action ──────────────────────────
  const reset = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch {}
    setRl({
      count: 0,
      remaining: policy.maxRequests,
      isBlocked: false,
      resetAt: null,
      hasAttempted: false,
    });
    setSecondsLeft(0);
  }, [storageKey, policy.maxRequests]);

  return {
    checkLimit,
    remaining: rl.remaining,
    maxRequests: policy.maxRequests,
    resetAt: rl.resetAt,
    isLimited: rl.isBlocked,
    hasAttempted: rl.hasAttempted,
    secondsLeft,
    reset,
  };
}

/**
 * Pre-built policies matching backend config.
 */
export const CLIENT_RATE_POLICIES = {
  auth: {
    windowMs: 15 * 60 * 1000,   // 15 minutes
    maxRequests: 10,
  },
  forgotPassword: {
    windowMs: 60 * 60 * 1000,   // 1 hour
    maxRequests: 5,
  },
  transactions: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  default: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
};
