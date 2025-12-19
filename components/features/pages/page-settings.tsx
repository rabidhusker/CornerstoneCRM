"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PageSettings as PageSettingsType } from "@/types/page";
import { generateSlug } from "@/types/page";

interface PageSettingsProps {
  title: string;
  slug: string;
  description: string;
  settings: PageSettingsType;
  onChange: (updates: {
    title?: string;
    slug?: string;
    description?: string;
    settings?: Partial<PageSettingsType>;
  }) => void;
}

export function PageSettings({
  title,
  slug,
  description,
  settings,
  onChange,
}: PageSettingsProps) {
  const handleTitleChange = (newTitle: string) => {
    onChange({ title: newTitle });
  };

  const handleSlugChange = (newSlug: string) => {
    // Sanitize slug
    const sanitized = newSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    onChange({ slug: sanitized });
  };

  const generateSlugFromTitle = () => {
    onChange({ slug: generateSlug(title) });
  };

  const updateSettings = (updates: Partial<PageSettingsType>) => {
    onChange({ settings: updates });
  };

  return (
    <TooltipProvider>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Set the title and URL for your landing page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Welcome to Our Product"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">URL Slug</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={generateSlugFromTitle}
                >
                  Generate from title
                </button>
              </div>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  /p/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="rounded-l-none"
                  placeholder="my-landing-page"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be the URL path for your page
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Brief description of the page..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>
              Optimize how your page appears in search results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The title that appears in search results. Keep it under 60
                      characters for best results.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="metaTitle"
                value={settings.metaTitle || ""}
                onChange={(e) => updateSettings({ metaTitle: e.target.value })}
                placeholder={title || "Page title..."}
              />
              <p className="text-xs text-muted-foreground">
                {(settings.metaTitle || title || "").length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The description that appears in search results. Keep it
                      under 160 characters.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="metaDescription"
                value={settings.metaDescription || ""}
                onChange={(e) => updateSettings({ metaDescription: e.target.value })}
                placeholder="A brief description for search engines..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {(settings.metaDescription || "").length}/160 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogImage">Social Share Image (OG Image)</Label>
              <Input
                id="ogImage"
                value={settings.ogImage || ""}
                onChange={(e) => updateSettings({ ogImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Recommended size: 1200x630 pixels
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon">Favicon URL</Label>
              <Input
                id="favicon"
                value={settings.favicon || ""}
                onChange={(e) => updateSettings({ favicon: e.target.value })}
                placeholder="https://example.com/favicon.ico"
              />
            </div>
          </CardContent>
        </Card>

        {/* Styling */}
        <Card>
          <CardHeader>
            <CardTitle>Styling</CardTitle>
            <CardDescription>
              Customize the look and feel of your page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={settings.fontFamily || "system-ui, -apple-system, sans-serif"}
                onValueChange={(value) => updateSettings({ fontFamily: value })}
              >
                <SelectTrigger id="fontFamily">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system-ui, -apple-system, sans-serif">
                    System Default
                  </SelectItem>
                  <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                  <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                  <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                  <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                  <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                  <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia</SelectItem>
                  <SelectItem value="'Playfair Display', serif">
                    Playfair Display
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={settings.primaryColor || "#3b82f6"}
                    onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                  />
                  <Input
                    value={settings.primaryColor || "#3b82f6"}
                    onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={settings.backgroundColor || "#ffffff"}
                    onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                  />
                  <Input
                    value={settings.backgroundColor || "#ffffff"}
                    onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  className="w-12 h-10 p-1"
                  value={settings.textColor || "#1f2937"}
                  onChange={(e) => updateSettings({ textColor: e.target.value })}
                />
                <Input
                  value={settings.textColor || "#1f2937"}
                  onChange={(e) => updateSettings({ textColor: e.target.value })}
                  placeholder="#1f2937"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics & Tracking</CardTitle>
            <CardDescription>
              Add tracking codes to measure page performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
              <Input
                id="googleAnalyticsId"
                value={settings.googleAnalyticsId || ""}
                onChange={(e) => updateSettings({ googleAnalyticsId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
              <Input
                id="facebookPixelId"
                value={settings.facebookPixelId || ""}
                onChange={(e) => updateSettings({ facebookPixelId: e.target.value })}
                placeholder="XXXXXXXXXXXXXXXXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom Code */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Code</CardTitle>
            <CardDescription>
              Add custom HTML/JavaScript to your page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="customHeadCode">Custom Head Code</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Code added here will be injected into the &lt;head&gt; section.
                      Useful for custom fonts, stylesheets, or meta tags.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="customHeadCode"
                value={settings.customHeadCode || ""}
                onChange={(e) => updateSettings({ customHeadCode: e.target.value })}
                placeholder="<!-- Your custom head code here -->"
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="customBodyCode">Custom Body Code</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Code added here will be injected at the end of the &lt;body&gt;
                      section. Useful for tracking scripts or chat widgets.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="customBodyCode"
                value={settings.customBodyCode || ""}
                onChange={(e) => updateSettings({ customBodyCode: e.target.value })}
                placeholder="<!-- Your custom body code here -->"
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom Domain */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Domain</CardTitle>
            <CardDescription>
              Connect a custom domain to your landing page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customDomain">Custom Domain</Label>
              <Input
                id="customDomain"
                value={settings.customDomain || ""}
                onChange={(e) => updateSettings({ customDomain: e.target.value })}
                placeholder="landing.yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                Point your domain&apos;s CNAME record to our servers to enable this feature.
                Contact support for DNS configuration details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
