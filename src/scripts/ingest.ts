import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";

import { KNOWLEDGE_BASE_INDEX, vectorStore } from "../mastra/stores/vector.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.resolve(__dirname, "../../seed/knowledge");
const EMBEDDING_MODEL = new ModelRouterEmbeddingModel(
  "openai/text-embedding-3-small",
);

type ChunkRecord = {
  id: string;
  text: string;
  source: string;
  title: string;
};

function titleFromMarkdown(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : fallback;
}

async function main() {
  const files = (await readdir(KNOWLEDGE_DIR))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No markdown files found in ${KNOWLEDGE_DIR}`);
  }

  const records: ChunkRecord[] = [];

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const content = await readFile(filePath, "utf-8");
    const title = titleFromMarkdown(content, file.replace(/\.md$/, ""));

    const doc = MDocument.fromMarkdown(content);
    const chunks = await doc.chunk({
      strategy: "recursive",
      maxSize: 512,
      overlap: 50,
    });

    chunks.forEach((chunk, index) => {
      records.push({
        id: `${file}::chunk-${index}`,
        text: chunk.text,
        source: file,
        title,
      });
    });

    console.log(`  ${file}: ${chunks.length} chunk(s)`);
  }

  console.log(
    `\nEmbedding ${records.length} chunk(s) with text-embedding-3-small...`,
  );
  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: records.map((r) => r.text),
  });
  console.log(
    `Generated ${embeddings.length} embedding(s) (dimension: ${embeddings[0]?.length ?? 0}).`,
  );

  await vectorStore.createIndex({
    indexName: KNOWLEDGE_BASE_INDEX,
    dimension: embeddings[0].length,
  });

  // Idempotent re-ingestion: delete every existing chunk for a source file before
  // upserting its freshly embedded chunks, so re-running this script never duplicates
  // vectors and correctly handles a source file that now chunks into fewer pieces.
  for (const file of files) {
    await vectorStore.deleteVectors({
      indexName: KNOWLEDGE_BASE_INDEX,
      filter: { source: file },
    });
  }

  await vectorStore.upsert({
    indexName: KNOWLEDGE_BASE_INDEX,
    vectors: embeddings,
    ids: records.map((r) => r.id),
    metadata: records.map((r) => ({
      source: r.source,
      title: r.title,
      text: r.text,
    })),
  });

  console.log(
    `\nIngested ${records.length} chunk(s) from ${files.length} document(s) into index "${KNOWLEDGE_BASE_INDEX}".`,
  );

  await vectorStore.disconnect();
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exitCode = 1;
});
