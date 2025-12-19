"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Users,
  Briefcase,
  Activity,
  Mail,
  GripVertical,
  Plus,
  Trash2,
  Play,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type {
  CustomReportConfig,
  ReportColumn,
  ReportDataSource,
  ReportField,
  FilterGroup,
  ReportSort,
  ReportGrouping,
  CustomChartConfig,
  AggregationType,
  ReportPreviewResult,
} from "@/types/report";
import { dataSourceFields } from "@/types/report";
import { FilterBuilder } from "./filter-builder";
import { ChartBuilder } from "./chart-builder";
import { ReportPreview } from "./report-preview";

interface ReportBuilderProps {
  initialConfig?: CustomReportConfig;
  onSave?: (config: CustomReportConfig) => void;
  onPreview?: (config: CustomReportConfig) => Promise<ReportPreviewResult>;
}

// Data source icons
const dataSourceIcons: Record<ReportDataSource, typeof Users> = {
  contacts: Users,
  deals: Briefcase,
  activities: Activity,
  campaigns: Mail,
};

// Data source labels
const dataSourceLabels: Record<ReportDataSource, string> = {
  contacts: "Contacts",
  deals: "Deals",
  activities: "Activities",
  campaigns: "Campaigns",
};

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Create empty filter group
function createEmptyFilterGroup(): FilterGroup {
  return {
    id: generateId(),
    logic: "and",
    conditions: [],
  };
}

// Create default config
function createDefaultConfig(): CustomReportConfig {
  return {
    name: "",
    description: "",
    dataSource: "contacts",
    columns: [],
    filters: createEmptyFilterGroup(),
    groupBy: [],
    sortBy: [],
    chart: {
      enabled: false,
      type: "bar",
      showLegend: true,
      showLabels: true,
    },
    limit: 100,
  };
}

// Sortable column item
function SortableColumnItem({
  column,
  field,
  onUpdate,
  onRemove,
}: {
  column: ReportColumn;
  field?: ReportField;
  onUpdate: (column: ReportColumn) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-gray-600"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex-1 grid grid-cols-3 gap-2">
        <Input
          value={column.label}
          onChange={(e) => onUpdate({ ...column, label: e.target.value })}
          placeholder="Column label"
          className="h-8 text-sm"
        />

        {field?.aggregatable && (
          <Select
            value={column.aggregation || "none"}
            onValueChange={(v) =>
              onUpdate({
                ...column,
                aggregation: v === "none" ? undefined : (v as AggregationType),
              })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Aggregation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No aggregation</SelectItem>
              <SelectItem value="count">Count</SelectItem>
              <SelectItem value="sum">Sum</SelectItem>
              <SelectItem value="avg">Average</SelectItem>
              <SelectItem value="min">Min</SelectItem>
              <SelectItem value="max">Max</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select
          value={column.format || "string"}
          onValueChange={(v) =>
            onUpdate({
              ...column,
              format: v as ReportColumn["format"],
            })
          }
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="currency">Currency</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="datetime">Date & Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}

export function ReportBuilder({
  initialConfig,
  onSave,
  onPreview,
}: ReportBuilderProps) {
  const [config, setConfig] = useState<CustomReportConfig>(
    initialConfig || createDefaultConfig()
  );
  const [previewData, setPreviewData] = useState<ReportPreviewResult | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Get fields for current data source
  const availableFields = dataSourceFields[config.dataSource];

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle data source change
  const handleDataSourceChange = (dataSource: ReportDataSource) => {
    setConfig({
      ...config,
      dataSource,
      columns: [],
      filters: createEmptyFilterGroup(),
      groupBy: [],
      sortBy: [],
    });
    setPreviewData(undefined);
  };

  // Add column
  const addColumn = (field: ReportField) => {
    const newColumn: ReportColumn = {
      id: generateId(),
      field: field.name,
      label: field.label,
      format: field.type === "currency" ? "currency" : field.type === "number" ? "number" : undefined,
    };
    setConfig({ ...config, columns: [...config.columns, newColumn] });
  };

  // Remove column
  const removeColumn = (id: string) => {
    setConfig({
      ...config,
      columns: config.columns.filter((c) => c.id !== id),
    });
  };

  // Update column
  const updateColumn = (column: ReportColumn) => {
    setConfig({
      ...config,
      columns: config.columns.map((c) => (c.id === column.id ? column : c)),
    });
  };

  // Handle column drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = config.columns.findIndex((c) => c.id === active.id);
    const newIndex = config.columns.findIndex((c) => c.id === over.id);

    setConfig({
      ...config,
      columns: arrayMove(config.columns, oldIndex, newIndex),
    });
  };

  // Handle filter change
  const handleFilterChange = (filters: FilterGroup) => {
    setConfig({ ...config, filters });
  };

  // Add sort
  const addSort = (field: string) => {
    const newSort: ReportSort = { field, direction: "asc" };
    setConfig({ ...config, sortBy: [...(config.sortBy || []), newSort] });
  };

  // Remove sort
  const removeSort = (field: string) => {
    setConfig({
      ...config,
      sortBy: config.sortBy?.filter((s) => s.field !== field),
    });
  };

  // Toggle sort direction
  const toggleSortDirection = (field: string) => {
    setConfig({
      ...config,
      sortBy: config.sortBy?.map((s) =>
        s.field === field
          ? { ...s, direction: s.direction === "asc" ? "desc" : "asc" }
          : s
      ),
    });
  };

  // Add grouping
  const addGrouping = (field: string) => {
    const newGroup: ReportGrouping = { field, showSubtotals: true };
    setConfig({ ...config, groupBy: [...(config.groupBy || []), newGroup] });
  };

  // Remove grouping
  const removeGrouping = (field: string) => {
    setConfig({
      ...config,
      groupBy: config.groupBy?.filter((g) => g.field !== field),
    });
  };

  // Handle chart config change
  const handleChartChange = (chart: CustomChartConfig) => {
    setConfig({ ...config, chart });
  };

  // Run preview
  const handlePreview = async () => {
    if (!onPreview) return;

    setIsLoading(true);
    setError(undefined);

    try {
      const result = await onPreview(config);
      setPreviewData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run report");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
  };

  // Check if config is valid
  const isValid = config.name.trim() !== "" && config.columns.length > 0;

  return (
    <div className="space-y-6">
      {/* Report details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name *</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Enter report name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Row Limit</Label>
              <Input
                id="limit"
                type="number"
                value={config.limit || 100}
                onChange={(e) =>
                  setConfig({ ...config, limit: parseInt(e.target.value) || 100 })
                }
                min={1}
                max={10000}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description || ""}
              onChange={(e) =>
                setConfig({ ...config, description: e.target.value })
              }
              placeholder="Optional description"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data source selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Data Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(dataSourceLabels) as ReportDataSource[]).map(
              (source) => {
                const Icon = dataSourceIcons[source];
                const isSelected = config.dataSource === source;

                return (
                  <button
                    key={source}
                    onClick={() => handleDataSourceChange(source)}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? "text-primary" : "text-gray-700"
                      }`}
                    >
                      {dataSourceLabels[source]}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Columns selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Columns</CardTitle>
            <Badge variant="secondary">
              {config.columns.length} selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Available fields */}
          <div className="space-y-2">
            <Label>Available Fields</Label>
            <div className="flex flex-wrap gap-2">
              {availableFields.map((field) => {
                const isSelected = config.columns.some(
                  (c) => c.field === field.name
                );
                return (
                  <Button
                    key={field.name}
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isSelected) {
                        const col = config.columns.find(
                          (c) => c.field === field.name
                        );
                        if (col) removeColumn(col.id);
                      } else {
                        addColumn(field);
                      }
                    }}
                    className="h-8"
                  >
                    {isSelected && <span className="mr-1">+</span>}
                    {field.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Selected columns */}
          {config.columns.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Columns (drag to reorder)</Label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={config.columns.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {config.columns.map((column) => {
                      const field = availableFields.find(
                        (f) => f.name === column.field
                      );
                      return (
                        <SortableColumnItem
                          key={column.id}
                          column={column}
                          field={field}
                          onUpdate={updateColumn}
                          onRemove={() => removeColumn(column.id)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <FilterBuilder
        fields={availableFields}
        value={config.filters || createEmptyFilterGroup()}
        onChange={handleFilterChange}
      />

      {/* Grouping and Sorting */}
      <Accordion type="multiple" className="space-y-4">
        <AccordionItem value="grouping" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-medium">Grouping</span>
              {config.groupBy && config.groupBy.length > 0 && (
                <Badge variant="secondary">{config.groupBy.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {availableFields
                  .filter((f) => f.groupable)
                  .map((field) => {
                    const isGrouped = config.groupBy?.some(
                      (g) => g.field === field.name
                    );
                    return (
                      <Button
                        key={field.name}
                        variant={isGrouped ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isGrouped) {
                            removeGrouping(field.name);
                          } else {
                            addGrouping(field.name);
                          }
                        }}
                      >
                        {field.label}
                      </Button>
                    );
                  })}
              </div>

              {config.groupBy && config.groupBy.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {config.groupBy.map((group) => (
                    <Badge key={group.field} variant="secondary">
                      {availableFields.find((f) => f.name === group.field)
                        ?.label || group.field}
                      <button
                        onClick={() => removeGrouping(group.field)}
                        className="ml-1 hover:text-destructive"
                      >
                        +
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sorting" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-medium">Sorting</span>
              {config.sortBy && config.sortBy.length > 0 && (
                <Badge variant="secondary">{config.sortBy.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {config.columns.map((col) => {
                  const sort = config.sortBy?.find((s) => s.field === col.field);
                  return (
                    <Button
                      key={col.id}
                      variant={sort ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (sort) {
                          removeSort(col.field);
                        } else {
                          addSort(col.field);
                        }
                      }}
                    >
                      {col.label}
                      {sort && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSortDirection(col.field);
                          }}
                          className="ml-1"
                        >
                          {sort.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </Button>
                  );
                })}
              </div>

              {config.sortBy && config.sortBy.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {config.sortBy.map((sort, index) => (
                    <Badge key={sort.field} variant="secondary">
                      {index + 1}.{" "}
                      {config.columns.find((c) => c.field === sort.field)
                        ?.label || sort.field}{" "}
                      ({sort.direction})
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Chart configuration */}
      <ChartBuilder
        config={config.chart || { enabled: false, type: "bar" }}
        columns={config.columns}
        onChange={handleChartChange}
        previewData={previewData}
      />

      {/* Action buttons */}
      <div className="flex items-center justify-between sticky bottom-0 bg-white py-4 border-t">
        <Button variant="outline" onClick={handlePreview} disabled={isLoading}>
          <Play className="h-4 w-4 mr-2" />
          {isLoading ? "Running..." : "Run Report"}
        </Button>

        <Button onClick={handleSave} disabled={!isValid || isLoading}>
          <Save className="h-4 w-4 mr-2" />
          Save Report
        </Button>
      </div>

      {/* Preview */}
      <ReportPreview
        data={previewData}
        loading={isLoading}
        error={error}
        chartConfig={config.chart}
        onRefresh={handlePreview}
      />
    </div>
  );
}
