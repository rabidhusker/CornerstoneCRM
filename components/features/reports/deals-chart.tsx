"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DealAnalytics, TimeSeriesDataPoint } from "@/types/report";
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
  ComposedChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface DealsChartProps {
  data?: DealAnalytics;
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
          <span className="font-medium">
            {entry.name === "Revenue"
              ? `$${entry.value.toLocaleString()}`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// Format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value}`;
}

// Won/Lost deals comparison chart
function WonLostChart({
  wonData,
  lostData,
  loading,
}: {
  wonData?: TimeSeriesDataPoint[];
  lostData?: TimeSeriesDataPoint[];
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="w-full h-[300px]" />;
  }

  if (!wonData || wonData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    );
  }

  // Combine data for the chart
  const combinedData = wonData.map((item, index) => ({
    date: item.date,
    won: item.value,
    lost: lostData?.[index]?.value || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="won"
          name="Won"
          fill={chartColors[1]}
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
        <Bar
          dataKey="lost"
          name="Lost"
          fill={chartColors[3]}
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Revenue over time chart
function RevenueChart({
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
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors[1]} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColors[1]} stopOpacity={0} />
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
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          name="Revenue"
          stroke={chartColors[1]}
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Deal value distribution chart
function ValueDistributionChart({
  data,
  loading,
}: {
  data?: DealAnalytics["valueDistribution"];
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
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey="range"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip />
        <Bar
          dataKey="count"
          name="Deals"
          fill={chartColors[4]}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Stage performance chart
function StagePerformanceChart({
  data,
  loading,
}: {
  data?: DealAnalytics["byStage"];
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
    <div className="space-y-4">
      {data.map((stage, index) => (
        <div key={stage.stage} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{stage.stage}</span>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{stage.count} deals</span>
              <span>{formatCurrency(stage.value)}</span>
              <span>{stage.avgCycleTime} days avg</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${(stage.count / Math.max(...data.map((d) => d.count))) * 100}%`,
                backgroundColor: chartColors[index % chartColors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DealsChart({ data, loading }: DealsChartProps) {
  const [view, setView] = useState<"wonlost" | "revenue" | "distribution" | "stages">("wonlost");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Deal Performance</CardTitle>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="h-8">
            <TabsTrigger value="wonlost" className="text-xs px-3 h-6">
              Won/Lost
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs px-3 h-6">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="distribution" className="text-xs px-3 h-6">
              Distribution
            </TabsTrigger>
            <TabsTrigger value="stages" className="text-xs px-3 h-6">
              Stages
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {view === "wonlost" && (
          <WonLostChart
            wonData={data?.wonDeals}
            lostData={data?.lostDeals}
            loading={loading}
          />
        )}
        {view === "revenue" && (
          <RevenueChart data={data?.revenue} loading={loading} />
        )}
        {view === "distribution" && (
          <ValueDistributionChart data={data?.valueDistribution} loading={loading} />
        )}
        {view === "stages" && (
          <StagePerformanceChart data={data?.byStage} loading={loading} />
        )}

        {/* Summary metrics */}
        {data && !loading && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Win Rate</div>
              <div className="text-lg font-semibold">{data.winRate.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Avg Deal Value</div>
              <div className="text-lg font-semibold">{formatCurrency(data.avgDealValue)}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Avg Cycle Time</div>
              <div className="text-lg font-semibold">{data.avgCycleTime} days</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
