import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.warn('SUPABASE_URL / SUPABASE_ANON_KEY not set — DB writes will fail.');
}

export const supabase = createClient(url, key);
