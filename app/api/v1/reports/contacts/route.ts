import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContactAnalytics, TimeSeriesDataPoint } from "@/types/report";
import {
  parseISO,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  differenceInDays,
} from "date-fns";

// GET /api/v1/reports/contacts - Get contact analytics
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
    const source = searchParams.get("source");

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

    // Build query (RLS will filter by workspace)
    let query = (supabase as any)
      .from("crm_contacts")
      .select("id, created_at, source, status")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (source) {
      query = query.eq("source", source);
    }

    const { data: contacts, error } = await query;

    if (error) {
      throw error;
    }

    // Generate time series data
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

    // Count contacts per interval
    const timeSeries: TimeSeriesDataPoint[] = intervals.map((interval) => {
      const intervalStart = startFn(interval);
      const nextInterval = groupBy === "month"
        ? startOfMonth(new Date(interval.getFullYear(), interval.getMonth() + 1, 1))
        : groupBy === "week"
        ? startOfWeek(new Date(interval.getTime() + 7 * 24 * 60 * 60 * 1000))
        : startOfDay(new Date(interval.getTime() + 24 * 60 * 60 * 1000));

      const count = (contacts || []).filter((contact: any) => {
        const createdAt = parseISO(contact.created_at);
        return createdAt >= intervalStart && createdAt < nextInterval;
      }).length;

      return {
        date: format(interval, formatString),
        value: count,
      };
    });

    // Group by source
    const sourceCounts: Record<string, number> = {};
    (contacts || []).forEach((contact: any) => {
      const src = contact.source || "unknown";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const totalContacts = contacts?.length || 0;
    const bySource = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalContacts > 0 ? (count / totalContacts) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Group by status
    const statusCounts: Record<string, number> = {};
    (contacts || []).forEach((contact: any) => {
      const status = contact.status || "active";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const byStatus = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count,
        percentage: totalContacts > 0 ? (count / totalContacts) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Get previous period count for growth
    const { count: previousCount } = await (supabase as any)
      .from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", previousStartDate.toISOString())
      .lte("created_at", previousEndDate.toISOString());

    const growth = {
      current: totalContacts,
      previous: previousCount || 0,
      percentageChange:
        previousCount && previousCount > 0
          ? ((totalContacts - previousCount) / previousCount) * 100
          : totalContacts > 0
          ? 100
          : 0,
    };

    const analytics: ContactAnalytics = {
      timeSeries,
      bySource,
      byStatus,
      growth,
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
    console.error("Error fetching contact analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact analytics" },
      { status: 500 }
    );
  }
}
