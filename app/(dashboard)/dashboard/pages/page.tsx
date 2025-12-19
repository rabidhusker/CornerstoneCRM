"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  Globe,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  TrendingUp,
  BarChart2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  usePages,
  useDeletePage,
  useDuplicatePage,
  useCreatePage,
} from "@/lib/hooks/use-pages";
import type { PageStatus, PageWithCreator, PageFilters } from "@/types/page";
import { pageStatusConfig, generateSlug } from "@/types/page";
import { formatDistanceToNow } from "date-fns";

type ViewMode = "grid" | "list";

const statusOptions: Array<{ value: PageStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

interface PageCardProps {
  page: PageWithCreator;
  onEdit: (page: PageWithCreator) => void;
  onDuplicate: (page: PageWithCreator) => void;
  onDelete: (page: PageWithCreator) => void;
  onPreview: (page: PageWithCreator) => void;
}

function PageCard({
  page,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview,
}: PageCardProps) {
  const statusInfo = pageStatusConfig[page.status as PageStatus];

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{page.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Globe className="h-3 w-3" />
              <span className="text-xs">/p/{page.slug}</span>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(page)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreview(page)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(page)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {page.status === "published" && (
                <DropdownMenuItem asChild>
                  <a
                    href={`/p/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Live
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(page)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <Badge className={cn(statusInfo.bgColor, statusInfo.color)}>
            {statusInfo.label}
          </Badge>
          {page.published_at && (
            <span className="text-xs text-muted-foreground">
              Published{" "}
              {formatDistanceToNow(new Date(page.published_at), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{page.views_count || 0}</p>
            <p className="text-xs text-muted-foreground">Views</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{page.conversions_count || 0}</p>
            <p className="text-xs text-muted-foreground">Conversions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {page.conversion_rate?.toFixed(1) || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PageCardCompact({
  page,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview,
}: PageCardProps) {
  const statusInfo = pageStatusConfig[page.status as PageStatus];

  return (
    <Card className="group">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{page.title}</p>
            <p className="text-sm text-muted-foreground truncate">
              /p/{page.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge className={cn(statusInfo.bgColor, statusInfo.color)}>
            {statusInfo.label}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart2 className="h-4 w-4" />
            {page.views_count || 0} views
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            {page.conversion_rate?.toFixed(1) || 0}%
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(page)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreview(page)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(page)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {page.status === "published" && (
                <DropdownMenuItem asChild>
                  <a
                    href={`/p/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Live
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(page)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PagesListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PageStatus | "all">(
    "all"
  );
  const [pageToDelete, setPageToDelete] = React.useState<PageWithCreator | null>(
    null
  );
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newPageTitle, setNewPageTitle] = React.useState("");

  // Build filters
  const filters: PageFilters = React.useMemo(() => {
    const f: PageFilters = {};
    if (statusFilter !== "all") {
      f.status = [statusFilter];
    }
    if (searchQuery) {
      f.search = searchQuery;
    }
    return f;
  }, [statusFilter, searchQuery]);

  // Fetch pages
  const { data: pages, isLoading, error } = usePages(filters);

  // Mutations
  const deleteMutation = useDeletePage();
  const duplicateMutation = useDuplicatePage();
  const createMutation = useCreatePage();

  // Handlers
  const handleEdit = (page: PageWithCreator) => {
    router.push(`/dashboard/pages/${page.id}`);
  };

  const handlePreview = (page: PageWithCreator) => {
    router.push(`/dashboard/pages/${page.id}?tab=preview`);
  };

  const handleDuplicate = async (page: PageWithCreator) => {
    try {
      await duplicateMutation.mutateAsync(page.id);
      toast({
        title: "Page duplicated",
        description: "A copy of the page has been created.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to duplicate page.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!pageToDelete) return;

    try {
      await deleteMutation.mutateAsync(pageToDelete.id);
      toast({
        title: "Page deleted",
        description: "The page has been removed.",
      });
      setPageToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete page.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    if (!newPageTitle.trim()) return;

    try {
      const page = await createMutation.mutateAsync({
        title: newPageTitle,
        slug: generateSlug(newPageTitle),
        status: "draft",
      });
      toast({
        title: "Page created",
        description: "Your new page has been created.",
      });
      setShowCreateDialog(false);
      setNewPageTitle("");
      router.push(`/dashboard/pages/${page.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create page.",
        variant: "destructive",
      });
    }
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!pages)
      return { draft: 0, published: 0, archived: 0, totalViews: 0 };

    return pages.reduce(
      (acc, p) => {
        if (p.status in acc) {
          acc[p.status as keyof typeof acc]++;
        }
        acc.totalViews += p.views_count || 0;
        return acc;
      },
      { draft: 0, published: 0, archived: 0, totalViews: 0 }
    );
  }, [pages]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Landing Pages</h1>
          <p className="text-muted-foreground">
            Create and manage your landing pages
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Page
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
              <Badge variant="secondary">Draft</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
              <Badge className="bg-green-100 text-green-600 dark:bg-green-900/30">
                Published
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold">{stats.archived}</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30">
                Archived
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PageStatus | "all")}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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

      {/* Pages List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Failed to load pages</p>
            <p className="text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      ) : !pages || pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No pages found</p>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first landing page.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Page
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={(p) => setPageToDelete(p)}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <PageCardCompact
              key={page.id}
              page={page}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={(p) => setPageToDelete(p)}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}

      {/* Create Page Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Enter a title for your new landing page. You can add content and
              configure settings after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="page-title">Page Title</Label>
              <Input
                id="page-title"
                placeholder="e.g., Product Launch, Summer Sale"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreate();
                  }
                }}
              />
              {newPageTitle && (
                <p className="text-xs text-muted-foreground">
                  URL: /p/{generateSlug(newPageTitle)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newPageTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!pageToDelete}
        onOpenChange={() => setPageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{pageToDelete?.title}&quot;?
              This action cannot be undone.
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
    </div>
  );
}
