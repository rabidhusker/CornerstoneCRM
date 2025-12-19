"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AppointmentCard } from "./appointment-card";
import type { CalendarView as CalendarViewType, AppointmentWithDetails } from "@/types/appointment";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  getHours,
  getMinutes,
  differenceInMinutes,
  addHours,
  startOfDay,
} from "date-fns";

interface CalendarViewProps {
  view: CalendarViewType;
  currentDate: Date;
  appointments: AppointmentWithDetails[];
  isLoading: boolean;
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onDateChange: (date: Date) => void;
}

const HOUR_HEIGHT = 60; // pixels per hour
const DAY_START_HOUR = 7; // 7 AM
const DAY_END_HOUR = 21; // 9 PM

export function CalendarView({
  view,
  currentDate,
  appointments,
  isLoading,
  onDateClick,
  onAppointmentClick,
  onDateChange,
}: CalendarViewProps) {
  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, AppointmentWithDetails[]> = {};
    appointments.forEach((apt) => {
      const dateKey = format(parseISO(apt.start_time), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(apt);
    });
    // Sort appointments within each day
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });
    return grouped;
  }, [appointments]);

  if (isLoading) {
    return <CalendarSkeleton view={view} />;
  }

  switch (view) {
    case "month":
      return (
        <MonthView
          currentDate={currentDate}
          appointmentsByDate={appointmentsByDate}
          onDateClick={onDateClick}
          onAppointmentClick={onAppointmentClick}
        />
      );
    case "week":
      return (
        <WeekView
          currentDate={currentDate}
          appointmentsByDate={appointmentsByDate}
          onDateClick={onDateClick}
          onAppointmentClick={onAppointmentClick}
        />
      );
    case "day":
      return (
        <DayView
          currentDate={currentDate}
          appointments={appointmentsByDate[format(currentDate, "yyyy-MM-dd")] || []}
          onDateClick={onDateClick}
          onAppointmentClick={onAppointmentClick}
        />
      );
    case "agenda":
      return (
        <AgendaView
          currentDate={currentDate}
          appointments={appointments}
          onAppointmentClick={onAppointmentClick}
        />
      );
  }
}

// Month View
function MonthView({
  currentDate,
  appointmentsByDate,
  onDateClick,
  onAppointmentClick,
}: {
  currentDate: Date;
  appointmentsByDate: Record<string, AppointmentWithDetails[]>;
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-6">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "min-h-[120px] border-r last:border-r-0 p-1 cursor-pointer hover:bg-muted/50 transition-colors",
                    !isCurrentMonth && "bg-muted/20"
                  )}
                  onClick={() => onDateClick(day)}
                >
                  <div
                    className={cn(
                      "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                      isCurrentDay && "bg-primary text-primary-foreground",
                      !isCurrentMonth && "text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        variant="compact"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(apt);
                        }}
                      />
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Week View
function WeekView({
  currentDate,
  appointmentsByDate,
  onDateClick,
  onAppointmentClick,
}: {
  currentDate: Date;
  appointmentsByDate: Record<string, AppointmentWithDetails[]>;
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
        <div className="border-r" />
        {days.map((day) => {
          const isCurrentDay = isToday(day);
          return (
            <div
              key={format(day, "yyyy-MM-dd")}
              className="px-2 py-3 text-center border-r last:border-r-0"
            >
              <div className="text-sm font-medium text-muted-foreground">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "text-2xl font-semibold mt-1",
                  isCurrentDay && "bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mx-auto"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] text-xs text-muted-foreground text-right pr-2 -mt-2"
              >
                {format(addHours(startOfDay(currentDate), hour), "h a")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayAppointments = appointmentsByDate[dateKey] || [];

            return (
              <div
                key={dateKey}
                className="relative border-r last:border-r-0"
                onClick={() => onDateClick(day)}
              >
                {/* Hour lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t"
                    style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Appointments */}
                {dayAppointments.map((apt) => {
                  const startTime = parseISO(apt.start_time);
                  const endTime = parseISO(apt.end_time);
                  const startHour = getHours(startTime) + getMinutes(startTime) / 60;
                  const duration = differenceInMinutes(endTime, startTime);
                  const top = (startHour - DAY_START_HOUR) * HOUR_HEIGHT;
                  const height = (duration / 60) * HOUR_HEIGHT;

                  if (startHour < DAY_START_HOUR || startHour >= DAY_END_HOUR) {
                    return null;
                  }

                  return (
                    <div
                      key={apt.id}
                      className="absolute left-1 right-1 z-10"
                      style={{ top, height: Math.max(height, 24) }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(apt);
                      }}
                    >
                      <AppointmentCard
                        appointment={apt}
                        variant="time-block"
                        className="h-full"
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Day View
function DayView({
  currentDate,
  appointments,
  onDateClick,
  onAppointmentClick,
}: {
  currentDate: Date;
  appointments: AppointmentWithDetails[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
}) {
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-[80px_1fr]" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
        {/* Time labels */}
        <div className="border-r">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] text-sm text-muted-foreground text-right pr-3 -mt-2"
            >
              {format(addHours(startOfDay(currentDate), hour), "h:mm a")}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div
          className="relative"
          onClick={() => onDateClick(currentDate)}
        >
          {/* Hour lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-t"
              style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
            />
          ))}

          {/* Current time indicator */}
          {isToday(currentDate) && (
            <div
              className="absolute w-full border-t-2 border-red-500 z-20"
              style={{
                top: (getHours(new Date()) + getMinutes(new Date()) / 60 - DAY_START_HOUR) * HOUR_HEIGHT,
              }}
            >
              <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
            </div>
          )}

          {/* Appointments */}
          {appointments.map((apt) => {
            const startTime = parseISO(apt.start_time);
            const endTime = parseISO(apt.end_time);
            const startHour = getHours(startTime) + getMinutes(startTime) / 60;
            const duration = differenceInMinutes(endTime, startTime);
            const top = (startHour - DAY_START_HOUR) * HOUR_HEIGHT;
            const height = (duration / 60) * HOUR_HEIGHT;

            if (startHour < DAY_START_HOUR || startHour >= DAY_END_HOUR) {
              return null;
            }

            return (
              <div
                key={apt.id}
                className="absolute left-2 right-2 z-10"
                style={{ top, height: Math.max(height, 30) }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAppointmentClick(apt);
                }}
              >
                <AppointmentCard
                  appointment={apt}
                  variant="detailed"
                  className="h-full"
                />
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

// Agenda View
function AgendaView({
  currentDate,
  appointments,
  onAppointmentClick,
}: {
  currentDate: Date;
  appointments: AppointmentWithDetails[];
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
}) {
  // Group by date
  const groupedAppointments = useMemo(() => {
    const grouped: { date: Date; appointments: AppointmentWithDetails[] }[] = [];
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    sorted.forEach((apt) => {
      const aptDate = startOfDay(parseISO(apt.start_time));
      const existing = grouped.find((g) => isSameDay(g.date, aptDate));
      if (existing) {
        existing.appointments.push(apt);
      } else {
        grouped.push({ date: aptDate, appointments: [apt] });
      }
    });

    return grouped;
  }, [appointments]);

  if (groupedAppointments.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No upcoming appointments</p>
          <p className="text-sm text-muted-foreground mt-1">
            Showing next 30 days from {format(currentDate, "MMM d, yyyy")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {groupedAppointments.map(({ date, appointments }) => (
          <div key={format(date, "yyyy-MM-dd")}>
            <div className="flex items-center gap-4 mb-3">
              <div
                className={cn(
                  "text-center p-2 rounded-lg min-w-[60px]",
                  isToday(date) && "bg-primary text-primary-foreground"
                )}
              >
                <div className="text-xs font-medium uppercase">
                  {format(date, "EEE")}
                </div>
                <div className="text-2xl font-bold">{format(date, "d")}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(date, "MMMM yyyy")}
              </div>
            </div>
            <div className="space-y-2 ml-[76px]">
              {appointments.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  variant="agenda"
                  onClick={() => onAppointmentClick(apt)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Loading skeleton
function CalendarSkeleton({ view }: { view: CalendarViewType }) {
  if (view === "month") {
    return (
      <div className="h-full p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
