import type { Workflow } from "@/types/workflow";

interface SendSmsConfig {
  message: string;
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  [key: string]: any;
}

interface ActionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute send SMS action
 */
export async function executeSendSms(
  config: SendSmsConfig,
  contact: Contact,
  workflow: Workflow
): Promise<ActionResult> {
  try {
    // Check if contact has phone
    if (!contact.phone) {
      return {
        success: false,
        error: "Contact does not have a phone number",
      };
    }

    // Personalize message
    const personalizationData = {
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      full_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
    };

    const message = parsePersonalizationTokens(
      config.message,
      personalizationData
    );

    // In production, send via Twilio or other SMS provider
    // For now, log and return success
    console.log("Sending SMS:", {
      to: contact.phone,
      message,
      workflow_id: workflow.id,
      contact_id: contact.id,
    });

    // Simulate sending via Twilio
    // const twilioClient = require('twilio')(accountSid, authToken);
    // await twilioClient.messages.create({
    //   body: message,
    //   to: contact.phone,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // });

    return {
      success: true,
      data: {
        to: contact.phone,
        message,
        sent_at: new Date().toISOString(),
        segments: Math.ceil(message.length / 160),
      },
    };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

function parsePersonalizationTokens(
  text: string,
  data: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}
