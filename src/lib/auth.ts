import { createSupabaseClient } from "./supabase.js";

/**
 * Signs in as a brand-new anonymous Supabase user and returns their access token.
 * Anonymous sign-in must be enabled on the local stack (see supabase/config.toml,
 * auth.enable_anonymous_sign_ins). Each call creates a *new* anonymous user -- there is no
 * "log back in" for anonymous sessions, which is why the chat script's --thread flag is
 * what lets you resume a conversation rather than the anonymous identity itself.
 */
export async function getAnonymousToken(): Promise<string> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.session) {
    throw new Error(
      `Anonymous sign-in failed: ${error?.message ?? "no session returned"}`,
    );
  }

  return data.session.access_token;
}

/**
 * Signs in a registered user with email + password and returns their access token.
 * Used for the seeded demo account (demo@example.com, see supabase/seed.sql) and any other
 * registered user you create locally.
 */
export async function getUserToken(
  email: string,
  password: string,
): Promise<string> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(
      `Sign-in failed for ${email}: ${error?.message ?? "no session returned"}`,
    );
  }

  return data.session.access_token;
}
