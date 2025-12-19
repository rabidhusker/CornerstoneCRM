import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DealAnalytics, TimeSeriesDataPoint } from "@/types/report";
import {
  parseISO,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfDay,
  startOfWeek,
  startOfMonth,
  differenceInDays,
} from "date-fns";

// Value distribution ranges
const valueRanges = [
  { label: "$0 - $1K", min: 0, max: 1000 },
  { label: "$1K - $5K", min: 1000, max: 5000 },
  { label: "$5K - $10K", min: 5000, max: 10000 },
  { label: "$10K - $25K", min: 10000, max: 25000 },
  { label: "$25K - $50K", min: 25000, max: 50000 },
  { label: "$50K - $100K", min: 50000, max: 100000 },
  { label: "$100K+", min: 100000, max: Infinity },
];

// GET /api/v1/reports/deals - Get deal analytics
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

    // Get params
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const groupBy = (searchParams.get("groupBy") || "day") as "day" | "week" | "month";
    const pipelineId = searchParams.get("pipelineId");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const startDate = parseISO(startDateStr);
    const endDate = parseISO(endDateStr);

    // Build query for won deals (RLS will filter by workspace)
    let wonQuery = (supabase as any)
      .from("crm_deals")
      .select("id, value, created_at, closed_at, stage_id")
      .eq("status", "won")
      .gte("closed_at", startDate.toISOString())
      .lte("closed_at", endDate.toISOString())
      .order("closed_at", { ascending: true });

    if (pipelineId) {
      wonQuery = wonQuery.eq("pipeline_id", pipelineId);
    }

    const { data: wonDeals, error: wonError } = await wonQuery;
    if (wonError) throw wonError;

    // Build query for lost deals
    let lostQuery = (supabase as any)
      .from("crm_deals")
      .select("id, value, created_at, closed_at")
      .eq("status", "lost")
      .gte("closed_at", startDate.toISOString())
      .lte("closed_at", endDate.toISOString())
      .order("closed_at", { ascending: true });

    if (pipelineId) {
      lostQuery = lostQuery.eq("pipeline_id", pipelineId);
    }

    const { data: lostDeals, error: lostError } = await lostQuery;
    if (lostError) throw lostError;

    // Get all deals for stage analysis
    let allDealsQuery = (supabase as any)
      .from("crm_deals")
      .select(`
        id,
        value,
        created_at,
        closed_at,
        status,
        stage:stage_id(id, name, position)
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (pipelineId) {
      allDealsQuery = allDealsQuery.eq("pipeline_id", pipelineId);
    }

    const { data: allDeals, error: allError } = await allDealsQuery;
    if (allError) throw allError;

    // Generate time series intervals
    let intervals: Date[];
    let formatString: string;
    let startFn: (date: Date) => Date;

    switch (groupBy) {
      case "week":
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        formatString = "yyyy-MM-dd";
        startFn = startOfWeek;
        break;
      case "month":
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        formatString = "yyyy-MM-01";
        startFn = startOfMonth;
        break;
      case "day":
      default:
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        formatString = "yyyy-MM-dd";
        startFn = startOfDay;
    }

    // Generate won deals time series
    const wonTimeSeries: TimeSeriesDataPoint[] = intervals.map((interval) => {
      const intervalStart = startFn(interval);
      const nextInterval = groupBy === "month"
        ? startOfMonth(new Date(interval.getFullYear(), interval.getMonth() + 1, 1))
        : groupBy === "week"
        ? startOfWeek(new Date(interval.getTime() + 7 * 24 * 60 * 60 * 1000))
        : startOfDay(new Date(interval.getTime() + 24 * 60 * 60 * 1000));

      const count = (wonDeals || []).filter((deal: any) => {
        const closedAt = parseISO(deal.closed_at);
        return closedAt >= intervalStart && closedAt < nextInterval;
      }).length;

      return {
        date: format(interval, formatString),
        value: count,
      };
    });

    // Generate lost deals time series
    const lostTimeSeries: TimeSeriesDataPoint[] = intervals.map((interval) => {
      const intervalStart = startFn(interval);
      const nextInterval = groupBy === "month"
        ? startOfMonth(new Date(interval.getFullYear(), interval.getMonth() + 1, 1))
        : groupBy === "week"
        ? startOfWeek(new Date(interval.getTime() + 7 * 24 * 60 * 60 * 1000))
        : startOfDay(new Date(interval.getTime() + 24 * 60 * 60 * 1000));

      const count = (lostDeals || []).filter((deal: any) => {
        const closedAt = parseISO(deal.closed_at);
        return closedAt >= intervalStart && closedAt < nextInterval;
      }).length;

      return {
        date: format(interval, formatString),
        value: count,
      };
    });

    // Generate revenue time series
    const revenueTimeSeries: TimeSeriesDataPoint[] = intervals.map((interval) => {
      const intervalStart = startFn(interval);
      const nextInterval = groupBy === "month"
        ? startOfMonth(new Date(interval.getFullYear(), interval.getMonth() + 1, 1))
        : groupBy === "week"
        ? startOfWeek(new Date(interval.getTime() + 7 * 24 * 60 * 60 * 1000))
        : startOfDay(new Date(interval.getTime() + 24 * 60 * 60 * 1000));

      const revenue = (wonDeals || [])
        .filter((deal: any) => {
          const closedAt = parseISO(deal.closed_at);
          return closedAt >= intervalStart && closedAt < nextInterval;
        })
        .reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);

      return {
        date: format(interval, formatString),
        value: revenue,
      };
    });

    // Group by stage
    const stageCounts: Record<string, { count: number; value: number; totalCycleDays: number }> = {};
    (allDeals || []).forEach((deal: any) => {
      const stageName = deal.stage?.name || "Unknown";
      if (!stageCounts[stageName]) {
        stageCounts[stageName] = { count: 0, value: 0, totalCycleDays: 0 };
      }
      stageCounts[stageName].count++;
      stageCounts[stageName].value += deal.value || 0;

      if (deal.closed_at && deal.created_at) {
        const cycleDays = differenceInDays(parseISO(deal.closed_at), parseISO(deal.created_at));
        stageCounts[stageName].totalCycleDays += cycleDays;
      }
    });

    const byStage = Object.entries(stageCounts)
      .map(([stage, data]) => ({
        stage,
        count: data.count,
        value: data.value,
        avgCycleTime: data.count > 0 ? Math.round(data.totalCycleDays / data.count) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Value distribution
    const valueDistribution = valueRanges.map((range) => ({
      range: range.label,
      count: (wonDeals || []).filter((deal: any) => {
        const value = deal.value || 0;
        return value >= range.min && value < range.max;
      }).length,
    }));

    // Calculate win rate
    const totalClosed = (wonDeals?.length || 0) + (lostDeals?.length || 0);
    const winRate = totalClosed > 0 ? ((wonDeals?.length || 0) / totalClosed) * 100 : 0;

    // Calculate average deal value
    const totalRevenue = (wonDeals || []).reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    const avgDealValue = wonDeals && wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

    // Calculate average cycle time
    let avgCycleTime = 0;
    if (wonDeals && wonDeals.length > 0) {
      const totalCycleDays = wonDeals.reduce((sum: number, deal: any) => {
        if (deal.closed_at && deal.created_at) {
          return sum + differenceInDays(parseISO(deal.closed_at), parseISO(deal.created_at));
        }
        return sum;
      }, 0);
      avgCycleTime = Math.round(totalCycleDays / wonDeals.length);
    }

    const analytics: DealAnalytics = {
      wonDeals: wonTimeSeries,
      lostDeals: lostTimeSeries,
      revenue: revenueTimeSeries,
      byStage,
      valueDistribution,
      winRate,
      avgDealValue,
      avgCycleTime,
    };

    return NextResponse.json({
      analytics,
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching deal analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal analytics" },
      { status: 500 }
    );
  }
}
