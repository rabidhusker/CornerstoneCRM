"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ConversationWithDetails,
  MessageWithSender,
  ConversationFilters,
  SendMessageData,
  CannedResponse,
} from "@/types/conversation";

// Query keys
const CONVERSATIONS_QUERY_KEY = "conversations";
const CANNED_RESPONSES_QUERY_KEY = "canned-responses";

// ============================================
// API Functions - Conversations
// ============================================

async function fetchConversations(
  filters?: ConversationFilters
): Promise<ConversationWithDetails[]> {
  const params = new URLSearchParams();

  if (filters?.channel?.length) {
    filters.channel.forEach((c) => params.append("channel", c));
  }
  if (filters?.status?.length) {
    filters.status.forEach((s) => params.append("status", s));
  }
  if (filters?.assigned_to) {
    params.append("assigned_to", filters.assigned_to);
  }
  if (filters?.search) {
    params.append("search", filters.search);
  }

  const url = `/api/v1/conversations${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  const data = await response.json();
  return data.conversations;
}

async function fetchConversation(
  conversationId: string
): Promise<ConversationWithDetails> {
  const response = await fetch(`/api/v1/conversations/${conversationId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch conversation");
  }

  const data = await response.json();
  return data.conversation;
}

async function fetchConversationMessages(
  conversationId: string
): Promise<MessageWithSender[]> {
  const response = await fetch(
    `/api/v1/conversations/${conversationId}/messages`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }

  const data = await response.json();
  return data.messages;
}

async function updateConversation({
  id,
  data,
}: {
  id: string;
  data: { status?: string; assigned_to?: string };
}): Promise<ConversationWithDetails> {
  const response = await fetch(`/api/v1/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update conversation");
  }

  const result = await response.json();
  return result.conversation;
}

async function sendMessage(data: SendMessageData): Promise<MessageWithSender> {
  const response = await fetch(
    `/api/v1/conversations/${data.conversation_id}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  const result = await response.json();
  return result.message;
}

async function markConversationRead(conversationId: string): Promise<void> {
  const response = await fetch(
    `/api/v1/conversations/${conversationId}/read`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to mark conversation as read");
  }
}

// ============================================
// API Functions - Canned Responses
// ============================================

async function fetchCannedResponses(): Promise<CannedResponse[]> {
  const response = await fetch("/api/v1/canned-responses");

  if (!response.ok) {
    throw new Error("Failed to fetch canned responses");
  }

  const data = await response.json();
  return data.responses;
}

async function createCannedResponse(data: {
  name: string;
  content: string;
  shortcut?: string;
  category?: string;
  is_shared?: boolean;
}): Promise<CannedResponse> {
  const response = await fetch("/api/v1/canned-responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create canned response");
  }

  const result = await response.json();
  return result.response;
}

async function updateCannedResponse({
  id,
  data,
}: {
  id: string;
  data: Partial<{
    name: string;
    content: string;
    shortcut: string;
    category: string;
    is_shared: boolean;
  }>;
}): Promise<CannedResponse> {
  const response = await fetch(`/api/v1/canned-responses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update canned response");
  }

  const result = await response.json();
  return result.response;
}

async function deleteCannedResponse(id: string): Promise<void> {
  const response = await fetch(`/api/v1/canned-responses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete canned response");
  }
}

// ============================================
// React Query Hooks - Conversations
// ============================================

// Hook for fetching all conversations
export function useConversations(filters?: ConversationFilters) {
  return useQuery({
    queryKey: [CONVERSATIONS_QUERY_KEY, filters],
    queryFn: () => fetchConversations(filters),
    refetchInterval: 30000, // Refresh every 30 seconds for new messages
  });
}

// Hook for fetching a single conversation
export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: [CONVERSATIONS_QUERY_KEY, conversationId],
    queryFn: () => fetchConversation(conversationId!),
    enabled: !!conversationId,
  });
}

// Hook for fetching messages in a conversation
export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: [CONVERSATIONS_QUERY_KEY, conversationId, "messages"],
    queryFn: () => fetchConversationMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 10000, // Refresh every 10 seconds for new messages
  });
}

// Hook for updating a conversation
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateConversation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_QUERY_KEY] });
      queryClient.setQueryData([CONVERSATIONS_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for sending a message
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_QUERY_KEY, variables.conversation_id, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_QUERY_KEY] });
    },
  });
}

// Hook for marking conversation as read
export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markConversationRead,
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_QUERY_KEY, conversationId],
      });
    },
  });
}

// ============================================
// React Query Hooks - Canned Responses
// ============================================

// Hook for fetching canned responses
export function useCannedResponses() {
  return useQuery({
    queryKey: [CANNED_RESPONSES_QUERY_KEY],
    queryFn: fetchCannedResponses,
  });
}

// Hook for creating a canned response
export function useCreateCannedResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCannedResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CANNED_RESPONSES_QUERY_KEY] });
    },
  });
}

// Hook for updating a canned response
export function useUpdateCannedResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCannedResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CANNED_RESPONSES_QUERY_KEY] });
    },
  });
}

// Hook for deleting a canned response
export function useDeleteCannedResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCannedResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CANNED_RESPONSES_QUERY_KEY] });
    },
  });
}

// Hook for invalidating conversations cache
export function useInvalidateConversations() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [CONVERSATIONS_QUERY_KEY] });
  };
}
