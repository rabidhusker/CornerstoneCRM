"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { BookingAvailability } from "@/types/booking";
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
  isBefore,
  addMonths,
  subMonths,
  addDays,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicBookingCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  bookingWindow: number;
  availability: BookingAvailability;
  primaryColor?: string;
}

// Day name mapping
const dayNameMap: Record<number, keyof BookingAvailability["schedule"]> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export function PublicBookingCalendar({
  selectedDate,
  onDateSelect,
  bookingWindow,
  availability,
  primaryColor = "#3b82f6",
}: PublicBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate the maximum bookable date
  const maxDate = useMemo(() => addDays(new Date(), bookingWindow), [bookingWindow]);

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Check if a day is available based on schedule
  const isDayAvailable = (date: Date): boolean => {
    // Check if date is in the past
    if (isBefore(date, new Date()) && !isToday(date)) {
      return false;
    }

    // Check if date is beyond booking window
    if (isBefore(maxDate, date)) {
      return false;
    }

    // Check day of week availability
    const dayOfWeek = getDay(date);
    const dayName = dayNameMap[dayOfWeek];
    const daySchedule = availability.schedule[dayName];

    if (!daySchedule.enabled) {
      return false;
    }

    // Check date overrides
    if (availability.date_overrides) {
      const dateStr = format(date, "yyyy-MM-dd");
      const override = availability.date_overrides.find((o) => o.date === dateStr);
      if (override && !override.enabled) {
        return false;
      }
    }

    return true;
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Check if can navigate to previous month
  const canGoPrevious = !isBefore(startOfMonth(currentMonth), startOfMonth(new Date()));

  // Check if can navigate to next month
  const canGoNext = !isBefore(maxDate, startOfMonth(addMonths(currentMonth, 1)));

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="font-semibold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isAvailable = isDayAvailable(day);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => isAvailable && onDateSelect(day)}
              disabled={!isAvailable || !isCurrentMonth}
              className={cn(
                "aspect-square p-2 rounded-lg text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                !isCurrentMonth && "invisible",
                isCurrentMonth && !isAvailable && "text-gray-300 cursor-not-allowed",
                isCurrentMonth && isAvailable && !isSelected && "hover:bg-gray-100 text-gray-900",
                isCurrentDay && !isSelected && "ring-1 ring-gray-300",
                isSelected && "text-white"
              )}
              style={{
                backgroundColor: isSelected ? primaryColor : undefined,
                boxShadow: isSelected ? `0 0 0 2px ${primaryColor}` : undefined,
              }}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: primaryColor }}
          />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-50 text-gray-300 flex items-center justify-center text-xs">
            X
          </div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
