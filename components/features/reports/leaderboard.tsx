"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Leaderboard as LeaderboardType, LeaderboardEntry } from "@/types/report";
import { formatMetricValue } from "@/types/report";
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  DollarSign,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
  data?: LeaderboardType;
  loading?: boolean;
}

// Rank badge colors
const rankColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  2: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  3: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

// Rank change indicator
function RankChange({ current, previous }: { current: number; previous?: number }) {
  if (!previous || previous === current) {
    return <Minus className="h-3 w-3 text-gray-400" />;
  }

  if (current < previous) {
    return (
      <div className="flex items-center gap-0.5 text-green-500">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs">{previous - current}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 text-red-500">
      <TrendingDown className="h-3 w-3" />
      <span className="text-xs">{current - previous}</span>
    </div>
  );
}

// Rank badge
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
        <Trophy className="h-4 w-4 text-yellow-600" />
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        <Medal className="h-4 w-4 text-gray-500" />
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
        <Medal className="h-4 w-4 text-orange-600" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-sm font-medium text-gray-600">
      {rank}
    </div>
  );
}

// Leaderboard entry row
function LeaderboardRow({
  entry,
  metricType,
  loading,
}: {
  entry: LeaderboardEntry;
  metricType: "deals" | "revenue" | "activities";
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-4 py-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    );
  }

  const colors = rankColors[entry.rank] || { bg: "bg-white", text: "text-gray-600", border: "" };

  // Format value based on metric type
  const formatValue = () => {
    switch (metricType) {
      case "revenue":
        return formatMetricValue(entry.value, "currency");
      case "deals":
      case "activities":
      default:
        return formatMetricValue(entry.value, "number");
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 py-3 px-3 -mx-3 rounded-lg transition-colors hover:bg-gray-50",
        entry.rank <= 3 && colors.bg
      )}
    >
      <RankBadge rank={entry.rank} />

      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatarUrl} alt={entry.userName} />
        <AvatarFallback>
          {entry.userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{entry.userName}</span>
          <RankChange current={entry.rank} previous={entry.previousRank} />
        </div>
        <div className="text-sm text-muted-foreground">
          {metricType === "revenue" && entry.deals && `${entry.deals} deals`}
          {metricType === "deals" && entry.revenue && `$${entry.revenue.toLocaleString()}`}
          {metricType === "activities" && "activities this period"}
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-semibold">{formatValue()}</div>
      </div>
    </div>
  );
}

// Empty state
function EmptyLeaderboard() {
  return (
    <div className="text-center py-8">
      <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <p className="text-muted-foreground">No leaderboard data available</p>
      <p className="text-sm text-muted-foreground mt-1">
        Data will appear as your team records activities
      </p>
    </div>
  );
}

export function Leaderboard({ data, loading }: LeaderboardProps) {
  const [view, setView] = useState<"deals" | "revenue" | "activities">("deals");

  // Get current leaderboard data
  const getLeaderboardData = (): LeaderboardEntry[] | undefined => {
    if (!data) return undefined;
    switch (view) {
      case "deals":
        return data.byDeals;
      case "revenue":
        return data.byRevenue;
      case "activities":
        return data.byActivities;
    }
  };

  const leaderboardData = getLeaderboardData();

  // Get icon for current view
  const getIcon = () => {
    switch (view) {
      case "deals":
        return <Target className="h-4 w-4" />;
      case "revenue":
        return <DollarSign className="h-4 w-4" />;
      case "activities":
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">Sales Leaderboard</CardTitle>
          {getIcon()}
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="h-8">
            <TabsTrigger value="deals" className="text-xs px-3 h-6">
              Deals
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs px-3 h-6">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-xs px-3 h-6">
              Activities
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <LeaderboardRow
                key={i}
                entry={{} as LeaderboardEntry}
                metricType={view}
                loading={true}
              />
            ))}
          </div>
        ) : leaderboardData && leaderboardData.length > 0 ? (
          <div className="space-y-1">
            {leaderboardData.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                metricType={view}
              />
            ))}
          </div>
        ) : (
          <EmptyLeaderboard />
        )}
      </CardContent>
    </Card>
  );
}

// Compact leaderboard for dashboard widgets
export function LeaderboardCompact({
  data,
  loading,
  title = "Top Performers",
}: {
  data?: LeaderboardEntry[];
  loading?: boolean;
  title?: string;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-24 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const topThree = data?.slice(0, 3) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {topThree.length > 0 ? (
          <div className="space-y-3">
            {topThree.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3">
                <RankBadge rank={entry.rank} />
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {entry.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium truncate">
                  {entry.userName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
