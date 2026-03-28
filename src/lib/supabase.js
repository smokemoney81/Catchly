import { createClient } from '@supabase/supabase-js';

// VITE_ Prefix macht die Vars im Browser verfügbar
// Der anon key ist öffentlich sicher - er wird durch RLS Policies geschützt
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vecxtgwxqzrogthqqdys.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3x3ObpWRTlVSiXo8Y0TvbA_mTeAMcYW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'catchly-auth',
  },
  global: {
    headers: {
      'x-app-name': 'catchly',
    },
  },
});

export const SUPABASE_URL = supabaseUrl;
