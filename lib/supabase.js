import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getRedirectUrl = (path = '') => {
  let origin = 'https://swipe-file-app-ruby.vercel.app';
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    origin = process.env.NEXT_PUBLIC_SITE_URL;
  } else if (typeof window !== 'undefined') {
    origin = window.location.origin;
  }
  // Remove trailing slash
  origin = origin.replace(/\/$/, '');
  return `${origin}${path}`;
};

