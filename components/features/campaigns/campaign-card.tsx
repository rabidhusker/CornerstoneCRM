"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  Mail,
  Smartphone,
  GitBranch,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  Users,
  Send,
  Eye,
  MousePointer,
  Clock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  campaignTypeConfig,
  campaignStatusConfig,
  calculateCampaignStats,
  type CampaignWithCreator,
  type CampaignType,
} from "@/types/campaign";

interface CampaignCardProps {
  campaign: CampaignWithCreator;
  onEdit?: (campaign: CampaignWithCreator) => void;
  onDuplicate?: (campaign: CampaignWithCreator) => void;
  onDelete?: (campaign: CampaignWithCreator) => void;
  onStart?: (campaign: CampaignWithCreator) => void;
  onPause?: (campaign: CampaignWithCreator) => void;
}

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

export function CampaignCard({
  campaign,
  onEdit,
  onDuplicate,
  onDelete,
  onStart,
  onPause,
}: CampaignCardProps) {
  const router = useRouter();
  const typeConfig = campaignTypeConfig[campaign.type];
  const statusConfig = campaignStatusConfig[campaign.status];
  const stats = calculateCampaignStats(campaign);

  const handleClick = () => {
    router.push(`/dashboard/campaigns/${campaign.id}`);
  };

  const isRunnable =
    campaign.status === "draft" || campaign.status === "scheduled";
  const isPausable = campaign.status === "active";

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                campaign.type === "email" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
                campaign.type === "sms" && "bg-green-100 text-green-600 dark:bg-green-900/30",
                campaign.type === "drip" && "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
              )}
            >
              <TypeIcon type={campaign.type} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold line-clamp-1">{campaign.name}</h3>
              <p className="text-sm text-muted-foreground">
                {typeConfig.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge className={cn("capitalize", statusConfig.bgColor, statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(campaign)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(campaign)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                {isRunnable && (
                  <DropdownMenuItem onClick={() => onStart?.(campaign)}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Campaign
                  </DropdownMenuItem>
                )}
                {isPausable && (
                  <DropdownMenuItem onClick={() => onPause?.(campaign)}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Campaign
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(campaign)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-semibold">{stats.recipients_count}</p>
                  <p className="text-xs text-muted-foreground">Recipients</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Total audience size</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-semibold">{stats.sent_count}</p>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Messages sent</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-semibold">
                    {stats.open_rate > 0 ? `${stats.open_rate.toFixed(1)}%` : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">Opened</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {stats.opened_count} opened ({stats.open_rate.toFixed(1)}% rate)
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <MousePointer className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-semibold">
                    {stats.click_rate > 0 ? `${stats.click_rate.toFixed(1)}%` : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">Clicked</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {stats.clicked_count} clicked ({stats.click_rate.toFixed(1)}% rate)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress bar for active campaigns */}
        {campaign.status === "active" && stats.recipients_count > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round((stats.sent_count / stats.recipients_count) * 100)}%</span>
            </div>
            <Progress
              value={(stats.sent_count / stats.recipients_count) * 100}
              className="h-1.5"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {campaign.scheduled_at ? (
              <span>
                Scheduled for {format(new Date(campaign.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            ) : (
              <span>Updated {formatDistanceToNow(new Date(campaign.updated_at))} ago</span>
            )}
          </div>
          {campaign.creator && (
            <span>by {campaign.creator.full_name || "Unknown"}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for table/list views
export function CampaignCardCompact({
  campaign,
  onEdit,
  onDuplicate,
  onDelete,
  onStart,
  onPause,
}: CampaignCardProps) {
  const router = useRouter();
  const statusConfig = campaignStatusConfig[campaign.status];
  const stats = calculateCampaignStats(campaign);

  const handleClick = () => {
    router.push(`/dashboard/campaigns/${campaign.id}`);
  };

  const isRunnable =
    campaign.status === "draft" || campaign.status === "scheduled";
  const isPausable = campaign.status === "active";

  return (
    <div
      className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleClick}
    >
      <div
        className={cn(
          "p-2 rounded-lg shrink-0",
          campaign.type === "email" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
          campaign.type === "sms" && "bg-green-100 text-green-600 dark:bg-green-900/30",
          campaign.type === "drip" && "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
        )}
      >
        <TypeIcon type={campaign.type} className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{campaign.name}</h4>
        <p className="text-sm text-muted-foreground">
          {stats.recipients_count} recipients
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{stats.sent_count} sent</span>
        <span>{stats.open_rate > 0 ? `${stats.open_rate.toFixed(1)}%` : "-"} opened</span>
        <span>{stats.click_rate > 0 ? `${stats.click_rate.toFixed(1)}%` : "-"} clicked</span>
      </div>

      <Badge className={cn("capitalize shrink-0", statusConfig.bgColor, statusConfig.color)}>
        {statusConfig.label}
      </Badge>

      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(campaign)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(campaign)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            {isRunnable && (
              <DropdownMenuItem onClick={() => onStart?.(campaign)}>
                <Play className="mr-2 h-4 w-4" />
                Start
              </DropdownMenuItem>
            )}
            {isPausable && (
              <DropdownMenuItem onClick={() => onPause?.(campaign)}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(campaign)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
