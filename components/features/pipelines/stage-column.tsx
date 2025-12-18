"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight, Plus, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DealCard, DealCardCompact } from "./deal-card";
import type { StageWithDeals, DealCard as DealCardType } from "@/types/pipeline";
import { usePipelineStore } from "@/stores/pipeline-store";

interface StageColumnProps {
  stage: StageWithDeals;
  isCompact?: boolean;
  onAddDeal?: (stageId: string) => void;
  onEditDeal?: (deal: DealCardType) => void;
  onDeleteDeal?: (deal: DealCardType) => void;
  onMarkDealWon?: (deal: DealCardType) => void;
  onMarkDealLost?: (deal: DealCardType) => void;
  onDealClick?: (deal: DealCardType) => void;
}

export function StageColumn({
  stage,
  isCompact = false,
  onAddDeal,
  onEditDeal,
  onDeleteDeal,
  onMarkDealWon,
  onMarkDealLost,
  onDealClick,
}: StageColumnProps) {
  const {
    collapsedStages,
    toggleStageCollapse,
    setSelectedDeal,
    setIsDealDetailOpen,
  } = usePipelineStore();

  const isCollapsed = collapsedStages.has(stage.id);

  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: {
      type: "stage",
      stage,
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDealClick = (deal: DealCardType) => {
    if (onDealClick) {
      onDealClick(deal);
    } else {
      setSelectedDeal(deal);
      setIsDealDetailOpen(true);
    }
  };

  // Get the deal IDs for sortable context
  const dealIds = stage.deals.map((deal) => deal.id);

  return (
    <div
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg border min-h-[500px]",
        isCollapsed ? "w-14" : "w-80 min-w-[320px]",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {/* Stage Header */}
      <div
        className={cn(
          "flex items-center gap-2 p-3 border-b bg-muted/50 rounded-t-lg",
          isCollapsed && "flex-col py-4"
        )}
      >
        <button
          onClick={() => toggleStageCollapse(stage.id)}
          className="flex-shrink-0 p-0.5 hover:bg-muted rounded"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            <span
              className="text-xs font-medium text-center"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              {stage.name}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1">
              {stage.dealCount}
            </Badge>
          </div>
        ) : (
          <>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{stage.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {stage.dealCount}
                </Badge>
              </div>
              {stage.totalValue > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stage.totalValue)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddDeal?.(stage.id)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add deal</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Stage options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => toggleStageCollapse(stage.id)}
                  >
                    Collapse column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>

      {/* Stage Content */}
      {!isCollapsed && (
        <ScrollArea className="flex-1">
          <div
            ref={setNodeRef}
            className={cn(
              "p-2 space-y-2 min-h-[400px]",
              isOver && "bg-primary/5"
            )}
          >
            <SortableContext
              items={dealIds}
              strategy={verticalListSortingStrategy}
            >
              {stage.deals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No deals in this stage
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1"
                    onClick={() => onAddDeal?.(stage.id)}
                  >
                    Add a deal
                  </Button>
                </div>
              ) : isCompact ? (
                stage.deals.map((deal) => (
                  <DealCardCompact
                    key={deal.id}
                    deal={deal}
                    onClick={() => handleDealClick(deal)}
                  />
                ))
              ) : (
                stage.deals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={onEditDeal}
                    onDelete={onDeleteDeal}
                    onMarkWon={onMarkDealWon}
                    onMarkLost={onMarkDealLost}
                  />
                ))
              )}
            </SortableContext>
          </div>
        </ScrollArea>
      )}

      {/* Won/Lost Stage Indicator */}
      {(stage.is_won_stage || stage.is_lost_stage) && !isCollapsed && (
        <div
          className={cn(
            "px-3 py-2 text-xs font-medium text-center border-t",
            stage.is_won_stage && "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
            stage.is_lost_stage && "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          )}
        >
          {stage.is_won_stage && "Won Stage"}
          {stage.is_lost_stage && "Lost Stage"}
        </div>
      )}
    </div>
  );
}
