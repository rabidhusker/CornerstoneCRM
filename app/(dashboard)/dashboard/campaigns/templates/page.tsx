"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Loader2,
  FileText,
  FolderOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useTemplates,
  useDeleteTemplate,
  useDuplicateTemplate,
} from "@/lib/hooks/use-templates";
import {
  TemplateCard,
  TemplateCardCompact,
} from "@/components/features/campaigns/template-card";
import { EmailPreviewModal } from "@/components/features/campaigns/email-preview";
import {
  templateCategoryConfig,
  type EmailTemplateWithCreator,
  type TemplateCategory,
  type TemplateFilters,
} from "@/types/template";

type ViewMode = "grid" | "list";

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<TemplateCategory | "all">("all");
  const [templateToDelete, setTemplateToDelete] = React.useState<EmailTemplateWithCreator | null>(null);
  const [previewTemplate, setPreviewTemplate] = React.useState<EmailTemplateWithCreator | null>(null);

  // Build filters
  const filters: TemplateFilters = React.useMemo(() => {
    const f: TemplateFilters = {};
    if (categoryFilter !== "all") {
      f.category = categoryFilter;
    }
    if (searchQuery) {
      f.search = searchQuery;
    }
    return f;
  }, [categoryFilter, searchQuery]);

  // Fetch templates
  const { data: templates, isLoading, error } = useTemplates(filters);

  // Mutations
  const deleteMutation = useDeleteTemplate();
  const duplicateMutation = useDuplicateTemplate();

  // Calculate stats by category
  const categoryStats = React.useMemo(() => {
    if (!templates) return {};

    return templates.reduce(
      (acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = 0;
        }
        acc[t.category]++;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [templates]);

  // Handlers
  const handleUse = (template: EmailTemplateWithCreator) => {
    // Navigate to campaign creation with template
    router.push(`/dashboard/campaigns/new?template=${template.id}`);
  };

  const handleEdit = (template: EmailTemplateWithCreator) => {
    router.push(`/dashboard/campaigns/templates/${template.id}`);
  };

  const handleDuplicate = async (template: EmailTemplateWithCreator) => {
    try {
      await duplicateMutation.mutateAsync(template.id);
      toast({
        title: "Template duplicated",
        description: "A copy of the template has been created.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to duplicate template.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      await deleteMutation.mutateAsync(templateToDelete.id);
      toast({
        title: "Template deleted",
        description: "The template has been removed.",
      });
      setTemplateToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (template: EmailTemplateWithCreator) => {
    setPreviewTemplate(template);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable email templates
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/campaigns/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      {/* Category Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={cn(
            "cursor-pointer transition-colors hover:bg-muted/50",
            categoryFilter === "all" && "ring-2 ring-primary"
          )}
          onClick={() => setCategoryFilter("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">All Templates</p>
                <p className="text-2xl font-bold">{templates?.length || 0}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {Object.entries(templateCategoryConfig)
          .slice(0, 3)
          .map(([key, config]) => (
            <Card
              key={key}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                categoryFilter === key && "ring-2 ring-primary"
              )}
              onClick={() => setCategoryFilter(key as TemplateCategory)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold">
                      {categoryStats[key] || 0}
                    </p>
                  </div>
                  <Badge className={config.color}>{config.label}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as TemplateCategory | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(templateCategoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Templates Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Failed to load templates</p>
            <p className="text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      ) : !templates || templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your filters."
                : "Get started by creating your first template."}
            </p>
            <Button asChild>
              <Link href="/dashboard/campaigns/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUse}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={(t) => setTemplateToDelete(t)}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => (
            <TemplateCardCompact
              key={template.id}
              template={template}
              onUse={handleUse}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={(t) => setTemplateToDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={() => setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      {previewTemplate && (
        <EmailPreviewModal
          open={!!previewTemplate}
          onOpenChange={() => setPreviewTemplate(null)}
          subjectLine={previewTemplate.subject_line || ""}
          contentHtml={previewTemplate.content_html || ""}
        />
      )}
    </div>
  );
}
