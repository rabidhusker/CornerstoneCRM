"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ContactFilters, ContactType, ContactStatus } from "@/types/contact";
import { contactTypeConfig, contactStatusConfig } from "@/types/contact";

interface ContactFiltersProps {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
  className?: string;
}

const contactTypes: ContactType[] = [
  "buyer",
  "seller",
  "both",
  "investor",
  "other",
];

const contactStatuses: ContactStatus[] = [
  "active",
  "inactive",
  "archived",
];

export function ContactFilters({
  filters,
  onFiltersChange,
  className,
}: ContactFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.type?.length) count++;
    if (filters.status?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.assignedTo?.length) count++;
    if (filters.dateRange) count++;
    return count;
  }, [filters]);

  const handleTypeChange = (type: ContactType, checked: boolean) => {
    const current = filters.type || [];
    const updated = checked
      ? [...current, type]
      : current.filter((t) => t !== type);

    onFiltersChange({
      ...filters,
      type: updated.length > 0 ? updated : undefined,
    });
  };

  const handleStatusChange = (status: ContactStatus, checked: boolean) => {
    const current = filters.status || [];
    const updated = checked
      ? [...current, status]
      : current.filter((s) => s !== status);

    onFiltersChange({
      ...filters,
      status: updated.length > 0 ? updated : undefined,
    });
  };

  const handleDateRangeChange = (
    type: "from" | "to",
    date: Date | undefined
  ) => {
    if (!date) {
      onFiltersChange({ ...filters, dateRange: undefined });
      return;
    }

    const currentRange = filters.dateRange || {
      from: new Date(),
      to: new Date(),
    };

    onFiltersChange({
      ...filters,
      dateRange: {
        ...currentRange,
        [type]: date,
      },
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search, // Keep search
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>

            <Separator />

            {/* Contact Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contact Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {contactTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.type?.includes(type) || false}
                      onCheckedChange={(checked) =>
                        handleTypeChange(type, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`type-${type}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {contactTypeConfig[type].label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Contact Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {contactStatuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status?.includes(status) || false}
                      onCheckedChange={(checked) =>
                        handleStatusChange(status, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {contactStatusConfig[status].label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Added</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange?.from ? (
                        format(filters.dateRange.from, "MMM d, yyyy")
                      ) : (
                        <span>From</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.from}
                      onSelect={(date) => handleDateRangeChange("from", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateRange?.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange?.to ? (
                        format(filters.dateRange.to, "MMM d, yyyy")
                      ) : (
                        <span>To</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.to}
                      onSelect={(date) => handleDateRangeChange("to", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {filters.type?.map((type) => (
        <Badge
          key={type}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {contactTypeConfig[type].label}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 px-1 hover:bg-transparent"
            onClick={() => handleTypeChange(type, false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      {filters.status?.map((status) => (
        <Badge
          key={status}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {contactStatusConfig[status].label}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 px-1 hover:bg-transparent"
            onClick={() => handleStatusChange(status, false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      {filters.dateRange && (
        <Badge variant="secondary" className="gap-1 pr-1">
          {format(filters.dateRange.from, "MMM d")} -{" "}
          {format(filters.dateRange.to, "MMM d")}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 px-1 hover:bg-transparent"
            onClick={() => onFiltersChange({ ...filters, dateRange: undefined })}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
}

// Quick filter buttons for contact types
interface QuickFiltersProps {
  activeType?: ContactType;
  onTypeChange: (type?: ContactType) => void;
}

export function QuickFilters({ activeType, onTypeChange }: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <Button
        variant={!activeType ? "default" : "outline"}
        size="sm"
        onClick={() => onTypeChange(undefined)}
      >
        All
      </Button>
      {contactTypes.map((type) => (
        <Button
          key={type}
          variant={activeType === type ? "default" : "outline"}
          size="sm"
          onClick={() => onTypeChange(type)}
        >
          {contactTypeConfig[type].label}
        </Button>
      ))}
    </div>
  );
}
