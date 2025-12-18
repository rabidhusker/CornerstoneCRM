import type { Database } from "./database";
import type { Deal } from "./deal";
import type { Contact } from "./contact";

// Re-export base types from database
export type Pipeline = Database["public"]["Tables"]["crm_pipelines"]["Row"];
export type PipelineInsert = Database["public"]["Tables"]["crm_pipelines"]["Insert"];
export type PipelineUpdate = Database["public"]["Tables"]["crm_pipelines"]["Update"];

export type PipelineStage = Database["public"]["Tables"]["crm_pipeline_stages"]["Row"];
export type PipelineStageInsert = Database["public"]["Tables"]["crm_pipeline_stages"]["Insert"];
export type PipelineStageUpdate = Database["public"]["Tables"]["crm_pipeline_stages"]["Update"];

// Pipeline with stages
export interface PipelineWithStages extends Pipeline {
  stages: PipelineStage[];
}

// Deal card for pipeline board (minimal data for performance)
export interface DealCard {
  id: string;
  title: string;
  value: number | null;
  status: "open" | "won" | "lost";
  stageId: string;
  pipelineId: string;
  expectedCloseDate: string | null;
  propertyAddress: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  assignedTo: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Stage with deals for pipeline board
export interface StageWithDeals extends PipelineStage {
  deals: DealCard[];
  totalValue: number;
  dealCount: number;
}

// Pipeline board data
export interface PipelineBoardData {
  pipeline: Pipeline;
  stages: StageWithDeals[];
  totalValue: number;
  totalDeals: number;
}

// Pipeline summary statistics
export interface PipelineStats {
  pipelineId: string;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  weightedValue: number;
  avgDealValue: number;
  avgDaysInPipeline: number;
  conversionRate: number;
}

// Stage statistics
export interface StageStats {
  stageId: string;
  stageName: string;
  dealCount: number;
  totalValue: number;
  avgTimeInStage: number;
}

// Drag and drop types
export interface DragItem {
  type: "deal";
  dealId: string;
  sourceStageId: string;
  index: number;
}

export interface DropResult {
  dealId: string;
  sourceStageId: string;
  targetStageId: string;
  sourceIndex: number;
  targetIndex: number;
}

// Move deal request/response
export interface MoveDealRequest {
  dealId: string;
  targetStageId: string;
  position?: number;
}

export interface MoveDealResponse {
  success: boolean;
  deal: Deal;
  previousStageId: string;
  newStageId: string;
}

// Pipeline filters
export interface PipelineFilters {
  status?: ("open" | "won" | "lost")[];
  assignedTo?: string[];
  tags?: string[];
  minValue?: number;
  maxValue?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

// Default stage colors
export const defaultStageColors = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
];

// Default pipeline stages (for new pipelines)
export const defaultPipelineStages = [
  { name: "New Lead", position: 0, color: "#6366f1", probability: 10 },
  { name: "Contacted", position: 1, color: "#8b5cf6", probability: 20 },
  { name: "Qualified", position: 2, color: "#a855f7", probability: 40 },
  { name: "Proposal", position: 3, color: "#f59e0b", probability: 60 },
  { name: "Negotiation", position: 4, color: "#f97316", probability: 80 },
  { name: "Closed Won", position: 5, color: "#22c55e", probability: 100, isWonStage: true },
  { name: "Closed Lost", position: 6, color: "#ef4444", probability: 0, isLostStage: true },
];
