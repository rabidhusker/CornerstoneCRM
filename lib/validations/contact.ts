import { z } from "zod";

// Contact type enum
export const contactTypeEnum = z.enum([
  "buyer",
  "seller",
  "both",
  "investor",
  "other",
]);

// Contact status enum
export const contactStatusEnum = z.enum([
  "active",
  "inactive",
  "archived",
]);

// Phone number validation (basic - allows various formats)
const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;

// Contact form schema for react-hook-form validation
// Note: We use explicit types instead of .default() to avoid react-hook-form type issues
export const contactFormSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(phoneRegex, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  companyName: z
    .string()
    .max(200, "Company name must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  jobTitle: z
    .string()
    .max(100, "Job title must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  addressLine1: z
    .string()
    .max(255, "Address must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  addressLine2: z
    .string()
    .max(255, "Address must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .max(100, "State must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  zipCode: z
    .string()
    .max(20, "Zip code must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .max(100, "Country must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  type: contactTypeEnum,
  status: contactStatusEnum,
  source: z.string().optional().or(z.literal("")),
  sourceDetail: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
  customFields: z.record(z.string(), z.unknown()),
});

export type ContactFormSchemaType = z.infer<typeof contactFormSchema>;

// Legacy schema with defaults for API use
export const contactSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(phoneRegex, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  companyName: z
    .string()
    .max(200, "Company name must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  jobTitle: z
    .string()
    .max(100, "Job title must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  addressLine1: z
    .string()
    .max(255, "Address must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  addressLine2: z
    .string()
    .max(255, "Address must be less than 255 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(100, "City must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .max(100, "State must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  zipCode: z
    .string()
    .max(20, "Zip code must be less than 20 characters")
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .max(100, "Country must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  type: contactTypeEnum.default("buyer"),
  status: contactStatusEnum.default("active"),
  source: z.string().optional().or(z.literal("")),
  sourceDetail: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
  customFields: z.record(z.string(), z.unknown()).default({}),
});

export type ContactSchemaType = z.infer<typeof contactSchema>;

// Schema for bulk updates
export const bulkUpdateSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1, "Select at least one contact"),
  updates: z.object({
    type: contactTypeEnum.optional(),
    status: contactStatusEnum.optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export type BulkUpdateSchemaType = z.infer<typeof bulkUpdateSchema>;

// Schema for contact filters
export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.array(contactTypeEnum).optional(),
  status: z.array(contactStatusEnum).optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.array(z.string().uuid()).optional(),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
});

export type ContactFiltersSchemaType = z.infer<typeof contactFiltersSchema>;

// Helper to transform form data to database format
export function transformContactFormToDb(data: ContactSchemaType) {
  return {
    email: data.email || null,
    phone: data.phone || null,
    first_name: data.firstName,
    last_name: data.lastName,
    company_name: data.companyName || null,
    job_title: data.jobTitle || null,
    address_line1: data.addressLine1 || null,
    address_line2: data.addressLine2 || null,
    city: data.city || null,
    state: data.state || null,
    zip_code: data.zipCode || null,
    country: data.country || "USA",
    type: data.type,
    status: data.status,
    source: data.source || null,
    source_detail: data.sourceDetail || null,
    tags: data.tags,
    assigned_to: data.assignedTo || null,
    custom_fields: data.customFields,
  };
}

// Helper to transform database record to form data
export function transformDbToContactForm(
  contact: Record<string, unknown>
): ContactFormSchemaType {
  return {
    email: (contact.email as string) || "",
    phone: (contact.phone as string) || "",
    firstName: (contact.first_name as string) || "",
    lastName: (contact.last_name as string) || "",
    companyName: (contact.company_name as string) || "",
    jobTitle: (contact.job_title as string) || "",
    addressLine1: (contact.address_line1 as string) || "",
    addressLine2: (contact.address_line2 as string) || "",
    city: (contact.city as string) || "",
    state: (contact.state as string) || "",
    zipCode: (contact.zip_code as string) || "",
    country: (contact.country as string) || "USA",
    type: (contact.type as ContactFormSchemaType["type"]) || "buyer",
    status: (contact.status as ContactFormSchemaType["status"]) || "active",
    source: (contact.source as string) || "",
    sourceDetail: (contact.source_detail as string) || "",
    tags: (contact.tags as string[]) || [],
    assignedTo: (contact.assigned_to as string) || "",
    customFields: (contact.custom_fields as Record<string, unknown>) || {},
  };
}
