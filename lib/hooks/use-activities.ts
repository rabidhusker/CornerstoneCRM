"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/types/database";
import type {
  Activity,
  ActivityWithUser,
  ActivityFormData,
  ActivityFilters,
} from "@/types/activity";

const ACTIVITIES_QUERY_KEY = "activities";

interface UseActivitiesOptions {
  contactId?: string;
  dealId?: string;
  filters?: ActivityFilters;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

// Fetch activities for a contact or deal
async function fetchActivities(
  options: UseActivitiesOptions
): Promise<{ activities: ActivityWithUser[]; total: number }> {
  const supabase = createClient();
  const { contactId, dealId, filters, limit = 20, offset = 0 } = options;

  let query = supabase
    .from("crm_activities")
    .select(
      `
      *,
      user:users!crm_activities_user_id_fkey(id, full_name, avatar_url)
    `,
      { count: "exact" }
    );

  // Filter by contact
  if (contactId) {
    query = query.eq("contact_id", contactId);
  }

  // Filter by deal
  if (dealId) {
    query = query.eq("deal_id", dealId);
  }

  // Filter by type
  if (filters?.type && filters.type.length > 0) {
    query = query.in("type", filters.type);
  }

  // Filter by completed status
  if (filters?.completed !== undefined) {
    if (filters.completed) {
      query = query.not("completed_at", "is", null);
    } else {
      query = query.is("completed_at", null);
    }
  }

  // Filter by date range
  if (filters?.dateRange) {
    query = query
      .gte("created_at", filters.dateRange.from.toISOString())
      .lte("created_at", filters.dateRange.to.toISOString());
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
    activities: (data as ActivityWithUser[]) || [],
    total: count || 0,
  };
}

// Fetch tasks (activities with type='task' that are not completed)
async function fetchTasks(
  contactId: string,
  showCompleted = false
): Promise<Activity[]> {
  const supabase = createClient();

  let query = supabase
    .from("crm_activities")
    .select("*")
    .eq("contact_id", contactId)
    .eq("type", "task");

  if (!showCompleted) {
    query = query.is("completed_at", null);
  }

  query = query.order("due_date", { ascending: true, nullsFirst: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);

  if (error) {
    throw new Error(error.message);
  }

  return (data as Activity[]) || [];
}

// Create a new activity
async function createActivity(formData: ActivityFormData): Promise<Activity> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get user's workspace
  const { data: workspaceMemberData } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const workspaceMember = workspaceMemberData as { workspace_id: string } | null;

  if (!workspaceMember) {
    throw new Error("No workspace found");
  }

  const insertData: Database["public"]["Tables"]["crm_activities"]["Insert"] = {
    workspace_id: workspaceMember.workspace_id,
    user_id: user.id,
    type: formData.type,
    title: formData.title,
    description: formData.description || null,
    due_date: formData.dueDate || null,
    outcome: formData.outcome || null,
    contact_id: formData.contactId || null,
    deal_id: formData.dealId || null,
    metadata: (formData.metadata || {}) as Json,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("crm_activities")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Activity;
}

// Update an activity
async function updateActivity(
  id: string,
  updates: Partial<ActivityFormData> & { completedAt?: string | null }
): Promise<Activity> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined)
    updateData.description = updates.description || null;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate || null;
  if (updates.outcome !== undefined) updateData.outcome = updates.outcome || null;
  if (updates.completedAt !== undefined)
    updateData.completed_at = updates.completedAt;
  if (updates.metadata !== undefined)
    updateData.metadata = updates.metadata as Json;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("crm_activities")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Activity;
}

// Delete an activity
async function deleteActivity(id: string): Promise<void> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("crm_activities")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

// Hook for fetching activities
export function useActivities(options: UseActivitiesOptions = {}) {
  return useQuery({
    queryKey: [
      ACTIVITIES_QUERY_KEY,
      options.contactId,
      options.dealId,
      options.filters,
      options.limit,
      options.offset,
    ],
    queryFn: () => fetchActivities(options),
    enabled: options.enabled !== false && !!(options.contactId || options.dealId),
  });
}

// Hook for fetching tasks for a contact
export function useContactTasks(contactId: string, showCompleted = false) {
  return useQuery({
    queryKey: [ACTIVITIES_QUERY_KEY, "tasks", contactId, showCompleted],
    queryFn: () => fetchTasks(contactId, showCompleted),
    enabled: !!contactId,
  });
}

// Hook for creating an activity
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY] });
    },
  });
}

// Hook for updating an activity
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ActivityFormData> & { completedAt?: string | null };
    }) => updateActivity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY] });
    },
  });
}

// Hook for deleting an activity
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY] });
    },
  });
}
