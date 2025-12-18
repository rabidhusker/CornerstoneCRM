"use client";

import * as React from "react";
import Link from "next/link";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  ChevronDown,
  Download,
  Info,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { DealForecast, ForecastTable } from "@/components/features/pipelines/deal-forecast";
import { StageBreakdown } from "@/components/features/pipelines/pipeline-summary-cards";
import { usePipelines, usePipelineBoard } from "@/lib/hooks/use-pipelines";
import {
  calculateForecast,
  calculatePipelineSummary,
  formatCurrency,
  exportDealsToCSV,
  downloadCSV,
} from "@/lib/utils/deal-calculations";
import type { DealCard, PipelineStage } from "@/types/pipeline";

export default function ForecastPage() {
  const [selectedPipelineId, setSelectedPipelineId] = React.useState<string>("all");
  const [showWeighted, setShowWeighted] = React.useState(true);
  const [monthsAhead, setMonthsAhead] = React.useState(6);
  const [dateRange, setDateRange] = React.useState(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(addMonths(now, 5)),
    };
  });

  // Fetch pipelines
  const { data: pipelines, isLoading: pipelinesLoading } = usePipelines();

  // Fetch board data for selected pipeline
  const { data: boardData, isLoading: dealsLoading } = usePipelineBoard(
    selectedPipelineId === "all" ? undefined : selectedPipelineId
  );

  const pipelinesList = pipelines || [];

  // Get deals and stages from board data
  const deals: DealCard[] = React.useMemo(() => {
    if (!boardData?.stages) return [];
    return boardData.stages.flatMap((s) => s.deals);
  }, [boardData]);

  const stages: PipelineStage[] = React.useMemo(() => {
    if (!boardData?.stages) return [];
    return boardData.stages as PipelineStage[];
  }, [boardData]);

  // Calculate forecast data
  const forecast = React.useMemo(() => {
    const openDeals = deals.filter((d) => d.status === "open");
    return calculateForecast(openDeals, stages, dateRange);
  }, [deals, stages, dateRange]);

  // Calculate previous period for comparison
  const previousPeriodForecast = React.useMemo(() => {
    const openDeals = deals.filter((d) => d.status === "open");
    const monthCount = monthsAhead;
    const prevDateRange = {
      from: subMonths(dateRange.from, monthCount),
      to: subMonths(dateRange.to, monthCount),
    };
    return calculateForecast(openDeals, stages, prevDateRange);
  }, [deals, stages, dateRange, monthsAhead]);

  // Calculate summary for stage breakdown
  const summary = React.useMemo(() => {
    if (deals.length === 0) return null;
    return calculatePipelineSummary(deals, stages);
  }, [deals, stages]);

  // Total forecast value
  const totalForecast = React.useMemo(() => {
    return forecast.reduce(
      (sum, m) => sum + (showWeighted ? m.weightedValue : m.unweightedValue),
      0
    );
  }, [forecast, showWeighted]);

  // Handle date range presets
  const handleMonthsChange = (months: string) => {
    const count = parseInt(months);
    setMonthsAhead(count);
    const now = new Date();
    setDateRange({
      from: startOfMonth(now),
      to: endOfMonth(addMonths(now, count - 1)),
    });
  };

  // Export forecast
  const handleExport = () => {
    const openDeals = deals.filter((d) => d.status === "open");
    const csvContent = exportDealsToCSV(openDeals, stages);
    const filename = `forecast-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    downloadCSV(csvContent, filename);
  };

  const isLoading = pipelinesLoading || dealsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pipelines">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Revenue Forecast</h1>
            <p className="text-muted-foreground">
              Projected revenue based on expected close dates
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Pipeline Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Pipeline</Label>
              <Select
                value={selectedPipelineId}
                onValueChange={setSelectedPipelineId}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Pipelines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pipelines</SelectItem>
                  {pipelinesList.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Range */}
            <div className="space-y-1.5">
              <Label className="text-xs">Forecast Period</Label>
              <Select
                value={monthsAhead.toString()}
                onValueChange={handleMonthsChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="9">9 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            <div className="space-y-1.5">
              <Label className="text-xs">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[260px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Separator orientation="vertical" className="h-10" />

            {/* Weighted Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="weighted"
                checked={showWeighted}
                onCheckedChange={setShowWeighted}
              />
              <Label htmlFor="weighted" className="text-sm cursor-pointer">
                Show Weighted Values
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Weighted values multiply deal amounts by their stage
                      probability percentage.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Forecast ({monthsAhead} months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(totalForecast)}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {showWeighted ? "Weighted by probability" : "Unweighted total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-bold">
                {deals.filter((d) => d.status === "open").length}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              In forecast period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Value</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-28" />
            ) : (
              <div className="text-3xl font-bold">
                {formatCurrency(
                  deals.filter((d) => d.value).length > 0
                    ? deals.filter((d) => d.value).reduce((sum, d) => sum + (d.value || 0), 0) /
                        deals.filter((d) => d.value).length
                    : 0
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">Per deal</p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <DealForecast
          deals={deals}
          stages={stages}
          monthsAhead={monthsAhead}
        />
      )}

      {/* Detailed Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Forecast by Month</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <ForecastTable
                  forecast={forecast}
                  showWeighted={showWeighted}
                  previousPeriod={previousPeriodForecast}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stage Breakdown */}
        <div>
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Value by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : summary ? (
            <StageBreakdown summary={summary} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Value by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  No deals to display
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
