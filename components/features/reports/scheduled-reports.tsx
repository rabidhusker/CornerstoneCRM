"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Calendar,
  Clock,
  Mail,
  Plus,
  Trash2,
  Edit,
  Send,
  Pause,
  Play,
  X,
} from "lucide-react";
import type { ReportSchedule } from "@/types/report";

interface ScheduledReportsProps {
  schedule?: ReportSchedule;
  onChange: (schedule: ReportSchedule | undefined) => void;
}

// Day of week options
const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Common timezones
const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

// Generate ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Create default schedule
function createDefaultSchedule(): ReportSchedule {
  return {
    id: generateId(),
    frequency: "weekly",
    dayOfWeek: 1, // Monday
    time: "09:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    recipients: [],
    format: "csv",
    enabled: true,
  };
}

// Schedule editor dialog
function ScheduleEditor({
  schedule,
  onSave,
  onCancel,
  isOpen,
}: {
  schedule: ReportSchedule;
  onSave: (schedule: ReportSchedule) => void;
  onCancel: () => void;
  isOpen: boolean;
}) {
  const [editedSchedule, setEditedSchedule] = useState<ReportSchedule>(schedule);
  const [newRecipient, setNewRecipient] = useState("");

  const addRecipient = () => {
    if (newRecipient && !editedSchedule.recipients.includes(newRecipient)) {
      setEditedSchedule({
        ...editedSchedule,
        recipients: [...editedSchedule.recipients, newRecipient],
      });
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    setEditedSchedule({
      ...editedSchedule,
      recipients: editedSchedule.recipients.filter((r) => r !== email),
    });
  };

  const handleSave = () => {
    if (editedSchedule.recipients.length > 0) {
      onSave(editedSchedule);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Report</DialogTitle>
          <DialogDescription>
            Configure automatic report delivery to email recipients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={editedSchedule.frequency}
                onValueChange={(v) =>
                  setEditedSchedule({
                    ...editedSchedule,
                    frequency: v as ReportSchedule["frequency"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={editedSchedule.time}
                onChange={(e) =>
                  setEditedSchedule({ ...editedSchedule, time: e.target.value })
                }
              />
            </div>
          </div>

          {/* Day selection */}
          {editedSchedule.frequency === "weekly" && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={String(editedSchedule.dayOfWeek)}
                onValueChange={(v) =>
                  setEditedSchedule({
                    ...editedSchedule,
                    dayOfWeek: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {editedSchedule.frequency === "monthly" && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select
                value={String(editedSchedule.dayOfMonth || 1)}
                onValueChange={(v) =>
                  setEditedSchedule({
                    ...editedSchedule,
                    dayOfMonth: parseInt(v),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {day}
                      {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={editedSchedule.timezone}
              onValueChange={(v) =>
                setEditedSchedule({ ...editedSchedule, timezone: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={editedSchedule.format}
              onValueChange={(v) =>
                setEditedSchedule({
                  ...editedSchedule,
                  format: v as ReportSchedule["format"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRecipient()}
              />
              <Button type="button" variant="outline" onClick={addRecipient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {editedSchedule.recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {editedSchedule.recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    <Mail className="h-3 w-3" />
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {editedSchedule.recipients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add at least one recipient email address
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={editedSchedule.recipients.length === 0}
          >
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduledReports({ schedule, onChange }: ScheduledReportsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleCreate = () => {
    setIsEditing(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = (newSchedule: ReportSchedule) => {
    onChange(newSchedule);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    onChange(undefined);
  };

  const handleToggle = (enabled: boolean) => {
    if (schedule) {
      onChange({ ...schedule, enabled });
    }
  };

  // Format schedule description
  const getScheduleDescription = (sched: ReportSchedule): string => {
    let desc = "";

    switch (sched.frequency) {
      case "daily":
        desc = "Every day";
        break;
      case "weekly":
        desc = `Every ${daysOfWeek.find((d) => d.value === sched.dayOfWeek)?.label || ""}`;
        break;
      case "monthly":
        const day = sched.dayOfMonth || 1;
        const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";
        desc = `Monthly on the ${day}${suffix}`;
        break;
    }

    desc += ` at ${sched.time}`;

    return desc;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Scheduled Delivery</CardTitle>
          {schedule && (
            <Switch checked={schedule.enabled} onCheckedChange={handleToggle} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!schedule ? (
          <div className="text-center py-6">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              Schedule automatic report delivery via email
            </p>
            <Button variant="outline" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        ) : (
          <div className={schedule.enabled ? "" : "opacity-50"}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {getScheduleDescription(schedule)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {schedule.format.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {schedule.timezone}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {schedule.recipients.map((email) => (
                    <Badge key={email} variant="secondary" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      {email}
                    </Badge>
                  ))}
                </div>

                {schedule.nextRun && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Next delivery: {new Date(schedule.nextRun).toLocaleString()}
                  </p>
                )}

                {schedule.lastSent && (
                  <p className="text-xs text-muted-foreground">
                    Last sent: {new Date(schedule.lastSent).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <ScheduleEditor
            schedule={schedule || createDefaultSchedule()}
            onSave={handleSave}
            onCancel={handleCancel}
            isOpen={isEditing}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Schedule summary for display
export function ScheduleSummary({ schedule }: { schedule?: ReportSchedule }) {
  if (!schedule) return null;

  const getFrequencyLabel = () => {
    switch (schedule.frequency) {
      case "daily":
        return "Daily";
      case "weekly":
        return daysOfWeek.find((d) => d.value === schedule.dayOfWeek)?.label || "Weekly";
      case "monthly":
        return `Monthly (${schedule.dayOfMonth}${
          schedule.dayOfMonth === 1 ? "st" : schedule.dayOfMonth === 2 ? "nd" : schedule.dayOfMonth === 3 ? "rd" : "th"
        })`;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={schedule.enabled ? "default" : "secondary"}>
        {schedule.enabled ? (
          <Play className="h-3 w-3 mr-1" />
        ) : (
          <Pause className="h-3 w-3 mr-1" />
        )}
        {getFrequencyLabel()} at {schedule.time}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {schedule.recipients.length} recipient
        {schedule.recipients.length !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
