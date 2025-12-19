"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppointmentForm } from "./appointment-form";
import {
  useCompleteAppointment,
  useCancelAppointment,
  useNoShowAppointment,
} from "@/lib/hooks/use-appointments";
import type { AppointmentWithDetails, AppointmentType } from "@/types/appointment";
import { appointmentTypeConfig, appointmentStatusConfig } from "@/types/appointment";
import { format, parseISO, differenceInMinutes } from "date-fns";
import {
  Clock,
  MapPin,
  User,
  Calendar,
  Home,
  ExternalLink,
  Phone,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  UserX,
  Video,
  Link as LinkIcon,
  Loader2,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentDetailSheetProps {
  appointment: AppointmentWithDetails | null;
  onClose: () => void;
}

export function AppointmentDetailSheet({
  appointment,
  onClose,
}: AppointmentDetailSheetProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const completeMutation = useCompleteAppointment();
  const cancelMutation = useCancelAppointment();
  const noShowMutation = useNoShowAppointment();

  if (!appointment) {
    return null;
  }

  const type = (appointment.showing_type || "meeting") as AppointmentType;
  const typeConfig = appointmentTypeConfig[type] || appointmentTypeConfig.other;
  const statusConfig = appointmentStatusConfig[appointment.status];

  const startTime = parseISO(appointment.start_time);
  const endTime = parseISO(appointment.end_time);
  const durationMinutes = differenceInMinutes(endTime, startTime);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(appointment.id);
      onClose();
    } catch (error) {
      console.error("Failed to complete appointment:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(appointment.id);
      setShowCancelDialog(false);
      onClose();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };

  const handleNoShow = async () => {
    try {
      await noShowMutation.mutateAsync(appointment.id);
      onClose();
    } catch (error) {
      console.error("Failed to mark as no-show:", error);
    }
  };

  const isLoading =
    completeMutation.isPending ||
    cancelMutation.isPending ||
    noShowMutation.isPending;

  // Check if this looks like a meeting link
  const hasMeetingLink =
    appointment.location?.includes("zoom.") ||
    appointment.location?.includes("meet.google") ||
    appointment.location?.includes("teams.microsoft");

  return (
    <>
      <Sheet open={!!appointment} onOpenChange={() => onClose()}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", typeConfig.bgColor)}>
                  <Calendar className={cn("h-5 w-5", typeConfig.color)} />
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className={cn(typeConfig.color, typeConfig.bgColor)}
                  >
                    {typeConfig.label}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {appointment.status === "scheduled" && (
                    <>
                      <DropdownMenuItem onClick={handleComplete}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleNoShow}>
                        <UserX className="h-4 w-4 mr-2" />
                        Mark No-Show
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setShowCancelDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel Appointment
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <SheetTitle className="text-left text-xl mt-4">
              {appointment.title}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Status */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                statusConfig.bgColor,
                statusConfig.color
              )}
            >
              {appointment.status === "completed" && <CheckCircle className="h-4 w-4" />}
              {appointment.status === "cancelled" && <XCircle className="h-4 w-4" />}
              {appointment.status === "no_show" && <UserX className="h-4 w-4" />}
              {statusConfig.label}
            </div>

            {/* Date and time */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {format(startTime, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Duration: {formatDuration(durationMinutes)}
                </span>
              </div>
            </div>

            <Separator />

            {/* Location / Meeting Link */}
            {appointment.location && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {hasMeetingLink ? (
                    <Video className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    {hasMeetingLink ? (
                      <a
                        href={appointment.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Join Meeting
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-sm">{appointment.location}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {appointment.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {appointment.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Contact */}
            {appointment.contact && (
              <div>
                <h4 className="text-sm font-medium mb-3">Contact</h4>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar>
                    <AvatarFallback>
                      {appointment.contact.first_name[0]}
                      {appointment.contact.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/contacts/${appointment.contact.id}`}
                      className="font-medium hover:underline"
                    >
                      {appointment.contact.first_name} {appointment.contact.last_name}
                    </Link>
                    {appointment.contact.email && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {appointment.contact.email}
                      </div>
                    )}
                    {appointment.contact.phone && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {appointment.contact.phone}
                      </div>
                    )}
                  </div>
                  <Link href={`/dashboard/contacts/${appointment.contact.id}`}>
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Deal */}
            {appointment.deal && (
              <div>
                <h4 className="text-sm font-medium mb-3">Related Deal</h4>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/pipelines?deal=${appointment.deal.id}`}
                      className="font-medium hover:underline"
                    >
                      {appointment.deal.title}
                    </Link>
                    {appointment.deal.value && (
                      <div className="text-sm text-muted-foreground">
                        ${appointment.deal.value.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assigned user */}
            {appointment.user && (
              <div>
                <h4 className="text-sm font-medium mb-3">Assigned To</h4>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={appointment.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {appointment.user.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{appointment.user.full_name || "Unknown"}</span>
                </div>
              </div>
            )}

            {/* Reminders */}
            {appointment.reminder_minutes && appointment.reminder_minutes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Reminders
                </h4>
                <div className="flex flex-wrap gap-2">
                  {appointment.reminder_minutes.map((minutes) => (
                    <Badge key={minutes} variant="secondary">
                      {minutes === 0
                        ? "At time of event"
                        : minutes < 60
                        ? `${minutes}m before`
                        : minutes < 1440
                        ? `${Math.floor(minutes / 60)}h before`
                        : `${Math.floor(minutes / 1440)}d before`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            {appointment.status === "scheduled" && (
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleComplete}
                  disabled={isLoading}
                >
                  {completeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Mark Complete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditForm(true)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit form */}
      <AppointmentForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        appointment={appointment}
      />

      {/* Cancel confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
