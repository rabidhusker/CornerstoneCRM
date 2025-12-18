import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// GET /api/v1/deals - List deals
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const pipelineId = searchParams.get("pipelineId");
    const stageId = searchParams.get("stageId");
    const status = searchParams.get("status");
    const contactId = searchParams.get("contactId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    // Build query
    let query = supabase
      .from("crm_deals")
      .select(
        `
        *,
        pipeline:crm_pipelines!crm_deals_pipeline_id_fkey(id, name, is_default),
        stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color, position, probability, is_won_stage, is_lost_stage),
        contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email, phone)
      `,
        { count: "exact" }
      );

    // Apply filters
    if (pipelineId) {
      query = query.eq("pipeline_id", pipelineId);
    }

    if (stageId) {
      query = query.eq("stage_id", stageId);
    }

    if (status) {
      const statusArray = status.split(",") as ("open" | "won" | "lost")[];
      query = query.in("status", statusArray);
    }

    if (contactId) {
      query = query.eq("contact_id", contactId);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Order by stage position, then by created_at
    query = query.order("created_at", { ascending: false });

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deals, error, count } = await (query as any);

    if (error) {
      console.error("Error fetching deals:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      deals,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/v1/deals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/v1/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workspace
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: workspaceMemberData } = await (supabase as any)
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    const workspaceMember = workspaceMemberData as { workspace_id: string } | null;

    if (!workspaceMember) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }

    // Validate required fields
    const { title, pipelineId, stageId, contactId } = body;

    if (!title || !pipelineId || !stageId || !contactId) {
      return NextResponse.json(
        { error: "Missing required fields: title, pipelineId, stageId, contactId" },
        { status: 400 }
      );
    }

    // Prepare deal data
    const dealData = {
      workspace_id: workspaceMember.workspace_id,
      title: body.title,
      description: body.description || null,
      pipeline_id: body.pipelineId,
      stage_id: body.stageId,
      contact_id: body.contactId,
      assigned_to: body.assignedTo || null,
      value: body.value || null,
      expected_close_date: body.expectedCloseDate || null,
      property_address: body.propertyAddress || null,
      property_city: body.propertyCity || null,
      property_state: body.propertyState || null,
      property_zip: body.propertyZip || null,
      property_type: body.propertyType || null,
      property_bedrooms: body.propertyBedrooms || null,
      property_bathrooms: body.propertyBathrooms || null,
      property_sqft: body.propertySqft || null,
      property_year_built: body.propertyYearBuilt || null,
      property_list_price: body.propertyListPrice || null,
      property_mls_number: body.propertyMlsNumber || null,
      commission_rate: body.commissionRate || null,
      commission_amount: body.commissionAmount || null,
      tags: body.tags || [],
      custom_fields: (body.customFields || {}) as Json,
      status: "open" as const,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deal, error } = await (supabase as any)
      .from("crm_deals")
      .insert(dealData)
      .select(
        `
        *,
        pipeline:crm_pipelines!crm_deals_pipeline_id_fkey(id, name),
        stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color),
        contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email)
      `
      )
      .single();

    if (error) {
      console.error("Error creating deal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/v1/deals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
