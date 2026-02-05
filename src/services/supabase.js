import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Helper to wrap supabase calls with a timeout to prevent permanent hangs.
 */
export const withTimeout = (promise, ms = 10000) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Connection timeout. Please check your network.')), ms);
  });
  return Promise.race([promise, timeout]);
};
