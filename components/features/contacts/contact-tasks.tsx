"use client";

import * as React from "react";
import { formatDistanceToNow, isPast, isToday, format } from "date-fns";
import { Plus, CheckSquare, Clock, Loader2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useContactTasks,
  useCreateActivity,
  useUpdateActivity,
} from "@/lib/hooks/use-activities";
import type { Activity } from "@/types/activity";

interface ContactTasksProps {
  contactId: string;
}

export function ContactTasks({ contactId }: ContactTasksProps) {
  const { toast } = useToast();
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [isAddingTask, setIsAddingTask] = React.useState(false);

  const { data: tasks, isLoading, isError } = useContactTasks(contactId);
  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsAddingTask(true);
    try {
      await createActivityMutation.mutateAsync({
        type: "task",
        title: newTaskTitle.trim(),
        contactId,
      });
      setNewTaskTitle("");
      toast({
        title: "Task created",
        description: "New task has been added.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleComplete = async (task: Activity) => {
    try {
      await updateActivityMutation.mutateAsync({
        id: task.id,
        data: {
          completedAt: task.completed_at ? null : new Date().toISOString(),
        },
      });
      toast({
        title: task.completed_at ? "Task reopened" : "Task completed",
        description: task.completed_at
          ? "Task has been marked as incomplete."
          : "Task has been marked as complete.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Tasks</CardTitle>
            <CardDescription>Open tasks and to-dos</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1" />
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
          <CardTitle className="text-base">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load tasks. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Tasks</CardTitle>
          <CardDescription>
            {tasks?.length || 0} open {(tasks?.length || 0) === 1 ? "task" : "tasks"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick add task */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            disabled={isAddingTask}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isAddingTask || !newTaskTitle.trim()}
          >
            {isAddingTask ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Task list */}
        {tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                isUpdating={updateActivityMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No open tasks. Add a task above to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: Activity;
  onToggleComplete: (task: Activity) => void;
  isUpdating: boolean;
}

function TaskItem({ task, onToggleComplete, isUpdating }: TaskItemProps) {
  const isCompleted = !!task.completed_at;
  const isOverdue =
    task.due_date && !isCompleted && isPast(new Date(task.due_date));
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-2 rounded-lg transition-colors",
        isCompleted && "opacity-60",
        isOverdue && "bg-destructive/10"
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggleComplete(task)}
        disabled={isUpdating}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}
        {task.due_date && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1 text-xs",
              isOverdue
                ? "text-destructive"
                : isDueToday
                ? "text-amber-600"
                : "text-muted-foreground"
            )}
          >
            {isOverdue ? (
              <AlertCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            <span>
              {isOverdue
                ? `Overdue ${formatDistanceToNow(new Date(task.due_date))}`
                : isDueToday
                ? "Due today"
                : `Due ${format(new Date(task.due_date), "MMM d")}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
