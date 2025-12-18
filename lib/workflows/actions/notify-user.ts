import type { Workflow } from "@/types/workflow";

interface SendNotificationConfig {
  type: "email" | "in_app" | "slack";
  recipients: string[]; // User IDs or "owner"
  subject: string;
  message: string;
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  assigned_to: string | null;
  [key: string]: any;
}

interface ActionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute send notification action
 */
export async function executeNotifyUser(
  config: SendNotificationConfig,
  contact: Contact,
  workflow: Workflow,
  supabase: any
): Promise<ActionResult> {
  try {
    if (!config.recipients || config.recipients.length === 0) {
      return {
        success: false,
        error: "No recipients specified",
      };
    }

    // Resolve recipient IDs
    const recipientIds = config.recipients.map((r) => {
      if (r === "owner") {
        return contact.assigned_to || workflow.created_by;
      }
      return r;
    }).filter(Boolean);

    if (recipientIds.length === 0) {
      return {
        success: false,
        error: "No valid recipients found",
      };
    }

    // Personalize content
    const personalizationData = {
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      full_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      email: contact.email || "",
      contact_id: contact.id,
      workflow_name: workflow.name,
    };

    const subject = parsePersonalizationTokens(config.subject, personalizationData);
    const message = parsePersonalizationTokens(config.message, personalizationData);

    // Create notifications based on type
    const notifications = [];

    for (const recipientId of recipientIds) {
      if (config.type === "in_app" || config.type === "email") {
        // Create in-app notification
        notifications.push({
          user_id: recipientId,
          workspace_id: workflow.workspace_id,
          type: "workflow_notification",
          title: subject,
          message: message,
          link: `/dashboard/contacts/${contact.id}`,
          read: false,
          metadata: {
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            contact_id: contact.id,
            notification_type: config.type,
          },
        });
      }

      if (config.type === "email") {
        // In production, also send email to user
        // Get user email and send notification email
        console.log(`Sending email notification to user ${recipientId}:`, {
          subject,
          message,
        });
      }

      if (config.type === "slack") {
        // In production, send to Slack via webhook
        console.log(`Sending Slack notification:`, {
          recipient: recipientId,
          message,
        });
      }
    }

    // Insert in-app notifications
    if (notifications.length > 0) {
      const { error } = await supabase
        .from("crm_notifications")
        .insert(notifications);

      if (error) {
        console.error("Error creating notifications:", error);
      }
    }

    return {
      success: true,
      data: {
        notification_type: config.type,
        recipients: recipientIds,
        subject,
        notifications_created: notifications.length,
      },
    };
  } catch (error) {
    console.error("Error sending notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send notification",
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
