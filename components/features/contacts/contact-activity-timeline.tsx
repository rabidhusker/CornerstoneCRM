"use client";

import * as React from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Activity,
  Plus,
  ChevronDown,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/lib/hooks/use-activities";
import type { ActivityType, ActivityWithUser } from "@/types/activity";

interface ContactActivityTimelineProps {
  contactId: string;
  onAddActivity: () => void;
}

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
  other: Activity,
};

const activityColors: Record<ActivityType, string> = {
  call: "bg-green-500",
  email: "bg-blue-500",
  meeting: "bg-purple-500",
  note: "bg-yellow-500",
  task: "bg-orange-500",
  other: "bg-gray-500",
};

export function ContactActivityTimeline({
  contactId,
  onAddActivity,
}: ContactActivityTimelineProps) {
  const [limit, setLimit] = React.useState(10);

  const { data, isLoading, isError } = useActivities({
    contactId,
    limit,
  });

  const activities = data?.activities || [];
  const total = data?.total || 0;
  const hasMore = activities.length < total;

  const loadMore = () => {
    setLimit((prev) => prev + 10);
  };

  if (isLoading && activities.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
            <CardDescription>Recent interactions and activities</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load activities. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
          <CardDescription>
            {total} {total === 1 ? "activity" : "activities"}
          </CardDescription>
        </div>
        <Button size="sm" onClick={onAddActivity}>
          <Plus className="mr-1 h-4 w-4" />
          Add Activity
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No activities yet. Add your first activity to start tracking
              interactions.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onAddActivity}>
              <Plus className="mr-1 h-4 w-4" />
              Add Activity
            </Button>
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={index === activities.length - 1}
              />
            ))}

            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  )}
                  Load More ({total - activities.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  activity: ActivityWithUser;
  isLast: boolean;
}

function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const Icon = activityIcons[activity.type] || Activity;
  const color = activityColors[activity.type] || "bg-gray-500";

  const getUserInitials = () => {
    if (activity.user?.full_name) {
      const names = activity.user.full_name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return activity.user.full_name.slice(0, 2).toUpperCase();
    }
    return "?";
  };

  return (
    <div className="relative flex gap-4 pb-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          color
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {activity.type}
          </Badge>
        </div>

        {/* Outcome */}
        {activity.outcome && (
          <p className="text-sm mt-1">
            <span className="text-muted-foreground">Outcome:</span>{" "}
            {activity.outcome}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {activity.user && (
            <>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span>{activity.user.full_name || "Unknown"}</span>
              <span>•</span>
            </>
          )}
          <time
            dateTime={activity.created_at}
            title={format(new Date(activity.created_at), "PPpp")}
          >
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
            })}
          </time>
          {activity.completed_at && (
            <>
              <span>•</span>
              <Badge variant="outline" className="text-xs h-5">
                Completed
              </Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
