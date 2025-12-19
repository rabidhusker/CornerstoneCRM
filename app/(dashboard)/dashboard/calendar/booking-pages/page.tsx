"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { BookingPageSettings } from "@/components/features/calendar/booking-page-settings";
import type { BookingPage, BookingAppointmentType } from "@/types/booking";
import {
  Plus,
  Calendar,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  MoreVertical,
  Settings,
  Trash2,
  Clock,
  Users,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BookingPagesPage() {
  const [bookingPages, setBookingPages] = useState<BookingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [editingPage, setEditingPage] = useState<BookingPage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Fetch booking pages
  useEffect(() => {
    fetchBookingPages();
  }, []);

  const fetchBookingPages = async () => {
    try {
      const response = await fetch("/api/v1/booking-pages");
      if (response.ok) {
        const data = await response.json();
        setBookingPages(data.bookingPages || []);
      }
    } catch (error) {
      console.error("Failed to fetch booking pages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle active status
  const toggleActive = async (page: BookingPage) => {
    try {
      const response = await fetch(`/api/v1/booking-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !page.is_active }),
      });

      if (response.ok) {
        setBookingPages((prev) =>
          prev.map((p) =>
            p.id === page.id ? { ...p, is_active: !p.is_active } : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  // Delete booking page
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/v1/booking-pages/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBookingPages((prev) => prev.filter((p) => p.id !== deleteId));
      }
    } catch (error) {
      console.error("Failed to delete booking page:", error);
    } finally {
      setDeleteId(null);
    }
  };

  // Copy URL to clipboard
  const copyUrl = async (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedUrl(slug);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Get active appointment types count
  const getActiveTypesCount = (types: BookingAppointmentType[]) => {
    return types.filter((t) => t.is_active).length;
  };

  // Handle settings close
  const handleSettingsClose = () => {
    setShowSettings(false);
    setEditingPage(null);
    fetchBookingPages();
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Booking Pages</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your public booking pages
          </p>
        </div>
        <Button onClick={() => setShowSettings(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Booking Page
        </Button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookingPages.length === 0 ? (
        // Empty state
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No booking pages yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Create a booking page to allow clients and prospects to schedule
              appointments with you directly.
            </p>
            <Button onClick={() => setShowSettings(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Booking Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Booking pages grid
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookingPages.map((page) => (
            <Card key={page.id} className={cn(!page.is_active && "opacity-60")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{page.name}</CardTitle>
                    <CardDescription className="truncate mt-1">
                      {page.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingPage(page);
                          setShowSettings(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyUrl(page.slug)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={`/book/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(page.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status and toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={page.is_active ? "default" : "secondary"}>
                      {page.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Switch
                    checked={page.is_active}
                    onCheckedChange={() => toggleActive(page)}
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {getActiveTypesCount(page.appointment_types)} appointment{" "}
                      {getActiveTypesCount(page.appointment_types) === 1
                        ? "type"
                        : "types"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{page.settings.booking_window} day window</span>
                  </div>
                </div>

                {/* URL */}
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">
                    /book/{page.slug}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => copyUrl(page.slug)}
                  >
                    {copiedUrl === page.slug ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                {/* Appointment types preview */}
                {page.appointment_types.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {page.appointment_types
                      .filter((t) => t.is_active)
                      .slice(0, 3)
                      .map((type) => (
                        <Badge
                          key={type.id}
                          variant="outline"
                          style={{ borderColor: type.color }}
                        >
                          {type.name}
                        </Badge>
                      ))}
                    {page.appointment_types.filter((t) => t.is_active).length > 3 && (
                      <Badge variant="outline">
                        +{page.appointment_types.filter((t) => t.is_active).length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Settings dialog */}
      <BookingPageSettings
        open={showSettings}
        onClose={handleSettingsClose}
        bookingPage={editingPage || undefined}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking page? This action
              cannot be undone and will remove the public booking link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
