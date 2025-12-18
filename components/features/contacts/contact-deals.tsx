"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Plus, DollarSign, Calendar, ArrowRight, Briefcase } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useContactDeals } from "@/lib/hooks/use-deals";
import type { DealWithRelations, DealStatus } from "@/types/deal";

interface ContactDealsProps {
  contactId: string;
}

const dealStatusConfig: Record<DealStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-blue-500 text-white" },
  won: { label: "Won", className: "bg-green-500 text-white" },
  lost: { label: "Lost", className: "bg-red-500 text-white" },
};

export function ContactDeals({ contactId }: ContactDealsProps) {
  const { data, isLoading, isError } = useContactDeals(contactId);

  const deals = data?.deals || [];
  const total = data?.total || 0;

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Deals</CardTitle>
            <CardDescription>Associated deals and opportunities</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load deals. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">Deals</CardTitle>
          <CardDescription>
            {total} {total === 1 ? "deal" : "deals"}
          </CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href={`/dashboard/deals/new?contactId=${contactId}`}>
            <Plus className="mr-1 h-4 w-4" />
            Add Deal
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No deals associated with this contact yet.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href={`/dashboard/deals/new?contactId=${contactId}`}>
                <Plus className="mr-1 h-4 w-4" />
                Create Deal
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} formatCurrency={formatCurrency} />
            ))}

            {total > deals.length && (
              <Button variant="link" size="sm" asChild className="w-full">
                <Link href={`/dashboard/deals?contactId=${contactId}`}>
                  View all {total} deals
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DealCardProps {
  deal: DealWithRelations;
  formatCurrency: (value: number | null) => string | null;
}

function DealCard({ deal, formatCurrency }: DealCardProps) {
  const statusConfig = dealStatusConfig[deal.status];

  return (
    <Link
      href={`/dashboard/deals/${deal.id}`}
      className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{deal.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {deal.pipeline && <span>{deal.pipeline.name}</span>}
            {deal.stage && (
              <>
                <span>•</span>
                <Badge
                  variant="outline"
                  className="text-xs h-5"
                  style={{
                    borderColor: deal.stage.color || undefined,
                    color: deal.stage.color || undefined,
                  }}
                >
                  {deal.stage.name}
                </Badge>
              </>
            )}
          </div>
        </div>
        <Badge className={cn("shrink-0", statusConfig.className)}>
          {statusConfig.label}
        </Badge>
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        {deal.value !== null && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(deal.value)}
          </div>
        )}
        {deal.expected_close_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Expected{" "}
            {formatDistanceToNow(new Date(deal.expected_close_date), {
              addSuffix: true,
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
