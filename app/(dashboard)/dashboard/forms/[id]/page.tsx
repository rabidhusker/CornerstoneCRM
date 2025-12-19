"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  Settings,
  Paintbrush,
  LayoutTemplate,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm, useUpdateForm } from "@/lib/hooks/use-forms";
import { FormBuilder } from "@/components/features/forms/form-builder";
import { FormSettings } from "@/components/features/forms/form-settings";
import { FormPreview } from "@/components/features/forms/form-preview";
import { FormStyleEditor } from "@/components/features/forms/form-style-editor";
import type {
  FormConfig,
  FormSettings as FormSettingsType,
  FormStyles,
  FormField,
  FormStatus,
} from "@/types/form";
import { defaultFormSettings, defaultFormStyles, formStatusConfig } from "@/types/form";
import { cn } from "@/lib/utils";

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const formId = params.id as string;

  const [activeTab, setActiveTab] = React.useState(
    searchParams.get("tab") || "builder"
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Fetch form data
  const { data: form, isLoading, error } = useForm(formId);
  const updateMutation = useUpdateForm();

  // Local state for form configuration
  const [fields, setFields] = React.useState<FormField[]>([]);
  const [settings, setSettings] = React.useState<FormSettingsType>(defaultFormSettings);
  const [styles, setStyles] = React.useState<FormStyles>(defaultFormStyles);

  // Initialize local state when form data loads
  React.useEffect(() => {
    if (form) {
      const config = form.config as FormConfig | null;
      const formSettings = form.settings as FormSettingsType | null;
      const formStyles = form.styles as FormStyles | null;

      setFields(config?.fields || []);
      setSettings({ ...defaultFormSettings, ...formSettings, name: form.name });
      setStyles({ ...defaultFormStyles, ...formStyles });
    }
  }, [form]);

  // Handle field changes
  const handleFieldsChange = (newFields: FormField[]) => {
    setFields(newFields);
    setHasUnsavedChanges(true);
  };

  // Handle settings changes
  const handleSettingsChange = (newSettings: Partial<FormSettingsType>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    setHasUnsavedChanges(true);
  };

  // Handle styles changes
  const handleStylesChange = (newStyles: Partial<FormStyles>) => {
    setStyles((prev) => ({ ...prev, ...newStyles }));
    setHasUnsavedChanges(true);
  };

  // Save form
  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: formId,
        data: {
          name: settings.name,
          description: settings.description,
          config: { fields },
          settings,
          styles,
        },
      });
      setHasUnsavedChanges(false);
      toast({
        title: "Form saved",
        description: "Your changes have been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save form.",
        variant: "destructive",
      });
    }
  };

  // Toggle form status
  const handleToggleStatus = async () => {
    if (!form) return;

    const newStatus: FormStatus = form.status === "active" ? "inactive" : "active";

    try {
      await updateMutation.mutateAsync({
        id: formId,
        data: { status: newStatus },
      });
      toast({
        title: newStatus === "active" ? "Form activated" : "Form deactivated",
        description:
          newStatus === "active"
            ? "Your form is now accepting submissions."
            : "Your form is no longer accepting submissions.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update form status.",
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

  if (error || !form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-medium">Form not found</h2>
        <p className="text-muted-foreground">
          The form you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild>
          <Link href="/dashboard/forms">Back to Forms</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = formStatusConfig[form.status as FormStatus];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{form.name}</h1>
              <Badge className={cn(statusInfo.bgColor, statusInfo.color)}>
                {statusInfo.label}
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {form.submissions_count || 0} submissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {form.status === "active" && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/f/${form.id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={updateMutation.isPending}
          >
            {form.status === "active" ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending || !hasUnsavedChanges}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="builder" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="styles" className="gap-2">
                <Paintbrush className="h-4 w-4" />
                Styles
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="builder" className="flex-1 m-0 overflow-hidden">
            <FormBuilder
              fields={fields}
              onChange={handleFieldsChange}
            />
          </TabsContent>

          <TabsContent value="settings" className="flex-1 m-0 overflow-auto p-6">
            <FormSettings
              settings={settings}
              onChange={handleSettingsChange}
            />
          </TabsContent>

          <TabsContent value="styles" className="flex-1 m-0 overflow-auto p-6">
            <FormStyleEditor
              styles={styles}
              onChange={handleStylesChange}
              fields={fields}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
            <FormPreview
              fields={fields}
              settings={settings}
              styles={styles}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
