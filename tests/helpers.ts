import { MastraClient } from "@mastra/client-js";

import { getAnonymousToken, getUserToken } from "../src/lib/auth.js";

export const MASTRA_BASE_URL = `http://localhost:${process.env.MASTRA_PORT ?? "4111"}`;

export const HAS_OPENAI_KEY = Boolean(process.env.OPENAI_API_KEY);

// The support agent always has the search-knowledge tool attached, so any live call to it
// is potentially RAG-capable regardless of what the prompt is about. Embeddings and the
// default LLM both use OpenAI, so one key covers agent tests.
export const HAS_LLM_KEYS = HAS_OPENAI_KEY;

export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "local-demo-password";

export function clientWithToken(token: string): MastraClient {
  return new MastraClient({
    baseUrl: MASTRA_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function anonymousClient(): Promise<MastraClient> {
  const token = await getAnonymousToken();
  return clientWithToken(token);
}

export async function demoUserClient(): Promise<MastraClient> {
  const token = await getUserToken(DEMO_EMAIL, DEMO_PASSWORD);
  return clientWithToken(token);
}
