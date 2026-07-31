export type SendWhatsAppMessageParams = {
  to: string;
  message: string;
};

export type SendWhatsAppMessageResult = {
  ok: boolean;
  dryRun: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Send a text message via the WhatsApp Cloud API.
 * When credentials are missing (or WHATSAPP_DRY_RUN=true), logs the message and returns dryRun.
 */
export async function sendWhatsAppMessage({
  to,
  message,
}: SendWhatsAppMessageParams): Promise<SendWhatsAppMessageResult> {
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const forceDryRun = process.env.WHATSAPP_DRY_RUN === "true";

  if (forceDryRun || !phoneNumberId || !accessToken) {
    console.info(
      `[whatsapp:dry-run] to=${to} message=${JSON.stringify(message)}`,
    );
    return {
      ok: true,
      dryRun: true,
      messageId: `dry-run-${Date.now()}`,
    };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: message },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      const error = result.error?.message ?? `HTTP ${response.status}`;
      console.error("[whatsapp] send failed:", error);
      return { ok: false, dryRun: false, error };
    }

    return {
      ok: true,
      dryRun: false,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Unknown WhatsApp error";
    console.error("[whatsapp] send error:", messageText);
    return { ok: false, dryRun: false, error: messageText };
  }
}
