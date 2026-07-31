import { fileURLToPath } from "node:url";

import { createLiveKitWorker, runLiveKitWorker } from "@mastra/livekit/worker";

import { END_CALL_TOOL_ID } from "./agents/aneka-agent.js";
import { getBusinessProfile } from "./config/business.js";
import { mastra } from "./index.js";

const profile = getBusinessProfile();
const greeting =
  profile.CUSTOM_AGENT_INTRODUCTION.trim() ||
  `Hi, you're through to ${profile.BUSINESS_NAME}. I'm the assistant helping ${profile.OWNER_NAME} while they're unavailable. How can I help?`;

/**
 * LiveKit agent worker for Aneka voice calls.
 * Run separately from `mastra dev`:
 *
 *   npx livekit-agents download-files
 *   npm run voice:worker
 */
export default createLiveKitWorker({
  mastra,
  agent: "anekaAgent",
  stt: process.env.ANEKA_STT ?? "deepgram/nova-3",
  tts: process.env.ANEKA_TTS ?? "cartesia/sonic-3",
  turnDetection: "multilingual",
  greeting,
  toolFeedback: ({ toolName }) => {
    if (toolName === "whatsapp_send_message") {
      return "One moment while I pass that on.";
    }
    return undefined;
  },
  configuration: {
    endCall: {
      tool: END_CALL_TOOL_ID,
    },
  },
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runLiveKitWorker({
    entry: import.meta.url,
    agentName: process.env.LIVEKIT_AGENT_NAME ?? "aneka-voice",
  });
}
