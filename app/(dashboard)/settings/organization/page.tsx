"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  Upload,
  Save,
  Globe,
  Clock,
  Calendar,
} from "lucide-react";
import type { OrganizationSettings, OrganizationSize, DateFormat, TimeFormat } from "@/types/settings";
import { commonTimezones } from "@/types/settings";
import { useToast } from "@/hooks/use-toast";

// Fetch organization settings
async function fetchOrganizationSettings(): Promise<OrganizationSettings> {
  const response = await fetch("/api/v1/settings/organization");
  if (!response.ok) {
    throw new Error("Failed to fetch organization settings");
  }
  const data = await response.json();
  return data.organization;
}

// Update organization settings
async function updateOrganizationSettings(
  settings: Partial<OrganizationSettings>
): Promise<OrganizationSettings> {
  const response = await fetch("/api/v1/settings/organization", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error("Failed to update organization settings");
  }
  const data = await response.json();
  return data.organization;
}

const organizationSizes: { value: OrganizationSize; label: string }[] = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

const dateFormats: { value: DateFormat; label: string; example: string }[] = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY", example: "12/31/2024" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY", example: "31/12/2024" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD", example: "2024-12-31" },
];

const timeFormats: { value: TimeFormat; label: string; example: string }[] = [
  { value: "12h", label: "12-hour", example: "3:30 PM" },
  { value: "24h", label: "24-hour", example: "15:30" },
];

const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
];

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<OrganizationSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["organizationSettings"],
    queryFn: fetchOrganizationSettings,
    staleTime: 5 * 60 * 1000,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateOrganizationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizationSettings"] });
      toast({ title: "Settings saved successfully" });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update form data
  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  // Get current value (form data or settings)
  const getValue = <K extends keyof OrganizationSettings>(
    field: K
  ): OrganizationSettings[K] | undefined => {
    if (field in formData) {
      return formData[field] as OrganizationSettings[K];
    }
    return settings?.[field];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Organization Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your organization profile and preferences
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Organization Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getValue("logo_url")} />
              <AvatarFallback className="text-xl">
                {getValue("name")?.substring(0, 2).toUpperCase() || "ORG"}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 200x200px, PNG or JPG
              </p>
            </div>
          </div>

          <Separator />

          {/* Organization name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={getValue("name") || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={getValue("slug") || ""}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="your-company"
              />
              <p className="text-xs text-muted-foreground">
                Used in public URLs like booking pages
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={getValue("website") || ""}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={getValue("industry") || ""}
                onChange={(e) => updateField("industry", e.target.value)}
                placeholder="Technology"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="size">Organization Size</Label>
              <Select
                value={getValue("size")}
                onValueChange={(v) => updateField("size", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {organizationSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={getValue("phone") || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={getValue("email") || ""}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="contact@example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>
            Configure timezone, date format, and currency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">
                <Clock className="h-4 w-4 inline mr-1" />
                Timezone
              </Label>
              <Select
                value={getValue("timezone")}
                onValueChange={(v) => updateField("timezone", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {commonTimezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={getValue("currency")}
                onValueChange={(v) => updateField("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_format">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Format
              </Label>
              <Select
                value={getValue("date_format")}
                onValueChange={(v) => updateField("date_format", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label} ({format.example})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time_format">Time Format</Label>
              <Select
                value={getValue("time_format")}
                onValueChange={(v) => updateField("time_format", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {timeFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label} ({format.example})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fiscal_year_start">Fiscal Year Start</Label>
            <Select
              value={String(getValue("fiscal_year_start") || 1)}
              onValueChange={(v) => updateField("fiscal_year_start", parseInt(v))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used for fiscal year calculations in reports
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your organization and all its data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
