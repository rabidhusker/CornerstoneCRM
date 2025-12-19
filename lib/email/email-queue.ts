import { createClient } from "@/lib/supabase/server";
import { sendEmailWithRetry, type SendEmailParams } from "./send-email";
import type { Json } from "@/types/database";

// Queue item status
export type QueueStatus = "pending" | "processing" | "sent" | "failed";

// Queue item interface
export interface EmailQueueItem {
  id: string;
  workspace_id: string;
  conversation_id?: string;
  contact_id?: string;
  to: string;
  from: string;
  reply_to?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: string[];
  status: QueueStatus;
  attempts: number;
  max_attempts: number;
  error?: string;
  external_id?: string;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// Queue email parameters
export interface QueueEmailParams {
  workspaceId: string;
  conversationId?: string;
  contactId?: string;
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: string[];
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

// Default from address
const DEFAULT_FROM = process.env.EMAIL_FROM || "noreply@example.com";

/**
 * Add email to queue for async sending
 */
export async function queueEmail(params: QueueEmailParams): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const insertData = {
      workspace_id: params.workspaceId,
      conversation_id: params.conversationId || null,
      contact_id: params.contactId || null,
      to_address: params.to,
      from_address: params.from || DEFAULT_FROM,
      reply_to: params.replyTo || null,
      subject: params.subject,
      html_content: params.html || null,
      text_content: params.text || null,
      attachments: (params.attachments || []) as Json,
      status: "pending",
      attempts: 0,
      max_attempts: 3,
      scheduled_at: params.scheduledAt?.toISOString() || null,
      metadata: (params.metadata || {}) as Json,
    };

    const { data, error } = await (supabase as any)
      .from("crm_email_queue")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Failed to queue email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, queueId: data.id };
  } catch (error) {
    console.error("Error queueing email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Queue multiple emails (bulk operation)
 */
export async function queueBulkEmails(emails: QueueEmailParams[]): Promise<{
  success: boolean;
  queued: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: true,
    queued: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const promises = batch.map((email) => queueEmail(email));
    const batchResults = await Promise.allSettled(promises);

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value.success) {
        results.queued++;
      } else {
        results.failed++;
        const error = result.status === "rejected"
          ? result.reason?.message
          : result.value.error;
        if (error) results.errors.push(error);
      }
    }
  }

  results.success = results.failed === 0;
  return results;
}

/**
 * Get pending emails from queue
 */
export async function getPendingEmails(limit: number = 50): Promise<EmailQueueItem[]> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await (supabase as any)
      .from("crm_email_queue")
      .select("*")
      .eq("status", "pending")
      .lt("attempts", 3) // Less than max attempts
      .or(`scheduled_at.is.null,scheduled_at.lte.${now}`) // Not scheduled or past scheduled time
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Failed to get pending emails:", error);
      return [];
    }

    return (data || []).map(mapQueueRow);
  } catch (error) {
    console.error("Error getting pending emails:", error);
    return [];
  }
}

/**
 * Process a single queued email
 */
export async function processQueueItem(item: EmailQueueItem): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Mark as processing
    await (supabase as any)
      .from("crm_email_queue")
      .update({
        status: "processing",
        attempts: item.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    // Build email params
    const emailParams: SendEmailParams = {
      to: item.to,
      from: item.from,
      subject: item.subject,
      html: item.html,
      text: item.text,
      replyTo: item.reply_to,
    };

    // Send the email
    const result = await sendEmailWithRetry(emailParams, 1); // Single attempt here since we handle retries at queue level

    if (result.success) {
      // Mark as sent
      await (supabase as any)
        .from("crm_email_queue")
        .update({
          status: "sent",
          external_id: result.messageId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      // If linked to a conversation, update the message
      if (item.conversation_id) {
        await updateConversationMessage(supabase, item, result.messageId);
      }

      return { success: true, messageId: result.messageId };
    } else {
      // Check if max attempts reached
      const newStatus = item.attempts + 1 >= item.max_attempts ? "failed" : "pending";

      await (supabase as any)
        .from("crm_email_queue")
        .update({
          status: newStatus,
          error: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await (supabase as any)
      .from("crm_email_queue")
      .update({
        status: item.attempts + 1 >= item.max_attempts ? "failed" : "pending",
        error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    return { success: false, error: errorMessage };
  }
}

/**
 * Process batch of queued emails
 */
export async function processQueue(batchSize: number = 10): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
  };

  const pendingEmails = await getPendingEmails(batchSize);

  for (const email of pendingEmails) {
    const result = await processQueueItem(email);
    results.processed++;

    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
    }

    // Small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(workspaceId?: string): Promise<{
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}> {
  try {
    const supabase = await createClient();

    let query = (supabase as any).from("crm_email_queue").select("status");

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to get queue stats:", error);
      return { pending: 0, processing: 0, sent: 0, failed: 0 };
    }

    const stats = { pending: 0, processing: 0, sent: 0, failed: 0 };
    for (const row of data || []) {
      if (row.status in stats) {
        stats[row.status as keyof typeof stats]++;
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting queue stats:", error);
    return { pending: 0, processing: 0, sent: 0, failed: 0 };
  }
}

/**
 * Retry failed emails
 */
export async function retryFailedEmails(workspaceId?: string): Promise<number> {
  try {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("crm_email_queue")
      .update({
        status: "pending",
        attempts: 0,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("status", "failed");

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }

    const { data, error } = await query.select("id");

    if (error) {
      console.error("Failed to retry emails:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("Error retrying emails:", error);
    return 0;
  }
}

/**
 * Clean up old sent/failed emails
 */
export async function cleanupQueue(olderThanDays: number = 30): Promise<number> {
  try {
    const supabase = await createClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await (supabase as any)
      .from("crm_email_queue")
      .delete()
      .in("status", ["sent", "failed"])
      .lt("updated_at", cutoffDate.toISOString())
      .select("id");

    if (error) {
      console.error("Failed to cleanup queue:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("Error cleaning up queue:", error);
    return 0;
  }
}

// Helper function to map database row to EmailQueueItem
function mapQueueRow(row: any): EmailQueueItem {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    conversation_id: row.conversation_id,
    contact_id: row.contact_id,
    to: row.to_address,
    from: row.from_address,
    reply_to: row.reply_to,
    subject: row.subject,
    html: row.html_content,
    text: row.text_content,
    attachments: row.attachments,
    status: row.status,
    attempts: row.attempts,
    max_attempts: row.max_attempts,
    error: row.error,
    external_id: row.external_id,
    scheduled_at: row.scheduled_at,
    sent_at: row.sent_at,
    created_at: row.created_at,
    metadata: row.metadata,
  };
}

// Helper to update conversation message after sending
async function updateConversationMessage(
  supabase: any,
  item: EmailQueueItem,
  externalId?: string
): Promise<void> {
  try {
    await supabase
      .from("crm_conversation_messages")
      .update({
        status: "sent",
        external_id: externalId,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("conversation_id", item.conversation_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
  } catch (error) {
    console.error("Failed to update conversation message:", error);
  }
}
