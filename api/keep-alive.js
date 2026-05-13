import { createClient } from '@supabase/supabase-js';

export default async function handler(request, response) {
  // Authorization check for Vercel Cron Jobs
  // Reference: https://vercel.com/docs/cron-jobs#securing-cron-jobs
  const authHeader = request.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  // Only enforce authorization if CRON_SECRET is configured in Vercel.
  // This ensures the keep-alive works out-of-the-box while remaining secure if configured.
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration in environment variables.');
    return response.status(500).json({ error: 'Internal Server Error: Missing config' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('Starting Supabase keep-alive health check...');
    
    // Perform a lightweight read query to keep the project active.
    // Querying the users table (publicly readable as per schema) for a single record.
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('Supabase keep-alive successful:', data.length > 0 ? 'Found data' : 'Table empty but query worked');
    
    return response.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Supabase project is active.'
    });
  } catch (error) {
    console.error('Supabase keep-alive failed:', error.message);
    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
}
