"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarView } from "@/components/features/calendar/calendar-view";
import { AppointmentForm } from "@/components/features/calendar/appointment-form";
import { AppointmentDetailSheet } from "@/components/features/calendar/appointment-detail-sheet";
import { useCalendarAppointments } from "@/lib/hooks/use-appointments";
import type { CalendarView as CalendarViewType, AppointmentWithDetails } from "@/types/appointment";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  List,
  Users,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
} from "date-fns";

export default function CalendarPage() {
  // State
  const [view, setView] = useState<CalendarViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>("me");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    switch (view) {
      case "month":
        return {
          start: startOfWeek(startOfMonth(currentDate)),
          end: endOfWeek(endOfMonth(currentDate)),
        };
      case "week":
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        };
      case "day":
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        };
      case "agenda":
        // Show 30 days for agenda view
        return {
          start: startOfDay(currentDate),
          end: addDays(startOfDay(currentDate), 30),
        };
    }
  }, [view, currentDate]);

  // Fetch appointments
  const { data: appointments = [], isLoading } = useCalendarAppointments(
    dateRange,
    selectedUserId === "me" ? undefined : selectedUserId === "all" ? undefined : selectedUserId
  );

  // Navigation functions
  const navigatePrevious = () => {
    switch (view) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "day":
      case "agenda":
        setCurrentDate(subDays(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "day":
      case "agenda":
        setCurrentDate(addDays(currentDate, 1));
        break;
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Get title based on view
  const getTitle = () => {
    switch (view) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week":
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, "MMMM d")} - ${format(weekEnd, "d, yyyy")}`;
        }
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "day":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "agenda":
        return `Agenda from ${format(currentDate, "MMMM d, yyyy")}`;
    }
  };

  // Handle date click (for creating appointments)
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowCreateForm(true);
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
  };

  // View icons
  const viewIcons = {
    month: Calendar,
    week: CalendarRange,
    day: CalendarDays,
    agenda: List,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Calendar</h1>
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-medium">{getTitle()}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* User filter */}
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[180px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">My Calendar</SelectItem>
                <SelectItem value="all">All Team Members</SelectItem>
              </SelectContent>
            </Select>

            {/* View selector */}
            <div className="flex items-center border rounded-lg p-1">
              {(["month", "week", "day", "agenda"] as const).map((v) => {
                const Icon = viewIcons[v];
                return (
                  <Button
                    key={v}
                    variant={view === v ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setView(v)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline capitalize">{v}</span>
                  </Button>
                );
              })}
            </div>

            {/* Create appointment */}
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-hidden">
        <CalendarView
          view={view}
          currentDate={currentDate}
          appointments={appointments}
          isLoading={isLoading}
          onDateClick={handleDateClick}
          onAppointmentClick={handleAppointmentClick}
          onDateChange={setCurrentDate}
        />
      </div>

      {/* Create/Edit form */}
      <AppointmentForm
        open={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setSelectedDate(null);
        }}
        defaultDate={selectedDate || undefined}
      />

      {/* Appointment detail sheet */}
      <AppointmentDetailSheet
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
}
