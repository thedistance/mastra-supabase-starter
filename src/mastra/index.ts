import { Mastra } from "@mastra/core/mastra";
import { PostgresStore } from "@mastra/pg";
import type { User } from "@supabase/supabase-js";

import { supportAgent } from "./agents/support-agent.js";
import { MastraAuthSupabaseWithStudioLogin } from "./studio-auth.js";

const storage = new PostgresStore({
  id: "mastra-supabase-storage",
  connectionString: requireEnv("SUPABASE_DB_URL"),
});

export const mastra = new Mastra({
  agents: { supportAgent },
  storage,
  server: {
    port: Number(process.env.MASTRA_PORT ?? 4111),
    auth: new MastraAuthSupabaseWithStudioLogin({
      url: requireEnv("SUPABASE_URL"),
      anonKey: requireEnv("SUPABASE_ANON_KEY"),
      // MastraAuthSupabase's *default* authorizeUser() queries
      // `select "isAdmin" from public.users where id = user.id` and only allows admins
      // through -- fine for an internal admin tool, wrong for a customer-support agent
      // that anonymous and registered customers alike should be able to talk to.
      //
      // We override it: authenticateToken() (unchanged) already verified the bearer token
      // against Supabase Auth and rejects anything invalid or missing, so by the time
      // authorizeUser() runs we just need to confirm a user came back. Every authenticated
      // Supabase user -- anonymous or registered -- is allowed through; unauthenticated
      // requests get a 401 from the token-verification step before authorizeUser() is even
      // called.
      authorizeUser: async (user: User) => Boolean(user?.id),
      // Maps the verified Supabase user to the memory `resource` ID. The server derives
      // resourceId from this on every request, taking precedence over any client-supplied
      // `memory.resource` -- so a client can never impersonate another user's memory, and
      // omit `resource` entirely when calling the agent (see src/scripts/chat.ts).
      mapUserToResourceId: (user: User) => user.id,
    }),
  },
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
