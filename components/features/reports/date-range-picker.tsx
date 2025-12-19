"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { DateRange, DateRangePreset } from "@/types/report";
import { getDateRangeFromPreset } from "@/types/report";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

// Preset options
const presets: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "thisQuarter", label: "This quarter" },
  { value: "lastQuarter", label: "Last quarter" },
  { value: "thisYear", label: "This year" },
  { value: "custom", label: "Custom range" },
];

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(value.preset === "custom");
  const [tempRange, setTempRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: value.startDate,
    to: value.endDate,
  });

  // Handle preset selection
  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setShowCustom(true);
      return;
    }

    const range = getDateRangeFromPreset(preset);
    onChange({
      ...range,
      compareToLastPeriod: value.compareToLastPeriod,
    });
    setShowCustom(false);
    setOpen(false);
  };

  // Handle custom range apply
  const handleApplyCustom = () => {
    if (tempRange.from && tempRange.to) {
      onChange({
        startDate: tempRange.from,
        endDate: tempRange.to,
        preset: "custom",
        compareToLastPeriod: value.compareToLastPeriod,
      });
      setOpen(false);
    }
  };

  // Handle compare toggle
  const handleCompareToggle = (checked: boolean) => {
    onChange({
      ...value,
      compareToLastPeriod: checked,
    });
  };

  // Format display label
  const getDisplayLabel = () => {
    if (value.preset && value.preset !== "custom") {
      const preset = presets.find((p) => p.value === value.preset);
      return preset?.label || "Select date range";
    }

    return `${format(value.startDate, "MMM d, yyyy")} - ${format(value.endDate, "MMM d, yyyy")}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between min-w-[240px] font-normal",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {getDisplayLabel()}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r p-2 space-y-1">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={value.preset === preset.value ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => handlePresetSelect(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar or custom picker */}
          <div className="p-4">
            {showCustom ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Calendar
                    mode="range"
                    selected={{
                      from: tempRange.from,
                      to: tempRange.to,
                    }}
                    onSelect={(range) => {
                      setTempRange({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={2}
                    defaultMonth={tempRange.from}
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    {tempRange.from && tempRange.to ? (
                      <>
                        {format(tempRange.from, "MMM d, yyyy")} -{" "}
                        {format(tempRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      "Select a date range"
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleApplyCustom}
                    disabled={!tempRange.from || !tempRange.to}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-8">
                  <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Select a preset or choose custom range
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Compare to previous period toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="compare-period" className="text-sm font-medium">
              Compare to previous period
            </Label>
            <p className="text-xs text-muted-foreground">
              Show trends vs. the equivalent previous time period
            </p>
          </div>
          <Switch
            id="compare-period"
            checked={value.compareToLastPeriod || false}
            onCheckedChange={handleCompareToggle}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
