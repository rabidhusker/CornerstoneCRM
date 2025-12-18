"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Mail,
  Smartphone,
  GitBranch,
  Search,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import {
  useCampaigns,
  useDeleteCampaign,
  useDuplicateCampaign,
  useStartCampaign,
  usePauseCampaign,
} from "@/lib/hooks/use-campaigns";
import { CampaignCard, CampaignCardCompact } from "@/components/features/campaigns/campaign-card";
import type {
  CampaignType,
  CampaignStatus,
  CampaignWithCreator,
  CampaignFilters,
} from "@/types/campaign";

type ViewMode = "grid" | "list";

const campaignTabs: Array<{ value: CampaignType | "all"; label: string; icon: React.ReactNode }> = [
  { value: "all", label: "All Campaigns", icon: null },
  { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { value: "sms", label: "SMS", icon: <Smartphone className="h-4 w-4" /> },
  { value: "drip", label: "Sequences", icon: <GitBranch className="h-4 w-4" /> },
];

const statusOptions: Array<{ value: CampaignStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];

export default function CampaignsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<CampaignType | "all">("all");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<CampaignStatus | "all">("all");
  const [campaignToDelete, setCampaignToDelete] = React.useState<CampaignWithCreator | null>(null);

  // Build filters
  const filters: CampaignFilters = React.useMemo(() => {
    const f: CampaignFilters = {};
    if (activeTab !== "all") {
      f.type = activeTab;
    }
    if (statusFilter !== "all") {
      f.status = [statusFilter];
    }
    if (searchQuery) {
      f.search = searchQuery;
    }
    return f;
  }, [activeTab, statusFilter, searchQuery]);

  // Fetch campaigns
  const { data: campaigns, isLoading, error } = useCampaigns(filters);

  // Mutations
  const deleteMutation = useDeleteCampaign();
  const duplicateMutation = useDuplicateCampaign();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();

  // Handlers
  const handleEdit = (campaign: CampaignWithCreator) => {
    window.location.href = `/dashboard/campaigns/${campaign.id}/edit`;
  };

  const handleDuplicate = async (campaign: CampaignWithCreator) => {
    try {
      await duplicateMutation.mutateAsync(campaign.id);
      toast({
        title: "Campaign duplicated",
        description: "A copy of the campaign has been created.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate campaign.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;

    try {
      await deleteMutation.mutateAsync(campaignToDelete.id);
      toast({
        title: "Campaign deleted",
        description: "The campaign has been removed.",
      });
      setCampaignToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive",
      });
    }
  };

  const handleStart = async (campaign: CampaignWithCreator) => {
    try {
      await startMutation.mutateAsync(campaign.id);
      toast({
        title: "Campaign started",
        description: "The campaign is now active.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start campaign.",
        variant: "destructive",
      });
    }
  };

  const handlePause = async (campaign: CampaignWithCreator) => {
    try {
      await pauseMutation.mutateAsync(campaign.id);
      toast({
        title: "Campaign paused",
        description: "The campaign has been paused.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause campaign.",
        variant: "destructive",
      });
    }
  };

  // Calculate stats by status
  const stats = React.useMemo(() => {
    if (!campaigns) return { draft: 0, active: 0, scheduled: 0, completed: 0 };

    return campaigns.reduce(
      (acc, c) => {
        if (c.status in acc) {
          acc[c.status as keyof typeof acc]++;
        }
        return acc;
      },
      { draft: 0, active: 0, scheduled: 0, completed: 0 }
    );
  }, [campaigns]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your marketing campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
              <Badge variant="secondary">Draft</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                Scheduled
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Badge className="bg-green-100 text-green-600 dark:bg-green-900/30">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                Completed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CampaignType | "all")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            {campaignTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as CampaignStatus | "all")}
            >
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Campaign Content */}
        {campaignTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                  <p className="text-lg font-medium">Failed to load campaigns</p>
                  <p className="text-muted-foreground">Please try again later.</p>
                </CardContent>
              </Card>
            ) : !campaigns || campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No campaigns found</p>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all"
                      ? "Get started by creating your first campaign."
                      : `No ${tab.label.toLowerCase()} campaigns found.`}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/campaigns/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={(c) => setCampaignToDelete(c)}
                    onStart={handleStart}
                    onPause={handlePause}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <CampaignCardCompact
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={(c) => setCampaignToDelete(c)}
                    onStart={handleStart}
                    onPause={handlePause}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!campaignToDelete}
        onOpenChange={() => setCampaignToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{campaignToDelete?.name}&quot;? This
              action cannot be undone.
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
