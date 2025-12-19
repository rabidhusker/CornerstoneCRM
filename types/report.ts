// Date range preset types
export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "lastQuarter"
  | "thisYear"
  | "custom";

// Date range configuration
export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset?: DateRangePreset;
  compareToLastPeriod?: boolean;
}

// KPI metric with trend
export interface KpiMetric {
  label: string;
  value: number;
  previousValue?: number;
  format: "number" | "currency" | "percentage";
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
    isPositive: boolean;
  };
}

// Dashboard metrics
export interface DashboardMetrics {
  totalContacts: KpiMetric;
  newContacts: KpiMetric;
  totalDeals: KpiMetric;
  wonDeals: KpiMetric;
  revenue: KpiMetric;
  conversionRate: KpiMetric;
  avgDealValue: KpiMetric;
  avgDealCycle: KpiMetric;
}

// Time series data point
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Grouped time series
export interface GroupedTimeSeriesData {
  series: {
    name: string;
    color?: string;
    data: TimeSeriesDataPoint[];
  }[];
  labels: string[];
}

// Contact analytics
export interface ContactAnalytics {
  timeSeries: TimeSeriesDataPoint[];
  bySource: {
    source: string;
    count: number;
    percentage: number;
  }[];
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  growth: {
    current: number;
    previous: number;
    percentageChange: number;
  };
}

// Deal analytics
export interface DealAnalytics {
  wonDeals: TimeSeriesDataPoint[];
  lostDeals: TimeSeriesDataPoint[];
  revenue: TimeSeriesDataPoint[];
  byStage: {
    stage: string;
    count: number;
    value: number;
    avgCycleTime: number;
  }[];
  valueDistribution: {
    range: string;
    count: number;
  }[];
  winRate: number;
  avgDealValue: number;
  avgCycleTime: number;
}

// Funnel stage
export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  value?: number;
  conversionRate: number;
  dropoffRate: number;
}

// Conversion funnel
export interface ConversionFunnel {
  stages: FunnelStage[];
  overallConversion: number;
}

// Activity summary
export interface ActivitySummary {
  byType: {
    type: string;
    count: number;
    icon?: string;
  }[];
  byUser: {
    userId: string;
    userName: string;
    count: number;
  }[];
  timeSeries: TimeSeriesDataPoint[];
  total: number;
  previousTotal: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  value: number;
  previousRank?: number;
  deals?: number;
  revenue?: number;
  activities?: number;
}

// Leaderboard
export interface Leaderboard {
  byDeals: LeaderboardEntry[];
  byRevenue: LeaderboardEntry[];
  byActivities: LeaderboardEntry[];
}

// Report API response
export interface ReportResponse<T> {
  data: T;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

// Chart configuration
export interface ChartConfig {
  type: "line" | "bar" | "area" | "pie" | "funnel";
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: string[];
}

// Report filter options
export interface ReportFilters {
  dateRange: DateRange;
  userId?: string;
  pipelineId?: string;
  source?: string;
  groupBy?: "day" | "week" | "month" | "quarter";
}

// Default chart colors
export const chartColors = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
];

// Format number based on type
export function formatMetricValue(value: number, format: KpiMetric["format"]): string {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "number":
    default:
      return new Intl.NumberFormat("en-US").format(value);
  }
}

// Calculate trend between two values
export function calculateTrend(
  current: number,
  previous: number
): KpiMetric["trend"] {
  if (previous === 0) {
    return current > 0
      ? { direction: "up", percentage: 100, isPositive: true }
      : { direction: "neutral", percentage: 0, isPositive: true };
  }

  const percentageChange = ((current - previous) / previous) * 100;
  const direction =
    percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral";

  return {
    direction,
    percentage: Math.abs(percentageChange),
    isPositive: percentageChange >= 0,
  };
}

// Get date range from preset
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return {
        startDate: today,
        endDate: now,
        preset,
      };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: new Date(today.getTime() - 1),
        preset,
      };
    }
    case "last7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return {
        startDate: start,
        endDate: now,
        preset,
      };
    }
    case "last30days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return {
        startDate: start,
        endDate: now,
        preset,
      };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: start,
        endDate: now,
        preset,
      };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: start,
        endDate: end,
        preset,
      };
    }
    case "thisQuarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      return {
        startDate: start,
        endDate: now,
        preset,
      };
    }
    case "lastQuarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      const end = new Date(now.getFullYear(), quarter * 3, 0);
      return {
        startDate: start,
        endDate: end,
        preset,
      };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: start,
        endDate: now,
        preset,
      };
    }
    default:
      return {
        startDate: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        endDate: now,
        preset: "last30days",
      };
  }
}

// Get previous period date range
export function getPreviousPeriodRange(dateRange: DateRange): DateRange {
  const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
  const previousEnd = new Date(dateRange.startDate.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return {
    startDate: previousStart,
    endDate: previousEnd,
  };
}

// ============================================
// Custom Report Builder Types
// ============================================

// Data sources available for reports
export type ReportDataSource = "contacts" | "deals" | "activities" | "campaigns";

// Field types
export type FieldType = "string" | "number" | "date" | "boolean" | "currency" | "email" | "phone";

// Aggregation functions
export type AggregationType = "count" | "sum" | "avg" | "min" | "max" | "count_distinct";

// Filter operators
export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_or_equal"
  | "less_or_equal"
  | "between"
  | "is_empty"
  | "is_not_empty"
  | "in"
  | "not_in";

// Filter condition
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | null;
  secondValue?: string | number | null; // For "between" operator
}

// Filter group (AND/OR logic)
export interface FilterGroup {
  id: string;
  logic: "and" | "or";
  conditions: (FilterCondition | FilterGroup)[];
}

// Field definition for data source
export interface ReportField {
  name: string;
  label: string;
  type: FieldType;
  table?: string;
  isRelation?: boolean;
  relationTable?: string;
  relationField?: string;
  aggregatable?: boolean;
  groupable?: boolean;
}

// Selected column in report
export interface ReportColumn {
  id: string;
  field: string;
  label: string;
  aggregation?: AggregationType;
  format?: "number" | "currency" | "percentage" | "date" | "datetime";
  width?: number;
}

// Sort configuration
export interface ReportSort {
  field: string;
  direction: "asc" | "desc";
}

// Grouping configuration
export interface ReportGrouping {
  field: string;
  showSubtotals?: boolean;
}

// Chart configuration for custom reports
export interface CustomChartConfig {
  enabled: boolean;
  type: "bar" | "line" | "pie" | "area" | "funnel";
  xAxis?: string;
  yAxis?: string;
  seriesField?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  colors?: string[];
}

// Complete report configuration
export interface CustomReportConfig {
  name: string;
  description?: string;
  dataSource: ReportDataSource;
  columns: ReportColumn[];
  filters?: FilterGroup;
  groupBy?: ReportGrouping[];
  sortBy?: ReportSort[];
  chart?: CustomChartConfig;
  limit?: number;
}

// Saved custom report
export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  config: CustomReportConfig;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  schedule?: ReportSchedule;
}

// Report schedule configuration
export interface ReportSchedule {
  id: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  timezone: string;
  recipients: string[]; // Email addresses
  format: "csv" | "pdf" | "excel";
  enabled: boolean;
  lastSent?: string;
  nextRun?: string;
}

// Report preview result
export interface ReportPreviewResult {
  columns: { field: string; label: string; type: FieldType }[];
  rows: Record<string, any>[];
  totalRows: number;
  executionTime: number;
}

// Data source field definitions
export const dataSourceFields: Record<ReportDataSource, ReportField[]> = {
  contacts: [
    { name: "id", label: "ID", type: "string" },
    { name: "first_name", label: "First Name", type: "string", groupable: true },
    { name: "last_name", label: "Last Name", type: "string", groupable: true },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "phone" },
    { name: "company", label: "Company", type: "string", groupable: true },
    { name: "job_title", label: "Job Title", type: "string", groupable: true },
    { name: "source", label: "Source", type: "string", groupable: true },
    { name: "status", label: "Status", type: "string", groupable: true },
    { name: "created_at", label: "Created Date", type: "date", groupable: true },
    { name: "updated_at", label: "Updated Date", type: "date" },
    { name: "tags", label: "Tags", type: "string" },
  ],
  deals: [
    { name: "id", label: "ID", type: "string" },
    { name: "title", label: "Title", type: "string" },
    { name: "value", label: "Value", type: "currency", aggregatable: true },
    { name: "status", label: "Status", type: "string", groupable: true },
    { name: "stage_id", label: "Stage", type: "string", groupable: true, isRelation: true, relationTable: "crm_pipeline_stages", relationField: "name" },
    { name: "pipeline_id", label: "Pipeline", type: "string", groupable: true, isRelation: true, relationTable: "crm_pipelines", relationField: "name" },
    { name: "contact_id", label: "Contact", type: "string", isRelation: true, relationTable: "crm_contacts", relationField: "email" },
    { name: "owner_id", label: "Owner", type: "string", groupable: true },
    { name: "probability", label: "Probability", type: "number", aggregatable: true },
    { name: "expected_close_date", label: "Expected Close", type: "date", groupable: true },
    { name: "closed_at", label: "Closed Date", type: "date", groupable: true },
    { name: "created_at", label: "Created Date", type: "date", groupable: true },
  ],
  activities: [
    { name: "id", label: "ID", type: "string" },
    { name: "type", label: "Type", type: "string", groupable: true },
    { name: "title", label: "Title", type: "string" },
    { name: "description", label: "Description", type: "string" },
    { name: "contact_id", label: "Contact", type: "string", isRelation: true, relationTable: "crm_contacts", relationField: "email" },
    { name: "deal_id", label: "Deal", type: "string", isRelation: true, relationTable: "crm_deals", relationField: "title" },
    { name: "user_id", label: "User", type: "string", groupable: true },
    { name: "completed", label: "Completed", type: "boolean", groupable: true },
    { name: "due_date", label: "Due Date", type: "date", groupable: true },
    { name: "completed_at", label: "Completed Date", type: "date", groupable: true },
    { name: "created_at", label: "Created Date", type: "date", groupable: true },
  ],
  campaigns: [
    { name: "id", label: "ID", type: "string" },
    { name: "name", label: "Name", type: "string" },
    { name: "type", label: "Type", type: "string", groupable: true },
    { name: "status", label: "Status", type: "string", groupable: true },
    { name: "subject", label: "Subject", type: "string" },
    { name: "sent_count", label: "Sent Count", type: "number", aggregatable: true },
    { name: "open_count", label: "Open Count", type: "number", aggregatable: true },
    { name: "click_count", label: "Click Count", type: "number", aggregatable: true },
    { name: "scheduled_at", label: "Scheduled Date", type: "date", groupable: true },
    { name: "sent_at", label: "Sent Date", type: "date", groupable: true },
    { name: "created_at", label: "Created Date", type: "date", groupable: true },
  ],
};

// Get table name for data source
export function getTableName(dataSource: ReportDataSource): string {
  switch (dataSource) {
    case "contacts":
      return "crm_contacts";
    case "deals":
      return "crm_deals";
    case "activities":
      return "crm_activities";
    case "campaigns":
      return "crm_campaigns";
  }
}

// Get operator label
export function getOperatorLabel(operator: FilterOperator): string {
  const labels: Record<FilterOperator, string> = {
    equals: "equals",
    not_equals: "does not equal",
    contains: "contains",
    not_contains: "does not contain",
    starts_with: "starts with",
    ends_with: "ends with",
    greater_than: "is greater than",
    less_than: "is less than",
    greater_or_equal: "is greater than or equal to",
    less_or_equal: "is less than or equal to",
    between: "is between",
    is_empty: "is empty",
    is_not_empty: "is not empty",
    in: "is one of",
    not_in: "is not one of",
  };
  return labels[operator];
}

// Get operators for field type
export function getOperatorsForType(type: FieldType): FilterOperator[] {
  switch (type) {
    case "string":
    case "email":
    case "phone":
      return ["equals", "not_equals", "contains", "not_contains", "starts_with", "ends_with", "is_empty", "is_not_empty", "in", "not_in"];
    case "number":
    case "currency":
      return ["equals", "not_equals", "greater_than", "less_than", "greater_or_equal", "less_or_equal", "between", "is_empty", "is_not_empty"];
    case "date":
      return ["equals", "not_equals", "greater_than", "less_than", "greater_or_equal", "less_or_equal", "between", "is_empty", "is_not_empty"];
    case "boolean":
      return ["equals", "not_equals"];
    default:
      return ["equals", "not_equals"];
  }
}
