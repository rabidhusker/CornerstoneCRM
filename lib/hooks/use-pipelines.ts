"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type {
  Pipeline,
  PipelineWithStages,
  PipelineBoardData,
  DealCard,
  StageWithDeals,
  PipelineFilters,
} from "@/types/pipeline";

const PIPELINES_QUERY_KEY = "pipelines";
const PIPELINE_BOARD_QUERY_KEY = "pipeline-board";

// Fetch all pipelines for the workspace
async function fetchPipelines(): Promise<Pipeline[]> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("crm_pipelines")
    .select("*")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

// Fetch a single pipeline with its stages
async function fetchPipelineWithStages(
  pipelineId: string
): Promise<PipelineWithStages | null> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pipeline, error: pipelineError } = await (supabase as any)
    .from("crm_pipelines")
    .select("*")
    .eq("id", pipelineId)
    .single();

  if (pipelineError) {
    throw new Error(pipelineError.message);
  }

  if (!pipeline) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stages, error: stagesError } = await (supabase as any)
    .from("crm_pipeline_stages")
    .select("*")
    .eq("pipeline_id", pipelineId)
    .order("position");

  if (stagesError) {
    throw new Error(stagesError.message);
  }

  return {
    ...pipeline,
    stages: stages || [],
  };
}

// Fetch pipeline board data (pipeline + stages + deals)
async function fetchPipelineBoardData(
  pipelineId: string,
  filters?: PipelineFilters
): Promise<PipelineBoardData | null> {
  const supabase = createClient();

  // Fetch pipeline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pipeline, error: pipelineError } = await (supabase as any)
    .from("crm_pipelines")
    .select("*")
    .eq("id", pipelineId)
    .single();

  if (pipelineError) {
    throw new Error(pipelineError.message);
  }

  if (!pipeline) {
    return null;
  }

  // Fetch stages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stages, error: stagesError } = await (supabase as any)
    .from("crm_pipeline_stages")
    .select("*")
    .eq("pipeline_id", pipelineId)
    .order("position");

  if (stagesError) {
    throw new Error(stagesError.message);
  }

  // Build deals query with filters
  let dealsQuery = supabase
    .from("crm_deals")
    .select(
      `
      id,
      title,
      value,
      status,
      stage_id,
      pipeline_id,
      expected_close_date,
      property_address,
      assigned_to,
      tags,
      created_at,
      updated_at,
      contact:crm_contacts!crm_deals_contact_id_fkey(
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("pipeline_id", pipelineId);

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    dealsQuery = dealsQuery.in("status", filters.status);
  } else {
    // By default, only show open deals on the board
    dealsQuery = dealsQuery.eq("status", "open");
  }

  if (filters?.assignedTo && filters.assignedTo.length > 0) {
    dealsQuery = dealsQuery.in("assigned_to", filters.assignedTo);
  }

  if (filters?.minValue !== undefined) {
    dealsQuery = dealsQuery.gte("value", filters.minValue);
  }

  if (filters?.maxValue !== undefined) {
    dealsQuery = dealsQuery.lte("value", filters.maxValue);
  }

  if (filters?.search) {
    dealsQuery = dealsQuery.ilike("title", `%${filters.search}%`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deals, error: dealsError } = await (dealsQuery as any);

  if (dealsError) {
    throw new Error(dealsError.message);
  }

  // Transform deals to DealCard format
  const dealCards: DealCard[] = (deals || []).map((deal: {
    id: string;
    title: string;
    value: number | null;
    status: "open" | "won" | "lost";
    stage_id: string;
    pipeline_id: string;
    expected_close_date: string | null;
    property_address: string | null;
    assigned_to: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
    contact: {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
    } | null;
  }) => ({
    id: deal.id,
    title: deal.title,
    value: deal.value,
    status: deal.status,
    stageId: deal.stage_id,
    pipelineId: deal.pipeline_id,
    expectedCloseDate: deal.expected_close_date,
    propertyAddress: deal.property_address,
    contact: deal.contact
      ? {
          id: deal.contact.id,
          firstName: deal.contact.first_name,
          lastName: deal.contact.last_name,
          email: deal.contact.email,
        }
      : null,
    assignedTo: deal.assigned_to,
    tags: deal.tags || [],
    createdAt: deal.created_at,
    updatedAt: deal.updated_at,
  }));

  // Group deals by stage
  const stagesWithDeals: StageWithDeals[] = (stages || []).map(
    (stage: { id: string; [key: string]: unknown }) => {
      const stageDeals = dealCards.filter((deal) => deal.stageId === stage.id);
      const totalValue = stageDeals.reduce(
        (sum, deal) => sum + (deal.value || 0),
        0
      );

      return {
        ...stage,
        deals: stageDeals,
        totalValue,
        dealCount: stageDeals.length,
      } as StageWithDeals;
    }
  );

  // Calculate totals
  const totalValue = dealCards.reduce(
    (sum, deal) => sum + (deal.value || 0),
    0
  );
  const totalDeals = dealCards.length;

  return {
    pipeline,
    stages: stagesWithDeals,
    totalValue,
    totalDeals,
  };
}

// Get default pipeline for workspace
async function fetchDefaultPipeline(): Promise<Pipeline | null> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("crm_pipelines")
    .select("*")
    .eq("is_default", true)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new Error(error.message);
  }

  return data || null;
}

// ============================================
// React Query Hooks
// ============================================

// Hook for fetching all pipelines
export function usePipelines() {
  return useQuery({
    queryKey: [PIPELINES_QUERY_KEY],
    queryFn: fetchPipelines,
  });
}

// Hook for fetching a single pipeline with stages
export function usePipeline(pipelineId: string | undefined) {
  return useQuery({
    queryKey: [PIPELINES_QUERY_KEY, pipelineId],
    queryFn: () => fetchPipelineWithStages(pipelineId!),
    enabled: !!pipelineId,
  });
}

// Hook for fetching the default pipeline
export function useDefaultPipeline() {
  return useQuery({
    queryKey: [PIPELINES_QUERY_KEY, "default"],
    queryFn: fetchDefaultPipeline,
  });
}

// Hook for fetching pipeline board data
export function usePipelineBoard(
  pipelineId: string | undefined,
  filters?: PipelineFilters
) {
  return useQuery({
    queryKey: [PIPELINE_BOARD_QUERY_KEY, pipelineId, filters],
    queryFn: () => fetchPipelineBoardData(pipelineId!, filters),
    enabled: !!pipelineId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Hook for creating a pipeline
export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      isDefault?: boolean;
    }) => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pipeline, error } = await (supabase as any)
        .from("crm_pipelines")
        .insert({
          name: data.name,
          description: data.description || null,
          is_default: data.isDefault || false,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return pipeline as Pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PIPELINES_QUERY_KEY] });
    },
  });
}

// Hook for updating a pipeline
export function useUpdatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string; isDefault?: boolean };
    }) => {
      const supabase = createClient();

      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.isDefault !== undefined) updateData.is_default = data.isDefault;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pipeline, error } = await (supabase as any)
        .from("crm_pipelines")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return pipeline as Pipeline;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PIPELINES_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [PIPELINES_QUERY_KEY, variables.id],
      });
    },
  });
}

// Hook for deleting a pipeline
export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pipelineId: string) => {
      const supabase = createClient();

      // Soft delete by setting is_active to false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("crm_pipelines")
        .update({ is_active: false })
        .eq("id", pipelineId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PIPELINES_QUERY_KEY] });
    },
  });
}

// Hook for invalidating pipeline cache
export function useInvalidatePipelines() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [PIPELINES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
  };
}

// Hook for invalidating pipeline board cache
export function useInvalidatePipelineBoard() {
  const queryClient = useQueryClient();

  return (pipelineId?: string) => {
    if (pipelineId) {
      queryClient.invalidateQueries({
        queryKey: [PIPELINE_BOARD_QUERY_KEY, pipelineId],
      });
    } else {
      queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
    }
  };
}
