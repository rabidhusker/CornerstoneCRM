"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Check,
  ChevronDown,
  Filter,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Pipeline, PipelineStage } from "@/types/pipeline";
import type { DealFilters, DealStatus } from "@/types/deal";

interface SavedView {
  id: string;
  name: string;
  filters: DealFilters;
}

interface PipelineFiltersProps {
  pipelines: Pipeline[];
  stages: PipelineStage[];
  filters: DealFilters;
  onFiltersChange: (filters: DealFilters) => void;
  savedViews?: SavedView[];
  onSaveView?: (name: string, filters: DealFilters) => void;
  onDeleteView?: (viewId: string) => void;
  onLoadView?: (view: SavedView) => void;
}

const statusOptions: { value: DealStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function PipelineFilters({
  pipelines,
  stages,
  filters,
  onFiltersChange,
  savedViews = [],
  onSaveView,
  onDeleteView,
  onLoadView,
}: PipelineFiltersProps) {
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [viewName, setViewName] = React.useState("");
  const [stagePopoverOpen, setStagePopoverOpen] = React.useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = React.useState(false);

  // Filter stages by selected pipeline
  const filteredStages = React.useMemo(() => {
    if (!filters.pipelineId) return stages;
    return stages.filter((s) => s.pipeline_id === filters.pipelineId);
  }, [stages, filters.pipelineId]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.pipelineId) count++;
    if (filters.stageId?.length) count++;
    if (filters.status?.length) count++;
    if (filters.assignedTo?.length) count++;
    if (filters.minValue !== undefined || filters.maxValue !== undefined) count++;
    if (filters.dateRange) count++;
    return count;
  }, [filters]);

  const handlePipelineChange = (pipelineId: string) => {
    onFiltersChange({
      ...filters,
      pipelineId: pipelineId === "all" ? undefined : pipelineId,
      stageId: undefined, // Reset stages when pipeline changes
    });
  };

  const handleStageToggle = (stageId: string) => {
    const currentStages = filters.stageId || [];
    const newStages = currentStages.includes(stageId)
      ? currentStages.filter((id) => id !== stageId)
      : [...currentStages, stageId];

    onFiltersChange({
      ...filters,
      stageId: newStages.length > 0 ? newStages : undefined,
    });
  };

  const handleStatusToggle = (status: DealStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleValueRangeChange = (field: "minValue" | "maxValue", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({
      ...filters,
      [field]: numValue,
    });
  };

  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: from && to ? { from, to } : undefined,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const handleSaveView = () => {
    if (viewName.trim() && onSaveView) {
      onSaveView(viewName.trim(), filters);
      setViewName("");
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Pipeline Filter */}
        <Select
          value={filters.pipelineId || "all"}
          onValueChange={handlePipelineChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Pipelines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pipelines</SelectItem>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stage Multi-Select */}
        <Popover open={stagePopoverOpen} onOpenChange={setStagePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-[180px] justify-between",
                filters.stageId?.length && "border-primary"
              )}
            >
              {filters.stageId?.length ? (
                <span className="truncate">
                  {filters.stageId.length} stage{filters.stageId.length !== 1 ? "s" : ""}
                </span>
              ) : (
                "All Stages"
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search stages..." />
              <CommandList>
                <CommandEmpty>No stages found.</CommandEmpty>
                <CommandGroup>
                  {filteredStages.map((stage) => (
                    <CommandItem
                      key={stage.id}
                      onSelect={() => handleStageToggle(stage.id)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          filters.stageId?.includes(stage.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "opacity-50"
                        )}
                      >
                        {filters.stageId?.includes(stage.id) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <div
                        className="mr-2 h-3 w-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Status Multi-Select */}
        <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-[140px] justify-between",
                filters.status?.length && "border-primary"
              )}
            >
              {filters.status?.length ? (
                <span className="truncate">
                  {filters.status.length} status{filters.status.length !== 1 ? "es" : ""}
                </span>
              ) : (
                "All Status"
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[160px] p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {statusOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleStatusToggle(option.value)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          filters.status?.includes(option.value)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "opacity-50"
                        )}
                      >
                        {filters.status?.includes(option.value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Value Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-between",
                (filters.minValue !== undefined || filters.maxValue !== undefined) &&
                  "border-primary"
              )}
            >
              {filters.minValue !== undefined || filters.maxValue !== undefined
                ? "Value set"
                : "Value Range"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px]" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimum Value</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minValue ?? ""}
                  onChange={(e) => handleValueRangeChange("minValue", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum Value</Label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={filters.maxValue ?? ""}
                  onChange={(e) => handleValueRangeChange("maxValue", e.target.value)}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[220px] justify-start text-left font-normal",
                filters.dateRange && "border-primary"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "LLL dd")} -{" "}
                    {format(filters.dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(filters.dateRange.from, "LLL dd, y")
                )
              ) : (
                "Expected Close Date"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={{
                from: filters.dateRange?.from,
                to: filters.dateRange?.to,
              }}
              onSelect={(range) =>
                handleDateRangeChange(range?.from, range?.to)
              }
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Filter Actions */}
        {activeFilterCount > 0 && (
          <>
            <Badge variant="secondary" className="h-9 px-3">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          </>
        )}

        {/* Save View Button */}
        {onSaveView && activeFilterCount > 0 && (
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save as View</DialogTitle>
                <DialogDescription>
                  Save your current filters as a named view for quick access.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="view-name">View Name</Label>
                <Input
                  id="view-name"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="e.g., High Value Open Deals"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveView} disabled={!viewName.trim()}>
                  Save View
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Saved Views */}
      {savedViews.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Saved Views:</span>
            {savedViews.map((view) => (
              <div
                key={view.id}
                className="flex items-center gap-1 bg-muted rounded-md"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => onLoadView?.(view)}
                >
                  {view.name}
                </Button>
                {onDeleteView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:text-destructive"
                    onClick={() => onDeleteView(view.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
