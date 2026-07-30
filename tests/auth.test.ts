import { describe, expect, it } from "vitest";

import {
  HAS_LLM_KEYS,
  MASTRA_BASE_URL,
  anonymousClient,
  demoUserClient,
} from "./helpers.js";

describe("auth", () => {
  it("rejects a request with no bearer token (401)", async () => {
    const res = await fetch(
      `${MASTRA_BASE_URL}/api/agents/supportAgent/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: "hi" }),
      },
    );

    expect(res.status).toBe(401);
  });

  it.skipIf(!HAS_LLM_KEYS)(
    "accepts an anonymous Supabase user (200)",
    async () => {
      const client = await anonymousClient();
      const agent = client.getAgent("supportAgent");

      const response = await agent.generate("Say hello in one short sentence.");

      expect(response.text).toBeTruthy();
    },
  );

  it.skipIf(!HAS_LLM_KEYS)(
    "accepts the registered demo user (200)",
    async () => {
      const client = await demoUserClient();
      const agent = client.getAgent("supportAgent");

      const response = await agent.generate("Say hello in one short sentence.");

      expect(response.text).toBeTruthy();
    },
  );

  if (!HAS_LLM_KEYS) {
    console.log(
      "Skipping authenticated 200 checks: OPENAI_API_KEY is not set.",
    );
  }
});
