"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Mail,
  MessageSquare,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Archive,
  Trash2,
  Clock3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useConversation,
  useConversationMessages,
  useUpdateConversation,
} from "@/lib/hooks/use-conversations";
import { MessageComposer } from "./message-composer";
import { useToast } from "@/hooks/use-toast";
import type { MessageWithSender, ConversationStatus } from "@/types/conversation";

interface ConversationViewProps {
  conversationId: string;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: conversationLoading } =
    useConversation(conversationId);
  const { data: messages, isLoading: messagesLoading } =
    useConversationMessages(conversationId);
  const updateMutation = useUpdateConversation();

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStatusChange = async (newStatus: ConversationStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: conversationId,
        data: { status: newStatus },
      });
      toast({
        title: "Status updated",
        description: `Conversation marked as ${newStatus}`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (conversationLoading || messagesLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("flex", i % 2 === 0 && "justify-end")}>
              <Skeleton className="h-20 w-2/3 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  const contact = conversation.contact;
  const contactName = contact
    ? `${contact.first_name} ${contact.last_name}`
    : "Unknown Contact";

  const ChannelIcon = conversation.channel === "email" ? Mail : MessageSquare;

  return (
    <div className="flex-1 flex flex-col border-r">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              conversation.channel === "email"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"
            )}
          >
            <ChannelIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">{contactName}</h2>
            {conversation.subject && (
              <p className="text-sm text-muted-foreground">
                {conversation.subject}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              conversation.status === "open"
                ? "default"
                : conversation.status === "snoozed"
                ? "secondary"
                : "outline"
            }
          >
            {conversation.status}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversation.status !== "open" && (
                <DropdownMenuItem onClick={() => handleStatusChange("open")}>
                  <Mail className="mr-2 h-4 w-4" />
                  Reopen
                </DropdownMenuItem>
              )}
              {conversation.status !== "closed" && (
                <DropdownMenuItem onClick={() => handleStatusChange("closed")}>
                  <Archive className="mr-2 h-4 w-4" />
                  Close
                </DropdownMenuItem>
              )}
              {conversation.status !== "snoozed" && (
                <DropdownMenuItem onClick={() => handleStatusChange("snoozed")}>
                  <Clock3 className="mr-2 h-4 w-4" />
                  Snooze
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation below</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <MessageComposer
        conversationId={conversationId}
        channel={conversation.channel}
      />
    </div>
  );
}

interface MessageBubbleProps {
  message: MessageWithSender;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";

  const senderName = isOutbound
    ? message.sender?.full_name || "You"
    : "Contact";

  const senderInitials = isOutbound
    ? message.sender?.full_name?.[0]?.toUpperCase() || "Y"
    : "C";

  const timestamp = format(new Date(message.created_at), "MMM d, h:mm a");

  const StatusIcon = () => {
    switch (message.status) {
      case "pending":
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3",
        isOutbound ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.sender?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[70%] space-y-1",
          isOutbound ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isOutbound
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          {message.subject && (
            <p className="font-medium text-sm mb-1">{message.subject}</p>
          )}
          {message.content_html ? (
            <div
              className="text-sm prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: message.content_html }}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            isOutbound ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span>{timestamp}</span>
          {isOutbound && <StatusIcon />}
        </div>

        {/* Attachments */}
        {message.attachments &&
          Array.isArray(message.attachments) &&
          message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(message.attachments as string[]).map((attachment, index) => (
                <a
                  key={index}
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Attachment {index + 1}
                </a>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
