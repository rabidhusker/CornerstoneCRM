"use client";

import * as React from "react";
import {
  Send,
  Paperclip,
  Smile,
  MoreHorizontal,
  Mail,
  MessageSquare,
  Loader2,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSendMessage } from "@/lib/hooks/use-conversations";
import { CannedResponses } from "./canned-responses";
import { useToast } from "@/hooks/use-toast";
import type { ConversationChannel } from "@/types/conversation";

interface MessageComposerProps {
  conversationId: string;
  channel: ConversationChannel;
}

export function MessageComposer({
  conversationId,
  channel,
}: MessageComposerProps) {
  const { toast } = useToast();
  const [content, setContent] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [showCannedResponses, setShowCannedResponses] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const sendMutation = useSendMessage();

  const isEmail = channel === "email";
  const maxLength = isEmail ? 10000 : 160;
  const isOverLimit = content.length > maxLength;

  const handleSend = async () => {
    if (!content.trim() || isOverLimit || sendMutation.isPending) return;

    try {
      await sendMutation.mutateAsync({
        conversation_id: conversationId,
        content: content.trim(),
        subject: isEmail && subject.trim() ? subject.trim() : undefined,
        channel,
      });

      setContent("");
      setSubject("");
      toast({
        title: "Message sent",
        description: `Your ${channel} has been sent.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertCannedResponse = (responseContent: string) => {
    setContent((prev) => prev + responseContent);
    setShowCannedResponses(false);
    textareaRef.current?.focus();
  };

  return (
    <TooltipProvider>
      <div className="border-t p-4 bg-background">
        {/* Channel indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
              isEmail
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            )}
          >
            {isEmail ? (
              <Mail className="h-3 w-3" />
            ) : (
              <MessageSquare className="h-3 w-3" />
            )}
            Reply via {isEmail ? "Email" : "SMS"}
          </div>

          {!isEmail && (
            <span className="text-xs text-muted-foreground">
              {content.length}/{maxLength} characters
            </span>
          )}
        </div>

        {/* Subject line for email */}
        {isEmail && (
          <Input
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mb-3"
          />
        )}

        {/* Message input */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder={
              isEmail
                ? "Write your email..."
                : "Type your SMS message..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "min-h-[100px] pr-12 resize-none",
              isOverLimit && "border-destructive focus-visible:ring-destructive"
            )}
            rows={isEmail ? 6 : 3}
          />

          {/* Character count for SMS */}
          {!isEmail && isOverLimit && (
            <p className="text-xs text-destructive mt-1">
              Message exceeds {maxLength} character limit
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            {/* Canned responses */}
            <Popover
              open={showCannedResponses}
              onOpenChange={setShowCannedResponses}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Zap className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>Canned responses</TooltipContent>
                  </Tooltip>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0"
                align="start"
                side="top"
              >
                <CannedResponses onSelect={handleInsertCannedResponse} />
              </PopoverContent>
            </Popover>

            {/* Attachments (email only) */}
            {isEmail && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {isEmail ? "Ctrl" : "Cmd"}+Enter to send
            </span>
            <Button
              onClick={handleSend}
              disabled={!content.trim() || isOverLimit || sendMutation.isPending}
              size="sm"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
