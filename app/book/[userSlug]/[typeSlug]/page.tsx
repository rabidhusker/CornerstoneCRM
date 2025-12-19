"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicBookingCalendar } from "@/components/features/calendar/public-booking-calendar";
import { BookingForm } from "@/components/features/calendar/booking-form";
import type { BookingPage, BookingAppointmentType, AvailableSlot } from "@/types/booking";
import { locationTypeLabels, generateCalendarLinks, generateConfirmationCode } from "@/types/booking";
import { format, parseISO, addMinutes } from "date-fns";
import {
  ArrowLeft,
  Clock,
  Video,
  Phone,
  MapPin,
  Globe,
  Calendar,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Get location icon
function LocationIcon({ type }: { type: BookingAppointmentType["location_type"] }) {
  switch (type) {
    case "video":
      return <Video className="h-4 w-4" />;
    case "phone":
      return <Phone className="h-4 w-4" />;
    case "in_person":
      return <MapPin className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

// Booking stages
type BookingStage = "calendar" | "time" | "form" | "confirmation";

interface BookingConfirmation {
  appointmentId: string;
  confirmationCode: string;
  startTime: Date;
  endTime: Date;
  calendarLinks: {
    google: string;
    outlook: string;
    ical: string;
  };
}

export default function TypeBookingPage() {
  const params = useParams();
  const router = useRouter();
  const userSlug = params.userSlug as string;
  const typeSlug = params.typeSlug as string;

  const [loading, setLoading] = useState(true);
  const [bookingPage, setBookingPage] = useState<BookingPage | null>(null);
  const [appointmentType, setAppointmentType] = useState<BookingAppointmentType | null>(null);
  const [stage, setStage] = useState<BookingStage>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // Fetch booking page data
  useEffect(() => {
    fetchBookingPage();
  }, [userSlug, typeSlug]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && bookingPage && appointmentType) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, bookingPage, appointmentType]);

  const fetchBookingPage = async () => {
    try {
      const response = await fetch(`/api/v1/booking-pages/public/${userSlug}`);
      if (!response.ok) {
        router.push("/404");
        return;
      }

      const data = await response.json();
      setBookingPage(data.bookingPage);

      // Find the appointment type
      const type = data.bookingPage.appointment_types.find(
        (t: BookingAppointmentType) => t.slug === typeSlug && t.is_active
      );

      if (!type) {
        router.push(`/book/${userSlug}`);
        return;
      }

      setAppointmentType(type);
    } catch (error) {
      console.error("Failed to fetch booking page:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: Date) => {
    if (!bookingPage || !appointmentType) return;

    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/v1/appointments/availability?` +
          `bookingPageId=${bookingPage.id}&` +
          `appointmentTypeId=${appointmentType.id}&` +
          `date=${format(date, "yyyy-MM-dd")}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStage("time");
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setStage("form");
  };

  const handleBooking = async (formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
  }) => {
    if (!bookingPage || !appointmentType || !selectedSlot) return;

    setBooking(true);
    try {
      const response = await fetch("/api/v1/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_page_id: bookingPage.id,
          appointment_type_id: appointmentType.id,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          contact: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book appointment");
      }

      const data = await response.json();
      const startTime = parseISO(selectedSlot.start);
      const endTime = parseISO(selectedSlot.end);

      // Generate calendar links
      const calendarLinks = generateCalendarLinks(
        appointmentType.name,
        `Appointment with ${bookingPage.name}`,
        appointmentType.location || locationTypeLabels[appointmentType.location_type],
        startTime,
        endTime
      );

      setConfirmation({
        appointmentId: data.appointment.id,
        confirmationCode: data.confirmationCode,
        startTime,
        endTime,
        calendarLinks,
      });
      setStage("confirmation");
    } catch (error) {
      console.error("Failed to book:", error);
      alert(error instanceof Error ? error.message : "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!bookingPage || !appointmentType) {
    return null;
  }

  const branding = bookingPage.branding || {};
  const primaryColor = branding.primary_color || "#3b82f6";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={stage === "calendar" ? `/book/${userSlug}` : "#"}
              onClick={(e) => {
                if (stage !== "calendar") {
                  e.preventDefault();
                  if (stage === "time") setStage("calendar");
                  else if (stage === "form") setStage("time");
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="font-semibold text-gray-900">{appointmentType.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {appointmentType.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <LocationIcon type={appointmentType.location_type} />
                  {locationTypeLabels[appointmentType.location_type]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Confirmation stage */}
        {stage === "confirmation" && confirmation && (
          <div className="max-w-md mx-auto bg-white rounded-lg border p-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              You're booked!
            </h2>
            <p className="text-gray-600 mb-6">
              {bookingPage.settings.confirmation_message ||
                "Your appointment has been confirmed. You'll receive a confirmation email shortly."}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="font-medium">
                  {format(confirmation.startTime, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5 text-gray-400" />
                <span>
                  {format(confirmation.startTime, "h:mm a")} -{" "}
                  {format(confirmation.endTime, "h:mm a")}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Confirmation code: <span className="font-mono">{confirmation.confirmationCode}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-2">Add to calendar:</p>
              <div className="flex justify-center gap-2">
                <a
                  href={confirmation.calendarLinks.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Google
                </a>
                <a
                  href={confirmation.calendarLinks.outlook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Outlook
                </a>
                <a
                  href={confirmation.calendarLinks.ical}
                  download="appointment.ics"
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  iCal
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Calendar and time selection */}
        {(stage === "calendar" || stage === "time") && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Calendar */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">Select a date</h2>
              <PublicBookingCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                bookingWindow={bookingPage.settings.booking_window}
                availability={appointmentType.custom_availability || bookingPage.availability}
                primaryColor={primaryColor}
              />
            </div>

            {/* Time slots */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">
                {selectedDate
                  ? format(selectedDate, "EEEE, MMMM d")
                  : "Select a time"}
              </h2>

              {!selectedDate ? (
                <div className="text-gray-500 text-sm">
                  Please select a date to see available times
                </div>
              ) : loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-gray-500 text-sm py-8 text-center">
                  No available times for this date
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {availableSlots
                    .filter((slot) => slot.available)
                    .map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => handleSlotSelect(slot)}
                        className={cn(
                          "px-4 py-3 border rounded-lg text-sm font-medium transition-colors",
                          selectedSlot?.start === slot.start
                            ? "border-2"
                            : "hover:border-gray-300"
                        )}
                        style={{
                          borderColor:
                            selectedSlot?.start === slot.start ? primaryColor : undefined,
                          backgroundColor:
                            selectedSlot?.start === slot.start ? `${primaryColor}10` : undefined,
                        }}
                      >
                        {format(parseISO(slot.start), "h:mm a")}
                      </button>
                    ))}
                </div>
              )}

              {selectedSlot && (
                <Button
                  className="w-full mt-4"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setStage("form")}
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Booking form */}
        {stage === "form" && selectedSlot && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h3 className="font-semibold mb-4">Appointment Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(selectedSlot.start), "EEEE, MMMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {format(parseISO(selectedSlot.start), "h:mm a")} -{" "}
                  {format(parseISO(selectedSlot.end), "h:mm a")}
                </div>
                <div className="flex items-center gap-2">
                  <LocationIcon type={appointmentType.location_type} />
                  {locationTypeLabels[appointmentType.location_type]}
                </div>
              </div>
            </div>

            <BookingForm
              onSubmit={handleBooking}
              isLoading={booking}
              requirePhone={bookingPage.settings.require_phone}
              collectNotes={bookingPage.settings.collect_notes}
              primaryColor={primaryColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}
