"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  BookingPage,
  BookingAppointmentType,
  BookingAvailability,
  BookingSettings,
  DaySchedule,
} from "@/types/booking";
import {
  defaultBookingAvailability,
  defaultBookingSettings,
  defaultAppointmentTypes,
  locationTypeLabels,
} from "@/types/booking";
import {
  Plus,
  Trash2,
  Loader2,
  Clock,
  Calendar,
  Palette,
  Settings,
  Video,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "URL slug is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  is_active: z.boolean(),
  buffer_before: z.number().min(0),
  buffer_after: z.number().min(0),
  minimum_notice: z.number().min(0),
  booking_window: z.number().min(1).max(365),
  slot_interval: z.number().min(5).max(120),
  confirmation_message: z.string().optional(),
  require_phone: z.boolean(),
  collect_notes: z.boolean(),
  auto_confirm: z.boolean(),
  send_reminders: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface BookingPageSettingsProps {
  open: boolean;
  onClose: () => void;
  bookingPage?: BookingPage;
}

// Day names
const dayNames: (keyof BookingAvailability["schedule"])[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function BookingPageSettings({
  open,
  onClose,
  bookingPage,
}: BookingPageSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [availability, setAvailability] = useState<BookingAvailability>(
    bookingPage?.availability || defaultBookingAvailability
  );
  const [appointmentTypes, setAppointmentTypes] = useState<BookingAppointmentType[]>(
    bookingPage?.appointment_types || defaultAppointmentTypes
  );

  const isEditing = !!bookingPage;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bookingPage?.name || "",
      slug: bookingPage?.slug || "",
      description: bookingPage?.description || "",
      is_active: bookingPage?.is_active ?? true,
      buffer_before: bookingPage?.settings.buffer_before ?? defaultBookingSettings.buffer_before,
      buffer_after: bookingPage?.settings.buffer_after ?? defaultBookingSettings.buffer_after,
      minimum_notice: bookingPage?.settings.minimum_notice ?? defaultBookingSettings.minimum_notice,
      booking_window: bookingPage?.settings.booking_window ?? defaultBookingSettings.booking_window,
      slot_interval: bookingPage?.settings.slot_interval ?? defaultBookingSettings.slot_interval,
      confirmation_message: bookingPage?.settings.confirmation_message || "",
      require_phone: bookingPage?.settings.require_phone ?? defaultBookingSettings.require_phone,
      collect_notes: bookingPage?.settings.collect_notes ?? defaultBookingSettings.collect_notes,
      auto_confirm: bookingPage?.settings.auto_confirm ?? defaultBookingSettings.auto_confirm,
      send_reminders: bookingPage?.settings.send_reminders ?? defaultBookingSettings.send_reminders,
    },
  });

  // Reset form when booking page changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: bookingPage?.name || "",
        slug: bookingPage?.slug || "",
        description: bookingPage?.description || "",
        is_active: bookingPage?.is_active ?? true,
        buffer_before: bookingPage?.settings.buffer_before ?? defaultBookingSettings.buffer_before,
        buffer_after: bookingPage?.settings.buffer_after ?? defaultBookingSettings.buffer_after,
        minimum_notice: bookingPage?.settings.minimum_notice ?? defaultBookingSettings.minimum_notice,
        booking_window: bookingPage?.settings.booking_window ?? defaultBookingSettings.booking_window,
        slot_interval: bookingPage?.settings.slot_interval ?? defaultBookingSettings.slot_interval,
        confirmation_message: bookingPage?.settings.confirmation_message || "",
        require_phone: bookingPage?.settings.require_phone ?? defaultBookingSettings.require_phone,
        collect_notes: bookingPage?.settings.collect_notes ?? defaultBookingSettings.collect_notes,
        auto_confirm: bookingPage?.settings.auto_confirm ?? defaultBookingSettings.auto_confirm,
        send_reminders: bookingPage?.settings.send_reminders ?? defaultBookingSettings.send_reminders,
      });
      setAvailability(bookingPage?.availability || defaultBookingAvailability);
      setAppointmentTypes(bookingPage?.appointment_types || defaultAppointmentTypes);
      setActiveTab("general");
    }
  }, [open, bookingPage]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setSaving(true);

    try {
      const settings: BookingSettings = {
        buffer_before: data.buffer_before,
        buffer_after: data.buffer_after,
        minimum_notice: data.minimum_notice,
        booking_window: data.booking_window,
        slot_interval: data.slot_interval,
        confirmation_message: data.confirmation_message,
        require_phone: data.require_phone,
        collect_notes: data.collect_notes,
        auto_confirm: data.auto_confirm,
        send_reminders: data.send_reminders,
        reminder_times: [1440, 60],
      };

      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        is_active: data.is_active,
        availability,
        settings,
        appointment_types: appointmentTypes,
      };

      const url = isEditing
        ? `/api/v1/booking-pages/${bookingPage.id}`
        : "/api/v1/booking-pages";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save booking page");
      }

      onClose();
    } catch (error) {
      console.error("Failed to save booking page:", error);
    } finally {
      setSaving(false);
    }
  };

  // Toggle day availability
  const toggleDay = (day: keyof BookingAvailability["schedule"]) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          enabled: !prev.schedule[day].enabled,
        },
      },
    }));
  };

  // Update day hours
  const updateDayHours = (
    day: keyof BookingAvailability["schedule"],
    field: "start" | "end",
    value: string
  ) => {
    setAvailability((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          slots: [
            {
              ...(prev.schedule[day].slots[0] || { start: "09:00", end: "17:00" }),
              [field]: value,
            },
          ],
        },
      },
    }));
  };

  // Add appointment type
  const addAppointmentType = () => {
    const newType: BookingAppointmentType = {
      id: `type-${Date.now()}`,
      slug: `new-appointment-${appointmentTypes.length + 1}`,
      name: `New Appointment ${appointmentTypes.length + 1}`,
      duration: 30,
      color: "#3b82f6",
      is_active: true,
      location_type: "video",
      buffer_before: 0,
      buffer_after: 15,
    };
    setAppointmentTypes((prev) => [...prev, newType]);
  };

  // Update appointment type
  const updateAppointmentType = (
    id: string,
    updates: Partial<BookingAppointmentType>
  ) => {
    setAppointmentTypes((prev) =>
      prev.map((type) => (type.id === id ? { ...type, ...updates } : type))
    );
  };

  // Remove appointment type
  const removeAppointmentType = (id: string) => {
    setAppointmentTypes((prev) => prev.filter((type) => type.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Booking Page" : "Create Booking Page"}
          </DialogTitle>
          <DialogDescription>
            Configure your public booking page settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="types" className="gap-2">
              <Clock className="h-4 w-4" />
              Types
            </TabsTrigger>
            <TabsTrigger value="availability" className="gap-2">
              <Calendar className="h-4 w-4" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Palette className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 px-1">
                {/* General Tab */}
                <TabsContent value="general" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="My Booking Page"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (!isEditing) {
                                form.setValue("slug", generateSlug(e.target.value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">/book/</span>
                            <Input placeholder="my-booking-page" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          This will be your public booking URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Book a meeting with me..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Make this booking page publicly accessible
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Appointment Types Tab */}
                <TabsContent value="types" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Appointment Types</h3>
                      <p className="text-sm text-muted-foreground">
                        Define the types of appointments visitors can book
                      </p>
                    </div>
                    <Button type="button" size="sm" onClick={addAppointmentType}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Type
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {appointmentTypes.map((type, index) => (
                      <Card key={type.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={type.color}
                                onChange={(e) =>
                                  updateAppointmentType(type.id, { color: e.target.value })
                                }
                                className="w-6 h-6 rounded cursor-pointer"
                              />
                              <Input
                                value={type.name}
                                onChange={(e) =>
                                  updateAppointmentType(type.id, {
                                    name: e.target.value,
                                    slug: generateSlug(e.target.value),
                                  })
                                }
                                className="font-medium"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={type.is_active}
                                onCheckedChange={(checked) =>
                                  updateAppointmentType(type.id, { is_active: checked })
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAppointmentType(type.id)}
                                disabled={appointmentTypes.length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Duration</label>
                            <Select
                              value={type.duration.toString()}
                              onValueChange={(value) =>
                                updateAppointmentType(type.id, {
                                  duration: parseInt(value),
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="90">1.5 hours</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Location Type</label>
                            <Select
                              value={type.location_type}
                              onValueChange={(value: BookingAppointmentType["location_type"]) =>
                                updateAppointmentType(type.id, { location_type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="video">
                                  <span className="flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    Video Call
                                  </span>
                                </SelectItem>
                                <SelectItem value="phone">
                                  <span className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Phone Call
                                  </span>
                                </SelectItem>
                                <SelectItem value="in_person">
                                  <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    In Person
                                  </span>
                                </SelectItem>
                                <SelectItem value="custom">
                                  <span className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    Custom
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Buffer Before (min)</label>
                            <Input
                              type="number"
                              min={0}
                              value={type.buffer_before}
                              onChange={(e) =>
                                updateAppointmentType(type.id, {
                                  buffer_before: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Buffer After (min)</label>
                            <Input
                              type="number"
                              min={0}
                              value={type.buffer_after}
                              onChange={(e) =>
                                updateAppointmentType(type.id, {
                                  buffer_after: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                              value={type.description || ""}
                              onChange={(e) =>
                                updateAppointmentType(type.id, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Brief description of this appointment type"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Availability Tab */}
                <TabsContent value="availability" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timezone</label>
                    <Select
                      value={availability.timezone}
                      onValueChange={(value) =>
                        setAvailability((prev) => ({ ...prev, timezone: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Weekly Schedule</h4>
                    {dayNames.map((day) => {
                      const schedule = availability.schedule[day];
                      const slot = schedule.slots[0] || { start: "09:00", end: "17:00" };

                      return (
                        <div
                          key={day}
                          className="flex items-center gap-4 py-2"
                        >
                          <div className="w-28 flex items-center gap-2">
                            <Switch
                              checked={schedule.enabled}
                              onCheckedChange={() => toggleDay(day)}
                            />
                            <span className="capitalize font-medium">{day}</span>
                          </div>

                          {schedule.enabled ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={slot.start}
                                onChange={(e) =>
                                  updateDayHours(day, "start", e.target.value)
                                }
                                className="w-32"
                              />
                              <span className="text-muted-foreground">to</span>
                              <Input
                                type="time"
                                value={slot.end}
                                onChange={(e) =>
                                  updateDayHours(day, "end", e.target.value)
                                }
                                className="w-32"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Unavailable
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 mt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="buffer_before"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer Before (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Time blocked before appointments</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="buffer_after"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer After (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Time blocked after appointments</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minimum_notice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Notice (hours)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>How far in advance bookings can be made</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="booking_window"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking Window (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>How far ahead visitors can book</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="require_phone"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Require Phone Number</FormLabel>
                          <FormDescription>
                            Require visitors to provide a phone number
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collect_notes"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Allow Notes</FormLabel>
                          <FormDescription>
                            Let visitors add notes/reason for meeting
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="auto_confirm"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-Confirm Bookings</FormLabel>
                          <FormDescription>
                            Automatically confirm appointments
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="send_reminders"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Send Reminders</FormLabel>
                          <FormDescription>
                            Send email reminders before appointments
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmation_message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmation Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Thank you for booking! We look forward to meeting with you."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Custom message shown after successful booking
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Save Changes" : "Create Booking Page"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
