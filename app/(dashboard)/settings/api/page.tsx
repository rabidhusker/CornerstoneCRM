"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ApiKeys } from "@/components/features/settings/api-keys";
import {
  ArrowLeft,
  Key,
  Webhook,
  BarChart3,
  Plus,
  Copy,
  MoreVertical,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import type { ApiKey, WebhookConfig, ApiUsageStats } from "@/types/integration";
import { webhookEvents } from "@/types/integration";

async function fetchApiData(): Promise<{
  apiKeys: ApiKey[];
  webhooks: WebhookConfig[];
  usage: ApiUsageStats;
}> {
  const res = await fetch("/api/v1/settings/api");
  if (!res.ok) {
    if (res.status === 404) {
      return {
        apiKeys: [],
        webhooks: [],
        usage: {
          period: "30d",
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          average_latency_ms: 0,
          requests_by_endpoint: {},
          requests_by_day: [],
        },
      };
    }
    throw new Error("Failed to fetch API data");
  }
  return res.json();
}

async function createWebhook(data: {
  url: string;
  events: string[];
}): Promise<WebhookConfig> {
  const res = await fetch("/api/v1/settings/webhooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create webhook");
  }
  return res.json();
}

async function deleteWebhook(webhookId: string): Promise<void> {
  const res = await fetch(`/api/v1/settings/webhooks/${webhookId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete webhook");
  }
}

async function testWebhook(webhookId: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/v1/settings/webhooks/${webhookId}/test`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Test failed");
  }
  return data;
}

export default function ApiSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("keys");
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(
    null
  );

  // Webhook form state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["api-settings"],
    queryFn: fetchApiData,
  });

  const createWebhookMutation = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-settings"] });
      toast({ title: "Webhook created" });
      setShowWebhookDialog(false);
      resetWebhookForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-settings"] });
      toast({ title: "Webhook deleted" });
      setShowDeleteDialog(false);
      setSelectedWebhook(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: testWebhook,
    onSuccess: (data) => {
      toast({
        title: data.success ? "Webhook test successful" : "Webhook test failed",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Webhook test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetWebhookForm = () => {
    setWebhookUrl("");
    setSelectedEvents([]);
  };

  const handleCreateWebhook = () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a webhook URL",
        variant: "destructive",
      });
      return;
    }
    if (selectedEvents.length === 0) {
      toast({
        title: "Events required",
        description: "Please select at least one event",
        variant: "destructive",
      });
      return;
    }

    createWebhookMutation.mutate({
      url: webhookUrl.trim(),
      events: selectedEvents,
    });
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const { apiKeys = [], webhooks = [], usage } = data || {};

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">API & Webhooks</h1>
          <p className="text-muted-foreground">
            Manage API keys and webhook integrations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="mt-6">
          <ApiKeys apiKeys={apiKeys} isLoading={isLoading} />
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>
                    Receive real-time notifications for CRM events
                  </CardDescription>
                </div>
                <Button onClick={() => setShowWebhookDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Webhook className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No webhooks</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Create a webhook to receive real-time event notifications
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowWebhookDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first webhook
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>
                          <code className="text-sm">{webhook.url}</code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.slice(0, 2).map((event) => (
                              <Badge
                                key={event}
                                variant="secondary"
                                className="text-xs"
                              >
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{webhook.events.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {webhook.last_triggered_at
                            ? new Date(
                                webhook.last_triggered_at
                              ).toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          {webhook.is_active ? (
                            webhook.failure_count > 0 ? (
                              <Badge variant="destructive">
                                {webhook.failure_count} failures
                              </Badge>
                            ) : (
                              <Badge
                                variant="default"
                                className="bg-green-600"
                              >
                                Active
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  testWebhookMutation.mutate(webhook.id)
                                }
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Test Webhook
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedWebhook(webhook);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Requests</CardDescription>
                <CardTitle className="text-3xl">
                  {usage?.total_requests.toLocaleString() || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Successful</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {usage?.successful_requests.toLocaleString() || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
                <CardTitle className="text-3xl text-destructive">
                  {usage?.failed_requests.toLocaleString() || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Latency</CardDescription>
                <CardTitle className="text-3xl">
                  {usage?.average_latency_ms || 0}ms
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Requests by Endpoint</CardTitle>
              <CardDescription>
                API usage breakdown by endpoint (last 30 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(usage?.requests_by_endpoint || {}).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No API requests in this period
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(usage?.requests_by_endpoint || {}).map(
                    ([endpoint, count]) => (
                      <div
                        key={endpoint}
                        className="flex items-center justify-between"
                      >
                        <code className="text-sm">{endpoint}</code>
                        <Badge variant="secondary">
                          {(count as number).toLocaleString()} requests
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Webhook Dialog */}
      <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Create a new webhook endpoint to receive event notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-server.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The URL where we&apos;ll send POST requests
              </p>
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-1 gap-2 rounded-md border p-4 max-h-60 overflow-y-auto">
                {webhookEvents.map((event) => (
                  <div
                    key={event.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={event.value}
                      checked={selectedEvents.includes(event.value)}
                      onCheckedChange={() => toggleEvent(event.value)}
                    />
                    <Label
                      htmlFor={event.value}
                      className="text-sm font-normal"
                    >
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowWebhookDialog(false);
                resetWebhookForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWebhook}
              disabled={createWebhookMutation.isPending}
            >
              {createWebhookMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Webhook Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this webhook. Event notifications
              will no longer be sent to this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                selectedWebhook &&
                deleteWebhookMutation.mutate(selectedWebhook.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWebhookMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
