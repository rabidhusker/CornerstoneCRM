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
  LayoutTemplate,
  AlertCircle,
  Globe,
  GlobeLock,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  usePage,
  useUpdatePage,
  usePublishPage,
  useUnpublishPage,
} from "@/lib/hooks/use-pages";
import { PageBuilder } from "@/components/features/pages/page-builder";
import { PageSettings } from "@/components/features/pages/page-settings";
import { PagePreview } from "@/components/features/pages/page-preview";
import type {
  PageConfig,
  PageSettings as PageSettingsType,
  PageBlock,
  PageStatus,
} from "@/types/page";
import { defaultPageSettings, pageStatusConfig } from "@/types/page";
import { cn } from "@/lib/utils";

export default function PageBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const pageId = params.id as string;

  const [activeTab, setActiveTab] = React.useState(
    searchParams.get("tab") || "builder"
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Fetch page data
  const { data: page, isLoading, error } = usePage(pageId);
  const updateMutation = useUpdatePage();
  const publishMutation = usePublishPage();
  const unpublishMutation = useUnpublishPage();

  // Local state for page configuration
  const [blocks, setBlocks] = React.useState<PageBlock[]>([]);
  const [settings, setSettings] = React.useState<PageSettingsType>(
    defaultPageSettings
  );
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Initialize local state when page data loads
  React.useEffect(() => {
    if (page) {
      const config = page.config as PageConfig | null;
      const pageSettings = page.settings as PageSettingsType | null;

      setBlocks(config?.blocks || []);
      setSettings({ ...defaultPageSettings, ...pageSettings });
      setTitle(page.title);
      setSlug(page.slug);
      setDescription(page.description || "");
    }
  }, [page]);

  // Handle block changes
  const handleBlocksChange = (newBlocks: PageBlock[]) => {
    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
  };

  // Handle settings changes
  const handleSettingsChange = (updates: {
    title?: string;
    slug?: string;
    description?: string;
    settings?: Partial<PageSettingsType>;
  }) => {
    if (updates.title !== undefined) setTitle(updates.title);
    if (updates.slug !== undefined) setSlug(updates.slug);
    if (updates.description !== undefined) setDescription(updates.description);
    if (updates.settings) {
      setSettings((prev) => ({ ...prev, ...updates.settings }));
    }
    setHasUnsavedChanges(true);
  };

  // Save page
  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: pageId,
        data: {
          title,
          slug,
          description,
          config: { blocks },
          settings,
        },
      });
      setHasUnsavedChanges(false);
      toast({
        title: "Page saved",
        description: "Your changes have been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save page.",
        variant: "destructive",
      });
    }
  };

  // Publish page
  const handlePublish = async () => {
    try {
      // Save first
      await updateMutation.mutateAsync({
        id: pageId,
        data: {
          title,
          slug,
          description,
          config: { blocks },
          settings,
        },
      });

      await publishMutation.mutateAsync(pageId);
      setHasUnsavedChanges(false);
      toast({
        title: "Page published",
        description: "Your page is now live.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to publish page.",
        variant: "destructive",
      });
    }
  };

  // Unpublish page
  const handleUnpublish = async () => {
    try {
      await unpublishMutation.mutateAsync(pageId);
      toast({
        title: "Page unpublished",
        description: "Your page is no longer live.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to unpublish page.",
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

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-medium">Page not found</h2>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access to it.
        </p>
        <Button asChild>
          <Link href="/dashboard/pages">Back to Pages</Link>
        </Button>
      </div>
    );
  }

  const statusInfo = pageStatusConfig[page.status as PageStatus];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{page.title}</h1>
              <Badge className={cn(statusInfo.bgColor, statusInfo.color)}>
                {statusInfo.label}
              </Badge>
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-600"
                >
                  Unsaved changes
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              /p/{page.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {page.status === "published" && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/p/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </a>
            </Button>
          )}
          {page.status === "published" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={unpublishMutation.isPending}
            >
              <GlobeLock className="mr-2 h-4 w-4" />
              Unpublish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublish}
              disabled={
                publishMutation.isPending || updateMutation.isPending
              }
            >
              {publishMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Globe className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          )}
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
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="builder" className="flex-1 m-0 overflow-hidden">
            <PageBuilder blocks={blocks} onChange={handleBlocksChange} />
          </TabsContent>

          <TabsContent value="settings" className="flex-1 m-0 overflow-auto p-6">
            <PageSettings
              title={title}
              slug={slug}
              description={description}
              settings={settings}
              onChange={handleSettingsChange}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
            <PagePreview blocks={blocks} settings={settings} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
