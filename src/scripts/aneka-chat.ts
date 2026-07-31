import "dotenv/config";

import { randomUUID } from "node:crypto";
import readline from "node:readline/promises";

import { MastraClient } from "@mastra/client-js";

import { getAnonymousToken, getUserToken } from "../lib/auth.js";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "local-demo-password";

type Args = {
  user: boolean;
  email?: string;
  password?: string;
  thread?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { user: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--user") {
      args.user = true;
    } else if (arg === "--email") {
      args.email = argv[++i];
    } else if (arg === "--password") {
      args.password = argv[++i];
    } else if (arg === "--thread") {
      args.thread = argv[++i];
    }
  }
  return args;
}

async function resolveToken(
  args: Args,
): Promise<{ token: string; label: string }> {
  if (args.email) {
    const password = args.password ?? DEMO_PASSWORD;
    const token = await getUserToken(args.email, password);
    return { token, label: args.email };
  }
  if (args.user) {
    const token = await getUserToken(DEMO_EMAIL, DEMO_PASSWORD);
    return { token, label: DEMO_EMAIL };
  }
  const token = await getAnonymousToken();
  return { token, label: "anonymous" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { token, label } = await resolveToken(args);
  const threadId = args.thread ?? randomUUID();

  const port = process.env.MASTRA_PORT ?? "4111";
  const client = new MastraClient({
    baseUrl: `http://localhost:${port}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const agent = client.getAgent("anekaAgent");

  console.log(`Aneka call simulation (text)`);
  console.log(`Signed in as: ${label}`);
  console.log(`Thread ID:    ${threadId}`);
  console.log(
    `Tip: set WHATSAPP_DRY_RUN=true and ANEKA_OWNER_WHATSAPP_NUMBER to exercise owner notifications.`,
  );
  console.log(
    `Resume later with: npm run aneka:chat -- --thread ${threadId}`,
  );
  console.log("Type as the caller. Ctrl+C to exit.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const input = await rl.question("Caller> ");
    if (!input.trim()) continue;

    const response = await agent.generate(input, {
      memory: { thread: threadId },
    });

    console.log(`Aneka> ${response.text}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
