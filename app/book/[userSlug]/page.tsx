import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { BookingPage, BookingAppointmentType } from "@/types/booking";
import { locationTypeLabels } from "@/types/booking";
import type { BrandingSettings } from "@/types/branding";
import { defaultBranding } from "@/types/branding";
import { Calendar, Clock, Video, Phone, MapPin, Globe, ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ userSlug: string }>;
}

// Fetch organization branding
async function getOrgBranding(workspaceId: string): Promise<BrandingSettings | null> {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("crm_branding_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();
  return data as BrandingSettings | null;
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userSlug } = await params;
  const supabase = await createClient();

  const { data: bookingPage } = await (supabase as any)
    .from("crm_booking_pages")
    .select("name, description, workspace_id")
    .eq("slug", userSlug)
    .eq("is_active", true)
    .single();

  if (!bookingPage) {
    return { title: "Booking Page Not Found" };
  }

  // Get organization branding for favicon
  let favicon: string | undefined;
  if (bookingPage.workspace_id) {
    const branding = await getOrgBranding(bookingPage.workspace_id);
    if (branding?.favicon_url) {
      favicon = branding.favicon_url;
    }
  }

  return {
    title: `Book with ${bookingPage.name}`,
    description: bookingPage.description || `Schedule an appointment with ${bookingPage.name}`,
    icons: favicon ? { icon: favicon } : undefined,
  };
}

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

export default async function PublicBookingPage({ params }: PageProps) {
  const { userSlug } = await params;
  const supabase = await createClient();

  // Fetch booking page
  const { data: bookingPageData, error } = await (supabase as any)
    .from("crm_booking_pages")
    .select(`
      *,
      user:user_id(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("slug", userSlug)
    .eq("is_active", true)
    .single();

  if (error || !bookingPageData) {
    notFound();
  }

  const bookingPage = bookingPageData as BookingPage & {
    user: { id: string; full_name: string | null; avatar_url: string | null };
  };

  // Get active appointment types
  const activeTypes = bookingPage.appointment_types.filter((t) => t.is_active);

  // Get organization branding
  let orgBranding: BrandingSettings | null = null;
  if (bookingPage.workspace_id) {
    orgBranding = await getOrgBranding(bookingPage.workspace_id);
  }

  if (activeTypes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">No Appointments Available</h1>
          <p className="text-gray-600 mt-2">
            There are currently no appointment types available for booking.
          </p>
        </div>
      </div>
    );
  }

  // Merge organization branding with page-level branding (page overrides org)
  const pageBranding = bookingPage.branding || {};
  const primaryColor = pageBranding.primary_color || orgBranding?.primary_color || defaultBranding.primary_color;
  const bgColor = pageBranding.background_color || orgBranding?.background_color || "#f9fafb";
  const logoUrl = orgBranding?.logo_light_url;
  const showPoweredBy = pageBranding.show_powered_by !== false && orgBranding?.show_powered_by !== false;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Organization Logo Header */}
      {logoUrl && (
        <div className="bg-white border-b py-4">
          <div className="max-w-4xl mx-auto px-4">
            <img
              src={logoUrl}
              alt={orgBranding?.organization_name || "Organization"}
              className="h-8 max-w-[180px] object-contain"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {bookingPage.user.avatar_url ? (
              <img
                src={bookingPage.user.avatar_url}
                alt={bookingPage.user.full_name || ""}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                {bookingPage.user.full_name?.[0] || "U"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {bookingPage.name}
              </h1>
              {bookingPage.user.full_name && (
                <p className="text-gray-600">{bookingPage.user.full_name}</p>
              )}
            </div>
          </div>

          {bookingPage.description && (
            <p className="text-gray-600 mt-4 max-w-2xl">
              {bookingPage.description}
            </p>
          )}
        </div>
      </div>

      {/* Appointment Types */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select an appointment type
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {activeTypes.map((type) => (
            <Link
              key={type.id}
              href={`/book/${userSlug}/${type.slug}`}
              className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                  </div>

                  {type.description && (
                    <p className="text-gray-600 text-sm mt-2">
                      {type.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {type.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <LocationIcon type={type.location_type} />
                      {locationTypeLabels[type.location_type]}
                    </span>
                  </div>
                </div>

                <ArrowRight
                  className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                  style={{ color: primaryColor }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      {showPoweredBy && (
        <div className="text-center py-8 text-sm text-gray-500">
          Powered by{" "}
          <a href="/" className="font-medium hover:underline">
            Cornerstone CRM
          </a>
        </div>
      )}
    </div>
  );
}
