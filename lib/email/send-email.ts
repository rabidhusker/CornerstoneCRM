import { Resend } from "resend";

// Lazy initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Email attachment type
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

// Send email parameters
export interface SendEmailParams {
  to: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  tags?: { name: string; value: string }[];
  headers?: Record<string, string>;
}

// Send email result
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Default from address
const DEFAULT_FROM = process.env.EMAIL_FROM || "noreply@example.com";

/**
 * Send an email using Resend
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, from = DEFAULT_FROM, replyTo, subject, html, text, attachments, tags, headers } = params;

  // Validate required fields
  if (!to || (Array.isArray(to) && to.length === 0)) {
    return { success: false, error: "Recipient email is required" };
  }

  if (!subject) {
    return { success: false, error: "Subject is required" };
  }

  if (!html && !text) {
    return { success: false, error: "Email body (html or text) is required" };
  }

  try {
    // Build email payload - use type assertion to handle Resend's complex union types
    const toAddresses = Array.isArray(to) ? to : [to];

    // Prepare attachments if provided
    const processedAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: typeof att.content === "string" ? Buffer.from(att.content, "base64") : att.content,
    }));

    // Send the email using the appropriate method based on content type
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from,
      to: toAddresses,
      subject,
      html: html || text || "",
      text: text,
      replyTo: replyTo,
      tags: tags,
      headers: headers,
      attachments: processedAttachments,
    } as any);

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  params: SendEmailParams,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<SendEmailResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(params);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Don't retry for validation errors
    if (
      lastError?.includes("required") ||
      lastError?.includes("invalid") ||
      lastError?.includes("Invalid")
    ) {
      return result;
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`,
  };
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get Resend email status
 */
export async function getEmailStatus(messageId: string): Promise<{
  status: string;
  error?: string;
}> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.get(messageId);

    if (error) {
      return { status: "unknown", error: error.message };
    }

    // Map Resend status to our status
    const statusMap: Record<string, string> = {
      queued: "pending",
      sent: "sent",
      delivered: "delivered",
      bounced: "failed",
      complained: "failed",
    };

    return {
      status: statusMap[data?.last_event || "sent"] || "sent",
    };
  } catch (error) {
    console.error("Failed to get email status:", error);
    return {
      status: "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
