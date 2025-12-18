"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/types/database";
import type {
  Contact,
  ContactFilters,
  ContactSort,
  ContactsResponse,
  ContactFormData,
  BulkUpdateData,
} from "@/types/contact";
import { transformContactFormToDb } from "@/lib/validations/contact";
import type { ContactSchemaType } from "@/lib/validations/contact";

const CONTACTS_QUERY_KEY = "contacts";

interface UseContactsOptions {
  filters?: ContactFilters;
  sort?: ContactSort;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

// Fetch contacts with filters, sorting, and pagination
async function fetchContacts(
  options: UseContactsOptions
): Promise<ContactsResponse> {
  const supabase = createClient();
  const { filters, sort, page = 1, pageSize = 10 } = options;

  // Start building query
  let query = supabase
    .from("crm_contacts")
    .select("*", { count: "exact" });

  // Apply search filter
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(
      `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company_name.ilike.${searchTerm},phone.ilike.${searchTerm}`
    );
  }

  // Apply type filter
  if (filters?.type && filters.type.length > 0) {
    query = query.in("type", filters.type);
  }

  // Apply status filter
  if (filters?.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }

  // Apply tags filter (contains any of the specified tags)
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps("tags", filters.tags);
  }

  // Apply assigned to filter
  if (filters?.assignedTo && filters.assignedTo.length > 0) {
    query = query.in("assigned_to", filters.assignedTo);
  }

  // Apply date range filter
  if (filters?.dateRange) {
    query = query
      .gte("created_at", filters.dateRange.from.toISOString())
      .lte("created_at", filters.dateRange.to.toISOString());
  }

  // Apply has email filter
  if (filters?.hasEmail === true) {
    query = query.not("email", "is", null);
  } else if (filters?.hasEmail === false) {
    query = query.is("email", null);
  }

  // Apply has phone filter
  if (filters?.hasPhone === true) {
    query = query.not("phone", "is", null);
  } else if (filters?.hasPhone === false) {
    query = query.is("phone", null);
  }

  // Apply sorting
  const sortField = sort?.field || "created_at";
  const sortDirection = sort?.direction || "desc";
  query = query.order(sortField, { ascending: sortDirection === "asc" });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    contacts: (data as Contact[]) || [],
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

// Fetch single contact by ID
async function fetchContact(id: string): Promise<Contact> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Contact;
}

// Create a new contact
async function createContact(formData: ContactFormData): Promise<Contact> {
  const supabase = createClient();

  // Get current user's workspace
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

  // Type assertion for workspace member data
  const workspaceMember = workspaceMemberData as { workspace_id: string } | null;

  if (!workspaceMember) {
    throw new Error("No workspace found");
  }

  // Convert form data to schema type with defaults
  const schemaData: ContactSchemaType = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email || "",
    phone: formData.phone || "",
    companyName: formData.companyName || "",
    jobTitle: formData.jobTitle || "",
    addressLine1: formData.addressLine1 || "",
    addressLine2: formData.addressLine2 || "",
    city: formData.city || "",
    state: formData.state || "",
    zipCode: formData.zipCode || "",
    country: formData.country || "USA",
    type: formData.type || "buyer",
    status: formData.status || "active",
    source: formData.source || "",
    sourceDetail: formData.sourceDetail || "",
    tags: formData.tags || [],
    assignedTo: formData.assignedTo || "",
    customFields: formData.customFields || {},
  };

  const dbData = transformContactFormToDb(schemaData);

  const insertData: Database["public"]["Tables"]["crm_contacts"]["Insert"] = {
    ...dbData,
    custom_fields: dbData.custom_fields as Json,
    workspace_id: workspaceMember.workspace_id,
  };

  // Type assertion needed due to Supabase SSR client type inference limitations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("crm_contacts")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Contact;
}

// Update an existing contact
async function updateContact(
  id: string,
  formData: Partial<ContactFormData>
): Promise<Contact> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {};

  if (formData.email !== undefined) updates.email = formData.email || null;
  if (formData.phone !== undefined) updates.phone = formData.phone || null;
  if (formData.firstName !== undefined) updates.first_name = formData.firstName;
  if (formData.lastName !== undefined) updates.last_name = formData.lastName;
  if (formData.companyName !== undefined) updates.company_name = formData.companyName || null;
  if (formData.jobTitle !== undefined) updates.job_title = formData.jobTitle || null;
  if (formData.addressLine1 !== undefined) updates.address_line1 = formData.addressLine1 || null;
  if (formData.addressLine2 !== undefined) updates.address_line2 = formData.addressLine2 || null;
  if (formData.city !== undefined) updates.city = formData.city || null;
  if (formData.state !== undefined) updates.state = formData.state || null;
  if (formData.zipCode !== undefined) updates.zip_code = formData.zipCode || null;
  if (formData.country !== undefined) updates.country = formData.country || "USA";
  if (formData.type !== undefined) updates.type = formData.type;
  if (formData.status !== undefined) updates.status = formData.status;
  if (formData.source !== undefined) updates.source = formData.source || null;
  if (formData.sourceDetail !== undefined) updates.source_detail = formData.sourceDetail || null;
  if (formData.tags !== undefined) updates.tags = formData.tags;
  if (formData.assignedTo !== undefined) updates.assigned_to = formData.assignedTo || null;
  if (formData.customFields !== undefined) updates.custom_fields = formData.customFields as Json;

  updates.updated_at = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("crm_contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Contact;
}

// Delete a contact
async function deleteContact(id: string): Promise<void> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("crm_contacts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

// Bulk update contacts
async function bulkUpdateContacts(data: BulkUpdateData): Promise<void> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {
    ...data.updates,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("crm_contacts")
    .update(updates)
    .in("id", data.contactIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Bulk delete contacts
async function bulkDeleteContacts(contactIds: string[]): Promise<void> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("crm_contacts")
    .delete()
    .in("id", contactIds);

  if (error) {
    throw new Error(error.message);
  }
}

// Hook for fetching contacts list
export function useContacts(options: UseContactsOptions = {}) {
  return useQuery({
    queryKey: [
      CONTACTS_QUERY_KEY,
      options.filters,
      options.sort,
      options.page,
      options.pageSize,
    ],
    queryFn: () => fetchContacts(options),
    enabled: options.enabled !== false,
  });
}

// Hook for fetching single contact
export function useContact(id: string, enabled = true) {
  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, id],
    queryFn: () => fetchContact(id),
    enabled: enabled && !!id,
  });
}

// Hook for creating a contact
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
    },
  });
}

// Hook for updating a contact
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactFormData> }) =>
      updateContact(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CONTACTS_QUERY_KEY, variables.id],
      });
    },
  });
}

// Hook for deleting a contact
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
    },
  });
}

// Hook for bulk updating contacts
export function useBulkUpdateContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdateContacts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
    },
  });
}

// Hook for bulk deleting contacts
export function useBulkDeleteContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteContacts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
    },
  });
}
