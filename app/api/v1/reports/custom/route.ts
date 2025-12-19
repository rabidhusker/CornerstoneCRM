import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CustomReportConfig, CustomReport } from "@/types/report";

// GET /api/v1/reports/custom - List saved reports
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
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const favorite = searchParams.get("favorite");

    // Build query (RLS will filter by workspace)
    let query = (supabase as any)
      .from("crm_custom_reports")
      .select("*")
      .order("updated_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (favorite === "true") {
      query = query.eq("is_favorite", true);
    }

    const { data: reports, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === "42P01") {
        return NextResponse.json({ reports: [] });
      }
      throw error;
    }

    // Transform to CustomReport type
    const customReports: CustomReport[] = (reports || []).map((report: any) => ({
      id: report.id,
      name: report.name,
      description: report.description,
      config: report.config as CustomReportConfig,
      created_by: report.created_by,
      created_at: report.created_at,
      updated_at: report.updated_at,
      is_favorite: report.is_favorite,
      schedule: report.schedule,
    }));

    return NextResponse.json({ reports: customReports });
  } catch (error) {
    console.error("Error fetching custom reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom reports" },
      { status: 500 }
    );
  }
}

// POST /api/v1/reports/custom - Create new report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { config, schedule } = body as {
      config: CustomReportConfig;
      schedule?: any;
    };

    // Validate config
    if (!config.name || !config.dataSource || !config.columns?.length) {
      return NextResponse.json(
        { error: "Report name, data source, and at least one column are required" },
        { status: 400 }
      );
    }

    // Get workspace ID from user's profile
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json(
        { error: "User workspace not found" },
        { status: 400 }
      );
    }

    // Create report
    const { data: report, error } = await (supabase as any)
      .from("crm_custom_reports")
      .insert({
        name: config.name,
        description: config.description,
        config,
        schedule,
        workspace_id: profile.workspace_id,
        created_by: user.id,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, provide helpful error
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Custom reports table not found. Please run migrations." },
          { status: 500 }
        );
      }
      throw error;
    }

    const customReport: CustomReport = {
      id: report.id,
      name: report.name,
      description: report.description,
      config: report.config,
      created_by: report.created_by,
      created_at: report.created_at,
      updated_at: report.updated_at,
      is_favorite: report.is_favorite,
      schedule: report.schedule,
    };

    return NextResponse.json({ report: customReport }, { status: 201 });
  } catch (error) {
    console.error("Error creating custom report:", error);
    return NextResponse.json(
      { error: "Failed to create custom report" },
      { status: 500 }
    );
  }
}
