"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Campaign,
  CampaignWithCreator,
  CampaignFormData,
  CampaignFilters,
  CampaignType,
  CampaignStatus,
} from "@/types/campaign";

// Query keys
const CAMPAIGNS_QUERY_KEY = "campaigns";

// ============================================
// API Functions
// ============================================

async function fetchCampaigns(filters?: CampaignFilters): Promise<CampaignWithCreator[]> {
  const params = new URLSearchParams();

  if (filters?.type) {
    params.append("type", filters.type);
  }
  if (filters?.status?.length) {
    filters.status.forEach((s) => params.append("status", s));
  }
  if (filters?.search) {
    params.append("search", filters.search);
  }

  const url = `/api/v1/campaigns${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch campaigns");
  }

  const data = await response.json();
  return data.campaigns;
}

async function fetchCampaign(campaignId: string): Promise<CampaignWithCreator> {
  const response = await fetch(`/api/v1/campaigns/${campaignId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch campaign");
  }

  const data = await response.json();
  return data.campaign;
}

async function createCampaign(data: CampaignFormData): Promise<Campaign> {
  const response = await fetch("/api/v1/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create campaign");
  }

  const result = await response.json();
  return result.campaign;
}

async function updateCampaign({
  id,
  data,
}: {
  id: string;
  data: Partial<CampaignFormData>;
}): Promise<Campaign> {
  const response = await fetch(`/api/v1/campaigns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update campaign");
  }

  const result = await response.json();
  return result.campaign;
}

async function deleteCampaign(campaignId: string): Promise<void> {
  const response = await fetch(`/api/v1/campaigns/${campaignId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete campaign");
  }
}

async function duplicateCampaign(campaignId: string): Promise<Campaign> {
  const response = await fetch(`/api/v1/campaigns/${campaignId}/duplicate`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to duplicate campaign");
  }

  const result = await response.json();
  return result.campaign;
}

async function startCampaign(campaignId: string): Promise<Campaign> {
  const response = await fetch(`/api/v1/campaigns/${campaignId}/start`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start campaign");
  }

  const result = await response.json();
  return result.campaign;
}

async function pauseCampaign(campaignId: string): Promise<Campaign> {
  const response = await fetch(`/api/v1/campaigns/${campaignId}/pause`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to pause campaign");
  }

  const result = await response.json();
  return result.campaign;
}

async function fetchCampaignContacts(
  campaignId: string
): Promise<{ contactId: string; status: string }[]> {
  const response = await fetch(`/api/v1/campaigns/${campaignId}/contacts`);

  if (!response.ok) {
    throw new Error("Failed to fetch campaign contacts");
  }

  const data = await response.json();
  return data.contacts;
}

async function addCampaignContacts({
  campaignId,
  contactIds,
}: {
  campaignId: string;
  contactIds: string[];
}): Promise<void> {
  const response = await fetch(`/api/v1/campaigns/${campaignId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add contacts to campaign");
  }
}

// ============================================
// React Query Hooks
// ============================================

// Hook for fetching all campaigns
export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: [CAMPAIGNS_QUERY_KEY, filters],
    queryFn: () => fetchCampaigns(filters),
  });
}

// Hook for fetching a single campaign
export function useCampaign(campaignId: string | undefined) {
  return useQuery({
    queryKey: [CAMPAIGNS_QUERY_KEY, campaignId],
    queryFn: () => fetchCampaign(campaignId!),
    enabled: !!campaignId,
  });
}

// Hook for fetching campaigns by type
export function useCampaignsByType(type: CampaignType) {
  return useQuery({
    queryKey: [CAMPAIGNS_QUERY_KEY, "type", type],
    queryFn: () => fetchCampaigns({ type }),
  });
}

// Hook for creating a campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}

// Hook for updating a campaign
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
      queryClient.setQueryData([CAMPAIGNS_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for deleting a campaign
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}

// Hook for duplicating a campaign
export function useDuplicateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}

// Hook for starting a campaign
export function useStartCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
      queryClient.setQueryData([CAMPAIGNS_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for pausing a campaign
export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
      queryClient.setQueryData([CAMPAIGNS_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for fetching campaign contacts
export function useCampaignContacts(campaignId: string | undefined) {
  return useQuery({
    queryKey: [CAMPAIGNS_QUERY_KEY, campaignId, "contacts"],
    queryFn: () => fetchCampaignContacts(campaignId!),
    enabled: !!campaignId,
  });
}

// Hook for adding contacts to a campaign
export function useAddCampaignContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCampaignContacts,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CAMPAIGNS_QUERY_KEY, variables.campaignId],
      });
    },
  });
}

// Hook for invalidating campaigns cache
export function useInvalidateCampaigns() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
  };
}
