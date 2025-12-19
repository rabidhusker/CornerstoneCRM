"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  AreaChartIcon,
  GitBranch,
} from "lucide-react";
import type { CustomChartConfig, ReportColumn, ReportPreviewResult } from "@/types/report";
import { chartColors } from "@/types/report";

interface ChartBuilderProps {
  config: CustomChartConfig;
  columns: ReportColumn[];
  onChange: (config: CustomChartConfig) => void;
  previewData?: ReportPreviewResult;
}

const chartTypes = [
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
  { value: "line", label: "Line Chart", icon: LineChartIcon },
  { value: "pie", label: "Pie Chart", icon: PieChartIcon },
  { value: "area", label: "Area Chart", icon: AreaChartIcon },
  { value: "funnel", label: "Funnel Chart", icon: GitBranch },
] as const;

export function ChartBuilder({
  config,
  columns,
  onChange,
  previewData,
}: ChartBuilderProps) {
  // Get numeric and non-numeric columns
  const numericColumns = columns.filter((col) =>
    ["number", "currency", "percentage"].includes(col.format || "")
  );
  const categoryColumns = columns.filter(
    (col) => !["number", "currency", "percentage"].includes(col.format || "")
  );

  const handleToggle = (enabled: boolean) => {
    onChange({ ...config, enabled });
  };

  const handleTypeChange = (type: CustomChartConfig["type"]) => {
    onChange({ ...config, type });
  };

  const handleAxisChange = (axis: "xAxis" | "yAxis", value: string) => {
    onChange({ ...config, [axis]: value });
  };

  const handleLegendToggle = (showLegend: boolean) => {
    onChange({ ...config, showLegend });
  };

  const handleLabelsToggle = (showLabels: boolean) => {
    onChange({ ...config, showLabels });
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!previewData || !config.xAxis) return [];

    return previewData.rows.map((row) => ({
      name: String(row[config.xAxis!] || "Unknown"),
      value: config.yAxis ? Number(row[config.yAxis]) || 0 : 0,
      ...row,
    }));
  }, [previewData, config.xAxis, config.yAxis]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Chart Visualization</CardTitle>
          <Switch checked={config.enabled} onCheckedChange={handleToggle} />
        </div>
      </CardHeader>
      <CardContent className={config.enabled ? "" : "opacity-50 pointer-events-none"}>
        <div className="space-y-4">
          {/* Chart type selection */}
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <div className="flex flex-wrap gap-2">
              {chartTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={config.type === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTypeChange(type.value)}
                  className="flex items-center gap-1.5"
                >
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Axis configuration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                {config.type === "pie" ? "Category Field" : "X-Axis"}
              </Label>
              <Select
                value={config.xAxis || ""}
                onValueChange={(v) => handleAxisChange("xAxis", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.field}>
                      {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.type !== "pie" && (
              <div className="space-y-2">
                <Label>Y-Axis (Value)</Label>
                <Select
                  value={config.yAxis || ""}
                  onValueChange={(v) => handleAxisChange("yAxis", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.field}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.type === "pie" && (
              <div className="space-y-2">
                <Label>Value Field</Label>
                <Select
                  value={config.yAxis || ""}
                  onValueChange={(v) => handleAxisChange("yAxis", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.field}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Display options */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="showLegend"
                checked={config.showLegend ?? true}
                onCheckedChange={handleLegendToggle}
              />
              <Label htmlFor="showLegend">Show Legend</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="showLabels"
                checked={config.showLabels ?? true}
                onCheckedChange={handleLabelsToggle}
              />
              <Label htmlFor="showLabels">Show Labels</Label>
            </div>
          </div>

          {/* Chart preview */}
          {config.enabled && config.xAxis && previewData && chartData.length > 0 && (
            <div className="mt-4">
              <Label className="mb-2 block">Preview</Label>
              <div className="h-64 w-full border rounded-lg p-4">
                <ChartPreview
                  type={config.type}
                  data={chartData}
                  showLegend={config.showLegend}
                  showLabels={config.showLabels}
                />
              </div>
            </div>
          )}

          {config.enabled && (!config.xAxis || !previewData) && (
            <div className="h-64 border rounded-lg flex items-center justify-center bg-muted/50">
              <p className="text-muted-foreground text-sm">
                {!config.xAxis
                  ? "Select axes to preview chart"
                  : "Run report to see chart preview"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Chart preview component
function ChartPreview({
  type,
  data,
  showLegend = true,
  showLabels = true,
}: {
  type: CustomChartConfig["type"];
  data: any[];
  showLegend?: boolean;
  showLabels?: boolean;
}) {
  const limitedData = data.slice(0, 20); // Limit for preview

  switch (type) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={limitedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar
              dataKey="value"
              fill={chartColors[0]}
              radius={[4, 4, 0, 0]}
              label={showLabels ? { position: "top", fontSize: 10 } : false}
            />
          </BarChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={limitedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColors[0]}
              strokeWidth={2}
              dot={showLabels}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={limitedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={chartColors[0]}
              fill={`${chartColors[0]}40`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={limitedData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              dataKey="value"
              nameKey="name"
              label={showLabels ? ({ name }) => name : false}
              labelLine={showLabels}
            >
              {limitedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );

    case "funnel":
      // Simple horizontal bar chart representation for funnel
      const sortedData = [...limitedData].sort((a, b) => b.value - a.value);
      const maxValue = sortedData[0]?.value || 1;

      return (
        <div className="h-full flex flex-col justify-center gap-2 px-4">
          {sortedData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-24 text-xs truncate">{item.name}</span>
              <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end pr-2"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: chartColors[index % chartColors.length],
                  }}
                >
                  {showLabels && (
                    <span className="text-xs text-white font-medium">
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// Standalone chart display component
export function ReportChart({
  config,
  data,
  height = 300,
}: {
  config: CustomChartConfig;
  data: any[];
  height?: number;
}) {
  if (!config.enabled || !config.xAxis) return null;

  const chartData = data.map((row) => ({
    name: String(row[config.xAxis!] || "Unknown"),
    value: config.yAxis ? Number(row[config.yAxis]) || 0 : 0,
    ...row,
  }));

  return (
    <div style={{ height }}>
      <ChartPreview
        type={config.type}
        data={chartData}
        showLegend={config.showLegend}
        showLabels={config.showLabels}
      />
    </div>
  );
}
