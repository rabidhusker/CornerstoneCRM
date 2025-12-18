"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateTemplate } from "@/lib/hooks/use-templates";
import { EmailBuilder } from "@/components/features/campaigns/email-builder";
import { EmailPreviewModal } from "@/components/features/campaigns/email-preview";
import {
  templateCategoryConfig,
  type TemplateCategory,
} from "@/types/template";
import type { CampaignSettings } from "@/types/campaign";

export default function NewTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateTemplate();

  // Form state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<TemplateCategory>("newsletter");
  const [subjectLine, setSubjectLine] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState("");
  const [contentText, setContentText] = React.useState("");
  const [settings, setSettings] = React.useState<CampaignSettings>({});
  const [showPreview, setShowPreview] = React.useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const template = await createMutation.mutateAsync({
        name,
        description: description || undefined,
        category,
        subject_line: subjectLine || undefined,
        content_html: contentHtml || undefined,
        content_text: contentText || undefined,
      });

      toast({
        title: "Template created",
        description: "Your template has been saved.",
      });

      router.push(`/dashboard/campaigns/templates/${template.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Template</h1>
            <p className="text-muted-foreground">
              Design a reusable email template
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Template
          </Button>
        </div>
      </div>

      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monthly Newsletter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TemplateCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(templateCategoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this template..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Content */}
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

      {/* Preview Modal */}
      <EmailPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        subjectLine={subjectLine}
        contentHtml={contentHtml}
        fromName={settings.from_name}
        fromEmail={settings.from_email}
      />
    </div>
  );
}
