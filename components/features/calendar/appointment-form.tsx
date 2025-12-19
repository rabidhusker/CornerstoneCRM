"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCreateAppointment, useUpdateAppointment } from "@/lib/hooks/use-appointments";
import type { AppointmentWithDetails, AppointmentType } from "@/types/appointment";
import { appointmentTypeConfig, durationOptions, reminderOptions } from "@/types/appointment";
import { format, addMinutes, setHours, setMinutes, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Video,
  Bell,
  Loader2,
  Check,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string(),
  description: z.string().optional(),
  contact_id: z.string().optional(),
  deal_id: z.string().optional(),
  date: z.date(),
  start_time: z.string(),
  duration: z.number(),
  all_day: z.boolean(),
  location: z.string().optional(),
  meeting_link: z.string().url().optional().or(z.literal("")),
  reminder_minutes: z.array(z.number()),
});

type FormData = z.infer<typeof formSchema>;

interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  appointment?: AppointmentWithDetails;
  defaultDate?: Date;
  defaultContactId?: string;
  defaultDealId?: string;
}

// Time slot options
const timeSlots = Array.from({ length: 32 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7; // Start at 7 AM
  const minute = (i % 2) * 30;
  const date = setMinutes(setHours(new Date(), hour), minute);
  return {
    value: format(date, "HH:mm"),
    label: format(date, "h:mm a"),
  };
});

export function AppointmentForm({
  open,
  onClose,
  appointment,
  defaultDate,
  defaultContactId,
  defaultDealId,
}: AppointmentFormProps) {
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactSearch, setShowContactSearch] = useState(false);

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();

  const isEditing = !!appointment;

  // Parse default values from appointment
  const getDefaultValues = (): Partial<FormData> => {
    if (appointment) {
      const startTime = parseISO(appointment.start_time);
      const endTime = parseISO(appointment.end_time);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      return {
        title: appointment.title,
        type: appointment.showing_type || "meeting",
        description: appointment.description || "",
        contact_id: appointment.contact_id || undefined,
        deal_id: appointment.deal_id || undefined,
        date: startTime,
        start_time: format(startTime, "HH:mm"),
        duration,
        all_day: appointment.all_day,
        location: appointment.location || "",
        meeting_link: "",
        reminder_minutes: appointment.reminder_minutes || [30],
      };
    }

    const date = defaultDate || new Date();
    return {
      title: "",
      type: "meeting",
      description: "",
      contact_id: defaultContactId,
      deal_id: defaultDealId,
      date,
      start_time: "09:00",
      duration: 60,
      all_day: false,
      location: "",
      meeting_link: "",
      reminder_minutes: [30],
    };
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when appointment changes
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues());
    }
  }, [appointment, open, defaultDate]);

  // Search contacts
  useEffect(() => {
    const searchContacts = async () => {
      if (!contactSearch.trim()) {
        setContacts([]);
        return;
      }

      setSearchingContacts(true);
      try {
        const response = await fetch(
          `/api/v1/contacts?search=${encodeURIComponent(contactSearch)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setContacts(
            data.contacts.map((c: any) => ({
              id: c.id,
              name: `${c.first_name} ${c.last_name}`,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to search contacts:", error);
      } finally {
        setSearchingContacts(false);
      }
    };

    const debounce = setTimeout(searchContacts, 300);
    return () => clearTimeout(debounce);
  }, [contactSearch]);

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      // Calculate start and end times
      const [hours, minutes] = data.start_time.split(":").map(Number);
      const startTime = setMinutes(setHours(data.date, hours), minutes);
      const endTime = addMinutes(startTime, data.duration);

      const appointmentData = {
        title: data.title,
        showing_type: data.type,
        description: data.description || null,
        contact_id: data.contact_id || null,
        deal_id: data.deal_id || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: data.all_day,
        location: data.meeting_link || data.location || null,
        reminder_minutes: data.reminder_minutes,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: appointment.id,
          data: appointmentData,
        });
      } else {
        await createMutation.mutateAsync(appointmentData);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save appointment:", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const selectedContact = contacts.find((c) => c.id === form.watch("contact_id"));

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Appointment" : "New Appointment"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the appointment details"
              : "Schedule a new appointment"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting with client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(appointmentTypeConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                config.borderColor.replace("border-", "bg-")
                              )}
                            />
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact selector */}
            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Contact (Optional)</FormLabel>
                  <Popover open={showContactSearch} onOpenChange={setShowContactSearch}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {selectedContact?.name || "Unknown Contact"}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Search className="h-4 w-4" />
                              Search contacts...
                            </span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search contacts..."
                          value={contactSearch}
                          onValueChange={setContactSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {searchingContacts ? "Searching..." : "No contacts found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {field.value && (
                              <CommandItem
                                onSelect={() => {
                                  field.onChange(undefined);
                                  setShowContactSearch(false);
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Clear selection
                              </CommandItem>
                            )}
                            {contacts.map((contact) => (
                              <CommandItem
                                key={contact.id}
                                value={contact.id}
                                onSelect={() => {
                                  field.onChange(contact.id);
                                  setShowContactSearch(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4 mr-2",
                                    field.value === contact.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {contact.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* All day toggle */}
            <FormField
              control={form.control}
              name="all_day"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>All Day Event</FormLabel>
                    <FormDescription>
                      This event lasts the entire day
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

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time and Duration (only if not all day) */}
            {!form.watch("all_day") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <Clock className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(parseInt(val))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {durationOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value.toString()}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="123 Main St or Office" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meeting Link */}
            <FormField
              control={form.control}
              name="meeting_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Link (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://zoom.us/j/..."
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Zoom, Google Meet, or Teams link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reminders */}
            <FormField
              control={form.control}
              name="reminder_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Reminders
                  </FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {reminderOptions.map((option) => {
                      const isSelected = field.value.includes(option.value);
                      return (
                        <Badge
                          key={option.value}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              field.onChange(
                                field.value.filter((v) => v !== option.value)
                              );
                            } else {
                              field.onChange([...field.value, option.value]);
                            }
                          }}
                        >
                          {isSelected && <Check className="h-3 w-3 mr-1" />}
                          {option.label}
                        </Badge>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes or agenda items..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Update" : "Create"} Appointment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
