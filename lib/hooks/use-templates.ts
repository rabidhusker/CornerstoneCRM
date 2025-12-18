"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  EmailTemplate,
  EmailTemplateWithCreator,
  TemplateFormData,
  TemplateFilters,
} from "@/types/template";

// Query keys
const TEMPLATES_QUERY_KEY = "templates";

// ============================================
// API Functions
// ============================================

async function fetchTemplates(
  filters?: TemplateFilters
): Promise<EmailTemplateWithCreator[]> {
  const params = new URLSearchParams();

  if (filters?.category) {
    params.append("category", filters.category);
  }
  if (filters?.search) {
    params.append("search", filters.search);
  }

  const url = `/api/v1/templates${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }

  const data = await response.json();
  return data.templates;
}

async function fetchTemplate(templateId: string): Promise<EmailTemplateWithCreator> {
  const response = await fetch(`/api/v1/templates/${templateId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch template");
  }

  const data = await response.json();
  return data.template;
}

async function createTemplate(data: TemplateFormData): Promise<EmailTemplate> {
  const response = await fetch("/api/v1/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create template");
  }

  const result = await response.json();
  return result.template;
}

async function updateTemplate({
  id,
  data,
}: {
  id: string;
  data: Partial<TemplateFormData>;
}): Promise<EmailTemplate> {
  const response = await fetch(`/api/v1/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update template");
  }

  const result = await response.json();
  return result.template;
}

async function deleteTemplate(templateId: string): Promise<void> {
  const response = await fetch(`/api/v1/templates/${templateId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete template");
  }
}

async function duplicateTemplate(templateId: string): Promise<EmailTemplate> {
  const response = await fetch(`/api/v1/templates/${templateId}/duplicate`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to duplicate template");
  }

  const result = await response.json();
  return result.template;
}

// ============================================
// React Query Hooks
// ============================================

// Hook for fetching all templates
export function useTemplates(filters?: TemplateFilters) {
  return useQuery({
    queryKey: [TEMPLATES_QUERY_KEY, filters],
    queryFn: () => fetchTemplates(filters),
  });
}

// Hook for fetching a single template
export function useTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: [TEMPLATES_QUERY_KEY, templateId],
    queryFn: () => fetchTemplate(templateId!),
    enabled: !!templateId,
  });
}

// Hook for creating a template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
    },
  });
}

// Hook for updating a template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      queryClient.setQueryData([TEMPLATES_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for deleting a template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
    },
  });
}

// Hook for duplicating a template
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
    },
  });
}

// Hook for invalidating templates cache
export function useInvalidateTemplates() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
  };
}
