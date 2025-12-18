import type { Workflow } from "@/types/workflow";
import { parsePersonalizationTokens } from "@/lib/utils/email-personalization";

interface SendEmailConfig {
  template_id?: string;
  subject?: string;
  content_html?: string;
  from_name?: string;
  from_email?: string;
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
  [key: string]: any;
}

interface ActionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute send email action
 */
export async function executeSendEmail(
  config: SendEmailConfig,
  contact: Contact,
  workflow: Workflow
): Promise<ActionResult> {
  try {
    // Check if contact has email
    if (!contact.email) {
      return {
        success: false,
        error: "Contact does not have an email address",
      };
    }

    let subject = config.subject || "";
    let contentHtml = config.content_html || "";

    // If using template, fetch it
    if (config.template_id) {
      // In production, fetch template from database
      // For now, we'll use the provided content as fallback
      console.log(`Using template: ${config.template_id}`);
    }

    // Personalize content
    const personalizationData = {
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      full_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      email: contact.email,
      company_name: contact.company_name || "",
      ...contact.custom_fields,
    };

    subject = parsePersonalizationTokens(subject, personalizationData);
    contentHtml = parsePersonalizationTokens(contentHtml, personalizationData);

    // In production, send via email provider (SendGrid, Resend, etc.)
    // For now, log and return success
    console.log("Sending email:", {
      to: contact.email,
      subject,
      from_name: config.from_name,
      from_email: config.from_email,
      workflow_id: workflow.id,
      contact_id: contact.id,
    });

    // Simulate sending
    // await sendViaProvider(...)

    return {
      success: true,
      data: {
        to: contact.email,
        subject,
        sent_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
