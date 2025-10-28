import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? undefined;
}

export function getSupabaseClient(server = true): SupabaseClient | null {
  // Return null if no Supabase is configured
  const url = process.env.SUPABASE_URL;
  // Prefer service role for server operations; fall back to anon key if
  // service role isn't available. Falling back to anon reduces privileges
  // and may fail depending on RLS policies; it's less secure than using
  // a service role key and should only be used if you accept that tradeoff.
  let key: string | undefined;
  if (server) {
    key = getServiceKey() ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  }
  if (!url || !key) return null;
  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}
