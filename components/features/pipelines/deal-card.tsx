"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import {
  Building2,
  Calendar,
  DollarSign,
  GripVertical,
  MoreHorizontal,
  User,
  MapPin,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DealCard as DealCardType } from "@/types/pipeline";
import { usePipelineStore } from "@/stores/pipeline-store";

interface DealCardProps {
  deal: DealCardType;
  isDragging?: boolean;
  onEdit?: (deal: DealCardType) => void;
  onDelete?: (deal: DealCardType) => void;
  onMarkWon?: (deal: DealCardType) => void;
  onMarkLost?: (deal: DealCardType) => void;
}

export function DealCard({
  deal,
  isDragging = false,
  onEdit,
  onDelete,
  onMarkWon,
  onMarkLost,
}: DealCardProps) {
  const { setSelectedDeal, setIsDealDetailOpen } = usePipelineStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: "deal",
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = () => {
    setSelectedDeal(deal);
    setIsDealDetailOpen(true);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const contactName = deal.contact
    ? `${deal.contact.firstName} ${deal.contact.lastName}`.trim()
    : null;

  const isOverdue =
    deal.expectedCloseDate &&
    new Date(deal.expectedCloseDate) < new Date() &&
    deal.status === "open";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg ring-2 ring-primary",
        deal.status === "won" && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
        deal.status === "lost" && "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight truncate">
              {deal.title}
            </h4>
            {contactName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <User className="h-3 w-3" />
                <span className="truncate">{contactName}</span>
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onEdit?.(deal)}>
              Edit deal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {deal.status === "open" && (
              <>
                <DropdownMenuItem
                  onClick={() => onMarkWon?.(deal)}
                  className="text-green-600"
                >
                  Mark as won
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMarkLost?.(deal)}
                  className="text-red-600"
                >
                  Mark as lost
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => onDelete?.(deal)}
              className="text-destructive"
            >
              Delete deal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2">
        {/* Value */}
        {deal.value && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(deal.value)}
            </span>
          </div>
        )}

        {/* Property Address */}
        {deal.propertyAddress && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{deal.propertyAddress}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{deal.propertyAddress}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Expected Close Date */}
        {deal.expectedCloseDate && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs",
              isOverdue ? "text-red-600" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" />
            <span>
              {isOverdue ? "Overdue: " : "Close: "}
              {format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}
            </span>
          </div>
        )}

        {/* Tags */}
        {deal.tags && deal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {deal.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
            {deal.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{deal.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for dense view
export function DealCardCompact({
  deal,
  isDragging = false,
  onClick,
}: {
  deal: DealCardType;
  isDragging?: boolean;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: "deal",
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 p-2 rounded-md border bg-card cursor-pointer transition-all hover:shadow-sm",
        (isDragging || isSortableDragging) && "opacity-50 shadow-md ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{deal.title}</p>
      </div>
      {deal.value && (
        <span className="text-xs font-medium text-green-600">
          {formatCurrency(deal.value)}
        </span>
      )}
    </div>
  );
}
