import { createTool } from "@mastra/core/tools";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { embed } from "ai";
import { z } from "zod";

import { KNOWLEDGE_BASE_INDEX, vectorStore } from "../stores/vector.js";

// Constructed inside execute(), not at module scope: ModelRouterEmbeddingModel validates
// that OPENAI_API_KEY is set as soon as it's constructed, and this module is imported at
// server boot. Constructing it eagerly here would crash `mastra dev` on startup for anyone
// who hasn't set OPENAI_API_KEY yet, instead of failing only when the tool actually runs.
function getEmbeddingModel() {
  return new ModelRouterEmbeddingModel("openai/text-embedding-3-small");
}

export const searchKnowledgeTool = createTool({
  id: "search-knowledge",
  description:
    "Searches the Aurora Home support knowledge base for information relevant to a customer question. Returns matching passages with their source document title so the answer can cite them.",
  inputSchema: z.object({
    query: z.string().describe("The customer question or topic to search for."),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        text: z.string(),
        title: z.string(),
        source: z.string(),
        score: z.number(),
      }),
    ),
  }),
  execute: async ({ query }) => {
    const { embedding } = await embed({
      model: getEmbeddingModel(),
      value: query,
    });

    const matches = await vectorStore.query({
      indexName: KNOWLEDGE_BASE_INDEX,
      queryVector: embedding,
      topK: 4,
    });

    return {
      results: matches.map((match) => ({
        text: String(match.metadata?.text ?? ""),
        title: String(match.metadata?.title ?? "Unknown document"),
        source: String(match.metadata?.source ?? "unknown"),
        score: match.score,
      })),
    };
  },
});
