"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Users,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { ConnectedIntegration } from "@/types/integration";

interface GoogleSettings {
  calendar_sync: boolean;
  calendar_id?: string;
  sync_direction: "one_way" | "two_way";
  gmail_tracking: boolean;
  contact_sync: boolean;
  sync_interval: number;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  primary: boolean;
}

async function fetchGoogleConnection(): Promise<{
  connection: ConnectedIntegration | null;
  settings: GoogleSettings;
  calendars: GoogleCalendar[];
}> {
  const res = await fetch("/api/v1/settings/integrations/google");
  if (!res.ok) {
    if (res.status === 404) {
      return {
        connection: null,
        settings: {
          calendar_sync: true,
          sync_direction: "two_way",
          gmail_tracking: true,
          contact_sync: false,
          sync_interval: 15,
        },
        calendars: [],
      };
    }
    throw new Error("Failed to fetch Google settings");
  }
  return res.json();
}

async function updateGoogleSettings(
  settings: Partial<GoogleSettings>
): Promise<void> {
  const res = await fetch("/api/v1/settings/integrations/google", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update settings");
  }
}

async function syncNow(): Promise<void> {
  const res = await fetch("/api/v1/settings/integrations/google/sync", {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to sync");
  }
}

async function disconnectGoogle(): Promise<void> {
  const res = await fetch("/api/v1/settings/integrations/google", {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to disconnect");
  }
}

export default function GoogleIntegrationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["integrations", "google"],
    queryFn: fetchGoogleConnection,
  });

  const updateMutation = useMutation({
    mutationFn: updateGoogleSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", "google"] });
      toast({ title: "Settings updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncNow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", "google"] });
      toast({ title: "Sync started" });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Google disconnected" });
      router.push("/settings/integrations");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disconnect",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof GoogleSettings, value: any) => {
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/integrations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { connection, settings, calendars } = data || {
    connection: null,
    settings: {
      calendar_sync: true,
      sync_direction: "two_way" as const,
      gmail_tracking: true,
      contact_sync: false,
      sync_interval: 15,
    },
    calendars: [],
  };

  const isConnected = connection?.status === "connected";

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/integrations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Google Integration</h1>
            <p className="text-muted-foreground">
              Connect Google Calendar and Gmail
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connect Google Account</CardTitle>
            <CardDescription>
              Link your Google account to sync calendars, track emails, and more
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Calendar Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Two-way sync between Google Calendar and CRM appointments
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Email Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    Track email opens and link emails to contacts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Contact Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep contacts in sync across both platforms
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/api/auth/google">
                Connect Google Account
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/integrations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Google Integration</h1>
            <p className="text-muted-foreground">
              Manage your Google Calendar and Gmail settings
            </p>
          </div>
        </div>
        <Badge variant="default" className="gap-1 bg-green-600">
          <Check className="h-3 w-3" />
          Connected
        </Badge>
      </div>

      {/* Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Your Google account is connected and syncing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Connected Email</p>
              <p className="font-medium">
                {connection.metadata?.email || "Google Account"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connected Since</p>
              <p className="font-medium">
                {new Date(connection.connected_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Sync</p>
              <p className="font-medium">
                {connection.last_sync_at
                  ? new Date(connection.last_sync_at).toLocaleString()
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sync Status</p>
              <div className="flex items-center gap-2">
                {connection.status === "error" ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">Error</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Active</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {connection.error_message && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {connection.error_message}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>
        </CardFooter>
      </Card>

      {/* Calendar Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Settings
          </CardTitle>
          <CardDescription>
            Configure how calendar events sync between Google and CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="calendar_sync">Enable Calendar Sync</Label>
              <p className="text-sm text-muted-foreground">
                Sync appointments between Google Calendar and CRM
              </p>
            </div>
            <Switch
              id="calendar_sync"
              checked={settings.calendar_sync}
              onCheckedChange={(checked) =>
                handleSettingChange("calendar_sync", checked)
              }
              disabled={updateMutation.isPending}
            />
          </div>

          {settings.calendar_sync && (
            <>
              <div className="space-y-2">
                <Label htmlFor="calendar_id">Sync Calendar</Label>
                <Select
                  value={settings.calendar_id || "primary"}
                  onValueChange={(value) =>
                    handleSettingChange("calendar_id", value)
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger id="calendar_id">
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary Calendar</SelectItem>
                    {calendars.map((cal) => (
                      <SelectItem key={cal.id} value={cal.id}>
                        {cal.summary}
                        {cal.primary && " (Primary)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync_direction">Sync Direction</Label>
                <Select
                  value={settings.sync_direction}
                  onValueChange={(value) =>
                    handleSettingChange("sync_direction", value)
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger id="sync_direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two_way">
                      Two-way sync (recommended)
                    </SelectItem>
                    <SelectItem value="one_way">
                      One-way (CRM to Google only)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync_interval">Sync Interval</Label>
                <Select
                  value={String(settings.sync_interval)}
                  onValueChange={(value) =>
                    handleSettingChange("sync_interval", parseInt(value))
                  }
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger id="sync_interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Every 5 minutes</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Gmail Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
          <CardDescription>
            Configure email tracking and integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gmail_tracking">Email Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track email opens and link emails to contacts
              </p>
            </div>
            <Switch
              id="gmail_tracking"
              checked={settings.gmail_tracking}
              onCheckedChange={(checked) =>
                handleSettingChange("gmail_tracking", checked)
              }
              disabled={updateMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contact Sync
          </CardTitle>
          <CardDescription>
            Keep contacts in sync with Google Contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="contact_sync">Enable Contact Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync contacts between Google and CRM
              </p>
            </div>
            <Switch
              id="contact_sync"
              checked={settings.contact_sync}
              onCheckedChange={(checked) =>
                handleSettingChange("contact_sync", checked)
              }
              disabled={updateMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Disconnect */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Disconnect your Google account from this CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Disconnecting will stop all syncing between Google and CRM. Your
            existing data will be preserved, but automatic updates will stop.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={() => setShowDisconnectDialog(true)}
          >
            Disconnect Google
          </Button>
        </CardFooter>
      </Card>

      {/* Disconnect Dialog */}
      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect your Google account and stop all calendar and
              email syncing. Any data already synced will remain in the CRM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => disconnectMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
