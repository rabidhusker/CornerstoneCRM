"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ColorPicker,
  ThemePresetSelector,
} from "@/components/features/settings/color-picker";
import {
  Palette,
  Image,
  Type,
  Code,
  Eye,
  Upload,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { BrandingSettings, BrandingFormData } from "@/types/branding";
import { defaultBranding, brandingToCssVariables, getContrastColor } from "@/types/branding";

interface BrandingEditorProps {
  branding: BrandingSettings;
  onSave?: (data: Partial<BrandingFormData>) => Promise<void>;
  isLoading?: boolean;
}

export function BrandingEditor({
  branding,
  onSave,
  isLoading = false,
}: BrandingEditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("colors");
  const [formData, setFormData] = useState<BrandingFormData>({
    logo_light_url: branding.logo_light_url,
    logo_dark_url: branding.logo_dark_url,
    favicon_url: branding.favicon_url,
    primary_color: branding.primary_color || defaultBranding.primary_color,
    secondary_color: branding.secondary_color || defaultBranding.secondary_color,
    accent_color: branding.accent_color,
    text_primary: branding.text_primary,
    text_secondary: branding.text_secondary,
    background_color: branding.background_color,
    surface_color: branding.surface_color,
    custom_css: branding.custom_css,
    organization_name: branding.organization_name || defaultBranding.organization_name,
    tagline: branding.tagline,
    support_email: branding.support_email,
    support_url: branding.support_url,
    footer_text: branding.footer_text,
    show_powered_by: branding.show_powered_by ?? defaultBranding.show_powered_by,
  });
  const [isDirty, setIsDirty] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  const logoLightRef = useRef<HTMLInputElement>(null);
  const logoDarkRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const updateField = useCallback(
    <K extends keyof BrandingFormData>(field: K, value: BrandingFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    []
  );

  const handleFileUpload = async (
    type: "logo_light" | "logo_dark" | "favicon",
    file: File
  ) => {
    setUploadingLogo(type);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", type);

      const res = await fetch("/api/v1/settings/branding/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url } = await res.json();

      const urlField =
        type === "logo_light"
          ? "logo_light_url"
          : type === "logo_dark"
            ? "logo_dark_url"
            : "favicon_url";

      updateField(urlField, url);
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave(formData);
      setIsDirty(false);
    }
  };

  const handleReset = () => {
    setFormData({
      logo_light_url: branding.logo_light_url,
      logo_dark_url: branding.logo_dark_url,
      favicon_url: branding.favicon_url,
      primary_color: branding.primary_color || defaultBranding.primary_color,
      secondary_color: branding.secondary_color || defaultBranding.secondary_color,
      accent_color: branding.accent_color,
      text_primary: branding.text_primary,
      text_secondary: branding.text_secondary,
      background_color: branding.background_color,
      surface_color: branding.surface_color,
      custom_css: branding.custom_css,
      organization_name: branding.organization_name || defaultBranding.organization_name,
      tagline: branding.tagline,
      support_email: branding.support_email,
      support_url: branding.support_url,
      footer_text: branding.footer_text,
      show_powered_by: branding.show_powered_by ?? defaultBranding.show_powered_by,
    });
    setIsDirty(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* Editor */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <Image className="h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Code className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Colors</CardTitle>
                <CardDescription>
                  Choose a preset theme or customize individual colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ThemePresetSelector
                  value={{
                    primary: formData.primary_color,
                    secondary: formData.secondary_color,
                  }}
                  onChange={(preset) => {
                    updateField("primary_color", preset.primary);
                    updateField("secondary_color", preset.secondary);
                  }}
                />

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorPicker
                    label="Primary Color"
                    value={formData.primary_color}
                    onChange={(color) => updateField("primary_color", color)}
                    showPresets={false}
                  />
                  <ColorPicker
                    label="Secondary Color"
                    value={formData.secondary_color}
                    onChange={(color) => updateField("secondary_color", color)}
                    showPresets={false}
                  />
                  <ColorPicker
                    label="Accent Color"
                    value={formData.accent_color || "#f59e0b"}
                    onChange={(color) => updateField("accent_color", color)}
                    showPresets={false}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Text & Background</CardTitle>
                <CardDescription>
                  Customize text and background colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorPicker
                    label="Primary Text"
                    value={formData.text_primary || "#0f172a"}
                    onChange={(color) => updateField("text_primary", color)}
                    showPresets={false}
                  />
                  <ColorPicker
                    label="Secondary Text"
                    value={formData.text_secondary || "#64748b"}
                    onChange={(color) => updateField("text_secondary", color)}
                    showPresets={false}
                  />
                  <ColorPicker
                    label="Background"
                    value={formData.background_color || "#ffffff"}
                    onChange={(color) => updateField("background_color", color)}
                    showPresets={false}
                  />
                  <ColorPicker
                    label="Surface"
                    value={formData.surface_color || "#f8fafc"}
                    onChange={(color) => updateField("surface_color", color)}
                    showPresets={false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>
                  Upload your organization logo (recommended: 200x50px, PNG or SVG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Light Logo */}
                <div className="space-y-2">
                  <Label>Light Mode Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-48 rounded-lg border bg-white flex items-center justify-center overflow-hidden">
                      {formData.logo_light_url ? (
                        <>
                          <img
                            src={formData.logo_light_url}
                            alt="Light logo"
                            className="max-h-full max-w-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6"
                            onClick={() => updateField("logo_light_url", undefined)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No logo
                        </span>
                      )}
                    </div>
                    <input
                      ref={logoLightRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("logo_light", file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoLightRef.current?.click()}
                      disabled={uploadingLogo === "logo_light"}
                    >
                      {uploadingLogo === "logo_light" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>

                {/* Dark Logo */}
                <div className="space-y-2">
                  <Label>Dark Mode Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-48 rounded-lg border bg-slate-900 flex items-center justify-center overflow-hidden">
                      {formData.logo_dark_url ? (
                        <>
                          <img
                            src={formData.logo_dark_url}
                            alt="Dark logo"
                            className="max-h-full max-w-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6"
                            onClick={() => updateField("logo_dark_url", undefined)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">No logo</span>
                      )}
                    </div>
                    <input
                      ref={logoDarkRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("logo_dark", file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoDarkRef.current?.click()}
                      disabled={uploadingLogo === "logo_dark"}
                    >
                      {uploadingLogo === "logo_dark" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favicon</CardTitle>
                <CardDescription>
                  Upload a favicon for browser tabs (recommended: 32x32px, ICO or PNG)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                    {formData.favicon_url ? (
                      <>
                        <img
                          src={formData.favicon_url}
                          alt="Favicon"
                          className="max-h-full max-w-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-5 w-5"
                          onClick={() => updateField("favicon_url", undefined)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">ICO</span>
                    )}
                  </div>
                  <input
                    ref={faviconRef}
                    type="file"
                    accept="image/x-icon,image/png,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload("favicon", file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => faviconRef.current?.click()}
                    disabled={uploadingLogo === "favicon"}
                  >
                    {uploadingLogo === "favicon" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Favicon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Info</CardTitle>
                <CardDescription>
                  Display name and branding text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization_name">Organization Name</Label>
                  <Input
                    id="organization_name"
                    value={formData.organization_name}
                    onChange={(e) =>
                      updateField("organization_name", e.target.value)
                    }
                    placeholder="Your Company Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline || ""}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    placeholder="Your company tagline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Footer Text</Label>
                  <Input
                    id="footer_text"
                    value={formData.footer_text || ""}
                    onChange={(e) => updateField("footer_text", e.target.value)}
                    placeholder="© 2024 Your Company. All rights reserved."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support Info</CardTitle>
                <CardDescription>
                  Contact information for support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={formData.support_email || ""}
                    onChange={(e) =>
                      updateField("support_email", e.target.value)
                    }
                    placeholder="support@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support_url">Support URL</Label>
                  <Input
                    id="support_url"
                    type="url"
                    value={formData.support_url || ""}
                    onChange={(e) => updateField("support_url", e.target.value)}
                    placeholder="https://help.company.com"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_powered_by">Show "Powered by" Badge</Label>
                    <p className="text-sm text-muted-foreground">
                      Display a small badge on public pages
                    </p>
                  </div>
                  <Switch
                    id="show_powered_by"
                    checked={formData.show_powered_by}
                    onCheckedChange={(checked) =>
                      updateField("show_powered_by", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom CSS</CardTitle>
                <CardDescription>
                  Add custom CSS to further customize the appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.custom_css || ""}
                  onChange={(e) => updateField("custom_css", e.target.value)}
                  placeholder={`/* Custom CSS */\n.my-class {\n  color: var(--brand-primary);\n}`}
                  className="font-mono min-h-[200px]"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Use CSS variables: --brand-primary, --brand-secondary, etc.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated CSS Variables</CardTitle>
                <CardDescription>
                  These CSS variables are automatically generated from your settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-muted p-4 text-sm font-mono overflow-x-auto">
                  {brandingToCssVariables(formData)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={!isDirty || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!isDirty || isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="lg:sticky lg:top-20">
        <BrandingPreview branding={formData} />
      </div>
    </div>
  );
}

// Live Preview Component
function BrandingPreview({ branding }: { branding: BrandingFormData }) {
  const primaryContrast = getContrastColor(branding.primary_color);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Preview */}
        <div className="rounded-lg border overflow-hidden">
          <div
            className="flex items-center justify-between p-4"
            style={{
              backgroundColor: branding.surface_color || "#f8fafc",
            }}
          >
            {branding.logo_light_url ? (
              <img
                src={branding.logo_light_url}
                alt="Logo"
                className="h-8 max-w-[120px] object-contain"
              />
            ) : (
              <span
                className="font-bold"
                style={{ color: branding.text_primary }}
              >
                {branding.organization_name}
              </span>
            )}
            <Button
              size="sm"
              style={{
                backgroundColor: branding.primary_color,
                color: primaryContrast,
              }}
            >
              Sign Up
            </Button>
          </div>
        </div>

        {/* Content Preview */}
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ backgroundColor: branding.background_color || "#ffffff" }}
        >
          <h3
            className="font-semibold"
            style={{ color: branding.text_primary }}
          >
            Welcome to {branding.organization_name}
          </h3>
          <p
            className="text-sm"
            style={{ color: branding.text_secondary }}
          >
            {branding.tagline || "Your tagline goes here"}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              style={{
                backgroundColor: branding.primary_color,
                color: primaryContrast,
              }}
            >
              Get Started
            </Button>
            <Button
              size="sm"
              variant="outline"
              style={{
                borderColor: branding.primary_color,
                color: branding.primary_color,
              }}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Form Preview */}
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ backgroundColor: branding.surface_color || "#f8fafc" }}
        >
          <Label style={{ color: branding.text_primary }}>Email</Label>
          <Input placeholder="you@example.com" />
          <Button
            className="w-full"
            style={{
              backgroundColor: branding.primary_color,
              color: primaryContrast,
            }}
          >
            Submit
          </Button>
        </div>

        {/* Footer Preview */}
        <div
          className="rounded-lg border p-4 text-center"
          style={{
            backgroundColor: branding.surface_color || "#f8fafc",
          }}
        >
          <p
            className="text-xs"
            style={{ color: branding.text_secondary }}
          >
            {branding.footer_text || `© 2024 ${branding.organization_name}`}
          </p>
          {branding.show_powered_by && (
            <p
              className="text-xs mt-1"
              style={{ color: branding.text_secondary }}
            >
              Powered by CRM Platform
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
