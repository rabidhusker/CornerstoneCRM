"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  Home,
  MapPin,
  Pencil,
  User,
  Users,
  GitBranch,
  Tag,
  Check,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useUpdateDeal } from "@/lib/hooks/use-deals";
import { useToast } from "@/hooks/use-toast";
import type { DealWithRelations } from "@/types/deal";
import type { DealCard } from "@/types/pipeline";

interface DealOverviewProps {
  deal: DealWithRelations | null;
  dealCard: DealCard | null;
}

export function DealOverview({ deal, dealCard }: DealOverviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const updateDealMutation = useUpdateDeal();

  // Inline editing states
  const [editingValue, setEditingValue] = React.useState(false);
  const [editingDate, setEditingDate] = React.useState(false);
  const [valueInput, setValueInput] = React.useState("");
  const [dateInput, setDateInput] = React.useState("");

  const displayDeal = deal || dealCard;

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSaveValue = async () => {
    if (!displayDeal) return;

    const numericValue = parseFloat(valueInput.replace(/[^0-9.]/g, ""));

    try {
      await updateDealMutation.mutateAsync({
        id: displayDeal.id,
        data: { value: isNaN(numericValue) ? undefined : numericValue },
      });
      toast({ title: "Deal value updated" });
      setEditingValue(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deal value",
        variant: "destructive",
      });
    }
  };

  const handleSaveDate = async () => {
    if (!displayDeal) return;

    try {
      await updateDealMutation.mutateAsync({
        id: displayDeal.id,
        data: { expectedCloseDate: dateInput || undefined },
      });
      toast({ title: "Expected close date updated" });
      setEditingDate(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update expected close date",
        variant: "destructive",
      });
    }
  };

  const startEditingValue = () => {
    const value = deal?.value || dealCard?.value;
    setValueInput(value?.toString() || "");
    setEditingValue(true);
  };

  const startEditingDate = () => {
    const date = deal?.expected_close_date || dealCard?.expectedCloseDate;
    setDateInput(date ? format(new Date(date), "yyyy-MM-dd") : "");
    setEditingDate(true);
  };

  if (!displayDeal) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No deal data available
      </div>
    );
  }

  const contactName = dealCard?.contact
    ? `${dealCard.contact.firstName} ${dealCard.contact.lastName}`.trim()
    : deal?.contact
    ? `${deal.contact.first_name} ${deal.contact.last_name}`.trim()
    : null;

  const contactEmail = dealCard?.contact?.email || deal?.contact?.email;

  const propertyAddress =
    deal?.property_address || dealCard?.propertyAddress;

  const propertyFullAddress = deal
    ? [
        deal.property_address,
        deal.property_city,
        deal.property_state,
        deal.property_zip,
      ]
        .filter(Boolean)
        .join(", ")
    : propertyAddress;

  return (
    <div className="space-y-6">
      {/* Deal Information */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Deal Information
        </h3>
        <div className="space-y-3">
          {/* Value */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Value</span>
            </div>
            {editingValue ? (
              <div className="flex items-center gap-1">
                <Input
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  className="h-8 w-32"
                  placeholder="0"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleSaveValue}
                  disabled={updateDealMutation.isPending}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditingValue(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={startEditingValue}
                className="flex items-center gap-1 text-sm font-medium hover:text-primary group"
              >
                <span className="text-green-600">
                  {formatCurrency(deal?.value ?? dealCard?.value ?? null)}
                </span>
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Expected Close Date */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Expected Close</span>
            </div>
            {editingDate ? (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="h-8 w-36"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleSaveDate}
                  disabled={updateDealMutation.isPending}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditingDate(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={startEditingDate}
                className="flex items-center gap-1 text-sm font-medium hover:text-primary group"
              >
                <span>
                  {deal?.expected_close_date || dealCard?.expectedCloseDate
                    ? format(
                        new Date(
                          deal?.expected_close_date ||
                            dealCard?.expectedCloseDate ||
                            ""
                        ),
                        "MMM d, yyyy"
                      )
                    : "—"}
                </span>
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Pipeline & Stage */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{deal?.pipeline?.name || "—"}</span>
              {deal?.stage && (
                <Badge
                  variant="outline"
                  style={{ borderColor: deal.stage.color, color: deal.stage.color }}
                >
                  {deal.stage.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created</span>
            </div>
            <span className="text-sm">
              {deal?.created_at || dealCard?.createdAt
                ? format(
                    new Date(deal?.created_at || dealCard?.createdAt || ""),
                    "MMM d, yyyy"
                  )
                : "—"}
            </span>
          </div>
        </div>
      </section>

      <Separator />

      {/* Contact Information */}
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Contact
        </h3>
        {contactName ? (
          <div className="space-y-2">
            <button
              onClick={() =>
                router.push(
                  `/dashboard/contacts/${
                    dealCard?.contact?.id || deal?.contact?.id
                  }`
                )
              }
              className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{contactName}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
            {contactEmail && (
              <p className="text-sm text-muted-foreground pl-6">{contactEmail}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No contact linked</p>
        )}
      </section>

      {/* Property Information (if exists) */}
      {propertyFullAddress && (
        <>
          <Separator />
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Property
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{propertyFullAddress}</span>
              </div>
              {deal?.property_type && (
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{deal.property_type}</span>
                </div>
              )}
              {(deal?.property_bedrooms || deal?.property_bathrooms || deal?.property_sqft) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground pl-6">
                  {deal.property_bedrooms && <span>{deal.property_bedrooms} bed</span>}
                  {deal.property_bathrooms && <span>{deal.property_bathrooms} bath</span>}
                  {deal.property_sqft && (
                    <span>{deal.property_sqft.toLocaleString()} sqft</span>
                  )}
                </div>
              )}
              {deal?.property_list_price && (
                <div className="flex items-center gap-2 text-sm pl-6">
                  <span className="text-muted-foreground">List Price:</span>
                  <span className="font-medium">
                    {formatCurrency(deal.property_list_price)}
                  </span>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Tags */}
      {((deal?.tags && deal.tags.length > 0) ||
        (dealCard?.tags && dealCard.tags.length > 0)) && (
        <>
          <Separator />
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(deal?.tags || dealCard?.tags || []).map((tag) => (
                <Badge key={tag} variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Description */}
      {deal?.description && (
        <>
          <Separator />
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Description
            </h3>
            <p className="text-sm whitespace-pre-wrap">{deal.description}</p>
          </section>
        </>
      )}

      {/* Commission Info (if exists) */}
      {(deal?.commission_rate || deal?.commission_amount) && (
        <>
          <Separator />
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Commission
            </h3>
            <div className="space-y-2 text-sm">
              {deal.commission_rate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span>{deal.commission_rate}%</span>
                </div>
              )}
              {deal.commission_amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(deal.commission_amount)}
                  </span>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
