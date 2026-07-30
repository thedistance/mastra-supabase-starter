import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { HAS_LLM_KEYS, anonymousClient } from "./helpers.js";

describe.skipIf(!HAS_LLM_KEYS)("rag", () => {
  it("answers a warranty question from the knowledge base", async () => {
    const client = await anonymousClient();
    const agent = client.getAgent("supportAgent");

    const response = await agent.generate(
      "How long is the warranty on my Aurora Thermostat?",
      {
        memory: { thread: randomUUID() },
      },
    );

    const text = response.text.toLowerCase();
    expect(text.includes("2 year") || text.includes("two year")).toBe(true);
  });

  it("answers a pricing question from the knowledge base", async () => {
    const client = await anonymousClient();
    const agent = client.getAgent("supportAgent");

    const response = await agent.generate(
      "How much does the Plus plan cost per month?",
      {
        memory: { thread: randomUUID() },
      },
    );

    expect(response.text).toContain("£3.99");
  });

  it("says it doesn't know rather than inventing an answer outside the knowledge base", async () => {
    const client = await anonymousClient();
    const agent = client.getAgent("supportAgent");

    const response = await agent.generate(
      "How much does the Aurora Home smart plug cost?",
      {
        memory: { thread: randomUUID() },
      },
    );

    // Aurora Home doesn't make a smart plug (see faq.md) -- the agent must not invent a
    // price for a product that isn't in the knowledge base.
    expect(response.text).not.toMatch(/£\d/);
  });
});

if (!HAS_LLM_KEYS) {
  console.log(
    "Skipping RAG tests: OPENAI_API_KEY is not set.",
  );
}
