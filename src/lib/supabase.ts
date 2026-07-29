import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client the same way a browser app would: URL + anon key only, no
 * service role secrets. This is deliberate -- it's the same client shape readers will use
 * in their own frontend, so auth.ts below exercises the real sign-in flows a browser would.
 */
export function createSupabaseClient(): SupabaseClient {
  const url = requireEnv("SUPABASE_URL");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
