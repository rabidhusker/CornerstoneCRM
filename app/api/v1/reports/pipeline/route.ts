import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface DealRow {
  id: string;
  title: string;
  value: number | null;
  status: string;
  stage_id: string;
  pipeline_id: string;
  expected_close_date: string | null;
  created_at: string;
  closed_at: string | null;
}

interface StageRow {
  id: string;
  name: string;
  pipeline_id: string;
  position: number;
  color: string;
  probability: number | null;
  is_won_stage: boolean;
  is_lost_stage: boolean;
}

// GET /api/v1/reports/pipeline - Get pipeline analytics
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get("pipelineId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get user's workspace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // Build deals query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dealsQuery = (supabase as any)
      .from("crm_deals")
      .select("*")
      .eq("workspace_id", membership.workspace_id);

    if (pipelineId) {
      dealsQuery = dealsQuery.eq("pipeline_id", pipelineId);
    }

    const { data: deals, error: dealsError } = await dealsQuery;

    if (dealsError) {
      console.error("Error fetching deals:", dealsError);
      return NextResponse.json({ error: dealsError.message }, { status: 500 });
    }

    // Get stages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stagesQuery = (supabase as any)
      .from("crm_pipeline_stages")
      .select("*")
      .order("position", { ascending: true });

    if (pipelineId) {
      stagesQuery = stagesQuery.eq("pipeline_id", pipelineId);
    }

    const { data: stages, error: stagesError } = await stagesQuery;

    if (stagesError) {
      console.error("Error fetching stages:", stagesError);
      return NextResponse.json({ error: stagesError.message }, { status: 500 });
    }

    const typedDeals = deals as DealRow[];
    const typedStages = stages as StageRow[];

    // Calculate summary statistics
    const openDeals = typedDeals.filter((d) => d.status === "open");
    const wonDeals = typedDeals.filter((d) => d.status === "won");
    const lostDeals = typedDeals.filter((d) => d.status === "lost");

    // Calculate values
    const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const totalLostValue = lostDeals.reduce((sum, d) => sum + (d.value || 0), 0);

    // Calculate weighted value
    const stageMap = new Map(typedStages.map((s) => [s.id, s]));
    const weightedValue = openDeals.reduce((sum, d) => {
      const stage = stageMap.get(d.stage_id);
      const probability = stage?.probability ?? 50;
      return sum + (d.value || 0) * (probability / 100);
    }, 0);

    // Calculate win rate
    const closedDeals = wonDeals.length + lostDeals.length;
    const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;

    // Calculate average deal size
    const dealsWithValue = typedDeals.filter((d) => d.value && d.value > 0);
    const avgDealSize =
      dealsWithValue.length > 0
        ? dealsWithValue.reduce((sum, d) => sum + (d.value || 0), 0) / dealsWithValue.length
        : 0;

    // Calculate average time to close (for won deals)
    const wonDealsWithDates = wonDeals.filter((d) => d.closed_at && d.created_at);
    let avgDaysToClose = 0;
    if (wonDealsWithDates.length > 0) {
      const totalDays = wonDealsWithDates.reduce((sum, d) => {
        const created = new Date(d.created_at).getTime();
        const closed = new Date(d.closed_at!).getTime();
        const days = Math.max(0, (closed - created) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgDaysToClose = totalDays / wonDealsWithDates.length;
    }

    // Stage breakdown
    const stageBreakdown = typedStages
      .filter((s) => !s.is_won_stage && !s.is_lost_stage)
      .map((stage) => {
        const stageDeals = openDeals.filter((d) => d.stage_id === stage.id);
        const stageTotalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const stageWeightedValue = stageTotalValue * ((stage.probability ?? 50) / 100);

        return {
          stageId: stage.id,
          stageName: stage.name,
          color: stage.color,
          position: stage.position,
          probability: stage.probability,
          dealCount: stageDeals.length,
          totalValue: stageTotalValue,
          weightedValue: stageWeightedValue,
        };
      });

    // Monthly trends (last 12 months)
    const now = new Date();
    const monthlyTrends = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

      const monthDealsCreated = typedDeals.filter((d) => {
        const created = new Date(d.created_at);
        return created >= monthStart && created <= monthEnd;
      });

      const monthDealsWon = wonDeals.filter((d) => {
        if (!d.closed_at) return false;
        const closed = new Date(d.closed_at);
        return closed >= monthStart && closed <= monthEnd;
      });

      const monthDealsLost = lostDeals.filter((d) => {
        if (!d.closed_at) return false;
        const closed = new Date(d.closed_at);
        return closed >= monthStart && closed <= monthEnd;
      });

      monthlyTrends.push({
        month: monthKey,
        monthLabel: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        dealsCreated: monthDealsCreated.length,
        valueCreated: monthDealsCreated.reduce((sum, d) => sum + (d.value || 0), 0),
        dealsWon: monthDealsWon.length,
        valueWon: monthDealsWon.reduce((sum, d) => sum + (d.value || 0), 0),
        dealsLost: monthDealsLost.length,
        valueLost: monthDealsLost.reduce((sum, d) => sum + (d.value || 0), 0),
      });
    }

    // Forecast (next 6 months)
    const forecast = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

      const monthDeals = openDeals.filter((d) => {
        if (!d.expected_close_date) return false;
        const closeDate = new Date(d.expected_close_date);
        return closeDate >= monthStart && closeDate <= monthEnd;
      });

      const unweightedValue = monthDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const monthWeightedValue = monthDeals.reduce((sum, d) => {
        const stage = stageMap.get(d.stage_id);
        const probability = stage?.probability ?? 50;
        return sum + (d.value || 0) * (probability / 100);
      }, 0);

      forecast.push({
        month: monthKey,
        monthLabel: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        dealCount: monthDeals.length,
        unweightedValue,
        weightedValue: monthWeightedValue,
      });
    }

    return NextResponse.json({
      summary: {
        totalDeals: typedDeals.length,
        openDeals: openDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        totalOpenValue,
        totalWonValue,
        totalLostValue,
        weightedValue,
        winRate,
        avgDealSize,
        avgDaysToClose,
      },
      stageBreakdown,
      monthlyTrends,
      forecast,
    });
  } catch (error) {
    console.error("Error in GET /api/v1/reports/pipeline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
