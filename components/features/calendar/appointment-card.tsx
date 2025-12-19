"use client";

import { cn } from "@/lib/utils";
import type { AppointmentWithDetails, AppointmentType } from "@/types/appointment";
import { appointmentTypeConfig, appointmentStatusConfig } from "@/types/appointment";
import { format, parseISO } from "date-fns";
import {
  Phone,
  Video,
  MapPin,
  User,
  Clock,
  Home,
  Calendar,
  MessageSquare,
  FileCheck,
  HelpCircle,
} from "lucide-react";

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  variant?: "compact" | "time-block" | "detailed" | "agenda";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// Get icon for appointment type
function getTypeIcon(type: AppointmentType | string) {
  switch (type) {
    case "call":
      return Phone;
    case "meeting":
      return Video;
    case "showing":
      return Home;
    case "follow_up":
      return MessageSquare;
    case "consultation":
      return Calendar;
    case "closing":
      return FileCheck;
    default:
      return HelpCircle;
  }
}

export function AppointmentCard({
  appointment,
  variant = "compact",
  className,
  onClick,
}: AppointmentCardProps) {
  const type = (appointment.showing_type || "meeting") as AppointmentType;
  const typeConfig = appointmentTypeConfig[type] || appointmentTypeConfig.other;
  const statusConfig = appointmentStatusConfig[appointment.status];
  const TypeIcon = getTypeIcon(type);

  const startTime = parseISO(appointment.start_time);
  const endTime = parseISO(appointment.end_time);

  // Compact variant (for month view)
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors",
          typeConfig.bgColor,
          typeConfig.color,
          "hover:opacity-80",
          className
        )}
        onClick={onClick}
      >
        <span className="font-medium">{format(startTime, "h:mm a")}</span>
        {" "}
        <span className="truncate">{appointment.title}</span>
      </div>
    );
  }

  // Time block variant (for week/day view)
  if (variant === "time-block") {
    return (
      <div
        className={cn(
          "rounded-md p-2 cursor-pointer overflow-hidden border-l-4 transition-colors",
          typeConfig.bgColor,
          typeConfig.borderColor,
          "hover:opacity-90",
          className
        )}
        onClick={onClick}
      >
        <div className={cn("font-medium text-sm truncate", typeConfig.color)}>
          {appointment.title}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
        </div>
        {appointment.contact && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
            <User className="h-3 w-3" />
            {appointment.contact.first_name} {appointment.contact.last_name}
          </div>
        )}
      </div>
    );
  }

  // Detailed variant (for day view)
  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "rounded-lg p-3 cursor-pointer overflow-hidden border-l-4 transition-colors",
          typeConfig.bgColor,
          typeConfig.borderColor,
          "hover:opacity-90",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", typeConfig.bgColor)}>
            <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("font-semibold", typeConfig.color)}>
              {appointment.title}
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </div>
            {appointment.contact && (
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {appointment.contact.first_name} {appointment.contact.last_name}
              </div>
            )}
            {appointment.location && (
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{appointment.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Agenda variant
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-3 rounded-lg cursor-pointer transition-colors border",
        "hover:bg-muted/50",
        appointment.status === "cancelled" && "opacity-60",
        className
      )}
      onClick={onClick}
    >
      <div className={cn("p-2 rounded-lg shrink-0", typeConfig.bgColor)}>
        <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold">{appointment.title}</h4>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </div>
          </div>
          <div
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
              statusConfig.bgColor,
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {appointment.contact && (
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {appointment.contact.first_name} {appointment.contact.last_name}
              {appointment.contact.email && (
                <span className="text-xs">({appointment.contact.email})</span>
              )}
            </div>
          )}
          {appointment.location && (
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{appointment.location}</span>
            </div>
          )}
          {appointment.deal && (
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              {appointment.deal.title}
            </div>
          )}
        </div>

        {appointment.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {appointment.description}
          </p>
        )}
      </div>
    </div>
  );
}
