"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Smartphone,
  GitBranch,
  Users,
  FileText,
  Send,
  Calendar,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateCampaign } from "@/lib/hooks/use-campaigns";
import { AudienceSelector } from "@/components/features/campaigns/audience-selector";
import { EmailBuilder } from "@/components/features/campaigns/email-builder";
import { SmsBuilder } from "@/components/features/campaigns/sms-builder";
import type {
  CampaignType,
  CampaignSettings,
  CampaignFormData,
} from "@/types/campaign";

type WizardStep = "type" | "details" | "audience" | "content" | "review";

const steps: Array<{ id: WizardStep; label: string; icon: React.ReactNode }> = [
  { id: "type", label: "Campaign Type", icon: <Mail className="h-4 w-4" /> },
  { id: "details", label: "Details", icon: <FileText className="h-4 w-4" /> },
  { id: "audience", label: "Audience", icon: <Users className="h-4 w-4" /> },
  { id: "content", label: "Content", icon: <Send className="h-4 w-4" /> },
  { id: "review", label: "Review", icon: <Check className="h-4 w-4" /> },
];

const campaignTypes: Array<{
  type: CampaignType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    type: "email",
    label: "Email Campaign",
    description: "Send a one-time email to selected contacts",
    icon: <Mail className="h-6 w-6" />,
  },
  {
    type: "sms",
    label: "SMS Campaign",
    description: "Send a text message to contacts",
    icon: <Smartphone className="h-6 w-6" />,
  },
  {
    type: "drip",
    label: "Email Sequence",
    description: "Automated series of emails sent over time",
    icon: <GitBranch className="h-6 w-6" />,
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createCampaign = useCreateCampaign();

  const [currentStep, setCurrentStep] = React.useState<WizardStep>("type");
  const [campaignType, setCampaignType] = React.useState<CampaignType>("email");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [subjectLine, setSubjectLine] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState("");
  const [contentText, setContentText] = React.useState("");
  const [smsContent, setSmsContent] = React.useState("");
  const [settings, setSettings] = React.useState<CampaignSettings>({
    audience_type: "all",
    exclude_unsubscribed: true,
    exclude_bounced: true,
  });

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const canProceed = React.useMemo(() => {
    switch (currentStep) {
      case "type":
        return true;
      case "details":
        return name.trim().length > 0;
      case "audience":
        return true; // Default to all contacts is valid
      case "content":
        if (campaignType === "email") {
          return subjectLine.trim().length > 0 && contentHtml.trim().length > 0;
        } else if (campaignType === "sms") {
          return smsContent.trim().length > 0;
        }
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  }, [currentStep, campaignType, name, subjectLine, contentHtml, smsContent]);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleCreate = async (saveAsDraft: boolean = true) => {
    const formData: CampaignFormData = {
      name,
      description: description || undefined,
      type: campaignType,
      subject_line: campaignType === "email" ? subjectLine : undefined,
      content_html: campaignType === "email" ? contentHtml : undefined,
      content_text: campaignType === "sms" ? smsContent : contentText || undefined,
      settings,
    };

    try {
      const campaign = await createCampaign.mutateAsync(formData);
      toast({
        title: "Campaign created",
        description: saveAsDraft
          ? "Your campaign has been saved as a draft."
          : "Your campaign is ready.",
      });
      router.push(`/dashboard/campaigns/${campaign.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "type":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Choose Campaign Type</h2>
              <p className="text-muted-foreground">
                Select the type of campaign you want to create
              </p>
            </div>

            <RadioGroup
              value={campaignType}
              onValueChange={(value) => setCampaignType(value as CampaignType)}
              className="grid gap-4 md:grid-cols-3"
            >
              {campaignTypes.map((type) => (
                <Label
                  key={type.type}
                  htmlFor={type.type}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 border rounded-xl cursor-pointer transition-all hover:border-primary/50",
                    campaignType === type.type &&
                      "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <RadioGroupItem
                    value={type.type}
                    id={type.type}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "p-4 rounded-full",
                      type.type === "email" &&
                        "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                      type.type === "sms" &&
                        "bg-green-100 text-green-600 dark:bg-green-900/30",
                      type.type === "drip" &&
                        "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                    )}
                  >
                    {type.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">{type.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {type.description}
                    </p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
        );

      case "details":
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-2xl font-bold">Campaign Details</h2>
              <p className="text-muted-foreground">
                Give your campaign a name and description
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., March Newsletter, Spring Sale Announcement"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes about this campaign's purpose or goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case "audience":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Select Audience</h2>
              <p className="text-muted-foreground">
                Choose who will receive this campaign
              </p>
            </div>

            <AudienceSelector
              settings={settings}
              onSettingsChange={setSettings}
              campaignType={campaignType}
            />
          </div>
        );

      case "content":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">
                {campaignType === "email"
                  ? "Create Email"
                  : campaignType === "sms"
                  ? "Compose Message"
                  : "Build Sequence"}
              </h2>
              <p className="text-muted-foreground">
                {campaignType === "email"
                  ? "Design your email content"
                  : campaignType === "sms"
                  ? "Write your SMS message"
                  : "Set up your email sequence"}
              </p>
            </div>

            {campaignType === "email" && (
              <EmailBuilder
                subjectLine={subjectLine}
                contentHtml={contentHtml}
                contentText={contentText}
                settings={settings}
                onSubjectChange={setSubjectLine}
                onContentHtmlChange={setContentHtml}
                onContentTextChange={setContentText}
                onSettingsChange={setSettings}
              />
            )}

            {campaignType === "sms" && (
              <SmsBuilder
                content={smsContent}
                onContentChange={setSmsContent}
                settings={settings}
                onSettingsChange={setSettings}
              />
            )}

            {campaignType === "drip" && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Sequence Builder</p>
                  <p className="text-muted-foreground">
                    Email sequence builder coming soon
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "review":
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-2xl font-bold">Review Campaign</h2>
              <p className="text-muted-foreground">
                Review your campaign settings before saving
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type */}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Type</span>
                  <Badge
                    className={cn(
                      campaignType === "email" &&
                        "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                      campaignType === "sms" &&
                        "bg-green-100 text-green-600 dark:bg-green-900/30",
                      campaignType === "drip" &&
                        "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                    )}
                  >
                    {campaignType === "email"
                      ? "Email Campaign"
                      : campaignType === "sms"
                      ? "SMS Campaign"
                      : "Email Sequence"}
                  </Badge>
                </div>

                {/* Name */}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{name}</span>
                </div>

                {/* Subject (for email) */}
                {campaignType === "email" && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">Subject Line</span>
                    <span className="font-medium truncate max-w-[300px]">
                      {subjectLine || "Not set"}
                    </span>
                  </div>
                )}

                {/* Audience */}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Audience</span>
                  <span className="font-medium capitalize">
                    {settings.audience_type === "all"
                      ? "All Contacts"
                      : settings.audience_type === "tags"
                      ? `${settings.audience_tags?.length || 0} Tag(s)`
                      : settings.audience_type === "lifecycle"
                      ? `${settings.audience_lifecycle_stages?.length || 0} Stage(s)`
                      : "Custom Filter"}
                  </span>
                </div>

                {/* From (for email) */}
                {campaignType === "email" && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium">
                      {settings.from_name || "Your Name"} &lt;
                      {settings.from_email || "you@company.com"}&gt;
                    </span>
                  </div>
                )}

                {/* Content Preview */}
                <div className="py-2">
                  <span className="text-muted-foreground">Content Preview</span>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    {campaignType === "email" ? (
                      <p className="text-sm line-clamp-3">{contentHtml || "No content"}</p>
                    ) : (
                      <p className="text-sm line-clamp-3">{smsContent || "No content"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                onClick={() => handleCreate(false)}
                disabled={createCampaign.isPending}
              >
                {createCampaign.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="mr-2 h-4 w-4" />
                )}
                Save & Schedule
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleCreate(true)}
                disabled={createCampaign.isPending}
              >
                Save as Draft
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Create Campaign</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="hidden md:flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    if (index <= currentStepIndex) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
                    index === currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : index < currentStepIndex
                      ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.icon
                  )}
                  <span className="hidden lg:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <Separator
                    orientation="horizontal"
                    className={cn(
                      "w-8",
                      index < currentStepIndex && "bg-primary/50"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">{renderStepContent()}</div>

      {/* Footer Navigation */}
      {currentStep !== "review" && (
        <div className="border-t bg-background/95 backdrop-blur sticky bottom-0">
          <div className="container flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button onClick={handleNext} disabled={!canProceed}>
              {currentStepIndex === steps.length - 2 ? "Review" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
