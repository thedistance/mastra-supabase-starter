import "dotenv/config";

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Pool } from "pg";

import { KNOWLEDGE_BASE_INDEX, vectorStore } from "../mastra/stores/vector.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("Dropping vector index...");
  try {
    await vectorStore.deleteIndex({ indexName: KNOWLEDGE_BASE_INDEX });
  } catch (error) {
    console.log(`  (nothing to drop: ${(error as Error).message})`);
  }
  await vectorStore.disconnect();

  console.log(
    "Clearing agent memory tables (threads, messages, working memory)...",
  );
  const pool = new Pool({ connectionString: requireEnv("SUPABASE_DB_URL") });
  await pool.query(
    "drop table if exists mastra_messages, mastra_threads, mastra_resources cascade;",
  );
  await pool.end();

  console.log("Re-running ingestion...\n");
  const result = spawnSync("npx", ["tsx", path.join(__dirname, "ingest.ts")], {
    stdio: "inherit",
    cwd: path.resolve(__dirname, "../.."),
  });

  if (result.status !== 0) {
    throw new Error("Ingestion failed during reset.");
  }

  console.log(
    "\nReset complete. The next `npm run dev` will recreate the memory tables automatically.",
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

main().catch((error) => {
  console.error("Reset failed:", error);
  process.exitCode = 1;
});
