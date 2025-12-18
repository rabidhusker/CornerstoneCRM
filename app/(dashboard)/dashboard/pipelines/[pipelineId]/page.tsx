"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Settings,
  Loader2,
  X,
} from "lucide-react";

import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
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
import { PipelineBoard, PipelineBoardHeader } from "@/components/features/pipelines";
import { DealDetailSheet } from "@/components/features/pipelines/deal-detail-sheet";
import { CloseDealDialog } from "@/components/features/pipelines/close-deal-dialog";
import { usePipeline, usePipelineBoard } from "@/lib/hooks/use-pipelines";
import { useDeleteDeal } from "@/lib/hooks/use-deals";
import { usePipelineStore } from "@/stores/pipeline-store";
import type { DealCard, PipelineFilters } from "@/types/pipeline";

interface PipelineBoardPageProps {
  params: Promise<{ pipelineId: string }>;
}

export default function PipelineBoardPage({ params }: PipelineBoardPageProps) {
  const { pipelineId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  // Pipeline store state
  const {
    viewMode,
    setViewMode,
    filters,
    clearFilters,
    searchQuery,
    setSearchQuery,
    showWonDeals,
    setShowWonDeals,
    showLostDeals,
    setShowLostDeals,
    selectedDeal,
    setSelectedDeal,
    isDealDetailOpen,
    setIsDealDetailOpen,
  } = usePipelineStore();

  // Local state
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchQuery);
  const [dealToDelete, setDealToDelete] = React.useState<DealCard | null>(null);
  const [dealForWon, setDealForWon] = React.useState<DealCard | null>(null);
  const [dealForLost, setDealForLost] = React.useState<DealCard | null>(null);
  const [lostReason, setLostReason] = React.useState("");

  // Queries
  const { data: pipeline, isLoading: pipelineLoading } = usePipeline(pipelineId);

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
    pipelineId,
    activeFilters
  );

  // Mutations
  const deleteDealMutation = useDeleteDeal();

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handlers
  const handleAddDeal = (stageId: string) => {
    router.push(`/dashboard/deals/new?stageId=${stageId}&pipelineId=${pipelineId}`);
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

  const hasActiveFilters =
    (filters.assignedTo && filters.assignedTo.length > 0) ||
    (filters.tags && filters.tags.length > 0) ||
    filters.minValue !== undefined ||
    filters.maxValue !== undefined;

  if (pipelineLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (!pipeline) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Pipeline not found</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title={pipeline.name}
          description={pipeline.description || "Pipeline board view"}
          breadcrumbs={[
            { label: "Pipelines", href: "/dashboard/pipelines" },
            { label: pipeline.name },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/pipelines/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
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

        {/* Pipeline Board */}
        <PipelineBoard
          pipelineId={pipelineId}
          filters={activeFilters}
          isCompact={viewMode === "list"}
          onAddDeal={handleAddDeal}
          onEditDeal={handleEditDeal}
          onDeleteDeal={setDealToDelete}
          onMarkDealWon={setDealForWon}
          onMarkDealLost={setDealForLost}
        />
      </ShellContent>

      {/* Deal Detail Sheet */}
      <DealDetailSheet
        deal={selectedDeal}
        open={isDealDetailOpen}
        onOpenChange={(open) => {
          setIsDealDetailOpen(open);
          if (!open) setSelectedDeal(null);
        }}
      />

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

      {/* Close Deal Dialogs */}
      {dealForWon && (
        <CloseDealDialog
          deal={dealForWon}
          type="won"
          open={!!dealForWon}
          onOpenChange={(open) => !open && setDealForWon(null)}
          onComplete={() => setDealForWon(null)}
        />
      )}

      {dealForLost && (
        <CloseDealDialog
          deal={dealForLost}
          type="lost"
          open={!!dealForLost}
          onOpenChange={(open) => !open && setDealForLost(null)}
          onComplete={() => setDealForLost(null)}
        />
      )}
    </Shell>
  );
}
