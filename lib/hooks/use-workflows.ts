import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Workflow, WorkflowWithCreator, WorkflowFormData, WorkflowFilters, WorkflowStatus } from "@/types/workflow";

// Query keys
export const workflowKeys = {
  all: ["workflows"] as const,
  lists: () => [...workflowKeys.all, "list"] as const,
  list: (filters?: WorkflowFilters) => [...workflowKeys.lists(), filters] as const,
  details: () => [...workflowKeys.all, "detail"] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
};

// API functions
async function fetchWorkflows(filters?: WorkflowFilters): Promise<{
  workflows: WorkflowWithCreator[];
  total: number;
}> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);

  const response = await fetch(`/api/v1/workflows?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch workflows");
  }
  return response.json();
}

async function fetchWorkflow(id: string): Promise<Workflow> {
  const response = await fetch(`/api/v1/workflows/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch workflow");
  }
  return response.json();
}

async function createWorkflow(data: WorkflowFormData): Promise<Workflow> {
  const response = await fetch("/api/v1/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create workflow");
  }
  return response.json();
}

async function updateWorkflow({
  id,
  data,
}: {
  id: string;
  data: Partial<WorkflowFormData> | Partial<Workflow>;
}): Promise<Workflow> {
  const response = await fetch(`/api/v1/workflows/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update workflow");
  }
  return response.json();
}

async function deleteWorkflow(id: string): Promise<void> {
  const response = await fetch(`/api/v1/workflows/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete workflow");
  }
}

async function duplicateWorkflow(id: string): Promise<Workflow> {
  const response = await fetch(`/api/v1/workflows/${id}/duplicate`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to duplicate workflow");
  }
  return response.json();
}

async function updateWorkflowStatus({
  id,
  status,
}: {
  id: string;
  status: WorkflowStatus;
}): Promise<Workflow> {
  const response = await fetch(`/api/v1/workflows/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error("Failed to update workflow status");
  }
  return response.json();
}

// Hooks
export function useWorkflows(filters?: WorkflowFilters) {
  return useQuery({
    queryKey: workflowKeys.list(filters),
    queryFn: () => fetchWorkflows(filters),
  });
}

export function useWorkflow(
  id: string,
  options?: Omit<UseQueryOptions<Workflow>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () => fetchWorkflow(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.setQueryData(workflowKeys.detail(data.id), data);
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useDuplicateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
    },
  });
}

export function useActivateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateWorkflowStatus({ id, status: "active" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.setQueryData(workflowKeys.detail(data.id), data);
    },
  });
}

export function usePauseWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateWorkflowStatus({ id, status: "paused" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.setQueryData(workflowKeys.detail(data.id), data);
    },
  });
}

export function useArchiveWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateWorkflowStatus({ id, status: "archived" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.setQueryData(workflowKeys.detail(data.id), data);
    },
  });
}
