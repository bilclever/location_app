import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase non configuré: vérifiez REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

let currentSupabaseSession = null;

export const getSupabaseAccessToken = () => currentSupabaseSession?.access_token || null;

if (isSupabaseConfigured && supabase) {
  supabase.auth.getSession()
    .then(({ data }) => {
      currentSupabaseSession = data?.session || null;
    })
    .catch(() => {
      currentSupabaseSession = null;
    });

  supabase.auth.onAuthStateChange((_event, session) => {
    currentSupabaseSession = session || null;
  });
}
