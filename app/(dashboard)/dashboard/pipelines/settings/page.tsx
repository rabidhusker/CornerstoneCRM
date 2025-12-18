"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MoreHorizontal,
  Loader2,
  Star,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";

import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PipelineSettingsForm } from "@/components/features/pipelines/pipeline-settings-form";
import {
  usePipelines,
  useCreatePipeline,
  useUpdatePipeline,
  useDeletePipeline,
} from "@/lib/hooks/use-pipelines";
import type { Pipeline } from "@/types/pipeline";

export default function PipelineSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [editingPipeline, setEditingPipeline] = React.useState<Pipeline | null>(null);
  const [deletingPipeline, setDeletingPipeline] = React.useState<Pipeline | null>(null);
  const [newPipelineName, setNewPipelineName] = React.useState("");
  const [newPipelineDescription, setNewPipelineDescription] = React.useState("");

  // Queries & Mutations
  const { data: pipelines, isLoading } = usePipelines();
  const createPipelineMutation = useCreatePipeline();
  const updatePipelineMutation = useUpdatePipeline();
  const deletePipelineMutation = useDeletePipeline();

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) return;

    try {
      await createPipelineMutation.mutateAsync({
        name: newPipelineName,
        description: newPipelineDescription || undefined,
        isDefault: pipelines?.length === 0,
      });
      toast({
        title: "Pipeline created",
        description: `${newPipelineName} has been created with default stages.`,
      });
      setShowCreateDialog(false);
      setNewPipelineName("");
      setNewPipelineDescription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create pipeline. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (pipeline: Pipeline) => {
    try {
      await updatePipelineMutation.mutateAsync({
        id: pipeline.id,
        data: { isDefault: true },
      });
      toast({
        title: "Default pipeline updated",
        description: `${pipeline.name} is now the default pipeline.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default pipeline.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePipeline = async () => {
    if (!deletingPipeline) return;

    try {
      await deletePipelineMutation.mutateAsync(deletingPipeline.id);
      toast({
        title: "Pipeline deleted",
        description: `${deletingPipeline.name} has been deleted.`,
      });
      setDeletingPipeline(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pipeline.",
        variant: "destructive",
      });
    }
  };

  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title="Pipeline Settings"
          description="Manage your sales pipelines and stages"
          breadcrumbs={[
            { label: "Pipelines", href: "/dashboard/pipelines" },
            { label: "Settings" },
          ]}
          actions={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Pipeline
            </Button>
          }
        />
      </ShellHeader>

      <ShellContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pipelines?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No pipelines yet</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first pipeline
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pipelines?.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                        {pipeline.is_default && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {pipeline.description && (
                        <CardDescription>{pipeline.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingPipeline(pipeline)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit pipeline
                        </DropdownMenuItem>
                        {!pipeline.is_default && (
                          <DropdownMenuItem
                            onClick={() => handleSetDefault(pipeline)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Set as default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/pipelines/${pipeline.id}`)
                          }
                        >
                          <ChevronRight className="mr-2 h-4 w-4" />
                          View board
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingPipeline(pipeline)}
                          className="text-destructive"
                          disabled={pipeline.is_default}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setEditingPipeline(pipeline)}
                  >
                    <span>Manage stages</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ShellContent>

      {/* Create Pipeline Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Pipeline</DialogTitle>
            <DialogDescription>
              Add a new sales pipeline. Default stages will be created
              automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pipelineName">Pipeline Name</Label>
              <Input
                id="pipelineName"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="e.g., Sales Pipeline, Buyer Pipeline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pipelineDescription">Description (optional)</Label>
              <Textarea
                id="pipelineDescription"
                value={newPipelineDescription}
                onChange={(e) => setNewPipelineDescription(e.target.value)}
                placeholder="Describe the purpose of this pipeline"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePipeline}
              disabled={!newPipelineName.trim() || createPipelineMutation.isPending}
            >
              {createPipelineMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pipeline Dialog */}
      {editingPipeline && (
        <Dialog
          open={!!editingPipeline}
          onOpenChange={(open) => !open && setEditingPipeline(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Pipeline: {editingPipeline.name}</DialogTitle>
              <DialogDescription>
                Update pipeline settings and manage stages
              </DialogDescription>
            </DialogHeader>
            <PipelineSettingsForm
              pipeline={editingPipeline}
              onClose={() => setEditingPipeline(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Pipeline Confirmation */}
      <AlertDialog
        open={!!deletingPipeline}
        onOpenChange={(open) => !open && setDeletingPipeline(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete pipeline?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deletingPipeline?.name}</span>?
              This will also affect all deals in this pipeline. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePipeline}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePipelineMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
