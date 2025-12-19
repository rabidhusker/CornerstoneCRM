"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BrandingEditor } from "@/components/features/settings/branding-editor";
import { ArrowLeft, Palette, Crown, Lock } from "lucide-react";
import type { BrandingSettings, BrandingFormData } from "@/types/branding";
import { defaultBranding } from "@/types/branding";

async function fetchBranding(): Promise<{
  branding: BrandingSettings;
  canEdit: boolean;
}> {
  const res = await fetch("/api/v1/settings/branding");
  if (!res.ok) {
    if (res.status === 404) {
      return {
        branding: {
          id: "",
          workspace_id: "",
          primary_color: defaultBranding.primary_color,
          secondary_color: defaultBranding.secondary_color,
          organization_name: defaultBranding.organization_name,
          show_powered_by: defaultBranding.show_powered_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        canEdit: false,
      };
    }
    throw new Error("Failed to fetch branding settings");
  }
  return res.json();
}

async function saveBranding(
  data: Partial<BrandingFormData>
): Promise<BrandingSettings> {
  const res = await fetch("/api/v1/settings/branding", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to save branding");
  }
  return res.json();
}

export default function BrandingSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["branding"],
    queryFn: fetchBranding,
  });

  const saveMutation = useMutation({
    mutationFn: saveBranding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branding"] });
      toast({ title: "Branding saved successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Branding</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive">Failed to load branding settings</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["branding"] })
              }
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { branding, canEdit } = data!;

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Branding</h1>
            <p className="text-muted-foreground">
              Customize your organization's look and feel
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">
              Permission Required
            </h2>
            <p className="mt-2 text-center text-muted-foreground max-w-md">
              Only organization owners and admins can customize branding
              settings. Contact your administrator for access.
            </p>
          </CardContent>
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
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Branding</h1>
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3" />
                Pro Feature
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Customize your organization's look and feel
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-start gap-4 py-4">
          <Palette className="h-8 w-8 text-primary shrink-0" />
          <div>
            <h3 className="font-semibold">White-Label Branding</h3>
            <p className="text-sm text-muted-foreground">
              Customize colors, logos, and more to match your brand. Changes
              will apply to all public-facing pages including forms, landing
              pages, and booking pages.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branding Editor */}
      <BrandingEditor
        branding={branding}
        onSave={async (data) => {
          await saveMutation.mutateAsync(data);
        }}
        isLoading={saveMutation.isPending}
      />
    </div>
  );
}
