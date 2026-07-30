import { MastraAuthSupabase } from "@mastra/auth-supabase";
import { getRequestHeader } from "@mastra/core/server";
import type { MastraAuthRequest } from "@mastra/core/server";
import type { User } from "@supabase/supabase-js";

const TOKEN_COOKIE = "mastra-token";

/**
 * MastraAuthSupabase only verifies a bearer token someone else obtained, so Mastra Studio
 * has no way to sign in and renders "Authentication Required ... no login method is
 * configured" instead of the playground.
 *
 * Studio looks for a `signIn()` method on the auth provider (via GET /api/auth/capabilities)
 * to decide whether to show an email/password form, and for `getCurrentUser()` to decide
 * whether someone is already signed in. Studio's own requests send cookies but no
 * Authorization header, so the Supabase access token is stored in a cookie and read back
 * out on every request.
 *
 * This is for Studio only -- the chat script and tests still send bearer tokens, which the
 * inherited authenticateToken() keeps handling unchanged.
 */
export class MastraAuthSupabaseWithStudioLogin extends MastraAuthSupabase {
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new Error(error?.message ?? "Sign-in failed");
    }

    return {
      user: { id: data.user.id, email: data.user.email },
      token: data.session.access_token,
      cookies: [
        `${TOKEN_COOKIE}=${data.session.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${data.session.expires_in}`,
      ],
    };
  }

  isSignUpEnabled() {
    return false;
  }

  async authenticateToken(
    token: string,
    request?: MastraAuthRequest,
  ): Promise<User | null> {
    return this.verify(token || readTokenCookie(request));
  }

  async getCurrentUser(request: Request) {
    const user = await this.verify(readTokenCookie(request));
    return user ? { id: user.id, email: user.email } : null;
  }

  getClearSessionHeaders() {
    return {
      "Set-Cookie": `${TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    };
  }

  /**
   * Never hand an empty token to the inherited authenticateToken(): signIn() leaves a
   * session on this.supabase, and supabase.auth.getUser() falls back to that session when
   * called without a JWT -- which would authenticate tokenless requests as whoever last
   * signed in to Studio.
   */
  private async verify(token: string): Promise<User | null> {
    return token ? super.authenticateToken(token) : null;
  }
}

function readTokenCookie(request?: MastraAuthRequest): string {
  if (!request) return "";
  const cookie = getRequestHeader(request, "cookie");
  const match = cookie?.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]+)`));
  return match?.[1] ?? "";
}
