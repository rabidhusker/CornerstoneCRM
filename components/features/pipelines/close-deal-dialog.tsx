"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Trophy, X as XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMarkDealWon, useMarkDealLost } from "@/lib/hooks/use-deals";
import { usePipelineBoard } from "@/lib/hooks/use-pipelines";
import { useToast } from "@/hooks/use-toast";
import type { DealCard } from "@/types/pipeline";

interface CloseDealDialogProps {
  deal: DealCard;
  type: "won" | "lost";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const lostReasonOptions = [
  { value: "price", label: "Price too high" },
  { value: "competitor", label: "Went with competitor" },
  { value: "timing", label: "Bad timing" },
  { value: "needs", label: "Needs changed" },
  { value: "budget", label: "Budget constraints" },
  { value: "no_response", label: "No response / Went cold" },
  { value: "other", label: "Other" },
];

export function CloseDealDialog({
  deal,
  type,
  open,
  onOpenChange,
  onComplete,
}: CloseDealDialogProps) {
  const { toast } = useToast();

  // Fetch pipeline to get won/lost stage IDs
  const { data: boardData } = usePipelineBoard(deal.pipelineId);

  const markWonMutation = useMarkDealWon();
  const markLostMutation = useMarkDealLost();

  // Form state
  const [closeDate, setCloseDate] = React.useState<Date>(new Date());
  const [wonValue, setWonValue] = React.useState(deal.value?.toString() || "");
  const [lostReason, setLostReason] = React.useState("");
  const [lostReasonDetail, setLostReasonDetail] = React.useState("");
  const [competitor, setCompetitor] = React.useState("");

  // Find won/lost stages
  const wonStage = boardData?.stages.find((s) => s.is_won_stage);
  const lostStage = boardData?.stages.find((s) => s.is_lost_stage);

  const formatCurrency = (value: number | null) => {
    if (!value) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async () => {
    if (type === "won") {
      if (!wonStage) {
        toast({
          title: "Error",
          description: "No won stage configured for this pipeline",
          variant: "destructive",
        });
        return;
      }

      try {
        await markWonMutation.mutateAsync({
          dealId: deal.id,
          wonStageId: wonStage.id,
          actualCloseDate: closeDate.toISOString(),
        });
        toast({
          title: "Deal won!",
          description: `Congratulations! ${deal.title} has been marked as won.`,
        });
        onComplete?.();
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to mark deal as won. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      if (!lostStage) {
        toast({
          title: "Error",
          description: "No lost stage configured for this pipeline",
          variant: "destructive",
        });
        return;
      }

      if (!lostReason) {
        toast({
          title: "Error",
          description: "Please select a reason for losing this deal",
          variant: "destructive",
        });
        return;
      }

      const fullLostReason = lostReasonDetail
        ? `${lostReasonOptions.find((o) => o.value === lostReason)?.label}: ${lostReasonDetail}`
        : lostReasonOptions.find((o) => o.value === lostReason)?.label || lostReason;

      try {
        await markLostMutation.mutateAsync({
          dealId: deal.id,
          lostStageId: lostStage.id,
          lostReason: competitor
            ? `${fullLostReason}. Competitor: ${competitor}`
            : fullLostReason,
        });
        toast({
          title: "Deal marked as lost",
          description: `${deal.title} has been marked as lost.`,
        });
        onComplete?.();
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to mark deal as lost. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const isLoading = markWonMutation.isPending || markLostMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "won" ? (
              <>
                <Trophy className="h-5 w-5 text-green-600" />
                Mark Deal as Won
              </>
            ) : (
              <>
                <XIcon className="h-5 w-5 text-red-600" />
                Mark Deal as Lost
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {type === "won"
              ? `Congratulations on closing ${deal.title}! Enter the final details.`
              : `Record the details for why ${deal.title} was lost.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {type === "won" ? (
            <>
              {/* Close Date */}
              <div className="grid gap-2">
                <Label htmlFor="closeDate">Close Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !closeDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {closeDate ? format(closeDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={closeDate}
                      onSelect={(date) => date && setCloseDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Won Value */}
              <div className="grid gap-2">
                <Label htmlFor="wonValue">Final Value</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="wonValue"
                    type="text"
                    value={wonValue}
                    onChange={(e) => setWonValue(e.target.value)}
                    className="pl-7"
                    placeholder="0"
                  />
                </div>
                {deal.value && (
                  <p className="text-xs text-muted-foreground">
                    Original value: {formatCurrency(deal.value)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Lost Reason */}
              <div className="grid gap-2">
                <Label htmlFor="lostReason">
                  Reason Lost <span className="text-destructive">*</span>
                </Label>
                <Select value={lostReason} onValueChange={setLostReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {lostReasonOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Details */}
              {lostReason && (
                <div className="grid gap-2">
                  <Label htmlFor="lostReasonDetail">Additional Details</Label>
                  <Textarea
                    id="lostReasonDetail"
                    value={lostReasonDetail}
                    onChange={(e) => setLostReasonDetail(e.target.value)}
                    placeholder="Add more context about why the deal was lost..."
                    rows={3}
                  />
                </div>
              )}

              {/* Competitor */}
              {lostReason === "competitor" && (
                <div className="grid gap-2">
                  <Label htmlFor="competitor">Competitor Name</Label>
                  <Input
                    id="competitor"
                    value={competitor}
                    onChange={(e) => setCompetitor(e.target.value)}
                    placeholder="Who did they go with?"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (type === "lost" && !lostReason)}
            className={cn(
              type === "won"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {type === "won" ? "Mark as Won" : "Mark as Lost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
