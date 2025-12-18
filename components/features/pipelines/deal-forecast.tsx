"use client";

import * as React from "react";
import { addMonths, startOfMonth, endOfMonth } from "date-fns";
import { BarChart3, TrendingUp, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateForecast,
  formatCurrency,
  type ForecastMonth,
} from "@/lib/utils/deal-calculations";
import type { DealCard, PipelineStage } from "@/types/pipeline";

interface DealForecastProps {
  deals: DealCard[];
  stages: PipelineStage[];
  isLoading?: boolean;
  monthsAhead?: number;
  compact?: boolean;
}

export function DealForecast({
  deals,
  stages,
  isLoading,
  monthsAhead = 6,
  compact = false,
}: DealForecastProps) {
  const [showWeighted, setShowWeighted] = React.useState(true);

  const forecast = React.useMemo(() => {
    if (isLoading) return [];

    const openDeals = deals.filter((d) => d.status === "open");
    const now = new Date();
    const dateRange = {
      from: startOfMonth(now),
      to: endOfMonth(addMonths(now, monthsAhead - 1)),
    };

    return calculateForecast(openDeals, stages, dateRange);
  }, [deals, stages, isLoading, monthsAhead]);

  const totalForecast = React.useMemo(() => {
    return forecast.reduce(
      (sum, m) => sum + (showWeighted ? m.weightedValue : m.unweightedValue),
      0
    );
  }, [forecast, showWeighted]);

  const maxValue = React.useMemo(() => {
    return Math.max(
      ...forecast.map((m) =>
        showWeighted ? m.weightedValue : m.unweightedValue
      ),
      1
    );
  }, [forecast, showWeighted]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 flex-1" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {monthsAhead}-Month Forecast
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalForecast)}
          </div>
          <p className="text-xs text-muted-foreground">
            {showWeighted ? "Weighted" : "Unweighted"} pipeline value
          </p>
          <div className="mt-4 flex items-center gap-1">
            {forecast.map((month) => (
              <TooltipProvider key={month.month}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1">
                      <div
                        className="bg-primary rounded-sm transition-all"
                        style={{
                          height: `${Math.max(
                            ((showWeighted ? month.weightedValue : month.unweightedValue) /
                              maxValue) *
                              40,
                            4
                          )}px`,
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{month.monthLabel}</p>
                    <p>
                      {formatCurrency(
                        showWeighted ? month.weightedValue : month.unweightedValue
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {month.dealCount} deal{month.dealCount !== 1 ? "s" : ""}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Revenue Forecast</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Forecast based on expected close dates. Weighted values
                    factor in stage probability percentages.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="weighted-toggle" className="text-sm text-muted-foreground">
              Show Weighted
            </Label>
            <Switch
              id="weighted-toggle"
              checked={showWeighted}
              onCheckedChange={setShowWeighted}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Total Forecast */}
        <div className="mb-6">
          <div className="text-3xl font-bold">{formatCurrency(totalForecast)}</div>
          <p className="text-sm text-muted-foreground">
            {showWeighted ? "Weighted" : "Unweighted"} forecast for next{" "}
            {monthsAhead} months
          </p>
        </div>

        {/* Chart */}
        <div className="space-y-4">
          {/* Bar Chart */}
          <div className="flex items-end gap-2 h-48">
            {forecast.map((month) => {
              const value = showWeighted
                ? month.weightedValue
                : month.unweightedValue;
              const height = (value / maxValue) * 100;

              return (
                <TooltipProvider key={month.month}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center h-40">
                          <div
                            className={cn(
                              "w-full max-w-16 bg-primary rounded-t transition-all hover:opacity-80",
                              value === 0 && "bg-muted"
                            )}
                            style={{
                              height: `${Math.max(height, 2)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {month.monthLabel.split(" ")[0]}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{month.monthLabel}</p>
                        <p>
                          {showWeighted ? "Weighted: " : "Total: "}
                          {formatCurrency(value)}
                        </p>
                        {showWeighted && (
                          <p className="text-xs text-muted-foreground">
                            Unweighted: {formatCurrency(month.unweightedValue)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {month.dealCount} deal{month.dealCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Month Values Table */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-4 border-t">
            {forecast.map((month) => (
              <div key={month.month} className="text-center">
                <p className="text-xs text-muted-foreground">{month.monthLabel}</p>
                <p className="font-medium">
                  {formatCurrency(
                    showWeighted ? month.weightedValue : month.unweightedValue
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {month.dealCount} deals
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Detailed forecast table component
interface ForecastTableProps {
  forecast: ForecastMonth[];
  showWeighted: boolean;
  previousPeriod?: ForecastMonth[];
}

export function ForecastTable({
  forecast,
  showWeighted,
  previousPeriod,
}: ForecastTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Month</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Deals</th>
            <th className="px-4 py-3 text-right text-sm font-medium">
              {showWeighted ? "Weighted Value" : "Total Value"}
            </th>
            {previousPeriod && (
              <th className="px-4 py-3 text-right text-sm font-medium">
                vs Previous
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y">
          {forecast.map((month, index) => {
            const value = showWeighted
              ? month.weightedValue
              : month.unweightedValue;
            const prevMonth = previousPeriod?.[index];
            const prevValue = prevMonth
              ? showWeighted
                ? prevMonth.weightedValue
                : prevMonth.unweightedValue
              : 0;
            const change = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0;

            return (
              <tr key={month.month} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-sm">{month.monthLabel}</td>
                <td className="px-4 py-3 text-sm text-right">{month.dealCount}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  {formatCurrency(value)}
                </td>
                {previousPeriod && (
                  <td className="px-4 py-3 text-sm text-right">
                    {prevValue > 0 ? (
                      <span
                        className={cn(
                          change > 0
                            ? "text-green-600"
                            : change < 0
                            ? "text-red-600"
                            : ""
                        )}
                      >
                        {change > 0 ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-muted font-medium">
          <tr>
            <td className="px-4 py-3 text-sm">Total</td>
            <td className="px-4 py-3 text-sm text-right">
              {forecast.reduce((sum, m) => sum + m.dealCount, 0)}
            </td>
            <td className="px-4 py-3 text-sm text-right">
              {formatCurrency(
                forecast.reduce(
                  (sum, m) =>
                    sum + (showWeighted ? m.weightedValue : m.unweightedValue),
                  0
                )
              )}
            </td>
            {previousPeriod && <td className="px-4 py-3 text-sm text-right" />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
