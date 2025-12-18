"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  Settings,
  ChevronRight,
} from "lucide-react";
import { ReactFlowProvider } from "reactflow";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  useWorkflow,
  useUpdateWorkflow,
  useActivateWorkflow,
  usePauseWorkflow,
} from "@/lib/hooks/use-workflows";
import {
  useWorkflowStore,
  useWorkflowIsDirty,
} from "@/stores/workflow-store";
import { WorkflowCanvas } from "@/components/features/automation/workflow-canvas";
import { WorkflowSidebar } from "@/components/features/automation/workflow-sidebar";
import { NodeConfigPanel } from "@/components/features/automation/node-config-panel";

const statusConfig = {
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

export default function WorkflowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const workflowId = params.id as string;
  const isNew = workflowId === "new";

  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [showConfigPanel, setShowConfigPanel] = React.useState(false);
  const [isEditingName, setIsEditingName] = React.useState(false);

  // Store state
  const {
    workflowName,
    workflowStatus,
    setWorkflowName,
    loadWorkflow,
    exportWorkflow,
    resetWorkflow,
    selectedNodeId,
    validateWorkflow,
    validationErrors,
  } = useWorkflowStore();
  const isDirty = useWorkflowIsDirty();

  // Fetch workflow if editing
  const {
    data: workflow,
    isLoading,
    error,
  } = useWorkflow(workflowId, {
    enabled: !isNew,
  });

  // Mutations
  const updateMutation = useUpdateWorkflow();
  const activateMutation = useActivateWorkflow();
  const pauseMutation = usePauseWorkflow();

  // Load workflow into store when fetched
  React.useEffect(() => {
    if (workflow) {
      loadWorkflow(workflow);
    } else if (isNew) {
      resetWorkflow();
    }
  }, [workflow, isNew, loadWorkflow, resetWorkflow]);

  // Show config panel when a node is selected
  React.useEffect(() => {
    if (selectedNodeId) {
      setShowConfigPanel(true);
    }
  }, [selectedNodeId]);

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      router.push("/dashboard/automation");
    }
  };

  const handleSave = async () => {
    // Validate workflow
    const isValid = validateWorkflow();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const workflowData = exportWorkflow();

      if (isNew) {
        // Create new workflow
        const response = await fetch("/api/v1/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workflowData),
        });

        if (!response.ok) {
          throw new Error("Failed to create workflow");
        }

        const newWorkflow = await response.json();
        toast({
          title: "Workflow created",
          description: "Your workflow has been saved.",
        });
        router.push(`/dashboard/automation/${newWorkflow.id}`);
      } else {
        // Update existing workflow
        await updateMutation.mutateAsync({
          id: workflowId,
          data: workflowData,
        });
        toast({
          title: "Workflow saved",
          description: "Your changes have been saved.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workflow.",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async () => {
    if (isNew) {
      toast({
        title: "Save first",
        description: "Please save the workflow before activating.",
        variant: "destructive",
      });
      return;
    }

    try {
      await activateMutation.mutateAsync(workflowId);
      toast({
        title: "Workflow activated",
        description: "Your workflow is now active.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to activate workflow.",
        variant: "destructive",
      });
    }
  };

  const handlePause = async () => {
    try {
      await pauseMutation.mutateAsync(workflowId);
      toast({
        title: "Workflow paused",
        description: "Your workflow has been paused.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to pause workflow.",
        variant: "destructive",
      });
    }
  };

  const handleDiscardAndLeave = () => {
    resetWorkflow();
    router.push("/dashboard/automation");
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isNew && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium">Workflow not found</p>
        <p className="text-muted-foreground mb-4">
          The workflow you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push("/dashboard/automation")}>
          Go to Automation
        </Button>
      </div>
    );
  }

  const status = isNew ? "draft" : workflowStatus;
  const statusConf = statusConfig[status];
  const canActivate = status === "draft" || status === "paused";
  const canPause = status === "active";

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {isEditingName ? (
                <Input
                  autoFocus
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="h-8 w-[300px] font-semibold"
                />
              ) : (
                <h1
                  className="text-lg font-semibold cursor-pointer hover:bg-accent px-2 py-1 rounded"
                  onClick={() => setIsEditingName(true)}
                >
                  {workflowName || "Untitled Workflow"}
                </h1>
              )}

              <Badge className={cn(statusConf.bgColor, statusConf.color)}>
                {statusConf.label}
              </Badge>

              {isDirty && (
                <Badge variant="secondary" className="text-xs">
                  Unsaved changes
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canActivate && !isNew && (
              <Button
                variant="outline"
                onClick={handleActivate}
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Activate
              </Button>
            )}

            {canPause && (
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={pauseMutation.isPending}
              >
                {pauseMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                Pause
              </Button>
            )}

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !isDirty}
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

        {/* Validation Errors Banner */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>
                {Object.values(validationErrors).flat().length} validation error(s)
              </span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <WorkflowSidebar className="w-[280px] shrink-0" />

          {/* Canvas */}
          <div className="flex-1 relative">
            <WorkflowCanvas
              onNodeSelect={(id) => setShowConfigPanel(!!id)}
            />
          </div>

          {/* Config Panel */}
          {showConfigPanel && (
            <NodeConfigPanel
              className="w-[320px] shrink-0"
              onClose={() => setShowConfigPanel(false)}
            />
          )}
        </div>

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to leave? Your
                changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDiscardAndLeave}>
                Discard and Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ReactFlowProvider>
  );
}
