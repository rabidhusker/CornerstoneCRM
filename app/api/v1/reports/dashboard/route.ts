import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DashboardMetrics, KpiMetric } from "@/types/report";
import { calculateTrend } from "@/types/report";
import { parseISO, subDays, differenceInDays } from "date-fns";

// Calculate metric with trend
function createMetric(
  label: string,
  current: number,
  previous: number,
  format: KpiMetric["format"]
): KpiMetric {
  return {
    label,
    value: current,
    previousValue: previous,
    format,
    trend: calculateTrend(current, previous),
  };
}

// GET /api/v1/reports/dashboard - Get dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date range from params
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);
    const periodDays = differenceInDays(endDate, startDate) + 1;

    // Calculate previous period dates
    const previousEndDate = subDays(startDate, 1);
    const previousStartDate = subDays(previousEndDate, periodDays - 1);

    // Fetch current period contacts (RLS will filter by workspace)
    const { count: totalContacts } = await (supabase as any)
      .from("crm_contacts")
      .select("*", { count: "exact", head: true });

    const { count: newContacts } = await (supabase as any)
      .from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    // Previous period contacts
    const { count: previousNewContacts } = await (supabase as any)
      .from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", previousStartDate.toISOString())
      .lte("created_at", previousEndDate.toISOString());

    // Fetch current period deals
    const { count: totalDeals } = await (supabase as any)
      .from("crm_deals")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "pending"]);

    const { data: wonDealsData } = await (supabase as any)
      .from("crm_deals")
      .select("value")
      .eq("status", "won")
      .gte("closed_at", startDate.toISOString())
      .lte("closed_at", endDate.toISOString());

    const wonDeals = wonDealsData?.length || 0;
    const revenue = wonDealsData?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0;

    // Previous period won deals
    const { data: previousWonDealsData } = await (supabase as any)
      .from("crm_deals")
      .select("value")
      .eq("status", "won")
      .gte("closed_at", previousStartDate.toISOString())
      .lte("closed_at", previousEndDate.toISOString());

    const previousWonDeals = previousWonDealsData?.length || 0;
    const previousRevenue = previousWonDealsData?.reduce(
      (sum: number, deal: any) => sum + (deal.value || 0),
      0
    ) || 0;

    // Calculate conversion rate
    const { count: closedDeals } = await (supabase as any)
      .from("crm_deals")
      .select("*", { count: "exact", head: true })
      .in("status", ["won", "lost"])
      .gte("closed_at", startDate.toISOString())
      .lte("closed_at", endDate.toISOString());

    const conversionRate = closedDeals && closedDeals > 0
      ? (wonDeals / closedDeals) * 100
      : 0;

    // Previous period conversion rate
    const { count: previousClosedDeals } = await (supabase as any)
      .from("crm_deals")
      .select("*", { count: "exact", head: true })
      .in("status", ["won", "lost"])
      .gte("closed_at", previousStartDate.toISOString())
      .lte("closed_at", previousEndDate.toISOString());

    const previousConversionRate =
      previousClosedDeals && previousClosedDeals > 0
        ? (previousWonDeals / previousClosedDeals) * 100
        : 0;

    // Calculate average deal value
    const avgDealValue = wonDeals > 0 ? revenue / wonDeals : 0;
    const previousAvgDealValue = previousWonDeals > 0 ? previousRevenue / previousWonDeals : 0;

    // Calculate average deal cycle (days from creation to close)
    const { data: cycleData } = await (supabase as any)
      .from("crm_deals")
      .select("created_at, closed_at")
      .eq("status", "won")
      .gte("closed_at", startDate.toISOString())
      .lte("closed_at", endDate.toISOString())
      .not("closed_at", "is", null);

    let avgDealCycle = 0;
    if (cycleData && cycleData.length > 0) {
      const totalDays = cycleData.reduce((sum: number, deal: any) => {
        const created = parseISO(deal.created_at);
        const closed = parseISO(deal.closed_at);
        return sum + differenceInDays(closed, created);
      }, 0);
      avgDealCycle = totalDays / cycleData.length;
    }

    // Previous period average deal cycle
    const { data: previousCycleData } = await (supabase as any)
      .from("crm_deals")
      .select("created_at, closed_at")
      .eq("status", "won")
      .gte("closed_at", previousStartDate.toISOString())
      .lte("closed_at", previousEndDate.toISOString())
      .not("closed_at", "is", null);

    let previousAvgDealCycle = 0;
    if (previousCycleData && previousCycleData.length > 0) {
      const totalDays = previousCycleData.reduce((sum: number, deal: any) => {
        const created = parseISO(deal.created_at);
        const closed = parseISO(deal.closed_at);
        return sum + differenceInDays(closed, created);
      }, 0);
      previousAvgDealCycle = totalDays / previousCycleData.length;
    }

    // Build metrics response
    const metrics: DashboardMetrics = {
      totalContacts: createMetric("Total Contacts", totalContacts || 0, totalContacts || 0, "number"),
      newContacts: createMetric("New Contacts", newContacts || 0, previousNewContacts || 0, "number"),
      totalDeals: createMetric("Active Deals", totalDeals || 0, totalDeals || 0, "number"),
      wonDeals: createMetric("Won Deals", wonDeals, previousWonDeals, "number"),
      revenue: createMetric("Revenue", revenue, previousRevenue, "currency"),
      conversionRate: createMetric("Conversion Rate", conversionRate, previousConversionRate, "percentage"),
      avgDealValue: createMetric("Avg Deal Value", avgDealValue, previousAvgDealValue, "currency"),
      avgDealCycle: createMetric("Avg Deal Cycle", avgDealCycle, previousAvgDealCycle, "number"),
    };

    return NextResponse.json({
      metrics,
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
