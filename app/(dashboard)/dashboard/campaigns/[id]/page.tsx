"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  Copy,
  Trash2,
  MoreHorizontal,
  Mail,
  Smartphone,
  GitBranch,
  Clock,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
  Send,
  Eye,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
  useStartCampaign,
  usePauseCampaign,
} from "@/lib/hooks/use-campaigns";
import { CampaignStatsCards, CampaignStatsDetailed } from "@/components/features/campaigns/campaign-stats";
import { CampaignRecipients, type CampaignRecipient } from "@/components/features/campaigns/campaign-recipients";
import { ClickMap, type LinkClick } from "@/components/features/campaigns/click-map";
import { CampaignTimeline, type TimelineEvent, type EngagementData } from "@/components/features/campaigns/campaign-timeline";
import { EmailPreviewModal } from "@/components/features/campaigns/email-preview";
import {
  campaignTypeConfig,
  campaignStatusConfig,
  calculateCampaignStats,
  type CampaignType,
} from "@/types/campaign";

const TypeIcon: React.FC<{ type: CampaignType; className?: string }> = ({
  type,
  className,
}) => {
  switch (type) {
    case "email":
      return <Mail className={className} />;
    case "sms":
      return <Smartphone className={className} />;
    case "drip":
      return <GitBranch className={className} />;
    default:
      return <Mail className={className} />;
  }
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const campaignId = params.id as string;

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");

  // Fetch campaign
  const { data: campaign, isLoading, error } = useCampaign(campaignId);

  // Mutations
  const deleteMutation = useDeleteCampaign();
  const duplicateMutation = useDuplicateCampaign();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();

  // Mock data for recipients, clicks, timeline (in production, fetch from API)
  const [recipients] = React.useState<CampaignRecipient[]>([]);
  const [linkClicks] = React.useState<LinkClick[]>([]);
  const [timelineEvents] = React.useState<TimelineEvent[]>([]);
  const [engagementData] = React.useState<EngagementData[]>([]);

  const stats = campaign ? calculateCampaignStats(campaign) : null;
  const typeConfig = campaign ? campaignTypeConfig[campaign.type] : null;
  const statusConfig = campaign ? campaignStatusConfig[campaign.status] : null;

  const isRunnable =
    campaign?.status === "draft" || campaign?.status === "scheduled";
  const isPausable = campaign?.status === "active";

  const handleEdit = () => {
    router.push(`/dashboard/campaigns/${campaignId}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      const newCampaign = await duplicateMutation.mutateAsync(campaignId);
      toast({
        title: "Campaign duplicated",
        description: "A copy of the campaign has been created.",
      });
      router.push(`/dashboard/campaigns/${newCampaign.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to duplicate campaign.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(campaignId);
      toast({
        title: "Campaign deleted",
        description: "The campaign has been removed.",
      });
      router.push("/dashboard/campaigns");
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive",
      });
    }
  };

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(campaignId);
      toast({
        title: "Campaign started",
        description: "The campaign is now active.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to start campaign.",
        variant: "destructive",
      });
    }
  };

  const handlePause = async () => {
    try {
      await pauseMutation.mutateAsync(campaignId);
      toast({
        title: "Campaign paused",
        description: "The campaign has been paused.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to pause campaign.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium">Campaign not found</p>
        <p className="text-muted-foreground mb-4">
          The campaign you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/dashboard/campaigns")}>
          Go to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                "p-2 rounded-lg",
                campaign.type === "email" &&
                  "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                campaign.type === "sms" &&
                  "bg-green-100 text-green-600 dark:bg-green-900/30",
                campaign.type === "drip" &&
                  "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
              )}
            >
              <TypeIcon type={campaign.type} className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <p className="text-muted-foreground">{typeConfig?.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={cn("capitalize", statusConfig?.bgColor, statusConfig?.color)}>
              {statusConfig?.label}
            </Badge>

            {isRunnable && (
              <Button onClick={handleStart} disabled={startMutation.isPending}>
                {startMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start Campaign
              </Button>
            )}

            {isPausable && (
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={pauseMutation.isPending}
              >
                {pauseMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                Pause
              </Button>
            )}

            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Campaign Info Bar */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{campaign.recipients_count?.toLocaleString() || 0} recipients</span>
          </div>
          {campaign.scheduled_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Scheduled for{" "}
                {format(new Date(campaign.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              Updated {formatDistanceToNow(new Date(campaign.updated_at))} ago
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <CampaignStatsCards stats={stats} />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="clicks">Click Map</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Performance Overview */}
            {stats && <CampaignStatsDetailed stats={stats} />}

            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-1">{campaign.description}</p>
                  </div>
                )}

                {campaign.type === "email" && campaign.subject_line && (
                  <div>
                    <p className="text-sm text-muted-foreground">Subject Line</p>
                    <p className="mt-1 font-medium">{campaign.subject_line}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="mt-1">
                      {format(new Date(campaign.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="mt-1">
                      {format(new Date(campaign.updated_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  {campaign.started_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="mt-1">
                        {format(new Date(campaign.started_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  )}
                  {campaign.completed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="mt-1">
                        {format(new Date(campaign.completed_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="mt-6">
          <CampaignRecipients
            campaignId={campaignId}
            recipients={recipients}
          />
        </TabsContent>

        <TabsContent value="clicks" className="mt-6">
          <ClickMap
            links={linkClicks}
            totalClicks={stats?.clicked_count || 0}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <CampaignTimeline
            events={timelineEvents}
            engagementData={engagementData}
            startedAt={campaign.started_at || undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{campaign.name}&quot;? This action
              cannot be undone.
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

      {/* Preview Modal */}
      <EmailPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        subjectLine={campaign.subject_line || ""}
        contentHtml={campaign.content_html || ""}
      />
    </div>
  );
}
