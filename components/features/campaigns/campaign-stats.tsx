"use client";

import * as React from "react";
import {
  Send,
  CheckCircle,
  Eye,
  MousePointer,
  AlertTriangle,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CampaignStats } from "@/types/campaign";

interface CampaignStatsProps {
  stats: CampaignStats;
  className?: string;
}

// Industry benchmarks for email marketing
const benchmarks = {
  open_rate: 21.5, // Average open rate across industries
  click_rate: 2.3, // Average click rate
  bounce_rate: 0.7, // Average bounce rate
  unsubscribe_rate: 0.1, // Average unsubscribe rate
};

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBg: string;
  benchmark?: number;
  benchmarkLabel?: string;
  progress?: number;
  progressColor?: string;
}

function StatCard({
  title,
  value,
  subValue,
  icon,
  iconBg,
  benchmark,
  benchmarkLabel,
  progress,
  progressColor = "bg-primary",
}: StatCardProps) {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  const comparison = benchmark !== undefined ? numericValue - benchmark : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {subValue && (
                <span className="text-sm text-muted-foreground">{subValue}</span>
              )}
            </div>
            {benchmark !== undefined && comparison !== null && (
              <div className="flex items-center gap-1 text-sm">
                {comparison > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : comparison < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    comparison > 0
                      ? "text-green-600"
                      : comparison < 0
                      ? "text-red-600"
                      : "text-muted-foreground"
                  )}
                >
                  {comparison > 0 ? "+" : ""}
                  {comparison.toFixed(1)}%
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{benchmarkLabel || "Industry benchmark"}: {benchmark}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-full", iconBg)}>{icon}</div>
        </div>
        {progress !== undefined && (
          <div className="mt-4">
            <Progress value={progress} className={cn("h-2", progressColor)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CampaignStatsCards({ stats, className }: CampaignStatsProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6", className)}>
      {/* Sent */}
      <StatCard
        title="Sent"
        value={stats.sent_count.toLocaleString()}
        subValue={`of ${stats.recipients_count.toLocaleString()}`}
        icon={<Send className="h-5 w-5 text-blue-600" />}
        iconBg="bg-blue-100 dark:bg-blue-900/30"
        progress={
          stats.recipients_count > 0
            ? (stats.sent_count / stats.recipients_count) * 100
            : 0
        }
      />

      {/* Delivered */}
      <StatCard
        title="Delivered"
        value={`${stats.delivery_rate.toFixed(1)}%`}
        subValue={`(${stats.delivered_count.toLocaleString()})`}
        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        iconBg="bg-green-100 dark:bg-green-900/30"
        progress={stats.delivery_rate}
        progressColor="bg-green-500"
      />

      {/* Opened */}
      <StatCard
        title="Open Rate"
        value={`${stats.open_rate.toFixed(1)}%`}
        subValue={`(${stats.opened_count.toLocaleString()})`}
        icon={<Eye className="h-5 w-5 text-purple-600" />}
        iconBg="bg-purple-100 dark:bg-purple-900/30"
        benchmark={benchmarks.open_rate}
        benchmarkLabel="Avg. open rate"
        progress={stats.open_rate}
        progressColor="bg-purple-500"
      />

      {/* Clicked */}
      <StatCard
        title="Click Rate"
        value={`${stats.click_rate.toFixed(1)}%`}
        subValue={`(${stats.clicked_count.toLocaleString()})`}
        icon={<MousePointer className="h-5 w-5 text-orange-600" />}
        iconBg="bg-orange-100 dark:bg-orange-900/30"
        benchmark={benchmarks.click_rate}
        benchmarkLabel="Avg. click rate"
        progress={Math.min(stats.click_rate * 10, 100)} // Scale for visibility
        progressColor="bg-orange-500"
      />

      {/* Bounced */}
      <StatCard
        title="Bounce Rate"
        value={`${stats.bounce_rate.toFixed(1)}%`}
        subValue={`(${stats.bounced_count.toLocaleString()})`}
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        iconBg="bg-red-100 dark:bg-red-900/30"
        benchmark={benchmarks.bounce_rate}
        benchmarkLabel="Avg. bounce rate"
      />

      {/* Unsubscribed */}
      <StatCard
        title="Unsubscribes"
        value={`${stats.unsubscribe_rate.toFixed(2)}%`}
        subValue={`(${stats.unsubscribed_count.toLocaleString()})`}
        icon={<UserMinus className="h-5 w-5 text-gray-600" />}
        iconBg="bg-gray-100 dark:bg-gray-800"
        benchmark={benchmarks.unsubscribe_rate}
        benchmarkLabel="Avg. unsubscribe rate"
      />
    </div>
  );
}

// Summary stats for campaign card/header
export function CampaignStatsSummary({ stats }: { stats: CampaignStats }) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-muted-foreground" />
        <span>
          <span className="font-medium">{stats.sent_count.toLocaleString()}</span>{" "}
          sent
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span>
          <span className="font-medium">{stats.open_rate.toFixed(1)}%</span> opened
        </span>
      </div>
      <div className="flex items-center gap-2">
        <MousePointer className="h-4 w-4 text-muted-foreground" />
        <span>
          <span className="font-medium">{stats.click_rate.toFixed(1)}%</span> clicked
        </span>
      </div>
    </div>
  );
}

// Detailed stats card with charts placeholder
export function CampaignStatsDetailed({
  stats,
  className,
}: CampaignStatsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Funnel visualization */}
          <div className="space-y-3">
            <FunnelBar
              label="Recipients"
              count={stats.recipients_count}
              percentage={100}
              color="bg-slate-500"
            />
            <FunnelBar
              label="Sent"
              count={stats.sent_count}
              percentage={
                stats.recipients_count > 0
                  ? (stats.sent_count / stats.recipients_count) * 100
                  : 0
              }
              color="bg-blue-500"
            />
            <FunnelBar
              label="Delivered"
              count={stats.delivered_count}
              percentage={stats.delivery_rate}
              color="bg-green-500"
            />
            <FunnelBar
              label="Opened"
              count={stats.opened_count}
              percentage={stats.open_rate}
              color="bg-purple-500"
            />
            <FunnelBar
              label="Clicked"
              count={stats.clicked_count}
              percentage={stats.click_rate}
              color="bg-orange-500"
            />
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Click-to-Open Rate</p>
              <p className="text-2xl font-bold">
                {stats.opened_count > 0
                  ? ((stats.clicked_count / stats.opened_count) * 100).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                Of those who opened, {stats.clicked_count} clicked
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Engagement Score</p>
              <p className="text-2xl font-bold">
                {calculateEngagementScore(stats)}/100
              </p>
              <p className="text-xs text-muted-foreground">
                Based on opens, clicks, and bounces
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelBar({
  label,
  count,
  percentage,
  color,
}: {
  label: string;
  count: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {count.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.max(percentage, 1)}%` }}
        />
      </div>
    </div>
  );
}

function calculateEngagementScore(stats: CampaignStats): number {
  // Simple engagement score calculation
  // Weight: Opens 30%, Clicks 50%, Low Bounces 20%
  const openScore = Math.min(stats.open_rate / benchmarks.open_rate, 2) * 30;
  const clickScore = Math.min(stats.click_rate / benchmarks.click_rate, 2) * 50;
  const bounceScore =
    stats.bounce_rate <= benchmarks.bounce_rate
      ? 20
      : Math.max(0, 20 - (stats.bounce_rate - benchmarks.bounce_rate) * 10);

  return Math.round(openScore + clickScore + bounceScore);
}
