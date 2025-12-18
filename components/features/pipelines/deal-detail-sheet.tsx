"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  DollarSign,
  Edit,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Trash2,
  Trophy,
  X as XIcon,
  User,
  Building2,
  MapPin,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DealOverview } from "./deal-overview";
import { DealActivityTab } from "./deal-activity-tab";
import { CloseDealDialog } from "./close-deal-dialog";
import { useDeal, useDeleteDeal } from "@/lib/hooks/use-deals";
import { usePipelineStore } from "@/stores/pipeline-store";
import { useToast } from "@/hooks/use-toast";
import type { DealCard } from "@/types/pipeline";

interface DealDetailSheetProps {
  deal: DealCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDetailSheet({
  deal,
  open,
  onOpenChange,
}: DealDetailSheetProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("overview");
  const [showCloseDialog, setShowCloseDialog] = React.useState<"won" | "lost" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Fetch full deal data when opened
  const { data: fullDeal, isLoading } = useDeal(open && deal?.id ? deal.id : undefined);
  const deleteDealMutation = useDeleteDeal();

  const formatCurrency = (value: number | null) => {
    if (!value) return "No value set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleEdit = () => {
    if (deal) {
      router.push(`/dashboard/deals/${deal.id}/edit`);
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (!deal) return;

    try {
      await deleteDealMutation.mutateAsync(deal.id);
      toast({
        title: "Deal deleted",
        description: `${deal.title} has been deleted.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deal. Please try again.",
        variant: "destructive",
      });
    }
    setShowDeleteConfirm(false);
  };

  const handleViewContact = () => {
    if (deal?.contact) {
      router.push(`/dashboard/contacts/${deal.contact.id}`);
      onOpenChange(false);
    }
  };

  const handleCloseDialogComplete = () => {
    setShowCloseDialog(null);
    onOpenChange(false);
  };

  // Get display data
  const displayDeal = fullDeal || deal;
  const contactName = deal?.contact
    ? `${deal.contact.firstName} ${deal.contact.lastName}`.trim()
    : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[540px] p-0 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayDeal ? (
            <>
              {/* Header */}
              <div className="p-6 pb-4 border-b">
                <SheetHeader className="space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0 pr-4">
                      <SheetTitle className="text-xl truncate">
                        {displayDeal.title}
                      </SheetTitle>
                      {contactName && (
                        <button
                          onClick={handleViewContact}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <User className="h-3.5 w-3.5" />
                          <span>{contactName}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEdit}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit deal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {displayDeal.status === "open" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setShowCloseDialog("won")}
                              className="text-green-600"
                            >
                              <Trophy className="mr-2 h-4 w-4" />
                              Mark as won
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setShowCloseDialog("lost")}
                              className="text-red-600"
                            >
                              <XIcon className="mr-2 h-4 w-4" />
                              Mark as lost
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete deal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Badge
                      className={cn(
                        "capitalize",
                        getStatusColor(displayDeal.status)
                      )}
                    >
                      {displayDeal.status}
                    </Badge>
                    {(fullDeal?.value || deal?.value) && (
                      <Badge variant="outline" className="gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(fullDeal?.value ?? deal?.value ?? null)}
                      </Badge>
                    )}
                    {(fullDeal?.expected_close_date || deal?.expectedCloseDate) && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(fullDeal?.expected_close_date || deal?.expectedCloseDate || ""), "MMM d, yyyy")}
                      </Badge>
                    )}
                  </div>
                </SheetHeader>
              </div>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="px-6 pt-2">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-6 pt-4">
                    <TabsContent value="overview" className="mt-0">
                      <DealOverview deal={fullDeal ?? null} dealCard={deal} />
                    </TabsContent>

                    <TabsContent value="activity" className="mt-0">
                      <DealActivityTab dealId={displayDeal.id} />
                    </TabsContent>

                    <TabsContent value="tasks" className="mt-0">
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Tasks coming soon</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="files" className="mt-0">
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Files coming soon</p>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>

              {/* Quick Actions Footer */}
              {displayDeal.status === "open" && (
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => setShowCloseDialog("won")}
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Won
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setShowCloseDialog("lost")}
                    >
                      <XIcon className="mr-2 h-4 w-4" />
                      Lost
                    </Button>
                    <Button variant="outline" onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No deal selected
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Close Deal Dialog */}
      {showCloseDialog && deal && (
        <CloseDealDialog
          deal={deal}
          type={showCloseDialog}
          open={!!showCloseDialog}
          onOpenChange={(open) => !open && setShowCloseDialog(null)}
          onComplete={handleCloseDialogComplete}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-sm mx-4 shadow-lg">
            <h3 className="font-semibold text-lg">Delete deal?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete{" "}
              <span className="font-medium">{deal?.title}</span>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteDealMutation.isPending}
              >
                {deleteDealMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
