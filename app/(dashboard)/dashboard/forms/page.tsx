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
  FileText,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  TrendingUp,
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
  useForms,
  useDeleteForm,
  useDuplicateForm,
  useCreateForm,
} from "@/lib/hooks/use-forms";
import type {
  FormStatus,
  FormWithCreator,
  FormFilters,
} from "@/types/form";
import { formStatusConfig } from "@/types/form";
import { formatDistanceToNow } from "date-fns";

type ViewMode = "grid" | "list";

const statusOptions: Array<{ value: FormStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

interface FormCardProps {
  form: FormWithCreator;
  onEdit: (form: FormWithCreator) => void;
  onDuplicate: (form: FormWithCreator) => void;
  onDelete: (form: FormWithCreator) => void;
  onPreview: (form: FormWithCreator) => void;
}

function FormCard({ form, onEdit, onDuplicate, onDelete, onPreview }: FormCardProps) {
  const statusInfo = formStatusConfig[form.status as FormStatus];

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{form.name}</CardTitle>
            {form.description && (
              <CardDescription className="line-clamp-2">
                {form.description}
              </CardDescription>
            )}
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
              <DropdownMenuItem onClick={() => onEdit(form)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreview(form)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(form)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {form.status === "active" && (
                <DropdownMenuItem asChild>
                  <a
                    href={`/f/${form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Public URL
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(form)}
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
          {form.last_submission_at && (
            <span className="text-xs text-muted-foreground">
              Last submission{" "}
              {formatDistanceToNow(new Date(form.last_submission_at), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{form.views_count || 0}</p>
            <p className="text-xs text-muted-foreground">Views</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{form.submissions_count || 0}</p>
            <p className="text-xs text-muted-foreground">Submissions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {form.conversion_rate?.toFixed(1) || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Conversion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FormCardCompact({
  form,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview,
}: FormCardProps) {
  const statusInfo = formStatusConfig[form.status as FormStatus];

  return (
    <Card className="group">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{form.name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {form.submissions_count || 0} submissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge className={cn(statusInfo.bgColor, statusInfo.color)}>
            {statusInfo.label}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            {form.conversion_rate?.toFixed(1) || 0}%
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(form)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreview(form)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(form)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              {form.status === "active" && (
                <DropdownMenuItem asChild>
                  <a
                    href={`/f/${form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Public URL
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(form)}
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

export default function FormsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<FormStatus | "all">("all");
  const [formToDelete, setFormToDelete] = React.useState<FormWithCreator | null>(null);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newFormName, setNewFormName] = React.useState("");

  // Build filters
  const filters: FormFilters = React.useMemo(() => {
    const f: FormFilters = {};
    if (statusFilter !== "all") {
      f.status = [statusFilter];
    }
    if (searchQuery) {
      f.search = searchQuery;
    }
    return f;
  }, [statusFilter, searchQuery]);

  // Fetch forms
  const { data: forms, isLoading, error } = useForms(filters);

  // Mutations
  const deleteMutation = useDeleteForm();
  const duplicateMutation = useDuplicateForm();
  const createMutation = useCreateForm();

  // Handlers
  const handleEdit = (form: FormWithCreator) => {
    router.push(`/dashboard/forms/${form.id}`);
  };

  const handlePreview = (form: FormWithCreator) => {
    router.push(`/dashboard/forms/${form.id}?tab=preview`);
  };

  const handleDuplicate = async (form: FormWithCreator) => {
    try {
      await duplicateMutation.mutateAsync(form.id);
      toast({
        title: "Form duplicated",
        description: "A copy of the form has been created.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to duplicate form.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!formToDelete) return;

    try {
      await deleteMutation.mutateAsync(formToDelete.id);
      toast({
        title: "Form deleted",
        description: "The form has been removed.",
      });
      setFormToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete form.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    if (!newFormName.trim()) return;

    try {
      const form = await createMutation.mutateAsync({
        name: newFormName,
        status: "draft",
      });
      toast({
        title: "Form created",
        description: "Your new form has been created.",
      });
      setShowCreateDialog(false);
      setNewFormName("");
      router.push(`/dashboard/forms/${form.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create form.",
        variant: "destructive",
      });
    }
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!forms) return { draft: 0, active: 0, inactive: 0, totalSubmissions: 0 };

    return forms.reduce(
      (acc, f) => {
        if (f.status in acc) {
          acc[f.status as keyof typeof acc]++;
        }
        acc.totalSubmissions += f.submissions_count || 0;
        return acc;
      },
      { draft: 0, active: 0, inactive: 0, totalSubmissions: 0 }
    );
  }, [forms]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">
            Create and manage lead capture forms
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Form
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
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Badge className="bg-green-100 text-green-600 dark:bg-green-900/30">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30">
                Inactive
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
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
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as FormStatus | "all")}
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

      {/* Forms List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Failed to load forms</p>
            <p className="text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      ) : !forms || forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No forms found</p>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first form.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={(f) => setFormToDelete(f)}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {forms.map((form) => (
            <FormCardCompact
              key={form.id}
              form={form}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={(f) => setFormToDelete(f)}
              onPreview={handlePreview}
            />
          ))}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Enter a name for your new form. You can add fields and configure
              settings after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                placeholder="e.g., Contact Form, Newsletter Signup"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newFormName.trim() || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!formToDelete}
        onOpenChange={() => setFormToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{formToDelete?.name}&quot;? This
              action cannot be undone. All submissions will also be deleted.
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
