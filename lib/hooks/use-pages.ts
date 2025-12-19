"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  LandingPage,
  PageWithCreator,
  PageFormData,
  PageFilters,
} from "@/types/page";

// Query keys
const PAGES_QUERY_KEY = "pages";

// ============================================
// API Functions
// ============================================

async function fetchPages(filters?: PageFilters): Promise<PageWithCreator[]> {
  const params = new URLSearchParams();

  if (filters?.status?.length) {
    filters.status.forEach((s) => params.append("status", s));
  }
  if (filters?.search) {
    params.append("search", filters.search);
  }

  const url = `/api/v1/pages${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch pages");
  }

  const data = await response.json();
  return data.pages;
}

async function fetchPage(pageId: string): Promise<PageWithCreator> {
  const response = await fetch(`/api/v1/pages/${pageId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch page");
  }

  const data = await response.json();
  return data.page;
}

async function createPage(data: PageFormData): Promise<LandingPage> {
  const response = await fetch("/api/v1/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create page");
  }

  const result = await response.json();
  return result.page;
}

async function updatePage({
  id,
  data,
}: {
  id: string;
  data: Partial<PageFormData>;
}): Promise<LandingPage> {
  const response = await fetch(`/api/v1/pages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update page");
  }

  const result = await response.json();
  return result.page;
}

async function deletePage(pageId: string): Promise<void> {
  const response = await fetch(`/api/v1/pages/${pageId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete page");
  }
}

async function duplicatePage(pageId: string): Promise<LandingPage> {
  const response = await fetch(`/api/v1/pages/${pageId}/duplicate`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to duplicate page");
  }

  const result = await response.json();
  return result.page;
}

async function publishPage(pageId: string): Promise<LandingPage> {
  const response = await fetch(`/api/v1/pages/${pageId}/publish`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to publish page");
  }

  const result = await response.json();
  return result.page;
}

async function unpublishPage(pageId: string): Promise<LandingPage> {
  const response = await fetch(`/api/v1/pages/${pageId}/unpublish`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to unpublish page");
  }

  const result = await response.json();
  return result.page;
}

// ============================================
// React Query Hooks
// ============================================

// Hook for fetching all pages
export function usePages(filters?: PageFilters) {
  return useQuery({
    queryKey: [PAGES_QUERY_KEY, filters],
    queryFn: () => fetchPages(filters),
  });
}

// Hook for fetching a single page
export function usePage(pageId: string | undefined) {
  return useQuery({
    queryKey: [PAGES_QUERY_KEY, pageId],
    queryFn: () => fetchPage(pageId!),
    enabled: !!pageId,
  });
}

// Hook for creating a page
export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] });
    },
  });
}

// Hook for updating a page
export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] });
      queryClient.setQueryData([PAGES_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for deleting a page
export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] });
    },
  });
}

// Hook for duplicating a page
export function useDuplicatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicatePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] });
    },
  });
}

// Hook for publishing a page
export function usePublishPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishPage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] });
      queryClient.setQueryData([PAGES_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for unpublishing a page
export function useUnpublishPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unpublishPage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] });
      queryClient.setQueryData([PAGES_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for invalidating pages cache
export function useInvalidatePages() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [PAGES_QUERY_KEY] });
  };
}
