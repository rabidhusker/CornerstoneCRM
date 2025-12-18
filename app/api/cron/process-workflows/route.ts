import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "@/lib/workflows/workflow-engine";

// Maximum number of enrollments to process in a single run
const BATCH_SIZE = 100;

// Maximum time to spend processing (in ms)
const MAX_PROCESSING_TIME = 55000; // 55 seconds (leaving buffer for cron timeout)

/**
 * POST /api/cron/process-workflows
 *
 * Cron endpoint for processing workflow steps.
 * Should be called periodically (e.g., every minute) by a cron service.
 *
 * Security: Verify cron secret in production
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret in production
    const cronSecret = request.headers.get("x-cron-secret");
    if (process.env.NODE_ENV === "production") {
      if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Fetch enrollments that are ready to process
    const { data: enrollments, error } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .select("id, workflow_id, contact_id, current_step_id")
      .eq("status", "active")
      .lte("next_step_at", now)
      .order("next_step_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) {
      console.error("Error fetching enrollments:", error);
      return NextResponse.json(
        { error: "Failed to fetch enrollments" },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        message: "No enrollments to process",
        processed: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`Processing ${enrollments.length} workflow enrollments`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: Array<{ enrollment_id: string; error: string }> = [];

    // Process each enrollment
    for (const enrollment of enrollments) {
      // Check if we're running out of time
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        console.log("Approaching timeout, stopping processing");
        break;
      }

      try {
        const success = await WorkflowEngine.processStep(enrollment.id);

        if (success) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
        failed++;
        errors.push({
          enrollment_id: enrollment.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      processed++;
    }

    const duration = Date.now() - startTime;

    console.log(
      `Workflow processing complete: ${succeeded} succeeded, ${failed} failed, ${duration}ms`
    );

    return NextResponse.json({
      message: "Workflow processing complete",
      processed,
      succeeded,
      failed,
      remaining: enrollments.length - processed,
      duration_ms: duration,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in workflow cron:", error);
    return NextResponse.json(
      {
        error: "Failed to process workflows",
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-workflows
 *
 * Health check endpoint to verify cron is accessible
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    // Get counts of pending enrollments
    const { count: pendingCount } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .lte("next_step_at", now);

    const { count: activeCount } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: workflowCount } = await (supabase as any)
      .from("crm_workflows")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    return NextResponse.json({
      status: "ok",
      timestamp: now,
      stats: {
        pending_enrollments: pendingCount || 0,
        active_enrollments: activeCount || 0,
        active_workflows: workflowCount || 0,
      },
    });
  } catch (error) {
    console.error("Error in workflow cron health check:", error);
    return NextResponse.json(
      { status: "error", error: "Failed to check status" },
      { status: 500 }
    );
  }
}
