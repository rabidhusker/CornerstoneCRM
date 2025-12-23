"use client";

import * as React from "react";
import DOMPurify from "dompurify";
import {
  Monitor,
  Smartphone,
  Moon,
  Sun,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generatePreview, parsePersonalizationTokens, sampleContact } from "@/lib/utils/email-personalization";
import type { Contact } from "@/types/contact";

type DeviceType = "desktop" | "mobile";
type ThemeMode = "light" | "dark";

interface EmailPreviewProps {
  subjectLine?: string;
  contentHtml?: string;
  fromName?: string;
  fromEmail?: string;
  contact?: Partial<Contact>;
  className?: string;
}

export function EmailPreview({
  subjectLine = "",
  contentHtml = "",
  fromName = "Your Company",
  fromEmail = "noreply@company.com",
  contact,
  className,
}: EmailPreviewProps) {
  const [device, setDevice] = React.useState<DeviceType>("desktop");
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Parse content with personalization
  const personalizedSubject = React.useMemo(() => {
    const contactData = contact || sampleContact;
    return parsePersonalizationTokens(subjectLine, contactData as Partial<Contact> & { full_name?: string });
  }, [subjectLine, contact]);

  const personalizedContent = React.useMemo(() => {
    const contactData = contact || sampleContact;
    return parsePersonalizationTokens(contentHtml, contactData as Partial<Contact> & { full_name?: string });
  }, [contentHtml, contact]);

  const previewFrame = (
    <div
      className={cn(
        "transition-all",
        device === "desktop" ? "w-full max-w-2xl" : "w-[375px]"
      )}
    >
      {/* Email Client Frame */}
      <div
        className={cn(
          "border rounded-lg overflow-hidden shadow-sm",
          theme === "dark" ? "bg-gray-900" : "bg-white"
        )}
      >
        {/* Email Header */}
        <div
          className={cn(
            "p-4 border-b",
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50"
          )}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium w-16",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}
              >
                From:
              </span>
              <span
                className={cn(
                  "text-sm",
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                )}
              >
                {fromName} &lt;{fromEmail}&gt;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium w-16",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}
              >
                To:
              </span>
              <span
                className={cn(
                  "text-sm",
                  theme === "dark" ? "text-gray-200" : "text-gray-900"
                )}
              >
                {contact?.email || sampleContact.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium w-16",
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                )}
              >
                Subject:
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  theme === "dark" ? "text-white" : "text-gray-900"
                )}
              >
                {personalizedSubject || "(No subject)"}
              </span>
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div
          className={cn(
            "p-6 min-h-[300px]",
            theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
          )}
        >
          {personalizedContent ? (
            <div
              className={cn(
                "prose prose-sm max-w-none",
                theme === "dark" && "prose-invert"
              )}
              style={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(personalizedContent) }}
            />
          ) : (
            <p
              className={cn(
                "text-center py-8",
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              )}
            >
              Start writing to see your email preview
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Email Preview</CardTitle>
            <div className="flex items-center gap-1">
              {/* Device Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={device === "desktop" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none h-8 px-3"
                  onClick={() => setDevice("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={device === "mobile" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none h-8 px-3"
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "flex justify-center p-4 rounded-lg",
              theme === "dark" ? "bg-gray-800" : "bg-muted"
            )}
          >
            {previewFrame}
          </div>

          {/* Sample Data Notice */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            Preview uses sample contact data. Actual emails will use real contact
            information.
          </p>
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Email Preview</DialogTitle>
              <div className="flex items-center gap-2">
                {/* Device Toggle */}
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant={device === "desktop" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-r-none h-8 px-3"
                    onClick={() => setDevice("desktop")}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Desktop
                  </Button>
                  <Button
                    variant={device === "mobile" ? "secondary" : "ghost"}
                    size="sm"
                    className="rounded-l-none h-8 px-3"
                    onClick={() => setDevice("mobile")}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </Button>
                </div>

                {/* Theme Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div
            className={cn(
              "flex-1 overflow-auto flex justify-center items-start p-6 rounded-lg",
              theme === "dark" ? "bg-gray-800" : "bg-muted"
            )}
          >
            {previewFrame}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Standalone preview modal component
interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectLine?: string;
  contentHtml?: string;
  fromName?: string;
  fromEmail?: string;
  contact?: Partial<Contact>;
}

export function EmailPreviewModal({
  open,
  onOpenChange,
  subjectLine = "",
  contentHtml = "",
  fromName = "Your Company",
  fromEmail = "noreply@company.com",
  contact,
}: EmailPreviewModalProps) {
  const [device, setDevice] = React.useState<DeviceType>("desktop");
  const [theme, setTheme] = React.useState<ThemeMode>("light");

  // Parse content with personalization
  const personalizedSubject = React.useMemo(() => {
    const contactData = contact || sampleContact;
    return parsePersonalizationTokens(subjectLine, contactData as Partial<Contact> & { full_name?: string });
  }, [subjectLine, contact]);

  const personalizedContent = React.useMemo(() => {
    const contactData = contact || sampleContact;
    return parsePersonalizationTokens(contentHtml, contactData as Partial<Contact> & { full_name?: string });
  }, [contentHtml, contact]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Email Preview</DialogTitle>
            <div className="flex items-center gap-2">
              {/* Device Toggle */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={device === "desktop" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none h-8 px-3"
                  onClick={() => setDevice("desktop")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={device === "mobile" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none h-8 px-3"
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div
          className={cn(
            "flex-1 overflow-auto flex justify-center items-start p-6 rounded-lg",
            theme === "dark" ? "bg-gray-800" : "bg-muted"
          )}
        >
          <div
            className={cn(
              "transition-all",
              device === "desktop" ? "w-full max-w-2xl" : "w-[375px]"
            )}
          >
            {/* Email Client Frame */}
            <div
              className={cn(
                "border rounded-lg overflow-hidden shadow-sm",
                theme === "dark" ? "bg-gray-900" : "bg-white"
              )}
            >
              {/* Email Header */}
              <div
                className={cn(
                  "p-4 border-b",
                  theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium w-16",
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      )}
                    >
                      From:
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        theme === "dark" ? "text-gray-200" : "text-gray-900"
                      )}
                    >
                      {fromName} &lt;{fromEmail}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium w-16",
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      )}
                    >
                      Subject:
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        theme === "dark" ? "text-white" : "text-gray-900"
                      )}
                    >
                      {personalizedSubject || "(No subject)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div
                className={cn(
                  "p-6 min-h-[400px]",
                  theme === "dark"
                    ? "bg-gray-900 text-gray-100"
                    : "bg-white text-gray-900"
                )}
              >
                {personalizedContent ? (
                  <div
                    className={cn(
                      "prose prose-sm max-w-none",
                      theme === "dark" && "prose-invert"
                    )}
                    style={{ whiteSpace: "pre-wrap" }}
                    dangerouslySetInnerHTML={{ __html: personalizedContent }}
                  />
                ) : (
                  <p
                    className={cn(
                      "text-center py-8",
                      theme === "dark" ? "text-gray-500" : "text-gray-400"
                    )}
                  >
                    No content to preview
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
