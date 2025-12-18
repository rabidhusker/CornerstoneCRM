"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Deal, DealWithRelations, DealFilters, DealFormData } from "@/types/deal";
import type { Json } from "@/types/database";

const DEALS_QUERY_KEY = "deals";
const PIPELINE_BOARD_QUERY_KEY = "pipeline-board";

interface UseDealsOptions {
  contactId?: string;
  filters?: DealFilters;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

// Fetch deals for a contact
async function fetchContactDeals(
  contactId: string,
  options: Omit<UseDealsOptions, "contactId"> = {}
): Promise<{ deals: DealWithRelations[]; total: number }> {
  const supabase = createClient();
  const { filters, limit = 10, offset = 0 } = options;

  let query = supabase
    .from("crm_deals")
    .select(
      `
      *,
      pipeline:crm_pipelines!crm_deals_pipeline_id_fkey(id, name, is_default),
      stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color, position)
    `,
      { count: "exact" }
    )
    .eq("contact_id", contactId);

  // Filter by status
  if (filters?.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }

  // Filter by pipeline
  if (filters?.pipelineId) {
    query = query.eq("pipeline_id", filters.pipelineId);
  }

  // Order by created_at descending
  query = query.order("created_at", { ascending: false });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (query as any);

  if (error) {
    throw new Error(error.message);
  }

  return {
    deals: (data as DealWithRelations[]) || [],
    total: count || 0,
  };
}

// Hook for fetching deals for a contact
export function useContactDeals(
  contactId: string,
  options: Omit<UseDealsOptions, "contactId"> = {}
) {
  return useQuery({
    queryKey: [DEALS_QUERY_KEY, "contact", contactId, options.filters],
    queryFn: () => fetchContactDeals(contactId, options),
    enabled: options.enabled !== false && !!contactId,
  });
}

// Hook for invalidating deals cache
export function useInvalidateDeals() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
  };
}

// Fetch a single deal by ID
async function fetchDeal(dealId: string): Promise<DealWithRelations | null> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("crm_deals")
    .select(
      `
      *,
      pipeline:crm_pipelines!crm_deals_pipeline_id_fkey(id, name, is_default),
      stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color, position),
      contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email)
    `
    )
    .eq("id", dealId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DealWithRelations;
}

// Hook for fetching a single deal
export function useDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: [DEALS_QUERY_KEY, dealId],
    queryFn: () => fetchDeal(dealId!),
    enabled: !!dealId,
  });
}

// Hook for creating a deal
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DealFormData) => {
      const supabase = createClient();

      const insertData = {
        title: data.title,
        description: data.description || null,
        pipeline_id: data.pipelineId,
        stage_id: data.stageId,
        contact_id: data.contactId,
        value: data.value || null,
        expected_close_date: data.expectedCloseDate || null,
        assigned_to: data.assignedTo || null,
        property_address: data.propertyAddress || null,
        property_city: data.propertyCity || null,
        property_state: data.propertyState || null,
        property_zip: data.propertyZip || null,
        property_type: data.propertyType || null,
        tags: data.tags || [],
        custom_fields: (data.customFields || {}) as Json,
        status: "open" as const,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deal, error } = await (supabase as any)
        .from("crm_deals")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return deal as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
    },
  });
}

// Hook for updating a deal
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<DealFormData>;
    }) => {
      const supabase = createClient();

      const updateData: Record<string, unknown> = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.pipelineId !== undefined) updateData.pipeline_id = data.pipelineId;
      if (data.stageId !== undefined) updateData.stage_id = data.stageId;
      if (data.contactId !== undefined) updateData.contact_id = data.contactId;
      if (data.value !== undefined) updateData.value = data.value || null;
      if (data.expectedCloseDate !== undefined) updateData.expected_close_date = data.expectedCloseDate || null;
      if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo || null;
      if (data.propertyAddress !== undefined) updateData.property_address = data.propertyAddress || null;
      if (data.propertyCity !== undefined) updateData.property_city = data.propertyCity || null;
      if (data.propertyState !== undefined) updateData.property_state = data.propertyState || null;
      if (data.propertyZip !== undefined) updateData.property_zip = data.propertyZip || null;
      if (data.propertyType !== undefined) updateData.property_type = data.propertyType || null;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.customFields !== undefined) updateData.custom_fields = data.customFields as Json;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deal, error } = await (supabase as any)
        .from("crm_deals")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return deal as Deal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
    },
  });
}

// Hook for moving a deal to a different stage
export function useMoveDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      targetStageId,
      status,
    }: {
      dealId: string;
      targetStageId: string;
      status?: "open" | "won" | "lost";
    }) => {
      const supabase = createClient();

      const updateData: Record<string, unknown> = {
        stage_id: targetStageId,
      };

      // If status is changing, update related fields
      if (status) {
        updateData.status = status;
        if (status === "won") {
          updateData.won_date = new Date().toISOString();
          updateData.actual_close_date = new Date().toISOString();
        } else if (status === "lost") {
          updateData.lost_date = new Date().toISOString();
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deal, error } = await (supabase as any)
        .from("crm_deals")
        .update(updateData)
        .eq("id", dealId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return deal as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
    },
  });
}

// Hook for deleting a deal
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: string) => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("crm_deals")
        .delete()
        .eq("id", dealId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
    },
  });
}

// Hook for bulk updating deals
export function useBulkUpdateDeals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealIds,
      updates,
    }: {
      dealIds: string[];
      updates: {
        stageId?: string;
        status?: "open" | "won" | "lost";
        assignedTo?: string | null;
      };
    }) => {
      const supabase = createClient();

      const updateData: Record<string, unknown> = {};
      if (updates.stageId !== undefined) updateData.stage_id = updates.stageId;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("crm_deals")
        .update(updateData)
        .in("id", dealIds);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
    },
  });
}

// Hook for marking a deal as won
export function useMarkDealWon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      wonStageId,
      actualCloseDate,
    }: {
      dealId: string;
      wonStageId: string;
      actualCloseDate?: string;
    }) => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deal, error } = await (supabase as any)
        .from("crm_deals")
        .update({
          stage_id: wonStageId,
          status: "won",
          won_date: new Date().toISOString(),
          actual_close_date: actualCloseDate || new Date().toISOString(),
        })
        .eq("id", dealId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return deal as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
    },
  });
}

// Hook for marking a deal as lost
export function useMarkDealLost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      lostStageId,
      lostReason,
    }: {
      dealId: string;
      lostStageId: string;
      lostReason?: string;
    }) => {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deal, error } = await (supabase as any)
        .from("crm_deals")
        .update({
          stage_id: lostStageId,
          status: "lost",
          lost_date: new Date().toISOString(),
          lost_reason: lostReason || null,
        })
        .eq("id", dealId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return deal as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_BOARD_QUERY_KEY] });
    },
  });
}
