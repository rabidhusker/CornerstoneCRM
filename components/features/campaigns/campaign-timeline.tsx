"use client";

import * as React from "react";
import { format, formatDistanceToNow, parseISO, eachHourOfInterval, eachDayOfInterval, startOfDay, endOfDay, isWithinInterval, addDays } from "date-fns";
import {
  Send,
  Eye,
  MousePointer,
  Clock,
  Play,
  Pause,
  CheckCircle,
  Calendar,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TimelineEvent {
  id: string;
  type: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "started" | "paused" | "completed";
  timestamp: string;
  count?: number;
  details?: string;
}

export interface EngagementData {
  timestamp: string;
  opens: number;
  clicks: number;
}

interface CampaignTimelineProps {
  events: TimelineEvent[];
  engagementData?: EngagementData[];
  startedAt?: string;
  className?: string;
}

const eventConfig: Record<
  TimelineEvent["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  started: {
    label: "Campaign Started",
    icon: <Play className="h-4 w-4" />,
    color: "bg-green-500 text-white",
  },
  paused: {
    label: "Campaign Paused",
    icon: <Pause className="h-4 w-4" />,
    color: "bg-yellow-500 text-white",
  },
  completed: {
    label: "Campaign Completed",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-purple-500 text-white",
  },
  sent: {
    label: "Emails Sent",
    icon: <Send className="h-4 w-4" />,
    color: "bg-blue-500 text-white",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-green-500 text-white",
  },
  opened: {
    label: "Opened",
    icon: <Eye className="h-4 w-4" />,
    color: "bg-purple-500 text-white",
  },
  clicked: {
    label: "Clicked",
    icon: <MousePointer className="h-4 w-4" />,
    color: "bg-orange-500 text-white",
  },
  bounced: {
    label: "Bounced",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-red-500 text-white",
  },
};

export function CampaignTimeline({
  events,
  engagementData,
  startedAt,
  className,
}: CampaignTimelineProps) {
  const [activeTab, setActiveTab] = React.useState<"activity" | "engagement">("activity");

  // Sort events by timestamp (newest first)
  const sortedEvents = React.useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "activity" | "engagement")}>
          <TabsList className="mb-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-0">
            {sortedEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity yet</p>
                <p className="text-sm mt-1">
                  Events will appear here as the campaign progresses
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {/* Events */}
                <div className="space-y-6">
                  {sortedEvents.map((event, index) => {
                    const config = eventConfig[event.type];
                    return (
                      <div key={event.id} className="relative flex gap-4 pl-10">
                        {/* Icon */}
                        <div
                          className={cn(
                            "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10",
                            config.color
                          )}
                        >
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{config.label}</span>
                            {event.count !== undefined && event.count > 0 && (
                              <Badge variant="secondary">
                                {event.count.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.timestamp), "MMM d, yyyy 'at' h:mm a")}
                            <span className="mx-1">•</span>
                            {formatDistanceToNow(new Date(event.timestamp))} ago
                          </p>
                          {event.details && (
                            <p className="text-sm mt-1">{event.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="engagement" className="mt-0">
            {engagementData && engagementData.length > 0 ? (
              <EngagementChart data={engagementData} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No engagement data yet</p>
                <p className="text-sm mt-1">
                  Opens and clicks over time will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface EngagementChartProps {
  data: EngagementData[];
}

function EngagementChart({ data }: EngagementChartProps) {
  // Find max values for scaling
  const maxOpens = Math.max(...data.map((d) => d.opens), 1);
  const maxClicks = Math.max(...data.map((d) => d.clicks), 1);
  const maxValue = Math.max(maxOpens, maxClicks);

  // Calculate totals
  const totalOpens = data.reduce((sum, d) => sum + d.opens, 0);
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Total Opens</span>
          </div>
          <p className="text-2xl font-bold mt-1">{totalOpens.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <MousePointer className="h-4 w-4" />
            <span className="text-sm font-medium">Total Clicks</span>
          </div>
          <p className="text-2xl font-bold mt-1">{totalClicks.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Engagement over time</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span>Opens</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded" />
              <span>Clicks</span>
            </div>
          </div>
        </div>

        {/* Simple bar chart */}
        <div className="h-48 flex items-end gap-1">
          {data.slice(-24).map((point, index) => {
            const openHeight = (point.opens / maxValue) * 100;
            const clickHeight = (point.clicks / maxValue) * 100;

            return (
              <div key={index} className="flex-1 flex gap-0.5 items-end h-full">
                <div
                  className="flex-1 bg-purple-500 rounded-t transition-all"
                  style={{ height: `${Math.max(openHeight, 2)}%` }}
                  title={`${point.opens} opens`}
                />
                <div
                  className="flex-1 bg-orange-500 rounded-t transition-all"
                  style={{ height: `${Math.max(clickHeight, 2)}%` }}
                  title={`${point.clicks} clicks`}
                />
              </div>
            );
          })}
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          {data.length > 0 && (
            <>
              <span>{format(new Date(data[0].timestamp), "MMM d, h a")}</span>
              <span>{format(new Date(data[data.length - 1].timestamp), "MMM d, h a")}</span>
            </>
          )}
        </div>
      </div>

      {/* Peak engagement */}
      {data.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Peak Engagement</h4>
          <div className="space-y-2">
            <PeakInfo
              label="Highest Opens"
              data={data}
              valueKey="opens"
              icon={<Eye className="h-4 w-4 text-purple-500" />}
            />
            <PeakInfo
              label="Highest Clicks"
              data={data}
              valueKey="clicks"
              icon={<MousePointer className="h-4 w-4 text-orange-500" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PeakInfo({
  label,
  data,
  valueKey,
  icon,
}: {
  label: string;
  data: EngagementData[];
  valueKey: "opens" | "clicks";
  icon: React.ReactNode;
}) {
  const peak = data.reduce(
    (max, d) => (d[valueKey] > max[valueKey] ? d : max),
    data[0]
  );

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{peak[valueKey].toLocaleString()}</span>
        <span className="text-muted-foreground">
          at {format(new Date(peak.timestamp), "MMM d, h a")}
        </span>
      </div>
    </div>
  );
}
