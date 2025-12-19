"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConversionFunnel, FunnelStage } from "@/types/report";
import { chartColors } from "@/types/report";
import { ArrowDown, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversionFunnelProps {
  data?: ConversionFunnel;
  loading?: boolean;
}

// Default funnel stages
const defaultStages = [
  { id: "visitors", name: "Website Visitors" },
  { id: "leads", name: "Leads" },
  { id: "mql", name: "Marketing Qualified" },
  { id: "sql", name: "Sales Qualified" },
  { id: "opportunity", name: "Opportunity" },
  { id: "customer", name: "Customer" },
];

// Funnel bar component
function FunnelBar({
  stage,
  index,
  totalStages,
  maxCount,
  onClick,
}: {
  stage: FunnelStage;
  index: number;
  totalStages: number;
  maxCount: number;
  onClick: () => void;
}) {
  // Calculate width percentage based on count
  const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
  const minWidth = 20; // Minimum width percentage
  const actualWidth = Math.max(widthPercent, minWidth);

  // Progressive color opacity
  const opacity = 1 - (index * 0.1);

  return (
    <div className="space-y-2">
      <div
        className="relative cursor-pointer group"
        onClick={onClick}
      >
        {/* Funnel bar */}
        <div
          className="mx-auto rounded-lg py-4 px-6 transition-all hover:shadow-md flex items-center justify-between"
          style={{
            width: `${actualWidth}%`,
            backgroundColor: chartColors[0],
            opacity,
          }}
        >
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-white/80" />
            <span className="text-white font-medium">{stage.name}</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <span className="text-lg font-bold">{stage.count.toLocaleString()}</span>
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Conversion arrow */}
        {index < totalStages - 1 && (
          <div className="flex flex-col items-center py-2">
            <ArrowDown className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-muted-foreground">
              {stage.conversionRate.toFixed(1)}% conversion
            </span>
            <span className="text-xs text-red-500">
              {stage.dropoffRate.toFixed(1)}% dropoff
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Stage detail dialog
function StageDetailDialog({
  stage,
  open,
  onClose,
}: {
  stage: FunnelStage | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!stage) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{stage.name} Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stage.count.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total in stage</div>
            </div>
            {stage.value !== undefined && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  ${stage.value.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total value</div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <Badge variant={stage.conversionRate >= 50 ? "default" : "secondary"}>
                {stage.conversionRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Dropoff Rate</span>
              <Badge variant={stage.dropoffRate <= 30 ? "default" : "destructive"}>
                {stage.dropoffRate.toFixed(1)}%
              </Badge>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Click on individual records to see the full journey of contacts
              through your sales funnel.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Horizontal funnel visualization
function HorizontalFunnel({
  stages,
  loading,
  onStageClick,
}: {
  stages?: FunnelStage[];
  loading?: boolean;
  onStageClick: (stage: FunnelStage) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-40 shrink-0" />
        ))}
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No funnel data available
      </div>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count));

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto py-4">
      {stages.map((stage, index) => {
        const height = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const minHeight = 40;
        const actualHeight = Math.max(height, minHeight);

        return (
          <div key={stage.id} className="flex items-center shrink-0">
            {/* Stage block */}
            <div
              className="relative cursor-pointer group w-32 flex flex-col justify-center px-3"
              style={{
                height: `${actualHeight}%`,
                minHeight: `${minHeight}px`,
                backgroundColor: chartColors[index % chartColors.length],
                clipPath: index === stages.length - 1
                  ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
                  : "polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)",
              }}
              onClick={() => onStageClick(stage)}
            >
              <div className="text-white text-center">
                <div className="text-lg font-bold">{stage.count.toLocaleString()}</div>
                <div className="text-xs opacity-80 truncate">{stage.name}</div>
              </div>
            </div>

            {/* Arrow with conversion rate */}
            {index < stages.length - 1 && (
              <div className="flex flex-col items-center px-2 text-xs text-muted-foreground">
                <span className="font-medium">{stage.conversionRate.toFixed(0)}%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ConversionFunnel({ data, loading }: ConversionFunnelProps) {
  const [selectedStage, setSelectedStage] = useState<FunnelStage | null>(null);
  const [view, setView] = useState<"vertical" | "horizontal">("vertical");

  const maxCount = data?.stages ? Math.max(...data.stages.map((s) => s.count)) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Conversion Funnel</CardTitle>
          {data && !loading && (
            <p className="text-sm text-muted-foreground mt-1">
              Overall conversion: <span className="font-medium">{data.overallConversion.toFixed(1)}%</span>
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setView("vertical")}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              view === "vertical"
                ? "bg-gray-100 text-gray-900"
                : "text-muted-foreground hover:text-gray-900"
            )}
          >
            Vertical
          </button>
          <button
            onClick={() => setView("horizontal")}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors",
              view === "horizontal"
                ? "bg-gray-100 text-gray-900"
                : "text-muted-foreground hover:text-gray-900"
            )}
          >
            Horizontal
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-12 mx-auto"
                style={{ width: `${100 - i * 10}%` }}
              />
            ))}
          </div>
        ) : view === "vertical" ? (
          <div className="space-y-0">
            {data?.stages.map((stage, index) => (
              <FunnelBar
                key={stage.id}
                stage={stage}
                index={index}
                totalStages={data.stages.length}
                maxCount={maxCount}
                onClick={() => setSelectedStage(stage)}
              />
            ))}
          </div>
        ) : (
          <HorizontalFunnel
            stages={data?.stages}
            loading={loading}
            onStageClick={setSelectedStage}
          />
        )}

        {/* Legend */}
        {data && !loading && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Good conversion (50%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Needs improvement (25-50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Critical (&lt;25%)</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Stage detail dialog */}
      <StageDetailDialog
        stage={selectedStage}
        open={!!selectedStage}
        onClose={() => setSelectedStage(null)}
      />
    </Card>
  );
}
