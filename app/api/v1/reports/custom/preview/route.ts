import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildReportQuery } from "@/lib/reports/report-engine";
import type { CustomReportConfig } from "@/types/report";

// POST /api/v1/reports/custom/preview - Preview report without saving
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
    const { config, limit = 100, offset = 0 } = body as {
      config: CustomReportConfig;
      limit?: number;
      offset?: number;
    };

    // Validate config
    if (!config.dataSource || !config.columns?.length) {
      return NextResponse.json(
        { error: "Data source and at least one column are required" },
        { status: 400 }
      );
    }

    // Execute the report query
    const result = await buildReportQuery(supabase, config, { limit, offset });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error previewing report:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to preview report" },
      { status: 500 }
    );
  }
}
