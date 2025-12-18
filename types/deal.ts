import type { Database } from "./database";

// Re-export the database deal type
export type Deal = Database["public"]["Tables"]["crm_deals"]["Row"];
export type DealInsert = Database["public"]["Tables"]["crm_deals"]["Insert"];
export type DealUpdate = Database["public"]["Tables"]["crm_deals"]["Update"];

// Deal status
export type DealStatus = "open" | "won" | "lost";

// Deal status configuration
export const dealStatusConfig: Record<
  DealStatus,
  { label: string; color: string }
> = {
  open: { label: "Open", color: "bg-blue-500" },
  won: { label: "Won", color: "bg-green-500" },
  lost: { label: "Lost", color: "bg-red-500" },
};

// Pipeline type
export type Pipeline = Database["public"]["Tables"]["crm_pipelines"]["Row"];

// Pipeline stage type
export type PipelineStage = Database["public"]["Tables"]["crm_pipeline_stages"]["Row"];

// Deal with related data
export interface DealWithRelations extends Deal {
  pipeline?: Pipeline;
  stage?: PipelineStage;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
  assigned_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Form data for creating/updating deals
export interface DealFormData {
  title: string;
  description?: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  value?: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyType?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

// Filters for deals
export interface DealFilters {
  pipelineId?: string;
  stageId?: string[];
  status?: DealStatus[];
  contactId?: string;
  assignedTo?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  minValue?: number;
  maxValue?: number;
}
