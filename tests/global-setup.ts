import "dotenv/config";

import { spawn, type ChildProcess } from "node:child_process";

const MASTRA_PORT = process.env.MASTRA_PORT ?? "4111";
const MASTRA_BASE_URL = `http://localhost:${MASTRA_PORT}`;
const READY_TIMEOUT_MS = 60_000;

async function isServerUp(): Promise<boolean> {
  try {
    const res = await fetch(`${MASTRA_BASE_URL}/api`);
    return res.ok || res.status === 404; // any HTTP response means the server is up
  } catch {
    return false;
  }
}

function killProcessGroup(child: ChildProcess): void {
  if (!child.pid) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill();
  }
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isServerUp()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `Mastra dev server did not become ready at ${MASTRA_BASE_URL} within ${READY_TIMEOUT_MS}ms. ` +
      "Check that `supabase start` has been run and SUPABASE_DB_URL in .env is correct.",
  );
}

export default async function globalSetup() {
  for (const name of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_DB_URL"]) {
    if (!process.env[name]) {
      throw new Error(
        `Missing ${name}. Copy .env.example to .env, run \`supabase start\`, and fill in the printed values before running tests.`,
      );
    }
  }

  if (await isServerUp()) {
    console.log(
      `[tests] Using already-running Mastra server at ${MASTRA_BASE_URL}.`,
    );
    return async () => {};
  }

  console.log("[tests] Starting Mastra dev server for the test run...");
  // `npx mastra dev` spawns its own child process for the actual server, so killing just
  // this process leaves that child (and its esbuild service) running. `detached: true`
  // makes this process the leader of a new process group; killing the whole group with a
  // negative PID takes the descendants down with it.
  const child: ChildProcess = spawn("npx", ["mastra", "dev"], {
    env: { ...process.env, MASTRA_TELEMETRY_DISABLED: "1" },
    stdio: "pipe",
    detached: true,
  });

  let output = "";
  child.stdout?.on("data", (chunk) => (output += chunk.toString()));
  child.stderr?.on("data", (chunk) => (output += chunk.toString()));

  try {
    await waitForServer();
  } catch (error) {
    console.error(output);
    killProcessGroup(child);
    throw error;
  }

  console.log("[tests] Mastra dev server ready.");

  return async () => {
    killProcessGroup(child);
  };
}
