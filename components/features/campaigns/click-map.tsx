"use client";

import * as React from "react";
import { Link2, ExternalLink, TrendingUp, MousePointer } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

export interface LinkClick {
  url: string;
  text: string | null;
  clicks: number;
  unique_clicks: number;
  first_click: string | null;
  last_click: string | null;
}

interface ClickMapProps {
  links: LinkClick[];
  totalClicks: number;
  className?: string;
}

export function ClickMap({ links, totalClicks, className }: ClickMapProps) {
  // Sort links by click count
  const sortedLinks = React.useMemo(() => {
    return [...links].sort((a, b) => b.clicks - a.clicks);
  }, [links]);

  const maxClicks = sortedLinks.length > 0 ? sortedLinks[0].clicks : 0;

  if (links.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Click Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No link clicks recorded yet</p>
            <p className="text-sm mt-1">
              Click data will appear here once recipients start clicking links
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Click Map
          </CardTitle>
          <Badge variant="secondary">
            {totalClicks.toLocaleString()} total clicks
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Visual click bars */}
          <div className="space-y-4">
            {sortedLinks.slice(0, 5).map((link, index) => (
              <ClickBar
                key={link.url}
                link={link}
                rank={index + 1}
                maxClicks={maxClicks}
                totalClicks={totalClicks}
              />
            ))}
          </div>

          {/* Full link table */}
          {sortedLinks.length > 5 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">All Links</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Link</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Unique</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLinks.map((link) => (
                      <TableRow key={link.url}>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm hover:underline max-w-[300px] truncate"
                                >
                                  <Link2 className="h-4 w-4 shrink-0" />
                                  <span className="truncate">
                                    {link.text || truncateUrl(link.url)}
                                  </span>
                                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-all">{link.url}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {link.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {link.unique_clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalClicks > 0
                            ? ((link.clicks / totalClicks) * 100).toFixed(1)
                            : 0}
                          %
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ClickBarProps {
  link: LinkClick;
  rank: number;
  maxClicks: number;
  totalClicks: number;
}

function ClickBar({ link, rank, maxClicks, totalClicks }: ClickBarProps) {
  const percentage = totalClicks > 0 ? (link.clicks / totalClicks) * 100 : 0;
  const barWidth = maxClicks > 0 ? (link.clicks / maxClicks) * 100 : 0;

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
  ];
  const color = colors[(rank - 1) % colors.length];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Badge variant="outline" className="shrink-0">
            #{rank}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm hover:underline truncate"
                >
                  <span className="truncate">{link.text || truncateUrl(link.url)}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs break-all">{link.url}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground">
            {link.unique_clicks.toLocaleString()} unique
          </span>
          <span className="font-semibold">{link.clicks.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground w-16 text-right">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function truncateUrl(url: string, maxLength: number = 50): string {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname + parsed.pathname;
    if (display.length > maxLength) {
      return display.substring(0, maxLength - 3) + "...";
    }
    return display;
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength - 3) + "..." : url;
  }
}

// Compact version for dashboard
export function ClickMapCompact({
  links,
  totalClicks,
}: {
  links: LinkClick[];
  totalClicks: number;
}) {
  const topLinks = [...links].sort((a, b) => b.clicks - a.clicks).slice(0, 3);

  if (topLinks.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No link clicks yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topLinks.map((link, index) => (
        <div key={link.url} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0 text-xs">
              {index + 1}
            </Badge>
            <span className="text-sm truncate">{link.text || truncateUrl(link.url, 30)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium">{link.clicks}</span>
            <span className="text-xs text-muted-foreground">
              ({((link.clicks / totalClicks) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
