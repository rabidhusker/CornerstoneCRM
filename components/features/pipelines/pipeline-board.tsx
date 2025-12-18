"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StageColumn } from "./stage-column";
import { DealCard } from "./deal-card";
import type {
  PipelineBoardData,
  StageWithDeals,
  DealCard as DealCardType,
  PipelineFilters,
} from "@/types/pipeline";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useMoveDeal } from "@/lib/hooks/use-deals";
import { usePipelineBoard } from "@/lib/hooks/use-pipelines";
import { useToast } from "@/hooks/use-toast";

interface PipelineBoardProps {
  pipelineId: string;
  filters?: PipelineFilters;
  isCompact?: boolean;
  onAddDeal?: (stageId: string) => void;
  onEditDeal?: (deal: DealCardType) => void;
  onDeleteDeal?: (deal: DealCardType) => void;
  onMarkDealWon?: (deal: DealCardType) => void;
  onMarkDealLost?: (deal: DealCardType) => void;
  onDealClick?: (deal: DealCardType) => void;
}

export function PipelineBoard({
  pipelineId,
  filters,
  isCompact = false,
  onAddDeal,
  onEditDeal,
  onDeleteDeal,
  onMarkDealWon,
  onMarkDealLost,
  onDealClick,
}: PipelineBoardProps) {
  const { toast } = useToast();
  const {
    draggingDealId,
    setDraggingDealId,
    setOptimisticUpdate,
    clearOptimisticUpdate,
  } = usePipelineStore();

  // Fetch pipeline board data
  const { data: boardData, isLoading, isError, refetch } = usePipelineBoard(
    pipelineId,
    filters
  );

  // Move deal mutation
  const moveDealMutation = useMoveDeal();

  // Local state for optimistic updates
  const [localStages, setLocalStages] = React.useState<StageWithDeals[]>([]);

  // Sync local state with server data
  React.useEffect(() => {
    if (boardData?.stages) {
      setLocalStages(boardData.stages);
    }
  }, [boardData?.stages]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Find deal by ID across all stages
  const findDealById = (dealId: string): DealCardType | undefined => {
    for (const stage of localStages) {
      const deal = stage.deals.find((d) => d.id === dealId);
      if (deal) return deal;
    }
    return undefined;
  };

  // Find stage containing a deal
  const findStageByDealId = (dealId: string): StageWithDeals | undefined => {
    return localStages.find((stage) =>
      stage.deals.some((deal) => deal.id === dealId)
    );
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDraggingDealId(active.id as string);
  };

  // Handle drag over (for preview)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Get the source stage
    const sourceStage = findStageByDealId(activeId);
    if (!sourceStage) return;

    // Determine target stage
    let targetStageId: string | undefined;

    if (overId.startsWith("stage-")) {
      // Dropped on stage droppable area
      targetStageId = overId.replace("stage-", "");
    } else {
      // Dropped on another deal
      const overStage = findStageByDealId(overId);
      targetStageId = overStage?.id;
    }

    if (!targetStageId || sourceStage.id === targetStageId) return;

    // Optimistic update - move deal to new stage in local state
    setLocalStages((stages) => {
      const updatedStages = stages.map((stage) => {
        if (stage.id === sourceStage.id) {
          return {
            ...stage,
            deals: stage.deals.filter((deal) => deal.id !== activeId),
            dealCount: stage.dealCount - 1,
          };
        }
        if (stage.id === targetStageId) {
          const movingDeal = sourceStage.deals.find((d) => d.id === activeId);
          if (movingDeal) {
            const updatedDeal = { ...movingDeal, stageId: targetStageId };
            return {
              ...stage,
              deals: [...stage.deals, updatedDeal],
              dealCount: stage.dealCount + 1,
            };
          }
        }
        return stage;
      });
      return updatedStages;
    });
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setDraggingDealId(null);

    if (!over) {
      // Reset to server state if dropped outside
      if (boardData?.stages) {
        setLocalStages(boardData.stages);
      }
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target stage
    let targetStageId: string | undefined;

    if (overId.startsWith("stage-")) {
      targetStageId = overId.replace("stage-", "");
    } else {
      const overStage = findStageByDealId(overId);
      targetStageId = overStage?.id;
    }

    if (!targetStageId) {
      if (boardData?.stages) {
        setLocalStages(boardData.stages);
      }
      return;
    }

    // Find the target stage to check if it's won/lost
    const targetStage = localStages.find((s) => s.id === targetStageId);

    // Determine new status based on target stage
    let newStatus: "open" | "won" | "lost" | undefined;
    if (targetStage?.is_won_stage) {
      newStatus = "won";
    } else if (targetStage?.is_lost_stage) {
      newStatus = "lost";
    }

    // Persist the change to the server
    try {
      setOptimisticUpdate(activeId, { stageId: targetStageId, position: 0 });

      await moveDealMutation.mutateAsync({
        dealId: activeId,
        targetStageId,
        status: newStatus,
      });

      if (newStatus === "won") {
        toast({
          title: "Deal won!",
          description: "Congratulations on closing this deal.",
        });
      } else if (newStatus === "lost") {
        toast({
          title: "Deal marked as lost",
          description: "The deal has been moved to lost.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert to server state on error
      if (boardData?.stages) {
        setLocalStages(boardData.stages);
      }
      toast({
        title: "Error",
        description: "Failed to move deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearOptimisticUpdate(activeId);
    }
  };

  // Get the deal being dragged for overlay
  const activeDeal = draggingDealId ? findDealById(draggingDealId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <p className="text-muted-foreground mb-4">
          Failed to load pipeline data
        </p>
        <button
          onClick={() => refetch()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!boardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No pipeline data available</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4 min-h-[600px]">
          {localStages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              isCompact={isCompact}
              onAddDeal={onAddDeal}
              onEditDeal={onEditDeal}
              onDeleteDeal={onDeleteDeal}
              onMarkDealWon={onMarkDealWon}
              onMarkDealLost={onMarkDealLost}
              onDealClick={onDealClick}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDeal ? (
          <div className="rotate-3 opacity-90">
            <DealCard deal={activeDeal} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Pipeline board header with stats
interface PipelineBoardHeaderProps {
  boardData: PipelineBoardData | null | undefined;
  isLoading?: boolean;
}

export function PipelineBoardHeader({
  boardData,
  isLoading,
}: PipelineBoardHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-6 animate-pulse">
        <div className="h-5 w-24 bg-muted rounded" />
        <div className="h-5 w-32 bg-muted rounded" />
      </div>
    );
  }

  if (!boardData) return null;

  return (
    <div className="flex items-center gap-6 text-sm">
      <div>
        <span className="text-muted-foreground">Total Deals:</span>{" "}
        <span className="font-semibold">{boardData.totalDeals}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Total Value:</span>{" "}
        <span className="font-semibold text-green-600">
          {formatCurrency(boardData.totalValue)}
        </span>
      </div>
    </div>
  );
}
