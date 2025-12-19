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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  MessageSquare,
  Phone,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  TestTube,
} from "lucide-react";
import type { ConnectedIntegration } from "@/types/integration";

interface TwilioConfig {
  account_sid: string;
  auth_token: string;
  phone_number: string;
  messaging_service_sid?: string;
  sms_enabled: boolean;
  voice_enabled: boolean;
  whatsapp_enabled: boolean;
}

async function fetchTwilioConnection(): Promise<{
  connection: ConnectedIntegration | null;
  config: TwilioConfig;
}> {
  const res = await fetch("/api/v1/settings/integrations/twilio");
  if (!res.ok) {
    if (res.status === 404) {
      return {
        connection: null,
        config: {
          account_sid: "",
          auth_token: "",
          phone_number: "",
          sms_enabled: true,
          voice_enabled: false,
          whatsapp_enabled: false,
        },
      };
    }
    throw new Error("Failed to fetch Twilio settings");
  }
  return res.json();
}

async function saveTwilioConfig(config: TwilioConfig): Promise<void> {
  const res = await fetch("/api/v1/settings/integrations/twilio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to save settings");
  }
}

async function testTwilioConnection(): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/v1/settings/integrations/twilio/test", {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Test failed");
  }
  return data;
}

async function disconnectTwilio(): Promise<void> {
  const res = await fetch("/api/v1/settings/integrations/twilio", {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to disconnect");
  }
}

export default function TwilioSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [formData, setFormData] = useState<TwilioConfig>({
    account_sid: "",
    auth_token: "",
    phone_number: "",
    sms_enabled: true,
    voice_enabled: false,
    whatsapp_enabled: false,
  });
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "twilio"],
    queryFn: fetchTwilioConnection,
  });

  // Update form data when query data loads
  const connection = data?.connection;
  const initialConfig = data?.config;

  // Sync form data with fetched data
  if (initialConfig && !isDirty && formData.account_sid !== initialConfig.account_sid) {
    setFormData(initialConfig);
  }

  const saveMutation = useMutation({
    mutationFn: saveTwilioConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", "twilio"] });
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Twilio settings saved" });
      setIsDirty(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: testTwilioConnection,
    onSuccess: (data) => {
      toast({
        title: data.success ? "Connection successful" : "Connection failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectTwilio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Twilio disconnected" });
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

  const handleChange = (field: keyof TwilioConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!formData.account_sid || !formData.auth_token || !formData.phone_number) {
      toast({
        title: "Missing required fields",
        description: "Please fill in Account SID, Auth Token, and Phone Number",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConnected = connection?.status === "connected";

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
            <h1 className="text-2xl font-bold">Twilio Integration</h1>
            <p className="text-muted-foreground">
              Configure SMS and voice calling
            </p>
          </div>
        </div>
        {isConnected && (
          <Badge variant="default" className="gap-1 bg-green-600">
            <Check className="h-3 w-3" />
            Connected
          </Badge>
        )}
      </div>

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Enter your Twilio account credentials. Find them in your{" "}
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Twilio Console
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_sid">Account SID *</Label>
            <Input
              id="account_sid"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.account_sid}
              onChange={(e) => handleChange("account_sid", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth_token">Auth Token *</Label>
            <div className="relative">
              <Input
                id="auth_token"
                type={showAuthToken ? "text" : "password"}
                placeholder="Your Twilio auth token"
                value={formData.auth_token}
                onChange={(e) => handleChange("auth_token", e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowAuthToken(!showAuthToken)}
              >
                {showAuthToken ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Twilio Phone Number *</Label>
            <Input
              id="phone_number"
              placeholder="+1234567890"
              value={formData.phone_number}
              onChange={(e) => handleChange("phone_number", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your Twilio phone number for sending messages and making calls
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="messaging_service_sid">
              Messaging Service SID (Optional)
            </Label>
            <Input
              id="messaging_service_sid"
              placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={formData.messaging_service_sid || ""}
              onChange={(e) =>
                handleChange("messaging_service_sid", e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Optional: Use a Messaging Service for better deliverability
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !isDirty}
          >
            {saveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Credentials
          </Button>
          {isConnected && (
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Enable or disable Twilio features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="sms_enabled">SMS Messaging</Label>
                <p className="text-sm text-muted-foreground">
                  Send and receive SMS messages to contacts
                </p>
              </div>
            </div>
            <Switch
              id="sms_enabled"
              checked={formData.sms_enabled}
              onCheckedChange={(checked) => handleChange("sms_enabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="voice_enabled">Voice Calls</Label>
                <p className="text-sm text-muted-foreground">
                  Make and receive voice calls from the CRM
                </p>
              </div>
            </div>
            <Switch
              id="voice_enabled"
              checked={formData.voice_enabled}
              onCheckedChange={(checked) =>
                handleChange("voice_enabled", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="whatsapp_enabled">WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Send WhatsApp messages through Twilio
                </p>
              </div>
            </div>
            <Switch
              id="whatsapp_enabled"
              checked={formData.whatsapp_enabled}
              onCheckedChange={(checked) =>
                handleChange("whatsapp_enabled", checked)
              }
            />
          </div>
        </CardContent>
        {isDirty && (
          <CardFooter>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Status */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  {connection.status === "error" ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">Error</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Connected</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected Since</p>
                <p className="font-medium">
                  {new Date(connection.connected_at).toLocaleDateString()}
                </p>
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
        </Card>
      )}

      {/* Disconnect */}
      {isConnected && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Disconnect Twilio from your CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Disconnecting will stop all SMS and voice functionality. Message
              history will be preserved.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={() => setShowDisconnectDialog(true)}
            >
              Disconnect Twilio
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Disconnect Dialog */}
      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Twilio?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable SMS and voice calling. Your message history will
              be preserved but you won&apos;t be able to send new messages until you
              reconnect.
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
