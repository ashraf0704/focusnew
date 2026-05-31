import {createClient} from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

if (!supabaseUrl || !anonKey) {
  console.warn('Supabase env vars are missing. API routes will fail until SUPABASE_URL and keys are configured.');
}

export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {persistSession: false, autoRefreshToken: false},
});

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {persistSession: false, autoRefreshToken: false},
});
