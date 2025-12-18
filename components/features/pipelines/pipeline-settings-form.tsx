"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  Loader2,
  Trophy,
  X as XIcon,
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUpdatePipeline, usePipeline } from "@/lib/hooks/use-pipelines";
import { defaultStageColors } from "@/types/pipeline";
import type { Pipeline, PipelineStage } from "@/types/pipeline";

interface PipelineSettingsFormProps {
  pipeline: Pipeline;
  onClose: () => void;
}

interface StageFormData extends Omit<PipelineStage, "created_at" | "updated_at" | "pipeline_id"> {
  isNew?: boolean;
}

export function PipelineSettingsForm({
  pipeline,
  onClose,
}: PipelineSettingsFormProps) {
  const { toast } = useToast();
  const updatePipelineMutation = useUpdatePipeline();

  // Fetch full pipeline with stages
  const { data: pipelineData, isLoading } = usePipeline(pipeline.id);

  // Form state
  const [name, setName] = React.useState(pipeline.name);
  const [description, setDescription] = React.useState(pipeline.description || "");
  const [stages, setStages] = React.useState<StageFormData[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize stages from fetched data
  React.useEffect(() => {
    if (pipelineData?.stages) {
      setStages(
        pipelineData.stages.map((s) => ({
          ...s,
          isNew: false,
        }))
      );
    }
  }, [pipelineData?.stages]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update positions
        return newItems.map((item, index) => ({ ...item, position: index }));
      });
    }
  };

  const handleAddStage = () => {
    const newStage: StageFormData = {
      id: `new-${Date.now()}`,
      name: "New Stage",
      position: stages.length,
      color: defaultStageColors[stages.length % defaultStageColors.length],
      probability: 50,
      is_won_stage: false,
      is_lost_stage: false,
      isNew: true,
    };
    setStages([...stages, newStage]);
  };

  const handleUpdateStage = (
    stageId: string,
    updates: Partial<StageFormData>
  ) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId ? { ...stage, ...updates } : stage
      )
    );
  };

  const handleDeleteStage = (stageId: string) => {
    // Don't allow deleting if only 1 stage remains
    if (stages.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "Pipeline must have at least one stage.",
        variant: "destructive",
      });
      return;
    }

    setStages((prev) => {
      const filtered = prev.filter((s) => s.id !== stageId);
      // Update positions
      return filtered.map((s, i) => ({ ...s, position: i }));
    });
  };

  const handleSetWonStage = (stageId: string) => {
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        is_won_stage: stage.id === stageId,
        // Can't be both won and lost
        is_lost_stage: stage.id === stageId ? false : stage.is_lost_stage,
      }))
    );
  };

  const handleSetLostStage = (stageId: string) => {
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        is_lost_stage: stage.id === stageId,
        // Can't be both won and lost
        is_won_stage: stage.id === stageId ? false : stage.is_won_stage,
      }))
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Pipeline name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update pipeline basic info
      await updatePipelineMutation.mutateAsync({
        id: pipeline.id,
        data: { name, description },
      });

      // Update stages via API
      const stagesPayload = stages.map((stage) => ({
        id: stage.isNew ? undefined : stage.id,
        name: stage.name,
        position: stage.position,
        color: stage.color,
        probability: stage.probability,
        is_won_stage: stage.is_won_stage,
        is_lost_stage: stage.is_lost_stage,
      }));

      const response = await fetch(`/api/v1/pipelines/${pipeline.id}/stages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stages: stagesPayload }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stages");
      }

      toast({
        title: "Pipeline updated",
        description: "Your changes have been saved.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Pipeline Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <Separator />

      {/* Stages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Stages</Label>
          <Button variant="outline" size="sm" onClick={handleAddStage}>
            <Plus className="h-4 w-4 mr-1" />
            Add Stage
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={stages.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {stages.map((stage) => (
                <SortableStageItem
                  key={stage.id}
                  stage={stage}
                  onUpdate={(updates) => handleUpdateStage(stage.id, updates)}
                  onDelete={() => handleDeleteStage(stage.id)}
                  onSetWon={() => handleSetWonStage(stage.id)}
                  onSetLost={() => handleSetLostStage(stage.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// Sortable Stage Item
interface SortableStageItemProps {
  stage: StageFormData;
  onUpdate: (updates: Partial<StageFormData>) => void;
  onDelete: () => void;
  onSetWon: () => void;
  onSetLost: () => void;
}

function SortableStageItem({
  stage,
  onUpdate,
  onDelete,
  onSetWon,
  onSetLost,
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 border rounded-lg bg-card",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-muted rounded p-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Color Picker */}
      <input
        type="color"
        value={stage.color}
        onChange={(e) => onUpdate({ color: e.target.value })}
        className="w-8 h-8 rounded cursor-pointer border-0"
      />

      {/* Name */}
      <Input
        value={stage.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="flex-1"
        placeholder="Stage name"
      />

      {/* Probability */}
      <div className="flex items-center gap-1 w-24">
        <Input
          type="number"
          value={stage.probability ?? ""}
          onChange={(e) =>
            onUpdate({ probability: parseInt(e.target.value) || 0 })
          }
          className="w-16"
          min={0}
          max={100}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>

      {/* Won/Lost toggles */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={stage.is_won_stage ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-8 w-8",
            stage.is_won_stage && "bg-green-600 hover:bg-green-700"
          )}
          onClick={onSetWon}
          title="Mark as Won stage"
        >
          <Trophy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={stage.is_lost_stage ? "default" : "outline"}
          size="icon"
          className={cn(
            "h-8 w-8",
            stage.is_lost_stage && "bg-red-600 hover:bg-red-700"
          )}
          onClick={onSetLost}
          title="Mark as Lost stage"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
