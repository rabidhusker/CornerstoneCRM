"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { KpiMetric, DashboardMetrics } from "@/types/report";
import { formatMetricValue } from "@/types/report";
import {
  Users,
  UserPlus,
  Target,
  Trophy,
  DollarSign,
  TrendingUp,
  Briefcase,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  metrics?: DashboardMetrics;
  loading?: boolean;
  showComparison?: boolean;
}

// Metric configuration
const metricConfig: {
  key: keyof DashboardMetrics;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: "totalContacts", label: "Total Contacts", icon: Users, color: "text-blue-500" },
  { key: "newContacts", label: "New Contacts", icon: UserPlus, color: "text-green-500" },
  { key: "totalDeals", label: "Active Deals", icon: Target, color: "text-purple-500" },
  { key: "wonDeals", label: "Won Deals", icon: Trophy, color: "text-amber-500" },
  { key: "revenue", label: "Revenue", icon: DollarSign, color: "text-emerald-500" },
  { key: "conversionRate", label: "Conversion Rate", icon: TrendingUp, color: "text-cyan-500" },
  { key: "avgDealValue", label: "Avg Deal Value", icon: Briefcase, color: "text-rose-500" },
  { key: "avgDealCycle", label: "Avg Deal Cycle", icon: Clock, color: "text-orange-500" },
];

// Trend indicator component
function TrendIndicator({ trend }: { trend?: KpiMetric["trend"] }) {
  if (!trend) return null;

  const { direction, percentage, isPositive } = trend;

  if (direction === "neutral") {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <Minus className="h-3 w-3" />
        <span className="text-xs">0%</span>
      </div>
    );
  }

  const Icon = direction === "up" ? ArrowUpRight : ArrowDownRight;
  const colorClass = isPositive ? "text-green-500" : "text-red-500";

  return (
    <div className={cn("flex items-center gap-1", colorClass)}>
      <Icon className="h-3 w-3" />
      <span className="text-xs font-medium">{percentage.toFixed(1)}%</span>
    </div>
  );
}

// Single KPI card
function KpiCard({
  config,
  metric,
  loading,
  showComparison,
}: {
  config: (typeof metricConfig)[0];
  metric?: KpiMetric;
  loading?: boolean;
  showComparison?: boolean;
}) {
  const Icon = config.icon;

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  if (!metric) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {config.label}
          </CardTitle>
          <div className={cn("p-2 rounded-full bg-gray-100", config.color)}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {config.label}
        </CardTitle>
        <div className={cn("p-2 rounded-full bg-gray-100/80", config.color)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatMetricValue(metric.value, metric.format)}
        </div>
        {showComparison && metric.trend && (
          <div className="flex items-center gap-2 mt-1">
            <TrendIndicator trend={metric.trend} />
            <span className="text-xs text-muted-foreground">vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KpiCards({ metrics, loading, showComparison = true }: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricConfig.map((config) => (
        <KpiCard
          key={config.key}
          config={config}
          metric={metrics?.[config.key]}
          loading={loading}
          showComparison={showComparison}
        />
      ))}
    </div>
  );
}

// Compact version for smaller displays
export function KpiCardsCompact({
  metrics,
  loading,
}: {
  metrics?: Partial<DashboardMetrics>;
  loading?: boolean;
}) {
  const compactMetrics = metricConfig.slice(0, 4);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {compactMetrics.map((config) => (
        <KpiCard
          key={config.key}
          config={config}
          metric={metrics?.[config.key]}
          loading={loading}
          showComparison={false}
        />
      ))}
    </div>
  );
}
