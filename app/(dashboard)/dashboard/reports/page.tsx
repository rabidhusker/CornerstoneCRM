"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/features/reports/date-range-picker";
import { KpiCards } from "@/components/features/reports/kpi-cards";
import { ContactsChart } from "@/components/features/reports/contacts-chart";
import { DealsChart } from "@/components/features/reports/deals-chart";
import { ConversionFunnel } from "@/components/features/reports/conversion-funnel";
import { ActivityReport } from "@/components/features/reports/activity-report";
import { Leaderboard } from "@/components/features/reports/leaderboard";
import {
  useDashboardMetrics,
  useContactAnalytics,
  useDealAnalytics,
  useConversionFunnel,
  useActivitySummary,
  useLeaderboard,
} from "@/lib/hooks/use-reports";
import type { DateRange } from "@/types/report";
import { getDateRangeFromPreset } from "@/types/report";
import { RefreshCw, Download, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeFromPreset("last30days")
  );

  // Fetch all report data
  const dashboard = useDashboardMetrics(dateRange);
  const contacts = useContactAnalytics(dateRange);
  const deals = useDealAnalytics(dateRange);
  const funnel = useConversionFunnel(dateRange);
  const activities = useActivitySummary(dateRange);
  const leaderboard = useLeaderboard(dateRange);

  // Check if any data is loading
  const isLoading =
    dashboard.isLoading ||
    contacts.isLoading ||
    deals.isLoading ||
    funnel.isLoading ||
    activities.isLoading ||
    leaderboard.isLoading;

  // Refresh all data
  const handleRefresh = () => {
    dashboard.refetch();
    contacts.refetch();
    deals.refetch();
    funnel.refetch();
    activities.refetch();
    leaderboard.refetch();
  };

  // Export report (placeholder)
  const handleExport = () => {
    // TODO: Implement export functionality
    alert("Export functionality coming soon!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your sales performance and business metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards
        metrics={dashboard.data}
        loading={dashboard.isLoading}
        showComparison={dateRange.compareToLastPeriod}
      />

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ContactsChart data={contacts.data} loading={contacts.isLoading} />
        <DealsChart data={deals.data} loading={deals.isLoading} />
      </div>

      {/* Conversion Funnel */}
      <ConversionFunnel data={funnel.data} loading={funnel.isLoading} />

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityReport data={activities.data} loading={activities.isLoading} />
        <Leaderboard data={leaderboard.data} loading={leaderboard.isLoading} />
      </div>

      {/* Footer note */}
      <div className="text-center text-sm text-muted-foreground pb-4">
        Data refreshed at {new Date().toLocaleTimeString()}
        {dateRange.compareToLastPeriod && (
          <span className="block mt-1">
            Comparing to previous period of the same length
          </span>
        )}
      </div>
    </div>
  );
}
