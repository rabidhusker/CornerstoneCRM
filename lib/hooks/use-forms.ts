"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Form,
  FormWithCreator,
  FormFormData,
  FormFilters,
  FormSubmission,
  FormConfig,
  FormSettings,
  FormStyles,
} from "@/types/form";

// Query keys
const FORMS_QUERY_KEY = "forms";

// ============================================
// API Functions
// ============================================

async function fetchForms(filters?: FormFilters): Promise<FormWithCreator[]> {
  const params = new URLSearchParams();

  if (filters?.status?.length) {
    filters.status.forEach((s) => params.append("status", s));
  }
  if (filters?.search) {
    params.append("search", filters.search);
  }

  const url = `/api/v1/forms${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch forms");
  }

  const data = await response.json();
  return data.forms;
}

async function fetchForm(formId: string): Promise<FormWithCreator> {
  const response = await fetch(`/api/v1/forms/${formId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch form");
  }

  const data = await response.json();
  return data.form;
}

async function createForm(data: FormFormData): Promise<Form> {
  const response = await fetch("/api/v1/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create form");
  }

  const result = await response.json();
  return result.form;
}

async function updateForm({
  id,
  data,
}: {
  id: string;
  data: Partial<FormFormData>;
}): Promise<Form> {
  const response = await fetch(`/api/v1/forms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update form");
  }

  const result = await response.json();
  return result.form;
}

async function deleteForm(formId: string): Promise<void> {
  const response = await fetch(`/api/v1/forms/${formId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete form");
  }
}

async function duplicateForm(formId: string): Promise<Form> {
  const response = await fetch(`/api/v1/forms/${formId}/duplicate`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to duplicate form");
  }

  const result = await response.json();
  return result.form;
}

async function fetchFormSubmissions(
  formId: string,
  options?: { page?: number; limit?: number }
): Promise<{ submissions: FormSubmission[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", String(options.page));
  if (options?.limit) params.append("limit", String(options.limit));

  const url = `/api/v1/forms/${formId}/submissions${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch form submissions");
  }

  const data = await response.json();
  return data;
}

// ============================================
// React Query Hooks
// ============================================

// Hook for fetching all forms
export function useForms(filters?: FormFilters) {
  return useQuery({
    queryKey: [FORMS_QUERY_KEY, filters],
    queryFn: () => fetchForms(filters),
  });
}

// Hook for fetching a single form
export function useForm(formId: string | undefined) {
  return useQuery({
    queryKey: [FORMS_QUERY_KEY, formId],
    queryFn: () => fetchForm(formId!),
    enabled: !!formId,
  });
}

// Hook for creating a form
export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORMS_QUERY_KEY] });
    },
  });
}

// Hook for updating a form
export function useUpdateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateForm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [FORMS_QUERY_KEY] });
      queryClient.setQueryData([FORMS_QUERY_KEY, data.id], data);
    },
  });
}

// Hook for deleting a form
export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORMS_QUERY_KEY] });
    },
  });
}

// Hook for duplicating a form
export function useDuplicateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORMS_QUERY_KEY] });
    },
  });
}

// Hook for fetching form submissions
export function useFormSubmissions(
  formId: string | undefined,
  options?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: [FORMS_QUERY_KEY, formId, "submissions", options],
    queryFn: () => fetchFormSubmissions(formId!, options),
    enabled: !!formId,
  });
}

// Hook for invalidating forms cache
export function useInvalidateForms() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [FORMS_QUERY_KEY] });
  };
}
