import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/v1/contacts/[id] - Fetch single contact with related data
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Fetch contact
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contact, error } = await (supabase as any)
      .from("crm_contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/contacts/[id] - Update contact
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case for database
    const fieldMapping: Record<string, string> = {
      firstName: "first_name",
      lastName: "last_name",
      companyName: "company_name",
      jobTitle: "job_title",
      addressLine1: "address_line1",
      addressLine2: "address_line2",
      zipCode: "zip_code",
      sourceDetail: "source_detail",
      assignedTo: "assigned_to",
      customFields: "custom_fields",
    };

    for (const [key, value] of Object.entries(body)) {
      const dbKey = fieldMapping[key] || key;
      updates[dbKey] = value === "" ? null : value;
    }

    // Update contact
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contact, error } = await (supabase as any)
      .from("crm_contacts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/contacts/[id] - Delete contact (soft delete by setting status to archived)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Soft delete by setting status to archived
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("crm_contacts")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
