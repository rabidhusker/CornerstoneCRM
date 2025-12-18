"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  MoreHorizontal,
  Plus,
  Loader2,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActivities, useDeleteActivity } from "@/lib/hooks/use-activities";
import { useToast } from "@/hooks/use-toast";
import type { Activity, ActivityType } from "@/types/activity";
import { activityTypeConfig } from "@/types/activity";

interface DealActivityTabProps {
  dealId: string;
}

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
  other: MoreHorizontal,
};

export function DealActivityTab({ dealId }: DealActivityTabProps) {
  const { toast } = useToast();
  const [showAddActivity, setShowAddActivity] = React.useState(false);

  // Fetch activities for this deal
  const { data, isLoading, isError } = useActivities({ dealId });
  const deleteActivityMutation = useDeleteActivity();

  const handleDeleteActivity = async (activity: Activity) => {
    try {
      await deleteActivityMutation.mutateAsync(activity.id);
      toast({
        title: "Activity deleted",
        description: "The activity has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete activity.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load activities
      </div>
    );
  }

  const activities = data?.activities || [];

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Activity Timeline
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddActivity(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Activity
        </Button>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No activities yet</p>
          <Button
            size="sm"
            variant="link"
            className="mt-1"
            onClick={() => setShowAddActivity(true)}
          >
            Add the first activity
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {activities.map((activity) => {
              const config = activityTypeConfig[activity.type as ActivityType];
              const Icon = activityIcons[activity.type as ActivityType] || FileText;
              const isCompleted = !!activity.completed_at;

              return (
                <div key={activity.id} className="relative flex gap-4 pl-10">
                  {/* Icon */}
                  <div
                    className={cn(
                      "absolute left-0 p-2 rounded-full border-2 border-background",
                      config?.color || "bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 border rounded-lg p-3 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {activity.title}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {config?.label || activity.type}
                          </Badge>
                          {isCompleted && (
                            <Badge
                              variant="outline"
                              className="text-xs text-green-600 border-green-200"
                            >
                              Completed
                            </Badge>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {activity.description}
                          </p>
                        )}
                        {activity.outcome && (
                          <p className="text-sm mt-2">
                            <span className="text-muted-foreground">Outcome: </span>
                            {activity.outcome}
                          </p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteActivity(activity)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(activity.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      {activity.due_date && !isCompleted && (
                        <span
                          className={cn(
                            new Date(activity.due_date) < new Date() &&
                              "text-red-600"
                          )}
                        >
                          Due: {format(new Date(activity.due_date), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Activity Dialog - Simplified inline form for now */}
      {showAddActivity && (
        <AddActivityInline
          dealId={dealId}
          onClose={() => setShowAddActivity(false)}
        />
      )}
    </div>
  );
}

// Simplified inline activity form
function AddActivityInline({
  dealId,
  onClose,
}: {
  dealId: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [type, setType] = React.useState<ActivityType>("note");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/deals/${dealId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description }),
      });

      if (!response.ok) throw new Error("Failed to create activity");

      toast({ title: "Activity added" });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-lg p-4 bg-muted/30 space-y-3"
    >
      <div className="flex gap-2">
        {(Object.keys(activityTypeConfig) as ActivityType[]).map((actType) => (
          <Button
            key={actType}
            type="button"
            size="sm"
            variant={type === actType ? "default" : "outline"}
            onClick={() => setType(actType)}
          >
            {activityTypeConfig[actType].label}
          </Button>
        ))}
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Activity title"
        className="w-full px-3 py-2 border rounded-md text-sm"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 border rounded-md text-sm"
        rows={2}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !title.trim()}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Add Activity
        </Button>
      </div>
    </form>
  );
}
