import type { Database } from "./database";

// Re-export the database contact type
export type Contact = Database["public"]["Tables"]["crm_contacts"]["Row"];
export type ContactInsert = Database["public"]["Tables"]["crm_contacts"]["Insert"];
export type ContactUpdate = Database["public"]["Tables"]["crm_contacts"]["Update"];

// Contact type (from database)
export type ContactType = "buyer" | "seller" | "both" | "investor" | "other";

// Contact status
export type ContactStatus = "active" | "inactive" | "archived";

// Contact with computed display properties
export interface ContactDisplay extends Contact {
  displayName: string;
  initials: string;
  lastContactedRelative: string | null;
}

// Filter options for contact list
export interface ContactFilters {
  search?: string;
  type?: ContactType[];
  status?: ContactStatus[];
  tags?: string[];
  assignedTo?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  hasEmail?: boolean;
  hasPhone?: boolean;
}

// Sort options
export interface ContactSort {
  field: keyof Contact;
  direction: "asc" | "desc";
}

// Pagination
export interface ContactPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Query params for fetching contacts
export interface ContactQueryParams {
  filters?: ContactFilters;
  sort?: ContactSort;
  page?: number;
  pageSize?: number;
}

// Response from contacts API
export interface ContactsResponse {
  contacts: Contact[];
  pagination: ContactPagination;
}

// Form data for creating/updating contacts
export interface ContactFormData {
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  jobTitle?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  type?: ContactType;
  status?: ContactStatus;
  source?: string;
  sourceDetail?: string;
  tags?: string[];
  assignedTo?: string;
  customFields?: Record<string, unknown>;
}

// Bulk update data
export interface BulkUpdateData {
  contactIds: string[];
  updates: Partial<{
    type: ContactType;
    status: ContactStatus;
    assigned_to: string | null;
    tags: string[];
  }>;
}

// Contact type display info
export const contactTypeConfig: Record<
  ContactType,
  { label: string; color: string }
> = {
  buyer: { label: "Buyer", color: "bg-blue-500" },
  seller: { label: "Seller", color: "bg-green-500" },
  both: { label: "Buyer/Seller", color: "bg-purple-500" },
  investor: { label: "Investor", color: "bg-amber-500" },
  other: { label: "Other", color: "bg-gray-500" },
};

// Contact status display info
export const contactStatusConfig: Record<
  ContactStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "bg-green-500" },
  inactive: { label: "Inactive", color: "bg-gray-500" },
  archived: { label: "Archived", color: "bg-red-500" },
};
