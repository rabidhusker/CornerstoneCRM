import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildReportQuery } from "@/lib/reports/report-engine";
import type { CustomReportConfig, CustomReport, ReportPreviewResult } from "@/types/report";

// GET /api/v1/reports/custom/[id] - Get report with data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if we should execute the report
    const searchParams = request.nextUrl.searchParams;
    const execute = searchParams.get("execute") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get report (RLS will filter by workspace)
    const { data: report, error } = await (supabase as any)
      .from("crm_custom_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
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

    // Execute report if requested
    let result: ReportPreviewResult | undefined;
    if (execute) {
      result = await buildReportQuery(supabase, report.config, { limit, offset });
    }

    return NextResponse.json({
      report: customReport,
      result,
    });
  } catch (error) {
    console.error("Error fetching custom report:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom report" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/reports/custom/[id] - Update report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { config, schedule, is_favorite } = body;

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (config !== undefined) {
      updates.config = config;
      updates.name = config.name;
      updates.description = config.description;
    }

    if (schedule !== undefined) {
      updates.schedule = schedule;
    }

    if (is_favorite !== undefined) {
      updates.is_favorite = is_favorite;
    }

    // Update report (RLS will ensure user has access)
    const { data: report, error } = await (supabase as any)
      .from("crm_custom_reports")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
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

    return NextResponse.json({ report: customReport });
  } catch (error) {
    console.error("Error updating custom report:", error);
    return NextResponse.json(
      { error: "Failed to update custom report" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/reports/custom/[id] - Delete report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete report (RLS will ensure user has access)
    const { error } = await (supabase as any)
      .from("crm_custom_reports")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom report:", error);
    return NextResponse.json(
      { error: "Failed to delete custom report" },
      { status: 500 }
    );
  }
}
