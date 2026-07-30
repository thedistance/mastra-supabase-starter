import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { searchKnowledgeTool } from "../tools/search-knowledge.js";

/**
 * Memory has no explicit `storage` here -- it inherits the PostgresStore registered on the
 * Mastra instance (see src/mastra/index.ts). `resource` (the thread owner) and `thread` are
 * supplied per-call: resource comes from the verified Supabase user via mapUserToResourceId,
 * thread is caller-supplied. A thread's resource owner cannot change after the thread is
 * first created -- reusing a thread ID across different users throws.
 */
export const supportAgent = new Agent({
  id: "support-agent",
  name: "Aurora Home Support Agent",
  instructions: `
You are the customer support agent for Aurora Home, a smart thermostat company.

Use the searchKnowledge tool to find information in the Aurora Home knowledge base before
answering questions about products, setup, billing, or policies. Cite the source document's
title when you use information from a search result (for example: "According to
'Returns & Warranty', ...").

If the knowledge base does not contain the answer, say you don't know rather than guessing
or inventing details such as prices or policy terms.

Be concise and friendly. Remember details the customer has already told you earlier in the
conversation.
`.trim(),
  model: process.env.MASTRA_MODEL ?? "openai/gpt-4o-mini",
  tools: { searchKnowledgeTool },
  memory: new Memory({
    options: {
      lastMessages: 20,
    },
  }),
});
