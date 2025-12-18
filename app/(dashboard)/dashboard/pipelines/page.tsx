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
  Settings2,
  Loader2,
  ChevronDown,
  X,
  BarChart3,
  Settings,
} from "lucide-react";

import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  PipelineBoard,
  PipelineBoardHeader,
  DealDetailSheet,
  CloseDealDialog,
} from "@/components/features/pipelines";
import { DealsListView } from "@/components/features/pipelines/deals-list-view";
import { PipelineSummaryCards } from "@/components/features/pipelines/pipeline-summary-cards";
import { DealForecast } from "@/components/features/pipelines/deal-forecast";
import {
  usePipelines,
  useDefaultPipeline,
  usePipelineBoard,
} from "@/lib/hooks/use-pipelines";
import {
  useDeleteDeal,
  useMarkDealWon,
  useMarkDealLost,
} from "@/lib/hooks/use-deals";
import { usePipelineStore } from "@/stores/pipeline-store";
import type { DealCard, PipelineFilters, PipelineStage } from "@/types/pipeline";

export default function PipelinesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Pipeline store state
  const {
    selectedPipelineId,
    setSelectedPipelineId,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    searchQuery,
    setSearchQuery,
    showWonDeals,
    setShowWonDeals,
    showLostDeals,
    setShowLostDeals,
    setIsCreateDealOpen,
  } = usePipelineStore();

  // Local state
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchQuery);
  const [dealToDelete, setDealToDelete] = React.useState<DealCard | null>(null);
  const [dealForWon, setDealForWon] = React.useState<DealCard | null>(null);
  const [dealForLost, setDealForLost] = React.useState<DealCard | null>(null);
  const [lostReason, setLostReason] = React.useState("");
  const [createDealStageId, setCreateDealStageId] = React.useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = React.useState<DealCard | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = React.useState(false);
  const [closeDealType, setCloseDealType] = React.useState<"won" | "lost" | null>(null);
  const [showSummary, setShowSummary] = React.useState(true);

  // Queries
  const { data: pipelines, isLoading: pipelinesLoading } = usePipelines();
  const { data: defaultPipeline } = useDefaultPipeline();

  // Set default pipeline on initial load
  React.useEffect(() => {
    if (!selectedPipelineId && defaultPipeline) {
      setSelectedPipelineId(defaultPipeline.id);
    } else if (!selectedPipelineId && pipelines && pipelines.length > 0) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [defaultPipeline, pipelines, selectedPipelineId, setSelectedPipelineId]);

  // Build filters with status
  const activeFilters: PipelineFilters = React.useMemo(() => {
    const statusFilter: ("open" | "won" | "lost")[] = ["open"];
    if (showWonDeals) statusFilter.push("won");
    if (showLostDeals) statusFilter.push("lost");

    return {
      ...filters,
      status: statusFilter,
      search: debouncedSearch || undefined,
    };
  }, [filters, showWonDeals, showLostDeals, debouncedSearch]);

  // Fetch board data
  const { data: boardData, isLoading: boardLoading } = usePipelineBoard(
    selectedPipelineId || undefined,
    activeFilters
  );

  // Mutations
  const deleteDealMutation = useDeleteDeal();
  const markWonMutation = useMarkDealWon();
  const markLostMutation = useMarkDealLost();

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Find won and lost stages
  const wonStage = React.useMemo(() => {
    return boardData?.stages.find((s) => s.is_won_stage);
  }, [boardData?.stages]);

  const lostStage = React.useMemo(() => {
    return boardData?.stages.find((s) => s.is_lost_stage);
  }, [boardData?.stages]);

  // Flatten all deals for list view and summary
  const allDeals = React.useMemo(() => {
    if (!boardData?.stages) return [];
    return boardData.stages.flatMap((stage) => stage.deals);
  }, [boardData?.stages]);

  // Get all stages
  const allStages = React.useMemo(() => {
    if (!boardData?.stages) return [];
    return boardData.stages as PipelineStage[];
  }, [boardData?.stages]);

  // Handlers
  const handleAddDeal = (stageId: string) => {
    setCreateDealStageId(stageId);
    // For now, navigate to a create deal page
    // In a full implementation, this would open a modal
    router.push(`/dashboard/deals/new?stageId=${stageId}&pipelineId=${selectedPipelineId}`);
  };

  const handleEditDeal = (deal: DealCard) => {
    router.push(`/dashboard/deals/${deal.id}/edit`);
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;

    try {
      await deleteDealMutation.mutateAsync(dealToDelete.id);
      toast({
        title: "Deal deleted",
        description: `${dealToDelete.title} has been deleted.`,
      });
      setDealToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkWon = async () => {
    if (!dealForWon || !wonStage) return;

    try {
      await markWonMutation.mutateAsync({
        dealId: dealForWon.id,
        wonStageId: wonStage.id,
      });
      toast({
        title: "Deal won!",
        description: `Congratulations! ${dealForWon.title} has been marked as won.`,
      });
      setDealForWon(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark deal as won. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkLost = async () => {
    if (!dealForLost || !lostStage) return;

    try {
      await markLostMutation.mutateAsync({
        dealId: dealForLost.id,
        lostStageId: lostStage.id,
        lostReason: lostReason || undefined,
      });
      toast({
        title: "Deal marked as lost",
        description: `${dealForLost.title} has been marked as lost.`,
      });
      setDealForLost(null);
      setLostReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark deal as lost. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDealClick = (deal: DealCard) => {
    setSelectedDeal(deal);
    setDetailSheetOpen(true);
  };

  const handleCloseDeal = (deal: DealCard, type: "won" | "lost") => {
    setSelectedDeal(deal);
    setCloseDealType(type);
  };

  const handleCloseDealComplete = () => {
    setCloseDealType(null);
    setSelectedDeal(null);
  };

  const hasActiveFilters =
    (filters.assignedTo && filters.assignedTo.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.minValue !== undefined ||
    filters.maxValue !== undefined;

  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title="Pipeline"
          description="Manage your deals and track progress"
          breadcrumbs={[{ label: "Pipeline" }]}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/dashboard/pipelines/forecast">
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Forecast
                </Button>
              </Link>
              <Link href="/dashboard/pipelines/settings">
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button onClick={() => handleAddDeal(boardData?.stages[0]?.id || "")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Deal
              </Button>
            </div>
          }
        />
      </ShellHeader>

      <ShellContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {/* Pipeline Selector */}
            <Select
              value={selectedPipelineId || ""}
              onValueChange={setSelectedPipelineId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines?.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                    {pipeline.is_default && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Default
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Board Stats */}
            <PipelineBoardHeader
              boardData={boardData}
              isLoading={boardLoading}
            />

            {/* Filter Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {hasActiveFilters && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 rounded-full p-0 text-[10px]"
                    >
                      !
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Show Deals</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showWonDeals}
                  onCheckedChange={setShowWonDeals}
                >
                  Won deals
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showLostDeals}
                  onCheckedChange={setShowLostDeals}
                >
                  Lost deals
                </DropdownMenuCheckboxItem>
                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={clearFilters}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "board" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {showSummary && selectedPipelineId && !pipelinesLoading && (
          <PipelineSummaryCards
            deals={allDeals}
            stages={allStages}
            isLoading={boardLoading}
          />
        )}

        {/* Loading State */}
        {(pipelinesLoading || !selectedPipelineId) && (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Pipeline Board (Grid View) */}
        {selectedPipelineId && !pipelinesLoading && viewMode === "board" && (
          <PipelineBoard
            pipelineId={selectedPipelineId}
            filters={activeFilters}
            isCompact={false}
            onAddDeal={handleAddDeal}
            onEditDeal={handleEditDeal}
            onDeleteDeal={setDealToDelete}
            onMarkDealWon={setDealForWon}
            onMarkDealLost={setDealForLost}
            onDealClick={handleDealClick}
          />
        )}

        {/* Deals List View */}
        {selectedPipelineId && !pipelinesLoading && viewMode === "list" && (
          <DealsListView
            deals={allDeals}
            stages={allStages}
            onDealClick={handleDealClick}
            onCloseDeal={handleCloseDeal}
          />
        )}
      </ShellContent>

      {/* Delete Deal Dialog */}
      <AlertDialog
        open={!!dealToDelete}
        onOpenChange={(open) => !open && setDealToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deal?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{dealToDelete?.title}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDealMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Won Dialog */}
      <AlertDialog
        open={!!dealForWon}
        onOpenChange={(open) => !open && setDealForWon(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark deal as won?</AlertDialogTitle>
            <AlertDialogDescription>
              Congratulations! This will mark{" "}
              <span className="font-medium">{dealForWon?.title}</span> as won
              and move it to the won stage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkWon}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {markWonMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Mark as Won
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark Lost Dialog */}
      <Dialog
        open={!!dealForLost}
        onOpenChange={(open) => {
          if (!open) {
            setDealForLost(null);
            setLostReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark deal as lost?</DialogTitle>
            <DialogDescription>
              This will mark{" "}
              <span className="font-medium">{dealForLost?.title}</span> as lost.
              Optionally, provide a reason for losing this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="lostReason">Lost Reason (optional)</Label>
            <Input
              id="lostReason"
              placeholder="e.g., Price too high, Went with competitor"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDealForLost(null);
                setLostReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkLost}
              disabled={markLostMutation.isPending}
            >
              {markLostMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Mark as Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Detail Sheet */}
      <DealDetailSheet
        deal={selectedDeal}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />

      {/* Close Deal Dialog */}
      {closeDealType && selectedDeal && (
        <CloseDealDialog
          deal={selectedDeal}
          type={closeDealType}
          open={!!closeDealType}
          onOpenChange={(open) => !open && setCloseDealType(null)}
          onComplete={handleCloseDealComplete}
        />
      )}
    </Shell>
  );
}
