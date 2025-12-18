import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PipelineFilters, DealCard } from "@/types/pipeline";

interface PipelineUIState {
  // Selected pipeline
  selectedPipelineId: string | null;
  setSelectedPipelineId: (id: string | null) => void;

  // View mode (board or list)
  viewMode: "board" | "list";
  setViewMode: (mode: "board" | "list") => void;

  // Filters
  filters: PipelineFilters;
  setFilters: (filters: PipelineFilters) => void;
  updateFilter: <K extends keyof PipelineFilters>(
    key: K,
    value: PipelineFilters[K]
  ) => void;
  clearFilters: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Deal being dragged
  draggingDealId: string | null;
  setDraggingDealId: (id: string | null) => void;

  // Deal being edited/viewed
  selectedDeal: DealCard | null;
  setSelectedDeal: (deal: DealCard | null) => void;

  // Modals
  isCreateDealOpen: boolean;
  setIsCreateDealOpen: (open: boolean) => void;

  isDealDetailOpen: boolean;
  setIsDealDetailOpen: (open: boolean) => void;

  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (open: boolean) => void;

  // Collapsed stages (for compact view)
  collapsedStages: Set<string>;
  toggleStageCollapse: (stageId: string) => void;
  setStageCollapsed: (stageId: string, collapsed: boolean) => void;

  // Show won/lost deals
  showWonDeals: boolean;
  setShowWonDeals: (show: boolean) => void;

  showLostDeals: boolean;
  setShowLostDeals: (show: boolean) => void;

  // Optimistic updates for drag and drop
  optimisticUpdates: Map<string, { stageId: string; position: number }>;
  setOptimisticUpdate: (
    dealId: string,
    update: { stageId: string; position: number }
  ) => void;
  clearOptimisticUpdate: (dealId: string) => void;
  clearAllOptimisticUpdates: () => void;
}

const defaultFilters: PipelineFilters = {};

export const usePipelineStore = create<PipelineUIState>()(
  persist(
    (set) => ({
      // Selected pipeline
      selectedPipelineId: null,
      setSelectedPipelineId: (id) => set({ selectedPipelineId: id }),

      // View mode
      viewMode: "board",
      setViewMode: (mode) => set({ viewMode: mode }),

      // Filters
      filters: defaultFilters,
      setFilters: (filters) => set({ filters }),
      updateFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      clearFilters: () => set({ filters: defaultFilters }),

      // Search
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Dragging
      draggingDealId: null,
      setDraggingDealId: (id) => set({ draggingDealId: id }),

      // Selected deal
      selectedDeal: null,
      setSelectedDeal: (deal) => set({ selectedDeal: deal }),

      // Modals
      isCreateDealOpen: false,
      setIsCreateDealOpen: (open) => set({ isCreateDealOpen: open }),

      isDealDetailOpen: false,
      setIsDealDetailOpen: (open) => set({ isDealDetailOpen: open }),

      isFilterPanelOpen: false,
      setIsFilterPanelOpen: (open) => set({ isFilterPanelOpen: open }),

      // Collapsed stages
      collapsedStages: new Set(),
      toggleStageCollapse: (stageId) =>
        set((state) => {
          const newCollapsed = new Set(state.collapsedStages);
          if (newCollapsed.has(stageId)) {
            newCollapsed.delete(stageId);
          } else {
            newCollapsed.add(stageId);
          }
          return { collapsedStages: newCollapsed };
        }),
      setStageCollapsed: (stageId, collapsed) =>
        set((state) => {
          const newCollapsed = new Set(state.collapsedStages);
          if (collapsed) {
            newCollapsed.add(stageId);
          } else {
            newCollapsed.delete(stageId);
          }
          return { collapsedStages: newCollapsed };
        }),

      // Won/lost deals visibility
      showWonDeals: false,
      setShowWonDeals: (show) => set({ showWonDeals: show }),

      showLostDeals: false,
      setShowLostDeals: (show) => set({ showLostDeals: show }),

      // Optimistic updates
      optimisticUpdates: new Map(),
      setOptimisticUpdate: (dealId, update) =>
        set((state) => {
          const newUpdates = new Map(state.optimisticUpdates);
          newUpdates.set(dealId, update);
          return { optimisticUpdates: newUpdates };
        }),
      clearOptimisticUpdate: (dealId) =>
        set((state) => {
          const newUpdates = new Map(state.optimisticUpdates);
          newUpdates.delete(dealId);
          return { optimisticUpdates: newUpdates };
        }),
      clearAllOptimisticUpdates: () =>
        set({ optimisticUpdates: new Map() }),
    }),
    {
      name: "cstg-crm-pipeline-storage",
      partialize: (state) => ({
        selectedPipelineId: state.selectedPipelineId,
        viewMode: state.viewMode,
        showWonDeals: state.showWonDeals,
        showLostDeals: state.showLostDeals,
      }),
      // Convert Set to Array for serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// Selector hooks for common state slices
export const useSelectedPipelineId = () =>
  usePipelineStore((state) => state.selectedPipelineId);

export const usePipelineViewMode = () =>
  usePipelineStore((state) => state.viewMode);

export const usePipelineFilters = () =>
  usePipelineStore((state) => state.filters);

export const useDraggingDealId = () =>
  usePipelineStore((state) => state.draggingDealId);

export const useSelectedDeal = () =>
  usePipelineStore((state) => state.selectedDeal);
