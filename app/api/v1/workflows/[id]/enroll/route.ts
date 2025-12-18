import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/v1/workflows/[id]/enroll - Manually enroll contact(s) in workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: workflowId } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contact_ids } = body;

    // Validate contact_ids
    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: "contact_ids array is required" },
        { status: 400 }
      );
    }

    // Fetch workflow
    const { data: workflow, error: workflowError } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (workflowError) {
      if (workflowError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 }
        );
      }
      throw workflowError;
    }

    // Check workflow status
    if (workflow.status !== "active") {
      return NextResponse.json(
        { error: "Can only enroll contacts in active workflows" },
        { status: 400 }
      );
    }

    // Check enrollment limit
    if (
      workflow.settings?.enrollment_limit &&
      workflow.enrolled_count >= workflow.settings.enrollment_limit
    ) {
      return NextResponse.json(
        { error: "Workflow has reached its enrollment limit" },
        { status: 400 }
      );
    }

    // Get first step of workflow
    const firstStep = workflow.steps?.[0];
    if (!firstStep) {
      return NextResponse.json(
        { error: "Workflow has no steps configured" },
        { status: 400 }
      );
    }

    // Check which contacts are already enrolled
    const { data: existingEnrollments } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .select("contact_id")
      .eq("workflow_id", workflowId)
      .in("contact_id", contact_ids)
      .in("status", ["active", "paused"]);

    const alreadyEnrolled = new Set(
      (existingEnrollments || []).map((e: any) => e.contact_id)
    );

    // Filter out already enrolled contacts (unless re-enrollment is allowed)
    let contactsToEnroll = contact_ids;
    if (!workflow.settings?.allow_re_enrollment) {
      contactsToEnroll = contact_ids.filter(
        (id: string) => !alreadyEnrolled.has(id)
      );
    }

    if (contactsToEnroll.length === 0) {
      return NextResponse.json({
        message: "All contacts are already enrolled",
        enrolled: 0,
        skipped: contact_ids.length,
      });
    }

    // Calculate when to execute first step
    const now = new Date();
    const nextStepAt = calculateNextStepTime(firstStep, now, workflow.settings);

    // Create enrollment records
    const enrollments = contactsToEnroll.map((contactId: string) => ({
      workflow_id: workflowId,
      contact_id: contactId,
      status: "active",
      current_step_id: firstStep.id,
      current_step_index: 0,
      enrolled_at: now.toISOString(),
      enrolled_by: user.id,
      next_step_at: nextStepAt.toISOString(),
      trigger_data: { source: "manual", enrolled_by: user.id },
    }));

    const { data: createdEnrollments, error: enrollError } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .insert(enrollments)
      .select();

    if (enrollError) {
      throw enrollError;
    }

    // Update workflow enrolled count
    await (supabase as any)
      .from("crm_workflows")
      .update({
        enrolled_count: workflow.enrolled_count + createdEnrollments.length,
        updated_at: now.toISOString(),
      })
      .eq("id", workflowId);

    // Log activity for each enrolled contact
    const activityLogs = createdEnrollments.map((enrollment: any) => ({
      contact_id: enrollment.contact_id,
      workspace_id: workflow.workspace_id,
      type: "workflow_enrolled",
      title: `Enrolled in workflow: ${workflow.name}`,
      description: `Contact was manually enrolled by user`,
      metadata: {
        workflow_id: workflowId,
        workflow_name: workflow.name,
        enrollment_id: enrollment.id,
      },
      created_by: user.id,
    }));

    await (supabase as any).from("crm_activities").insert(activityLogs);

    return NextResponse.json({
      message: `Successfully enrolled ${createdEnrollments.length} contact(s)`,
      enrolled: createdEnrollments.length,
      skipped: contact_ids.length - contactsToEnroll.length,
      enrollments: createdEnrollments,
    });
  } catch (error) {
    console.error("Error enrolling contacts:", error);
    return NextResponse.json(
      { error: "Failed to enroll contacts" },
      { status: 500 }
    );
  }
}

// GET /api/v1/workflows/[id]/enroll - Get enrollments for workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: workflowId } = await params;
    const { searchParams } = new URL(request.url);

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "25", 10);

    // Build query
    let query = (supabase as any)
      .from("crm_workflow_enrollments")
      .select(
        `
        *,
        contact:contact_id(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `,
        { count: "exact" }
      )
      .eq("workflow_id", workflowId)
      .order("enrolled_at", { ascending: false });

    // Apply status filter
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: enrollments, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get status counts
    const { data: statusCounts } = await (supabase as any)
      .from("crm_workflow_enrollments")
      .select("status")
      .eq("workflow_id", workflowId);

    const statusBreakdown: Record<string, number> = {
      active: 0,
      completed: 0,
      exited: 0,
      paused: 0,
      failed: 0,
    };

    if (statusCounts) {
      for (const row of statusCounts) {
        statusBreakdown[row.status] = (statusBreakdown[row.status] || 0) + 1;
      }
    }

    return NextResponse.json({
      enrollments: enrollments || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

// Calculate when to execute the next step
function calculateNextStepTime(
  step: any,
  now: Date,
  settings: any
): Date {
  // For wait steps, add the wait duration
  if (step.type === "wait") {
    const duration = step.config?.duration || 1;
    const unit = step.config?.unit || "days";

    const msPerUnit: Record<string, number> = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
    };

    return new Date(now.getTime() + duration * (msPerUnit[unit] || msPerUnit.days));
  }

  // For other steps, execute immediately (or with small delay)
  return new Date(now.getTime() + 1000); // 1 second delay
}
