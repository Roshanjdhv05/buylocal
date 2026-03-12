import { createClient } from '@supabase/supabase-js';

const isLocal = window.location.hostname === 'localhost';
const supabaseUrl = isLocal 
  ? (import.meta.env.VITE_SUPABASE_URL?.trim() || '') 
  : '/api/supabase';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
} else {
  console.log('Supabase Initialized with:', isLocal ? 'Direct (Local)' : 'Netlify Proxy');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Recommended for modern web apps
  }
});

/**
 * Helper to wrap supabase calls with a timeout to prevent permanent hangs.
 */
export const withTimeout = (promise, ms = 30000, label = 'Operation') => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      console.error(`Timeout error: ${label} took longer than ${ms}ms`);
      reject(new Error(`Connection timeout (${label}). Please check your network or try again.`));
    }, ms);
  });
  return Promise.race([promise, timeout]);
};
