"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Trophy,
  XCircle,
  Clock,
  Percent,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculatePipelineSummary,
  formatCurrency,
  formatPercentage,
  type PipelineSummary,
} from "@/lib/utils/deal-calculations";
import type { DealCard, PipelineStage } from "@/types/pipeline";

interface PipelineSummaryCardsProps {
  deals: DealCard[];
  stages: PipelineStage[];
  isLoading?: boolean;
  showWeighted?: boolean;
}

export function PipelineSummaryCards({
  deals,
  stages,
  isLoading,
  showWeighted = true,
}: PipelineSummaryCardsProps) {
  const summary = React.useMemo(() => {
    if (isLoading || deals.length === 0) return null;
    return calculatePipelineSummary(deals, stages);
  }, [deals, stages, isLoading]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EmptyCard title="Open Deals" icon={Target} value="0" description="No deals yet" />
        <EmptyCard title="Pipeline Value" icon={DollarSign} value="$0" description="Total value" />
        <EmptyCard title="Won This Month" icon={Trophy} value="$0" description="0 deals won" />
        <EmptyCard title="Win Rate" icon={Percent} value="0%" description="All time" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Open Deals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalOpenDeals}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(summary.totalOpenValue)} total value
          </p>
        </CardContent>
      </Card>

      {/* Pipeline Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {showWeighted ? "Weighted Value" : "Total Value"}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(
              showWeighted ? summary.totalWeightedValue : summary.totalOpenValue
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {showWeighted && `${formatCurrency(summary.totalOpenValue)} unweighted`}
          </p>
        </CardContent>
      </Card>

      {/* Won This Month */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Won This Month</CardTitle>
          <Trophy className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.valueWonThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.dealsWonThisMonth} deal{summary.dealsWonThisMonth !== 1 ? "s" : ""} closed
          </p>
        </CardContent>
      </Card>

      {/* Lost This Month */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lost This Month</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.valueLostThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.dealsLostThisMonth} deal{summary.dealsLostThisMonth !== 1 ? "s" : ""} lost
          </p>
        </CardContent>
      </Card>

      {/* Average Deal Size */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.averageDealSize)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across all deals
          </p>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(summary.winRate, 1)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.averageTimeToClose > 0 &&
              `Avg ${Math.round(summary.averageTimeToClose)} days to close`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Empty card component
function EmptyCard({
  title,
  icon: Icon,
  value,
  description,
}: {
  title: string;
  icon: React.ElementType;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Stage breakdown component for detailed view
interface StageBreakdownProps {
  summary: PipelineSummary;
}

export function StageBreakdown({ summary }: StageBreakdownProps) {
  const maxValue = Math.max(...summary.dealsByStage.map((s) => s.totalValue), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Value by Stage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.dealsByStage.map((stage) => (
          <div key={stage.stageId} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span>{stage.stageName}</span>
                <span className="text-muted-foreground">
                  ({stage.dealCount} deal{stage.dealCount !== 1 ? "s" : ""})
                </span>
              </div>
              <span className="font-medium">{formatCurrency(stage.totalValue)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(stage.totalValue / maxValue) * 100}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
