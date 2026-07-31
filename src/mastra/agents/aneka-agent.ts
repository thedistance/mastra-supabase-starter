import { Agent } from "@mastra/core/agent";
import { createEndCallTool } from "@mastra/livekit";
import { Memory } from "@mastra/memory";

import { getBusinessProfile } from "../config/business.js";
import { buildAnekaInstructions } from "../prompts/build-aneka-instructions.js";
import { whatsappSendMessageTool } from "../tools/whatsapp-send-message.js";

/** Tool id must match the prompt (`end_call`) and the LiveKit worker endCall.tool setting. */
export const END_CALL_TOOL_ID = "end_call";

const endCallTool = createEndCallTool({
  id: END_CALL_TOOL_ID,
  description:
    "End the phone call after you have successfully called whatsapp_send_message (when name and callback number were captured) and delivered the approved closing message. Do not call this before WhatsApp notification succeeds.",
});

/**
 * Aneka — inbound phone call assistant for trades businesses.
 * Speaks over LiveKit realtime voice and notifies the owner via WhatsApp.
 */
export const anekaAgent = new Agent({
  id: "aneka-agent",
  name: "Aneka",
  instructions: () => buildAnekaInstructions(getBusinessProfile()),
  model: process.env.MASTRA_MODEL ?? "openai/gpt-4o-mini",
  tools: {
    whatsapp_send_message: whatsappSendMessageTool,
    end_call: endCallTool,
  },
  memory: new Memory({
    options: {
      lastMessages: 40,
    },
  }),
});
