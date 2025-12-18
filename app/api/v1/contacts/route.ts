import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// GET /api/v1/contacts - List contacts with filtering, sorting, pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search");
    const type = searchParams.getAll("type");
    const status = searchParams.getAll("status");
    const sortField = searchParams.get("sortField") || "created_at";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    // Build query
    let query = supabase
      .from("crm_contacts")
      .select("*", { count: "exact" });

    // Apply search filter
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company_name.ilike.${searchTerm},phone.ilike.${searchTerm}`
      );
    }

    // Apply type filter
    if (type.length > 0) {
      query = query.in("type", type);
    }

    // Apply status filter
    if (status.length > 0) {
      query = query.in("status", status);
    }

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === "asc" });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contacts, error, count } = await (query as any);

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      contacts: contacts || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST /api/v1/contacts - Create new contact
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
    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Create contact
    const insertData = {
      workspace_id: workspaceMember.workspace_id,
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      company_name: body.companyName || null,
      job_title: body.jobTitle || null,
      address_line1: body.addressLine1 || null,
      address_line2: body.addressLine2 || null,
      city: body.city || null,
      state: body.state || null,
      zip_code: body.zipCode || null,
      country: body.country || "USA",
      type: body.type || "buyer",
      status: body.status || "active",
      source: body.source || null,
      source_detail: body.sourceDetail || null,
      tags: body.tags || [],
      assigned_to: body.assignedTo || null,
      custom_fields: (body.customFields || {}) as Json,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contact, error } = await (supabase as any)
      .from("crm_contacts")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
