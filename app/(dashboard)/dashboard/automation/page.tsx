"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Archive,
  Copy,
  Trash2,
  Edit,
  GitBranch,
  Users,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import {
  useWorkflows,
  useDeleteWorkflow,
  useDuplicateWorkflow,
  useActivateWorkflow,
  usePauseWorkflow,
  useArchiveWorkflow,
} from "@/lib/hooks/use-workflows";
import type { WorkflowWithCreator, WorkflowStatus } from "@/types/workflow";

const statusConfig: Record<
  WorkflowStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  active: {
    label: "Active",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  paused: {
    label: "Paused",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  archived: {
    label: "Archived",
    color: "text-gray-500 dark:text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
};

export default function AutomationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteWorkflowId, setDeleteWorkflowId] = React.useState<string | null>(null);

  // Fetch workflows
  const {
    data,
    isLoading,
    error,
  } = useWorkflows({
    status: activeTab === "all" ? undefined : (activeTab as WorkflowStatus),
    search: searchQuery || undefined,
  });

  // Mutations
  const deleteMutation = useDeleteWorkflow();
  const duplicateMutation = useDuplicateWorkflow();
  const activateMutation = useActivateWorkflow();
  const pauseMutation = usePauseWorkflow();
  const archiveMutation = useArchiveWorkflow();

  const handleCreateWorkflow = () => {
    router.push("/dashboard/automation/new");
  };

  const handleEditWorkflow = (id: string) => {
    router.push(`/dashboard/automation/${id}`);
  };

  const handleDuplicateWorkflow = async (id: string) => {
    try {
      const newWorkflow = await duplicateMutation.mutateAsync(id);
      toast({
        title: "Workflow duplicated",
        description: "A copy of the workflow has been created.",
      });
      router.push(`/dashboard/automation/${newWorkflow.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to duplicate workflow.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return;
    try {
      await deleteMutation.mutateAsync(deleteWorkflowId);
      toast({
        title: "Workflow deleted",
        description: "The workflow has been removed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete workflow.",
        variant: "destructive",
      });
    } finally {
      setDeleteWorkflowId(null);
    }
  };

  const handleActivateWorkflow = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id);
      toast({
        title: "Workflow activated",
        description: "The workflow is now active.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to activate workflow.",
        variant: "destructive",
      });
    }
  };

  const handlePauseWorkflow = async (id: string) => {
    try {
      await pauseMutation.mutateAsync(id);
      toast({
        title: "Workflow paused",
        description: "The workflow has been paused.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to pause workflow.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveWorkflow = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      toast({
        title: "Workflow archived",
        description: "The workflow has been archived.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to archive workflow.",
        variant: "destructive",
      });
    }
  };

  // Count workflows by status
  const workflows = data?.workflows || [];
  const statusCounts = {
    all: workflows.length,
    active: workflows.filter((w) => w.status === "active").length,
    draft: workflows.filter((w) => w.status === "draft").length,
    paused: workflows.filter((w) => w.status === "paused").length,
    archived: workflows.filter((w) => w.status === "archived").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-muted-foreground">
            Create and manage workflow automations
          </p>
        </div>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
            <TabsTrigger value="paused">Paused ({statusCounts.paused})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({statusCounts.archived})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Workflow List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium">Failed to load workflows</p>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      ) : workflows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first workflow to automate your processes
            </p>
            <Button onClick={handleCreateWorkflow}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onEdit={() => handleEditWorkflow(workflow.id)}
              onDuplicate={() => handleDuplicateWorkflow(workflow.id)}
              onDelete={() => setDeleteWorkflowId(workflow.id)}
              onActivate={() => handleActivateWorkflow(workflow.id)}
              onPause={() => handlePauseWorkflow(workflow.id)}
              onArchive={() => handleArchiveWorkflow(workflow.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteWorkflowId}
        onOpenChange={() => setDeleteWorkflowId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkflow}
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

interface WorkflowCardProps {
  workflow: WorkflowWithCreator;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onPause: () => void;
  onArchive: () => void;
}

function WorkflowCard({
  workflow,
  onEdit,
  onDuplicate,
  onDelete,
  onActivate,
  onPause,
  onArchive,
}: WorkflowCardProps) {
  const config = statusConfig[workflow.status];
  const canActivate = workflow.status === "draft" || workflow.status === "paused";
  const canPause = workflow.status === "active";
  const canArchive = workflow.status !== "archived";

  return (
    <Card
      className="hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold line-clamp-1">{workflow.name}</h3>
              <Badge className={cn("mt-1", config.bgColor, config.color)}>
                {config.label}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canActivate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onActivate();
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
              {canPause && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onPause();
                  }}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </DropdownMenuItem>
              )}
              {canArchive && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
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
        {workflow.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {workflow.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{workflow.enrolled_count} enrolled</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(workflow.updated_at))} ago</span>
          </div>
        </div>

        {workflow.steps && workflow.steps.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {workflow.steps.length} step{workflow.steps.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
