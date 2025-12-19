import { SupabaseClient } from "@supabase/supabase-js";
import type {
  CustomReportConfig,
  FilterCondition,
  FilterGroup,
  ReportColumn,
  ReportPreviewResult,
  ReportDataSource,
  getTableName,
  dataSourceFields,
} from "@/types/report";

// Build select clause from columns
function buildSelectClause(config: CustomReportConfig): string {
  const fields = config.columns.map((col) => {
    if (col.aggregation) {
      switch (col.aggregation) {
        case "count":
          return `count(*)`;
        case "count_distinct":
          return `count(distinct ${col.field})`;
        case "sum":
          return `sum(${col.field})`;
        case "avg":
          return `avg(${col.field})`;
        case "min":
          return `min(${col.field})`;
        case "max":
          return `max(${col.field})`;
        default:
          return col.field;
      }
    }
    return col.field;
  });

  // Add groupBy fields if not already included
  if (config.groupBy) {
    config.groupBy.forEach((group) => {
      if (!fields.includes(group.field)) {
        fields.unshift(group.field);
      }
    });
  }

  return fields.join(", ");
}

// Apply filter condition to query
function applyFilterCondition(
  query: any,
  condition: FilterCondition
): any {
  const { field, operator, value, secondValue } = condition;

  switch (operator) {
    case "equals":
      return query.eq(field, value);
    case "not_equals":
      return query.neq(field, value);
    case "contains":
      return query.ilike(field, `%${value}%`);
    case "not_contains":
      return query.not(field, "ilike", `%${value}%`);
    case "starts_with":
      return query.ilike(field, `${value}%`);
    case "ends_with":
      return query.ilike(field, `%${value}`);
    case "greater_than":
      return query.gt(field, value);
    case "less_than":
      return query.lt(field, value);
    case "greater_or_equal":
      return query.gte(field, value);
    case "less_or_equal":
      return query.lte(field, value);
    case "between":
      return query.gte(field, value).lte(field, secondValue);
    case "is_empty":
      return query.is(field, null);
    case "is_not_empty":
      return query.not(field, "is", null);
    case "in":
      return query.in(field, Array.isArray(value) ? value : [value]);
    case "not_in":
      return query.not(field, "in", `(${(Array.isArray(value) ? value : [value]).join(",")})`);
    default:
      return query;
  }
}

// Check if item is a FilterCondition
function isFilterCondition(item: FilterCondition | FilterGroup): item is FilterCondition {
  return "field" in item && "operator" in item;
}

// Apply filter group to query
function applyFilterGroup(
  query: any,
  group: FilterGroup
): any {
  if (!group.conditions || group.conditions.length === 0) {
    return query;
  }

  // For OR logic, we need to build an or filter string
  if (group.logic === "or") {
    const orConditions: string[] = [];

    group.conditions.forEach((condition) => {
      if (isFilterCondition(condition)) {
        const filterStr = buildFilterString(condition);
        if (filterStr) {
          orConditions.push(filterStr);
        }
      }
      // Nested groups in OR logic are complex - simplify for now
    });

    if (orConditions.length > 0) {
      return query.or(orConditions.join(","));
    }
    return query;
  }

  // For AND logic, apply each condition sequentially
  let result = query;
  group.conditions.forEach((condition) => {
    if (isFilterCondition(condition)) {
      result = applyFilterCondition(result, condition);
    } else {
      // Nested group
      result = applyFilterGroup(result, condition);
    }
  });

  return result;
}

// Build filter string for OR conditions
function buildFilterString(condition: FilterCondition): string | null {
  const { field, operator, value } = condition;

  switch (operator) {
    case "equals":
      return `${field}.eq.${value}`;
    case "not_equals":
      return `${field}.neq.${value}`;
    case "contains":
      return `${field}.ilike.%${value}%`;
    case "greater_than":
      return `${field}.gt.${value}`;
    case "less_than":
      return `${field}.lt.${value}`;
    case "greater_or_equal":
      return `${field}.gte.${value}`;
    case "less_or_equal":
      return `${field}.lte.${value}`;
    case "is_empty":
      return `${field}.is.null`;
    case "is_not_empty":
      return `${field}.not.is.null`;
    default:
      return null;
  }
}

// Get table name for data source
function getTableNameForSource(dataSource: ReportDataSource): string {
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

// Build and execute report query
export async function executeReportQuery(
  supabase: SupabaseClient,
  config: CustomReportConfig,
  options?: { limit?: number; offset?: number }
): Promise<ReportPreviewResult> {
  const startTime = Date.now();
  const tableName = getTableNameForSource(config.dataSource);

  // Build select fields
  const selectFields = config.columns.map((col) => col.field).join(", ");

  // Start query
  let query = (supabase as any).from(tableName).select(selectFields, { count: "exact" });

  // Apply filters
  if (config.filters && config.filters.conditions.length > 0) {
    query = applyFilterGroup(query, config.filters);
  }

  // Apply sorting
  if (config.sortBy && config.sortBy.length > 0) {
    config.sortBy.forEach((sort) => {
      query = query.order(sort.field, { ascending: sort.direction === "asc" });
    });
  } else {
    // Default sort by created_at desc
    query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  const limit = options?.limit || config.limit || 100;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Report query failed: ${error.message}`);
  }

  const executionTime = Date.now() - startTime;

  // Build column metadata
  const columns = config.columns.map((col) => ({
    field: col.field,
    label: col.label,
    type: getFieldType(config.dataSource, col.field),
  }));

  return {
    columns,
    rows: data || [],
    totalRows: count || 0,
    executionTime,
  };
}

// Get field type from data source
function getFieldType(dataSource: ReportDataSource, fieldName: string): "string" | "number" | "date" | "boolean" | "currency" | "email" | "phone" {
  const fieldDefs: Record<string, Record<string, string>> = {
    contacts: {
      id: "string",
      first_name: "string",
      last_name: "string",
      email: "email",
      phone: "phone",
      company: "string",
      job_title: "string",
      source: "string",
      status: "string",
      created_at: "date",
      updated_at: "date",
    },
    deals: {
      id: "string",
      title: "string",
      value: "currency",
      status: "string",
      stage_id: "string",
      pipeline_id: "string",
      contact_id: "string",
      owner_id: "string",
      probability: "number",
      expected_close_date: "date",
      closed_at: "date",
      created_at: "date",
    },
    activities: {
      id: "string",
      type: "string",
      title: "string",
      description: "string",
      contact_id: "string",
      deal_id: "string",
      user_id: "string",
      completed: "boolean",
      due_date: "date",
      completed_at: "date",
      created_at: "date",
    },
    campaigns: {
      id: "string",
      name: "string",
      type: "string",
      status: "string",
      subject: "string",
      sent_count: "number",
      open_count: "number",
      click_count: "number",
      scheduled_at: "date",
      sent_at: "date",
      created_at: "date",
    },
  };

  return (fieldDefs[dataSource]?.[fieldName] || "string") as any;
}

// Execute aggregated report query
export async function executeAggregatedQuery(
  supabase: SupabaseClient,
  config: CustomReportConfig
): Promise<ReportPreviewResult> {
  const startTime = Date.now();
  const tableName = getTableNameForSource(config.dataSource);

  // For aggregated queries, we need to handle them differently
  // Supabase doesn't support GROUP BY directly, so we fetch all data and aggregate in JS

  // Get all relevant fields
  const allFields = new Set<string>();
  config.columns.forEach((col) => allFields.add(col.field));
  if (config.groupBy) {
    config.groupBy.forEach((g) => allFields.add(g.field));
  }

  let query = (supabase as any)
    .from(tableName)
    .select(Array.from(allFields).join(", "));

  // Apply filters
  if (config.filters && config.filters.conditions.length > 0) {
    query = applyFilterGroup(query, config.filters);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Report query failed: ${error.message}`);
  }

  // Perform aggregation in JavaScript
  let resultRows: Record<string, any>[] = [];

  if (config.groupBy && config.groupBy.length > 0) {
    // Group the data
    const groups = new Map<string, any[]>();

    (data || []).forEach((row: any) => {
      const groupKey = config.groupBy!
        .map((g) => String(row[g.field] ?? "null"))
        .join("|||");

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    });

    // Aggregate each group
    groups.forEach((groupRows, groupKey) => {
      const resultRow: Record<string, any> = {};

      // Add group fields
      config.groupBy!.forEach((g, idx) => {
        resultRow[g.field] = groupKey.split("|||")[idx];
        if (resultRow[g.field] === "null") {
          resultRow[g.field] = null;
        }
      });

      // Add aggregated fields
      config.columns.forEach((col) => {
        if (col.aggregation) {
          const values = groupRows
            .map((r) => r[col.field])
            .filter((v) => v !== null && v !== undefined);

          switch (col.aggregation) {
            case "count":
              resultRow[col.field] = groupRows.length;
              break;
            case "count_distinct":
              resultRow[col.field] = new Set(values).size;
              break;
            case "sum":
              resultRow[col.field] = values.reduce((a, b) => a + (Number(b) || 0), 0);
              break;
            case "avg":
              resultRow[col.field] = values.length > 0
                ? values.reduce((a, b) => a + (Number(b) || 0), 0) / values.length
                : 0;
              break;
            case "min":
              resultRow[col.field] = values.length > 0 ? Math.min(...values.map(Number)) : null;
              break;
            case "max":
              resultRow[col.field] = values.length > 0 ? Math.max(...values.map(Number)) : null;
              break;
          }
        } else if (!config.groupBy!.find((g) => g.field === col.field)) {
          // For non-aggregated fields not in groupBy, take first value
          resultRow[col.field] = groupRows[0]?.[col.field];
        }
      });

      resultRows.push(resultRow);
    });
  } else {
    // No grouping, just return the data with any aggregations
    const hasAggregation = config.columns.some((col) => col.aggregation);

    if (hasAggregation) {
      // Single row with aggregations
      const resultRow: Record<string, any> = {};

      config.columns.forEach((col) => {
        if (col.aggregation) {
          const values = (data || [])
            .map((r: any) => r[col.field])
            .filter((v: any) => v !== null && v !== undefined);

          switch (col.aggregation) {
            case "count":
              resultRow[col.field] = (data || []).length;
              break;
            case "count_distinct":
              resultRow[col.field] = new Set(values).size;
              break;
            case "sum":
              resultRow[col.field] = values.reduce((a: number, b: any) => a + (Number(b) || 0), 0);
              break;
            case "avg":
              resultRow[col.field] = values.length > 0
                ? values.reduce((a: number, b: any) => a + (Number(b) || 0), 0) / values.length
                : 0;
              break;
            case "min":
              resultRow[col.field] = values.length > 0 ? Math.min(...values.map(Number)) : null;
              break;
            case "max":
              resultRow[col.field] = values.length > 0 ? Math.max(...values.map(Number)) : null;
              break;
          }
        }
      });

      resultRows = [resultRow];
    } else {
      resultRows = data || [];
    }
  }

  // Apply sorting
  if (config.sortBy && config.sortBy.length > 0) {
    resultRows.sort((a, b) => {
      for (const sort of config.sortBy!) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        if (aVal === bVal) continue;
        if (aVal === null || aVal === undefined) return sort.direction === "asc" ? -1 : 1;
        if (bVal === null || bVal === undefined) return sort.direction === "asc" ? 1 : -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sort.direction === "asc" ? comparison : -comparison;
      }
      return 0;
    });
  }

  // Apply limit
  if (config.limit) {
    resultRows = resultRows.slice(0, config.limit);
  }

  const executionTime = Date.now() - startTime;

  // Build column metadata
  const columns = config.columns.map((col) => ({
    field: col.field,
    label: col.label,
    type: getFieldType(config.dataSource, col.field),
  }));

  return {
    columns,
    rows: resultRows,
    totalRows: resultRows.length,
    executionTime,
  };
}

// Main function to build and execute report
export async function buildReportQuery(
  supabase: SupabaseClient,
  config: CustomReportConfig,
  options?: { limit?: number; offset?: number }
): Promise<ReportPreviewResult> {
  // Check if we have aggregations or grouping
  const hasAggregation = config.columns.some((col) => col.aggregation);
  const hasGrouping = config.groupBy && config.groupBy.length > 0;

  if (hasAggregation || hasGrouping) {
    return executeAggregatedQuery(supabase, config);
  }

  return executeReportQuery(supabase, config, options);
}

// Export report to CSV
export function exportToCSV(result: ReportPreviewResult): string {
  const headers = result.columns.map((col) => col.label);
  const rows = result.rows.map((row) =>
    result.columns.map((col) => {
      const value = row[col.field];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    })
  );

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// Format value for display
export function formatReportValue(
  value: any,
  type: string,
  format?: string
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  switch (format || type) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(value));
    case "percentage":
      return `${Number(value).toFixed(1)}%`;
    case "number":
      return new Intl.NumberFormat("en-US").format(Number(value));
    case "date":
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return String(value);
      }
    case "datetime":
      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    case "boolean":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}
