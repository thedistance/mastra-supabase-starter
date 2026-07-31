import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { getBusinessProfile } from "../src/mastra/config/business.js";
import { sendWhatsAppMessage } from "../src/mastra/lib/whatsapp-client.js";
import { buildAnekaInstructions } from "../src/mastra/prompts/build-aneka-instructions.js";
import { whatsappSendMessageTool } from "../src/mastra/tools/whatsapp-send-message.js";

describe("Aneka prompt templating", () => {
  it("fills business placeholders from the profile", () => {
    const profile = getBusinessProfile();
    const instructions = buildAnekaInstructions(profile);

    expect(instructions).toContain(profile.BUSINESS_NAME);
    expect(instructions).toContain(profile.OWNER_NAME);
    expect(instructions).toContain("whatsapp_send_message");
    expect(instructions).toContain("end_call");
    expect(instructions).not.toContain("{{BUSINESS_NAME}}");
    expect(instructions).not.toContain("{{OWNER_NAME}}");
  });
});

describe("WhatsApp client dry-run", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env.WHATSAPP_DRY_RUN = "true";
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it("logs and succeeds without Cloud API credentials", async () => {
    const result = await sendWhatsAppMessage({
      to: "447700900123",
      message: "Test summary",
    });

    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.messageId).toMatch(/^dry-run-/);
  });
});

describe("whatsapp_send_message tool", () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env.WHATSAPP_DRY_RUN = "true";
    process.env.ANEKA_OWNER_WHATSAPP_NUMBER = "447700900123";
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
    vi.restoreAllMocks();
  });

  it("requires the owner WhatsApp number", async () => {
    delete process.env.ANEKA_OWNER_WHATSAPP_NUMBER;

    const result = await whatsappSendMessageTool.execute!(
      {
        summary: "Caller needs a boiler repair",
        callerName: "Alex Smith",
        callerPhone: "07123456789",
      },
      {} as never,
    );

    expect(result).toMatchObject({
      success: false,
      error: expect.stringMatching(/ANEKA_OWNER_WHATSAPP_NUMBER/),
    });
  });

  it("sends a structured summary to the owner", async () => {
    const result = await whatsappSendMessageTool.execute!(
      {
        summary: "Boiler not heating — wants a callback this afternoon",
        callerName: "Alex Smith",
        callerPhone: "07123456789",
        urgency: "urgent",
      },
      {} as never,
    );

    expect(result).toMatchObject({
      success: true,
      dryRun: true,
      to: "447700900123",
    });
  });
});
