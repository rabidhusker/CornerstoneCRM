"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
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
import { useTemplate, useUpdateTemplate } from "@/lib/hooks/use-templates";
import { EmailBuilder } from "@/components/features/campaigns/email-builder";
import { EmailPreviewModal } from "@/components/features/campaigns/email-preview";
import {
  templateCategoryConfig,
  type TemplateCategory,
} from "@/types/template";
import type { CampaignSettings } from "@/types/campaign";

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const templateId = params.id as string;

  // Fetch template
  const { data: template, isLoading, error } = useTemplate(templateId);
  const updateMutation = useUpdateTemplate();

  // Form state
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<TemplateCategory>("newsletter");
  const [subjectLine, setSubjectLine] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState("");
  const [contentText, setContentText] = React.useState("");
  const [settings, setSettings] = React.useState<CampaignSettings>({});
  const [showPreview, setShowPreview] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Initialize form when template loads
  React.useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setCategory(template.category);
      setSubjectLine(template.subject_line || "");
      setContentHtml(template.content_html || "");
      setContentText(template.content_text || "");
    }
  }, [template]);

  // Track changes
  React.useEffect(() => {
    if (template) {
      const changed =
        name !== template.name ||
        description !== (template.description || "") ||
        category !== template.category ||
        subjectLine !== (template.subject_line || "") ||
        contentHtml !== (template.content_html || "") ||
        contentText !== (template.content_text || "");
      setHasChanges(changed);
    }
  }, [template, name, description, category, subjectLine, contentHtml, contentText]);

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
      await updateMutation.mutateAsync({
        id: templateId,
        data: {
          name,
          description: description || undefined,
          category,
          subject_line: subjectLine || undefined,
          content_html: contentHtml || undefined,
          content_text: contentText || undefined,
        },
      });

      toast({
        title: "Template saved",
        description: "Your changes have been saved.",
      });
      setHasChanges(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium">Template not found</p>
        <p className="text-muted-foreground mb-4">
          The template you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Template</h1>
            <p className="text-muted-foreground">{template.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
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
