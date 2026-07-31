import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getOwnerWhatsAppNumber } from "../config/business.js";
import { sendWhatsAppMessage } from "../lib/whatsapp-client.js";

/**
 * Notify the business owner with a call summary over WhatsApp.
 * The destination is always the configured owner number — not the caller.
 */
export const whatsappSendMessageTool = createTool({
  id: "whatsapp_send_message",
  description:
    "Send a WhatsApp summary of this call to the business owner. Mandatory before closing any call where you have captured the caller's name and callback phone number. Prefix with URGENT:, COLD CALL:, or SALES: when required by the instructions.",
  inputSchema: z.object({
    summary: z
      .string()
      .describe(
        "Concise call summary for the owner: caller name, callback number, postcode/location if known, what they need, urgency, and any questions to answer.",
      ),
    callerName: z.string().describe("Caller's full name."),
    callerPhone: z
      .string()
      .describe("Caller's callback phone number as given on the call."),
    urgency: z
      .enum(["normal", "urgent", "cold_call", "sales"])
      .optional()
      .describe("Optional urgency/category tag applied to the message prefix."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    dryRun: z.boolean(),
    to: z.string().optional(),
    messageId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ summary, callerName, callerPhone, urgency }) => {
    const to = getOwnerWhatsAppNumber();
    if (!to) {
      return {
        success: false,
        dryRun: false,
        error:
          "ANEKA_OWNER_WHATSAPP_NUMBER is not configured. Set the owner's WhatsApp number in E.164 format.",
      };
    }

    const prefix =
      urgency === "urgent"
        ? "URGENT: "
        : urgency === "cold_call"
          ? "COLD CALL: "
          : urgency === "sales"
            ? "SALES: "
            : summary.startsWith("URGENT:") ||
                summary.startsWith("COLD CALL:") ||
                summary.startsWith("SALES:")
              ? ""
              : "";

    const body = [
      `${prefix}${summary}`.trim(),
      "",
      `Caller: ${callerName}`,
      `Phone: ${callerPhone}`,
    ].join("\n");

    const result = await sendWhatsAppMessage({ to, message: body });

    return {
      success: result.ok,
      dryRun: result.dryRun,
      to,
      messageId: result.messageId,
      error: result.error,
    };
  },
});
