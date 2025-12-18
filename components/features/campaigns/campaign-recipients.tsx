"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Send,
  CheckCircle,
  Eye,
  MousePointer,
  AlertTriangle,
  Clock,
  Download,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Recipient status type
export type RecipientStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "unsubscribed"
  | "failed";

export interface CampaignRecipient {
  contact_id: string;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  status: RecipientStatus;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  bounce_reason: string | null;
  open_count: number;
  click_count: number;
}

interface CampaignRecipientsProps {
  campaignId: string;
  recipients: CampaignRecipient[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onFilterChange?: (status: RecipientStatus | "all") => void;
  onSearch?: (query: string) => void;
}

const statusConfig: Record<
  RecipientStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  sent: {
    label: "Sent",
    icon: <Send className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  opened: {
    label: "Opened",
    icon: <Eye className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  clicked: {
    label: "Clicked",
    icon: <MousePointer className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
  bounced: {
    label: "Bounced",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  unsubscribed: {
    label: "Unsubscribed",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  failed: {
    label: "Failed",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

export function CampaignRecipients({
  campaignId,
  recipients,
  isLoading = false,
  pagination,
  onPageChange,
  onFilterChange,
  onSearch,
}: CampaignRecipientsProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<RecipientStatus | "all">("all");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleStatusChange = (value: RecipientStatus | "all") => {
    setStatusFilter(value);
    onFilterChange?.(value);
  };

  const handleExport = () => {
    // Generate CSV
    const headers = [
      "Name",
      "Email",
      "Status",
      "Sent At",
      "Opened At",
      "Clicked At",
      "Open Count",
      "Click Count",
    ];

    const rows = recipients.map((r) => [
      `${r.contact.first_name} ${r.contact.last_name}`,
      r.contact.email || "",
      r.status,
      r.sent_at ? format(new Date(r.sent_at), "yyyy-MM-dd HH:mm") : "",
      r.opened_at ? format(new Date(r.opened_at), "yyyy-MM-dd HH:mm") : "",
      r.clicked_at ? format(new Date(r.clicked_at), "yyyy-MM-dd HH:mm") : "",
      r.open_count.toString(),
      r.click_count.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${campaignId}-recipients.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Recipients</CardTitle>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search recipients..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export */}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No recipients found
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient) => (
                    <RecipientRow key={recipient.contact_id} recipient={recipient} />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
                  {pagination.total} recipients
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecipientRow({ recipient }: { recipient: CampaignRecipient }) {
  const config = statusConfig[recipient.status];

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/dashboard/contacts/${recipient.contact.id}`}
          className="font-medium hover:underline"
        >
          {recipient.contact.first_name} {recipient.contact.last_name}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {recipient.contact.email || "-"}
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className={cn("gap-1", config.color)}>
                {config.icon}
                {config.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {recipient.status === "bounced" && recipient.bounce_reason && (
                <p>Reason: {recipient.bounce_reason}</p>
              )}
              {recipient.status === "opened" && (
                <p>Opened {recipient.open_count} time(s)</p>
              )}
              {recipient.status === "clicked" && (
                <p>Clicked {recipient.click_count} time(s)</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {recipient.sent_at
          ? format(new Date(recipient.sent_at), "MMM d, h:mm a")
          : "-"}
      </TableCell>
      <TableCell>
        {recipient.opened_at ? (
          <div className="flex items-center gap-1 text-purple-600">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-sm">
              {format(new Date(recipient.opened_at), "MMM d, h:mm a")}
            </span>
            {recipient.open_count > 1 && (
              <Badge variant="secondary" className="text-xs">
                x{recipient.open_count}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {recipient.clicked_at ? (
          <div className="flex items-center gap-1 text-orange-600">
            <MousePointer className="h-3.5 w-3.5" />
            <span className="text-sm">
              {format(new Date(recipient.clicked_at), "MMM d, h:mm a")}
            </span>
            {recipient.click_count > 1 && (
              <Badge variant="secondary" className="text-xs">
                x{recipient.click_count}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/contacts/${recipient.contact.id}`}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
