"use client";

import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Mail,
  Check,
  Loader2,
  Eye,
  EyeOff,
  TestTube,
  Send,
} from "lucide-react";
import type { ConnectedIntegration, IntegrationProvider } from "@/types/integration";

type EmailProvider = "resend" | "sendgrid";

interface EmailConfig {
  provider: EmailProvider;
  api_key: string;
  from_email: string;
  from_name: string;
  reply_to?: string;
}

async function fetchEmailConnection(): Promise<{
  connection: ConnectedIntegration | null;
  config: EmailConfig;
}> {
  const res = await fetch("/api/v1/settings/integrations/email");
  if (!res.ok) {
    if (res.status === 404) {
      return {
        connection: null,
        config: {
          provider: "resend",
          api_key: "",
          from_email: "",
          from_name: "",
        },
      };
    }
    throw new Error("Failed to fetch email settings");
  }
  return res.json();
}

async function saveEmailConfig(config: EmailConfig): Promise<void> {
  const res = await fetch("/api/v1/settings/integrations/email", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to save settings");
  }
}

async function testEmailConnection(): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/v1/settings/integrations/email/test", {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Test failed");
  }
  return data;
}

async function sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/v1/settings/integrations/email/test-send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to send test email");
  }
  return data;
}

async function disconnectEmail(): Promise<void> {
  const res = await fetch("/api/v1/settings/integrations/email", {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to disconnect");
  }
}

export default function EmailSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [formData, setFormData] = useState<EmailConfig>({
    provider: "resend",
    api_key: "",
    from_email: "",
    from_name: "",
  });
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "email"],
    queryFn: fetchEmailConnection,
  });

  const connection = data?.connection;
  const initialConfig = data?.config;

  // Sync form data with fetched data
  useEffect(() => {
    if (initialConfig && !isDirty) {
      setFormData(initialConfig);
    }
  }, [initialConfig, isDirty]);

  const saveMutation = useMutation({
    mutationFn: saveEmailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", "email"] });
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Email settings saved" });
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
    mutationFn: testEmailConnection,
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

  const sendTestMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (data) => {
      toast({
        title: data.success ? "Test email sent" : "Failed to send",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Email provider disconnected" });
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

  const handleChange = (field: keyof EmailConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!formData.api_key || !formData.from_email) {
      toast({
        title: "Missing required fields",
        description: "Please fill in API Key and From Email",
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
            <h1 className="text-2xl font-bold">Email Provider</h1>
            <p className="text-muted-foreground">
              Configure transactional email delivery
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

      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Email Provider</CardTitle>
          <CardDescription>
            Choose your email delivery provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={formData.provider}
            onValueChange={(value) => handleChange("provider", value as EmailProvider)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <RadioGroupItem
                value="resend"
                id="resend"
                className="peer sr-only"
              />
              <Label
                htmlFor="resend"
                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Resend</p>
                  <p className="text-xs text-muted-foreground">
                    Modern email API
                  </p>
                </div>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="sendgrid"
                id="sendgrid"
                className="peer sr-only"
              />
              <Label
                htmlFor="sendgrid"
                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium">SendGrid</p>
                  <p className="text-xs text-muted-foreground">
                    Enterprise email delivery
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            {formData.provider === "resend" ? (
              <>
                Get your API key from the{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Resend Dashboard
                </a>
              </>
            ) : (
              <>
                Get your API key from{" "}
                <a
                  href="https://app.sendgrid.com/settings/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SendGrid Settings
                </a>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key *</Label>
            <div className="relative">
              <Input
                id="api_key"
                type={showApiKey ? "text" : "password"}
                placeholder={
                  formData.provider === "resend"
                    ? "re_xxxxxxxxxxxx"
                    : "SG.xxxxxxxxxxxx"
                }
                value={formData.api_key}
                onChange={(e) => handleChange("api_key", e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from_email">From Email *</Label>
            <Input
              id="from_email"
              type="email"
              placeholder="noreply@yourdomain.com"
              value={formData.from_email}
              onChange={(e) => handleChange("from_email", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must be a verified domain in your email provider
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from_name">From Name</Label>
            <Input
              id="from_name"
              placeholder="Your Company Name"
              value={formData.from_name}
              onChange={(e) => handleChange("from_name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply_to">Reply-To Email (Optional)</Label>
            <Input
              id="reply_to"
              type="email"
              placeholder="support@yourdomain.com"
              value={formData.reply_to || ""}
              onChange={(e) => handleChange("reply_to", e.target.value)}
            />
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
            Save Settings
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

      {/* Test Email */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Send a test email to verify your configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="max-w-sm"
              />
              <Button
                variant="outline"
                onClick={() => sendTestMutation.mutate(testEmailAddress)}
                disabled={sendTestMutation.isPending || !testEmailAddress}
              >
                {sendTestMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-medium capitalize">{connection.provider}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Connected</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected Since</p>
                <p className="font-medium">
                  {new Date(connection.connected_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disconnect */}
      {isConnected && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Disconnect email provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Disconnecting will stop all email sending from the CRM. This
              includes transactional emails, campaigns, and notifications.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="destructive"
              onClick={() => setShowDisconnectDialog(true)}
            >
              Disconnect Email Provider
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
            <AlertDialogTitle>Disconnect Email Provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop all email sending from the CRM. Scheduled campaigns
              will fail to send. Are you sure you want to continue?
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
