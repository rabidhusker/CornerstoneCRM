"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ConversationWithDetails } from "@/types/conversation";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="divide-y">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedId}
          onSelect={() => onSelect(conversation.id)}
        />
      ))}
    </div>
  );
}

interface ConversationListItemProps {
  conversation: ConversationWithDetails;
  isSelected: boolean;
  onSelect: () => void;
}

function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationListItemProps) {
  const contact = conversation.contact;
  const hasUnread = (conversation.unread_count || 0) > 0;

  const contactName = contact
    ? `${contact.first_name} ${contact.last_name}`
    : "Unknown Contact";

  const contactInitials = contact
    ? `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase()
    : "?";

  const lastMessageTime = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: true,
      })
    : "";

  const ChannelIcon = conversation.channel === "email" ? Mail : MessageSquare;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted",
        hasUnread && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={contact?.avatar_url || undefined} />
            <AvatarFallback>{contactInitials}</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              "absolute -bottom-1 -right-1 rounded-full p-1",
              conversation.channel === "email"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"
            )}
          >
            <ChannelIcon className="h-3 w-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "font-medium truncate",
                hasUnread && "font-semibold"
              )}
            >
              {contactName}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {lastMessageTime}
            </span>
          </div>

          {conversation.subject && (
            <p
              className={cn(
                "text-sm truncate",
                hasUnread ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {conversation.subject}
            </p>
          )}

          <p
            className={cn(
              "text-sm truncate",
              hasUnread ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {conversation.last_message_preview || "No messages yet"}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {hasUnread && (
              <Badge variant="default" className="h-5 px-1.5 text-xs">
                {conversation.unread_count}
              </Badge>
            )}

            {conversation.status === "snoozed" && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                Snoozed
              </Badge>
            )}

            {conversation.status === "closed" && (
              <Badge variant="outline" className="h-5 px-1.5 text-xs">
                Closed
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
