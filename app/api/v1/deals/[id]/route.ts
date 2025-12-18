import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// GET /api/v1/deals/[id] - Get a single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deal, error } = await (supabase as any)
      .from("crm_deals")
      .select(
        `
        *,
        pipeline:crm_pipelines!crm_deals_pipeline_id_fkey(id, name, is_default),
        stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color, position, probability, is_won_stage, is_lost_stage),
        contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email, phone, company_name, job_title)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
      console.error("Error fetching deal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Error in GET /api/v1/deals/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/deals/[id] - Update a deal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.pipelineId !== undefined) updateData.pipeline_id = body.pipelineId;
    if (body.stageId !== undefined) updateData.stage_id = body.stageId;
    if (body.contactId !== undefined) updateData.contact_id = body.contactId;
    if (body.assignedTo !== undefined) updateData.assigned_to = body.assignedTo || null;
    if (body.value !== undefined) updateData.value = body.value || null;
    if (body.expectedCloseDate !== undefined) updateData.expected_close_date = body.expectedCloseDate || null;
    if (body.actualCloseDate !== undefined) updateData.actual_close_date = body.actualCloseDate || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.lostReason !== undefined) updateData.lost_reason = body.lostReason || null;
    if (body.propertyAddress !== undefined) updateData.property_address = body.propertyAddress || null;
    if (body.propertyCity !== undefined) updateData.property_city = body.propertyCity || null;
    if (body.propertyState !== undefined) updateData.property_state = body.propertyState || null;
    if (body.propertyZip !== undefined) updateData.property_zip = body.propertyZip || null;
    if (body.propertyType !== undefined) updateData.property_type = body.propertyType || null;
    if (body.propertyBedrooms !== undefined) updateData.property_bedrooms = body.propertyBedrooms || null;
    if (body.propertyBathrooms !== undefined) updateData.property_bathrooms = body.propertyBathrooms || null;
    if (body.propertySqft !== undefined) updateData.property_sqft = body.propertySqft || null;
    if (body.propertyYearBuilt !== undefined) updateData.property_year_built = body.propertyYearBuilt || null;
    if (body.propertyListPrice !== undefined) updateData.property_list_price = body.propertyListPrice || null;
    if (body.propertyMlsNumber !== undefined) updateData.property_mls_number = body.propertyMlsNumber || null;
    if (body.commissionRate !== undefined) updateData.commission_rate = body.commissionRate || null;
    if (body.commissionAmount !== undefined) updateData.commission_amount = body.commissionAmount || null;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.customFields !== undefined) updateData.custom_fields = body.customFields as Json;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deal, error } = await (supabase as any)
      .from("crm_deals")
      .update(updateData)
      .eq("id", id)
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
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
      console.error("Error updating deal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Error in PATCH /api/v1/deals/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/deals/[id] - Delete a deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("crm_deals")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting deal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/v1/deals/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
