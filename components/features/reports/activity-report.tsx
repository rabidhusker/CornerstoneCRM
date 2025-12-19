"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ActivitySummary, TimeSeriesDataPoint } from "@/types/report";
import { chartColors } from "@/types/report";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityReportProps {
  data?: ActivitySummary;
  loading?: boolean;
}

// Get icon for activity type
function getActivityIcon(type: string) {
  const icons: Record<string, React.ElementType> = {
    call: Phone,
    email: Mail,
    meeting: Calendar,
    message: MessageSquare,
    note: FileText,
    task: CheckCircle,
  };
  return icons[type.toLowerCase()] || CheckCircle;
}

// Activity type breakdown
function ActivityTypeBreakdown({
  data,
  loading,
}: {
  data?: ActivitySummary["byType"];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const Icon = getActivityIcon(item.type);
        const percentage = total > 0 ? (item.count / total) * 100 : 0;

        return (
          <div key={item.type} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${chartColors[index % chartColors.length]}20` }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: chartColors[index % chartColors.length] }}
                  />
                </div>
                <span className="text-sm font-medium capitalize">{item.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.count}</span>
                <span className="text-xs text-muted-foreground">
                  ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Activity by user
function ActivityByUser({
  data,
  loading,
}: {
  data?: ActivitySummary["byUser"];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No user activity data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((u) => u.count));

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((user, index) => (
        <div key={user.userId} className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user.userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate">{user.userName}</span>
              <span className="text-sm text-muted-foreground">{user.count}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${(user.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Activity timeline chart
function ActivityTimeline({
  data,
  loading,
}: {
  data?: TimeSeriesDataPoint[];
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="w-full h-[200px]" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No timeline data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(parseISO(value), "MMM d")}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            return (
              <div className="bg-white border rounded-lg shadow-lg p-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {label ? format(parseISO(String(label)), "MMM d, yyyy") : label}
                </p>
                <p className="text-sm font-medium">{payload[0].value} activities</p>
              </div>
            );
          }}
        />
        <Bar
          dataKey="value"
          name="Activities"
          fill={chartColors[0]}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActivityReport({ data, loading }: ActivityReportProps) {
  const trendDirection =
    data && data.total > data.previousTotal
      ? "up"
      : data && data.total < data.previousTotal
      ? "down"
      : "neutral";
  const trendPercentage =
    data && data.previousTotal > 0
      ? ((data.total - data.previousTotal) / data.previousTotal) * 100
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Activity Summary</CardTitle>
          {data && !loading && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.total.toLocaleString()}</span>
              {trendDirection !== "neutral" && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm",
                    trendDirection === "up" ? "text-green-500" : "text-red-500"
                  )}
                >
                  {trendDirection === "up" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{Math.abs(trendPercentage).toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity timeline */}
          <div>
            <h4 className="text-sm font-medium mb-3">Activity Trend</h4>
            <ActivityTimeline data={data?.timeSeries} loading={loading} />
          </div>

          {/* Activity breakdown */}
          <div>
            <h4 className="text-sm font-medium mb-3">By Type</h4>
            <ActivityTypeBreakdown data={data?.byType} loading={loading} />
          </div>
        </div>

        {/* Top performers */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Top Performers</h4>
          <ActivityByUser data={data?.byUser} loading={loading} />
        </div>
      </CardContent>
    </Card>
  );
}
