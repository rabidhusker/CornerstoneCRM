"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Clock,
  Paperclip,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  AtSign,
  Loader2,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Email composer props
interface EmailComposerProps {
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
  conversationId?: string;
  contactId?: string;
  onSent?: () => void;
}

// Email data
interface EmailData {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  content: string;
  attachments: File[];
}

export function EmailComposer({
  open,
  onClose,
  defaultTo = "",
  defaultSubject = "",
  conversationId,
  contactId,
  onSent,
}: EmailComposerProps) {
  const [email, setEmail] = useState<EmailData>({
    to: defaultTo,
    cc: "",
    bcc: "",
    subject: defaultSubject,
    content: "",
    attachments: [],
  });
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle sending email
  const handleSend = async (queue: boolean = false) => {
    if (!email.to.trim() || !email.subject.trim() || !email.content.trim()) {
      return;
    }

    setSending(true);

    try {
      const formData: Record<string, unknown> = {
        to: email.to.split(",").map((e) => e.trim()),
        subject: email.subject,
        text: email.content,
        conversationId,
        contactId,
      };

      // Add CC/BCC if provided
      if (email.cc.trim()) {
        formData.cc = email.cc.split(",").map((e) => e.trim());
      }
      if (email.bcc.trim()) {
        formData.bcc = email.bcc.split(",").map((e) => e.trim());
      }

      // Handle scheduling
      if (queue && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(":").map(Number);
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        formData.scheduledAt = scheduledDateTime.toISOString();
        formData.queue = true;
      }

      const response = await fetch("/api/v1/messages/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      // Reset form and close
      setEmail({
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        content: "",
        attachments: [],
      });
      setScheduledDate(undefined);
      onSent?.();
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      // You could show a toast notification here
    } finally {
      setSending(false);
    }
  };

  // Handle file attachment
  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setEmail((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(files)],
      }));
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setEmail((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Insert formatting (basic)
  const insertFormatting = (type: string) => {
    const textarea = document.getElementById("email-content") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = email.content.substring(start, end);
    let newText = "";

    switch (type) {
      case "bold":
        newText = `**${selectedText || "text"}**`;
        break;
      case "italic":
        newText = `*${selectedText || "text"}*`;
        break;
      case "underline":
        newText = `_${selectedText || "text"}_`;
        break;
      case "list":
        newText = `\n- ${selectedText || "item"}\n`;
        break;
      case "ordered":
        newText = `\n1. ${selectedText || "item"}\n`;
        break;
      case "link":
        newText = `[${selectedText || "link text"}](url)`;
        break;
    }

    const content =
      email.content.substring(0, start) +
      newText +
      email.content.substring(end);

    setEmail((prev) => ({ ...prev, content }));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>
            Send an email to your contact
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* To field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="to" className="w-12">
                To:
              </Label>
              <Input
                id="to"
                value={email.to}
                onChange={(e) =>
                  setEmail((prev) => ({ ...prev, to: e.target.value }))
                }
                placeholder="email@example.com"
                className="flex-1"
              />
              <div className="flex gap-1">
                {!showCc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCc(true)}
                  >
                    Cc
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBcc(true)}
                  >
                    Bcc
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* CC field */}
          {showCc && (
            <div className="flex items-center gap-2">
              <Label htmlFor="cc" className="w-12">
                Cc:
              </Label>
              <Input
                id="cc"
                value={email.cc}
                onChange={(e) =>
                  setEmail((prev) => ({ ...prev, cc: e.target.value }))
                }
                placeholder="cc@example.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCc(false);
                  setEmail((prev) => ({ ...prev, cc: "" }));
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* BCC field */}
          {showBcc && (
            <div className="flex items-center gap-2">
              <Label htmlFor="bcc" className="w-12">
                Bcc:
              </Label>
              <Input
                id="bcc"
                value={email.bcc}
                onChange={(e) =>
                  setEmail((prev) => ({ ...prev, bcc: e.target.value }))
                }
                placeholder="bcc@example.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowBcc(false);
                  setEmail((prev) => ({ ...prev, bcc: "" }));
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-2">
            <Label htmlFor="subject" className="w-12">
              Subject:
            </Label>
            <Input
              id="subject"
              value={email.subject}
              onChange={(e) =>
                setEmail((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Email subject"
              className="flex-1"
            />
          </div>

          <Separator />

          {/* Formatting toolbar */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertFormatting("bold")}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertFormatting("italic")}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertFormatting("underline")}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertFormatting("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertFormatting("ordered")}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertFormatting("link")}
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          {/* Email content */}
          <Textarea
            id="email-content"
            value={email.content}
            onChange={(e) =>
              setEmail((prev) => ({ ...prev, content: e.target.value }))
            }
            placeholder="Write your email..."
            className="min-h-[200px] resize-none"
          />

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex flex-wrap gap-2">
                {email.attachments.map((file, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 py-1 px-2"
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <span className="text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleAttachment}
          />
        </div>

        <Separator />

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex items-center gap-2 mr-auto">
            {/* Schedule send */}
            <Popover open={scheduling} onOpenChange={setScheduling}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select
                      value={scheduledTime}
                      onValueChange={setScheduledTime}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0");
                          return [
                            <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>,
                            <SelectItem key={`${hour}:30`} value={`${hour}:30`}>
                              {hour}:30
                            </SelectItem>,
                          ];
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setScheduling(false);
                      handleSend(true);
                    }}
                    disabled={!scheduledDate || sending}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Schedule Send
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {scheduledDate && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {format(scheduledDate, "MMM d")} at {scheduledTime}
                <button
                  type="button"
                  onClick={() => setScheduledDate(undefined)}
                  className="ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>

          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => handleSend(false)}
            disabled={
              sending ||
              !email.to.trim() ||
              !email.subject.trim() ||
              !email.content.trim()
            }
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
