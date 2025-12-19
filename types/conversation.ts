import type { Database } from "./database";

// Re-export base types from database
export type Conversation = Database["public"]["Tables"]["crm_conversations"]["Row"];
export type ConversationInsert = Database["public"]["Tables"]["crm_conversations"]["Insert"];
export type ConversationUpdate = Database["public"]["Tables"]["crm_conversations"]["Update"];

export type ConversationMessage = Database["public"]["Tables"]["crm_conversation_messages"]["Row"];
export type ConversationMessageInsert = Database["public"]["Tables"]["crm_conversation_messages"]["Insert"];
export type ConversationMessageUpdate = Database["public"]["Tables"]["crm_conversation_messages"]["Update"];

export type CannedResponse = Database["public"]["Tables"]["crm_canned_responses"]["Row"];
export type CannedResponseInsert = Database["public"]["Tables"]["crm_canned_responses"]["Insert"];
export type CannedResponseUpdate = Database["public"]["Tables"]["crm_canned_responses"]["Update"];

// Channel types
export type ConversationChannel = "email" | "sms";

// Status types
export type ConversationStatus = "open" | "closed" | "snoozed";

// Message status
export type MessageStatus = "pending" | "sent" | "delivered" | "failed" | "read";

// Message direction
export type MessageDirection = "inbound" | "outbound";

// Extended conversation with relations
export interface ConversationWithDetails extends Conversation {
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    avatar_url?: string | null;
    company_name?: string | null;
  };
  assigned_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: {
    id: string;
    content: string;
    direction: MessageDirection;
    created_at: string;
  };
}

// Extended message with sender info
export interface MessageWithSender extends ConversationMessage {
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Conversation filters
export interface ConversationFilters {
  channel?: ConversationChannel[];
  status?: ConversationStatus[];
  assigned_to?: string;
  search?: string;
}

// Form data for creating/updating conversations
export interface ConversationFormData {
  contact_id: string;
  channel: ConversationChannel;
  status?: ConversationStatus;
  assigned_to?: string;
  subject?: string;
}

// Form data for sending messages
export interface SendMessageData {
  conversation_id: string;
  content: string;
  channel?: ConversationChannel;
  subject?: string;
  attachments?: string[];
}

// Status configuration
export const conversationStatusConfig: Record<
  ConversationStatus,
  { label: string; color: string; bgColor: string }
> = {
  open: {
    label: "Open",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  closed: {
    label: "Closed",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  snoozed: {
    label: "Snoozed",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
};

// Channel configuration
export const channelConfig: Record<
  ConversationChannel,
  { label: string; icon: string }
> = {
  email: {
    label: "Email",
    icon: "mail",
  },
  sms: {
    label: "SMS",
    icon: "message-square",
  },
};
