"use client";

import * as React from "react";
import {
  Smartphone,
  User,
  AlertTriangle,
  Info,
  ChevronDown,
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { personalizationTokens, type CampaignSettings } from "@/types/campaign";

interface SmsBuilderProps {
  content: string;
  onContentChange: (content: string) => void;
  settings: CampaignSettings;
  onSettingsChange: (settings: CampaignSettings) => void;
}

// SMS character limits
const SMS_SEGMENT_LENGTH = 160;
const SMS_CONCAT_SEGMENT_LENGTH = 153; // Concatenated SMS segments are 153 chars

function calculateSmsSegments(text: string): {
  characters: number;
  segments: number;
  remaining: number;
} {
  const characters = text.length;

  if (characters === 0) {
    return { characters: 0, segments: 0, remaining: SMS_SEGMENT_LENGTH };
  }

  if (characters <= SMS_SEGMENT_LENGTH) {
    return {
      characters,
      segments: 1,
      remaining: SMS_SEGMENT_LENGTH - characters,
    };
  }

  // For concatenated messages
  const segments = Math.ceil(characters / SMS_CONCAT_SEGMENT_LENGTH);
  const remaining =
    segments * SMS_CONCAT_SEGMENT_LENGTH - characters;

  return { characters, segments, remaining };
}

// Mock contact for preview
const mockContact = {
  first_name: "John",
  last_name: "Smith",
  full_name: "John Smith",
  email: "john.smith@example.com",
  phone: "(555) 123-4567",
  company: "ABC Realty",
  address: "123 Main Street",
  city: "Austin",
  state: "TX",
};

export function SmsBuilder({
  content,
  onContentChange,
  settings,
  onSettingsChange,
}: SmsBuilderProps) {
  const [tokenOpen, setTokenOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const smsInfo = calculateSmsSegments(content);

  // Replace tokens with mock values for preview
  const previewContent = React.useMemo(() => {
    let preview = content;
    preview = preview.replace(/\{\{first_name\}\}/g, mockContact.first_name);
    preview = preview.replace(/\{\{last_name\}\}/g, mockContact.last_name);
    preview = preview.replace(/\{\{full_name\}\}/g, mockContact.full_name);
    preview = preview.replace(/\{\{email\}\}/g, mockContact.email);
    preview = preview.replace(/\{\{phone\}\}/g, mockContact.phone);
    preview = preview.replace(/\{\{company\}\}/g, mockContact.company);
    preview = preview.replace(/\{\{address\}\}/g, mockContact.address);
    preview = preview.replace(/\{\{city\}\}/g, mockContact.city);
    preview = preview.replace(/\{\{state\}\}/g, mockContact.state);
    return preview;
  }, [content]);

  const previewInfo = calculateSmsSegments(previewContent);

  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + token + content.substring(end);
      onContentChange(newContent);

      // Set cursor position after inserted token
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      onContentChange(content + token);
    }
    setTokenOpen(false);
  };

  const getSegmentColor = (segments: number) => {
    if (segments <= 1) return "text-green-600";
    if (segments <= 2) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Editor Panel */}
      <div className="space-y-6">
        {/* Message Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Compose SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token Insertion */}
            <div className="flex items-center gap-2">
              <Label>Personalization:</Label>
              <Popover open={tokenOpen} onOpenChange={setTokenOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <User className="h-4 w-4" />
                    Insert Field
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search fields..." />
                    <CommandList>
                      <CommandEmpty>No field found.</CommandEmpty>
                      <CommandGroup>
                        {personalizationTokens.map((token) => (
                          <CommandItem
                            key={token.token}
                            onSelect={() => handleInsertToken(token.token)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{token.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {token.token}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Type your SMS message here..."
                rows={6}
                className="resize-none font-mono text-sm"
              />

              {/* Character Counter */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span
                    className={cn("font-medium", getSegmentColor(smsInfo.segments))}
                  >
                    {smsInfo.characters} characters
                  </span>
                  <span className="text-muted-foreground">
                    {smsInfo.segments} segment{smsInfo.segments !== 1 && "s"}
                  </span>
                  <span className="text-muted-foreground">
                    {smsInfo.remaining} remaining
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-sm">
                        SMS messages are split into segments of 160 characters
                        (153 for multi-segment messages). Carriers charge per
                        segment.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Segment Warning */}
              {smsInfo.segments > 2 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Long message warning
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      This message will be sent as {smsInfo.segments} segments,
                      which may increase costs.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Opt-out Reminder */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Opt-out compliance
                </p>
                <p className="text-blue-700 dark:text-blue-300">
                  Consider including opt-out instructions (e.g., &quot;Reply STOP to
                  unsubscribe&quot;) to comply with messaging regulations.
                </p>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Quick snippets:
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onContentChange(content + "\n\nReply STOP to unsubscribe.")
                  }
                >
                  + Opt-out text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onContentChange(
                      content + "\n\nCall me: (555) 123-4567"
                    )
                  }
                >
                  + Phone number
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleInsertToken("Hi {{first_name}}, ")
                  }
                >
                  + Greeting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SMS Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sender_id">Sender ID</Label>
              <p className="text-sm text-muted-foreground">
                The phone number or name that appears as the sender.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {settings.sender_id || "Default Number"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (Configured in account settings)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Phone Mockup */}
            <div className="flex justify-center">
              <div className="w-72 bg-gray-900 rounded-[2.5rem] p-3 shadow-xl">
                {/* Phone notch */}
                <div className="flex justify-center mb-2">
                  <div className="w-20 h-5 bg-black rounded-full" />
                </div>

                {/* Phone screen */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex justify-between text-xs">
                    <span className="font-medium">9:41</span>
                    <div className="flex gap-1">
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>

                  {/* Message header */}
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {settings.sender_id || "Business"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          SMS Message
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="p-4 min-h-[300px] bg-gray-50 dark:bg-gray-900">
                    {previewContent ? (
                      <div className="space-y-2">
                        <div className="max-w-[85%] bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-2">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {previewContent}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Now
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                        Your message preview will appear here
                      </div>
                    )}
                  </div>

                  {/* Input area */}
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-gray-600 rounded-full px-4 py-2 text-xs text-muted-foreground">
                      iMessage
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="flex justify-center mt-2">
                  <div className="w-32 h-1 bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>

            {/* Preview Stats */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Estimated segments:</span>
                <Badge
                  variant={previewInfo.segments > 2 ? "destructive" : "secondary"}
                >
                  {previewInfo.segments}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Characters with personalization:</span>
                <span className="text-sm font-medium">
                  ~{previewInfo.characters}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Final character count may vary based on contact data
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
