import { PgVector } from "@mastra/pg";

/**
 * Shared PgVector instance for the knowledge base index. Both the ingest script and the
 * search-knowledge tool query through this single instance so they always agree on the
 * connection and index name.
 */
export const KNOWLEDGE_BASE_INDEX = "knowledge_base";

export const vectorStore = new PgVector({
  id: "aurora-home-vector-store",
  connectionString: requireEnv("SUPABASE_DB_URL"),
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
