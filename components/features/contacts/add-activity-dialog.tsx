"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Activity,
  CalendarIcon,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useCreateActivity } from "@/lib/hooks/use-activities";
import type { ActivityType } from "@/types/activity";

interface AddActivityDialogProps {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const activityTypes: {
  value: ActivityType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "note", label: "Note", icon: FileText },
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Calendar },
  { value: "task", label: "Task", icon: CheckSquare },
  { value: "other", label: "Other", icon: Activity },
];

export function AddActivityDialog({
  contactId,
  open,
  onOpenChange,
}: AddActivityDialogProps) {
  const { toast } = useToast();
  const [type, setType] = React.useState<ActivityType>("note");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [outcome, setOutcome] = React.useState("");
  const [dueDate, setDueDate] = React.useState<Date | undefined>();
  const [duration, setDuration] = React.useState("");

  const createActivityMutation = useCreateActivity();

  const resetForm = () => {
    setType("note");
    setTitle("");
    setDescription("");
    setOutcome("");
    setDueDate(undefined);
    setDuration("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the activity.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createActivityMutation.mutateAsync({
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        outcome: outcome.trim() || undefined,
        dueDate: dueDate?.toISOString(),
        contactId,
        metadata: duration ? { duration: parseInt(duration, 10) } : undefined,
      });

      toast({
        title: "Activity added",
        description: `${activityTypes.find((t) => t.value === type)?.label || "Activity"} has been added.`,
      });

      resetForm();
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  // Get fields based on activity type
  const showDueDate = type === "task" || type === "meeting";
  const showDuration = type === "call" || type === "meeting";
  const showOutcome = type === "call" || type === "meeting";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>
              Log an interaction or create a task for this contact.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Activity Type */}
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as ActivityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((activityType) => {
                    const Icon = activityType.icon;
                    return (
                      <SelectItem key={activityType.value} value={activityType.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {activityType.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {type === "note" ? "Note Title" : "Subject"}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "note"
                    ? "Enter note title..."
                    : type === "call"
                    ? "Call with..."
                    : type === "email"
                    ? "Email subject..."
                    : type === "meeting"
                    ? "Meeting about..."
                    : type === "task"
                    ? "Task to complete..."
                    : "Activity title..."
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {type === "note" ? "Note Content" : "Description"}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === "note"
                    ? "Write your note here..."
                    : "Add details..."
                }
                rows={type === "note" ? 5 : 3}
              />
            </div>

            {/* Due Date (for tasks and meetings) */}
            {showDueDate && (
              <div className="space-y-2">
                <Label>{type === "meeting" ? "Meeting Date" : "Due Date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Duration (for calls and meetings) */}
            {showDuration && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
            )}

            {/* Outcome (for calls and meetings) */}
            {showOutcome && (
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="left_voicemail">Left Voicemail</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    {type === "meeting" && (
                      <SelectItem value="no_show">No Show</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createActivityMutation.isPending}>
              {createActivityMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
