"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ContactAnalytics, TimeSeriesDataPoint } from "@/types/report";
import { chartColors } from "@/types/report";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ContactsChartProps {
  data?: ContactAnalytics;
  loading?: boolean;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-1">
        {label ? format(parseISO(label), "MMM d, yyyy") : label}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Time series line chart
function TimeSeriesChart({
  data,
  loading,
}: {
  data?: TimeSeriesDataPoint[];
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="contactsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(parseISO(value), "MMM d")}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          name="New Contacts"
          stroke={chartColors[0]}
          strokeWidth={2}
          fill="url(#contactsGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Source breakdown pie chart
function SourceBreakdownChart({
  data,
  loading,
}: {
  data?: ContactAnalytics["bySource"];
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="flex items-center gap-8">
      <ResponsiveContainer width="50%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="source"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.source}
                fill={chartColors[index % chartColors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-3">
        {data.map((item, index) => (
          <div key={item.source} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <span className="text-sm capitalize">{item.source.replace(/_/g, " ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{item.count}</span>
              <span className="text-xs text-muted-foreground">
                ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Source bar chart
function SourceBarChart({
  data,
  loading,
}: {
  data?: ContactAnalytics["bySource"];
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: chartColors[index % chartColors.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="source"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.replace(/_/g, " ")}
        />
        <Tooltip />
        <Bar dataKey="count" name="Contacts" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.source} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ContactsChart({ data, loading }: ContactsChartProps) {
  const [view, setView] = useState<"timeline" | "sources" | "breakdown">("timeline");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Contact Growth</CardTitle>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="h-8">
            <TabsTrigger value="timeline" className="text-xs px-3 h-6">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="sources" className="text-xs px-3 h-6">
              By Source
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs px-3 h-6">
              Breakdown
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {view === "timeline" && (
          <TimeSeriesChart data={data?.timeSeries} loading={loading} />
        )}
        {view === "sources" && (
          <SourceBarChart data={data?.bySource} loading={loading} />
        )}
        {view === "breakdown" && (
          <SourceBreakdownChart data={data?.bySource} loading={loading} />
        )}

        {/* Growth summary */}
        {data?.growth && !loading && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Growth this period
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{data.growth.current} new contacts</span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  data.growth.percentageChange >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {data.growth.percentageChange >= 0 ? "+" : ""}
                {data.growth.percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
