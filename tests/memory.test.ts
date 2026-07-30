import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { HAS_LLM_KEYS, anonymousClient } from "./helpers.js";

describe.skipIf(!HAS_LLM_KEYS)("memory", () => {
  it("recalls a fact within the same thread", async () => {
    const client = await anonymousClient();
    const agent = client.getAgent("supportAgent");
    const thread = randomUUID();

    await agent.generate("My order number is AH-4821. Please remember that.", {
      memory: { thread },
    });

    const response = await agent.generate("What is my order number?", {
      memory: { thread },
    });

    expect(response.text).toContain("AH-4821");
  });

  it("does not leak a fact into a different thread for the same user", async () => {
    const client = await anonymousClient();
    const agent = client.getAgent("supportAgent");
    const threadA = randomUUID();
    const threadB = randomUUID();

    await agent.generate("My order number is AH-9137. Please remember that.", {
      memory: { thread: threadA },
    });

    const response = await agent.generate("What is my order number?", {
      memory: { thread: threadB },
    });

    expect(response.text).not.toContain("AH-9137");
  });
});

if (!HAS_LLM_KEYS) {
  console.log(
    "Skipping memory tests: OPENAI_API_KEY is not set.",
  );
}
