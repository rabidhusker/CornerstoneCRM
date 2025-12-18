"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  ListOrdered,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smartphone,
  Monitor,
  ChevronDown,
  Eye,
  Code,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { personalizationTokens, type CampaignSettings } from "@/types/campaign";

interface EmailBuilderProps {
  subjectLine: string;
  contentHtml: string;
  contentText: string;
  settings: CampaignSettings;
  onSubjectChange: (subject: string) => void;
  onContentHtmlChange: (html: string) => void;
  onContentTextChange: (text: string) => void;
  onSettingsChange: (settings: CampaignSettings) => void;
}

export function EmailBuilder({
  subjectLine,
  contentHtml,
  contentText,
  settings,
  onSubjectChange,
  onContentHtmlChange,
  onContentTextChange,
  onSettingsChange,
}: EmailBuilderProps) {
  const [viewMode, setViewMode] = React.useState<"edit" | "preview">("edit");
  const [previewDevice, setPreviewDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = React.useState<"visual" | "text">("visual");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const fromName = settings.from_name || "";
  const fromEmail = settings.from_email || "";
  const replyTo = settings.reply_to || "";

  const handleFromSettingChange = (
    field: "from_name" | "from_email" | "reply_to",
    value: string
  ) => {
    onSettingsChange({
      ...settings,
      [field]: value,
    });
  };

  const insertToken = (token: string) => {
    if (activeTab === "visual" && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = contentHtml;
      const newText = text.substring(0, start) + token + text.substring(end);
      onContentHtmlChange(newText);

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = start + token.length;
        textarea.selectionEnd = start + token.length;
        textarea.focus();
      }, 0);
    }
  };

  const insertTokenToSubject = (token: string) => {
    onSubjectChange(subjectLine + token);
  };

  // Auto-generate plain text from HTML
  const generatePlainText = () => {
    // Simple HTML to text conversion
    const text = contentHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    onContentTextChange(text);
  };

  // Preview with tokens replaced
  const previewContent = React.useMemo(() => {
    let preview = contentHtml;
    // Replace tokens with sample values
    preview = preview.replace(/\{\{first_name\}\}/g, "John");
    preview = preview.replace(/\{\{last_name\}\}/g, "Smith");
    preview = preview.replace(/\{\{full_name\}\}/g, "John Smith");
    preview = preview.replace(/\{\{email\}\}/g, "john.smith@example.com");
    preview = preview.replace(/\{\{phone\}\}/g, "(555) 123-4567");
    preview = preview.replace(/\{\{company\}\}/g, "Acme Corp");
    preview = preview.replace(/\{\{address\}\}/g, "123 Main St");
    preview = preview.replace(/\{\{city\}\}/g, "Los Angeles");
    preview = preview.replace(/\{\{state\}\}/g, "CA");
    return preview;
  }, [contentHtml]);

  const previewSubject = React.useMemo(() => {
    let preview = subjectLine;
    preview = preview.replace(/\{\{first_name\}\}/g, "John");
    preview = preview.replace(/\{\{last_name\}\}/g, "Smith");
    preview = preview.replace(/\{\{company\}\}/g, "Acme Corp");
    return preview;
  }, [subjectLine]);

  return (
    <div className="space-y-6">
      {/* From Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sender Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="from-name">From Name</Label>
            <Input
              id="from-name"
              placeholder="Your Name or Company"
              value={fromName}
              onChange={(e) => handleFromSettingChange("from_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-email">From Email</Label>
            <Input
              id="from-email"
              type="email"
              placeholder="you@company.com"
              value={fromEmail}
              onChange={(e) => handleFromSettingChange("from_email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reply-to">Reply-To (optional)</Label>
            <Input
              id="reply-to"
              type="email"
              placeholder="replies@company.com"
              value={replyTo}
              onChange={(e) => handleFromSettingChange("reply_to", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Subject Line */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Subject Line</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  Insert Token
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-2">
                  <p className="font-medium text-sm">Personalization Tokens</p>
                  <div className="grid gap-1">
                    {personalizationTokens.slice(0, 5).map((token) => (
                      <Button
                        key={token.token}
                        variant="ghost"
                        size="sm"
                        className="justify-start h-auto py-2"
                        onClick={() => insertTokenToSubject(token.token)}
                      >
                        <div className="text-left">
                          <p className="font-mono text-xs">{token.token}</p>
                          <p className="text-xs text-muted-foreground">{token.description}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Enter your email subject line..."
            value={subjectLine}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {subjectLine.length}/150 characters
          </p>
        </CardContent>
      </Card>

      {/* Email Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Email Content</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("edit")}
              >
                Edit
              </Button>
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "edit" ? (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "visual" | "text")}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="visual">Visual Editor</TabsTrigger>
                    <TabsTrigger value="text">Plain Text</TabsTrigger>
                  </TabsList>

                  {/* Token Inserter */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <User className="mr-2 h-4 w-4" />
                        Insert Token
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72">
                      <div className="space-y-2">
                        <p className="font-medium text-sm">Personalization Tokens</p>
                        <div className="grid gap-1">
                          {personalizationTokens.map((token) => (
                            <Button
                              key={token.token}
                              variant="ghost"
                              size="sm"
                              className="justify-start h-auto py-2"
                              onClick={() => insertToken(token.token)}
                            >
                              <div className="text-left">
                                <p className="font-mono text-xs">{token.token}</p>
                                <p className="text-xs text-muted-foreground">{token.description}</p>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <TabsContent value="visual" className="mt-0">
                  {/* Toolbar */}
                  <TooltipProvider>
                    <div className="flex items-center gap-1 p-2 border rounded-t-lg bg-muted/30">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Bold className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bold</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Italic className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Italic</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Underline className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Underline</TooltipContent>
                      </Tooltip>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Link2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Link</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Image className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Insert Image</TooltipContent>
                      </Tooltip>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <List className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bullet List</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Numbered List</TooltipContent>
                      </Tooltip>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <AlignLeft className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Align Left</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <AlignCenter className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Align Center</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <AlignRight className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Align Right</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>

                  {/* Editor */}
                  <Textarea
                    ref={textareaRef}
                    placeholder="Write your email content here..."
                    value={contentHtml}
                    onChange={(e) => onContentHtmlChange(e.target.value)}
                    className="min-h-[300px] rounded-t-none resize-none font-sans"
                  />
                </TabsContent>

                <TabsContent value="text" className="mt-0">
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={generatePlainText}>
                      <Code className="mr-2 h-4 w-4" />
                      Generate from HTML
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Plain text version of your email..."
                    value={contentText}
                    onChange={(e) => onContentTextChange(e.target.value)}
                    className="min-h-[300px] resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Plain text version shown to recipients whose email clients don't support HTML.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            // Preview Mode
            <div className="space-y-4">
              {/* Device Toggle */}
              <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-lg">
                <Button
                  variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Desktop
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Mobile
                </Button>
              </div>

              {/* Preview Frame */}
              <div className="flex justify-center">
                <div
                  className={cn(
                    "border rounded-lg overflow-hidden bg-white transition-all",
                    previewDevice === "desktop" ? "w-full max-w-2xl" : "w-[375px]"
                  )}
                >
                  {/* Email Header */}
                  <div className="p-4 border-b bg-muted/30">
                    <p className="text-sm">
                      <span className="font-medium">From:</span> {fromName || "Your Name"}{" "}
                      &lt;{fromEmail || "you@company.com"}&gt;
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Subject:</span> {previewSubject || "No subject"}
                    </p>
                  </div>

                  {/* Email Body */}
                  <div className="p-6">
                    {previewContent ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {previewContent}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Start writing to see your email preview
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
