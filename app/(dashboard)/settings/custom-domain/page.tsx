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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Globe,
  Lock,
  Shield,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  AlertCircle,
  Trash2,
  Plus,
  ExternalLink,
} from "lucide-react";
import type { CustomDomainSettings, DnsRecord } from "@/types/branding";

async function fetchCustomDomain(): Promise<{
  domain: CustomDomainSettings | null;
  canEdit: boolean;
}> {
  const res = await fetch("/api/v1/settings/custom-domain");
  if (!res.ok) {
    if (res.status === 404) {
      return { domain: null, canEdit: true };
    }
    throw new Error("Failed to fetch custom domain");
  }
  return res.json();
}

async function addCustomDomain(domain: string): Promise<CustomDomainSettings> {
  const res = await fetch("/api/v1/settings/custom-domain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add domain");
  }
  return res.json();
}

async function verifyDomain(): Promise<CustomDomainSettings> {
  const res = await fetch("/api/v1/settings/custom-domain/verify", {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Verification failed");
  }
  return res.json();
}

async function removeDomain(): Promise<void> {
  const res = await fetch("/api/v1/settings/custom-domain", {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove domain");
  }
}

export default function CustomDomainPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["custom-domain"],
    queryFn: fetchCustomDomain,
  });

  const addMutation = useMutation({
    mutationFn: addCustomDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-domain"] });
      toast({ title: "Domain added successfully" });
      setShowAddDialog(false);
      setNewDomain("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add domain",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyDomain,
    onSuccess: (domain) => {
      queryClient.invalidateQueries({ queryKey: ["custom-domain"] });
      if (domain.status === "active") {
        toast({ title: "Domain verified and active" });
      } else {
        toast({
          title: "Verification in progress",
          description: "DNS records not yet propagated. Try again in a few minutes.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-domain"] });
      toast({ title: "Domain removed" });
      setShowRemoveDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove domain",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, recordName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedRecord(recordName);
    setTimeout(() => setCopiedRecord(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const getStatusBadge = (status: CustomDomainSettings["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-600 gap-1">
            <Check className="h-3 w-3" />
            Active
          </Badge>
        );
      case "verifying":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Verifying
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending Setup
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
    }
  };

  const getSslBadge = (status: CustomDomainSettings["ssl_status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-600 gap-1">
            <Lock className="h-3 w-3" />
            SSL Active
          </Badge>
        );
      case "provisioning":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Provisioning
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            SSL Failed
          </Badge>
        );
    }
  };

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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { domain, canEdit } = data || { domain: null, canEdit: false };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Custom Domain</h1>
            <p className="text-muted-foreground">
              Use your own domain for public pages
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900">
        <CardContent className="flex items-start gap-4 py-4">
          <Globe className="h-8 w-8 text-amber-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Custom Domains - Coming Soon
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-200">
              Custom domain functionality is currently in development. You'll soon be
              able to use your own domain for forms, landing pages, and booking pages.
            </p>
          </div>
        </CardContent>
      </Card>

      {!domain ? (
        /* No Domain Setup */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No Custom Domain</h3>
            <p className="mt-2 text-center text-muted-foreground max-w-md">
              Add a custom domain to use your own branding for public-facing pages
              like forms, landing pages, and booking pages.
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowAddDialog(true)}
              disabled={!canEdit}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Domain Configured */
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {domain.domain}
                  </CardTitle>
                  <CardDescription>
                    {domain.subdomain
                      ? `Subdomain: ${domain.subdomain}`
                      : "Root domain"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(domain.status)}
                  {getSslBadge(domain.ssl_status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {domain.status !== "active" && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">DNS Configuration Required</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add the following DNS records to your domain registrar:
                  </p>
                  <div className="space-y-3">
                    {domain.dns_records.map((record, index) => (
                      <DnsRecordRow
                        key={index}
                        record={record}
                        onCopy={copyToClipboard}
                        copiedRecord={copiedRecord}
                      />
                    ))}
                  </div>
                </div>
              )}

              {domain.verified_at && (
                <div className="text-sm text-muted-foreground">
                  Verified on{" "}
                  {new Date(domain.verified_at).toLocaleDateString()}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              {domain.status !== "active" && (
                <Button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Verify DNS
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowRemoveDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Domain
              </Button>
            </CardFooter>
          </Card>

          {/* SSL Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SSL Certificate
              </CardTitle>
              <CardDescription>
                Automatic SSL certificate provisioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domain.ssl_status === "active" ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Lock className="h-5 w-5" />
                  <span>SSL certificate is active and valid</span>
                </div>
              ) : domain.ssl_status === "provisioning" ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>SSL certificate is being provisioned...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-5 w-5" />
                  <span>
                    SSL certificate will be provisioned after DNS verification
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Custom Domains Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="font-bold">1</span>
              </div>
              <h4 className="font-medium">Add Your Domain</h4>
              <p className="text-sm text-muted-foreground">
                Enter your custom domain (e.g., forms.yourcompany.com)
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="font-bold">2</span>
              </div>
              <h4 className="font-medium">Configure DNS</h4>
              <p className="text-sm text-muted-foreground">
                Add the provided DNS records to your domain registrar
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="font-bold">3</span>
              </div>
              <h4 className="font-medium">Go Live</h4>
              <p className="text-sm text-muted-foreground">
                Once verified, your domain will be active with SSL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Domain</DialogTitle>
            <DialogDescription>
              Enter the domain or subdomain you want to use for public pages
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="forms.yourcompany.com"
              />
              <p className="text-sm text-muted-foreground">
                We recommend using a subdomain like forms.yourcompany.com
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewDomain("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addMutation.mutate(newDomain)}
              disabled={!newDomain.trim() || addMutation.isPending}
            >
              {addMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Domain Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Custom Domain?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your custom domain configuration. Public pages will
              revert to using the default domain. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// DNS Record Row Component
function DnsRecordRow({
  record,
  onCopy,
  copiedRecord,
}: {
  record: DnsRecord;
  onCopy: (text: string, name: string) => void;
  copiedRecord: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-background p-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{record.type}</Badge>
          {record.verified ? (
            <Badge variant="default" className="bg-green-600 text-xs">
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Pending</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Name: </span>
            <code className="rounded bg-muted px-1">{record.name}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Value: </span>
            <code className="rounded bg-muted px-1 text-xs">
              {record.value.length > 30
                ? record.value.substring(0, 30) + "..."
                : record.value}
            </code>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onCopy(record.value, record.name)}
      >
        {copiedRecord === record.name ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
