import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

interface ImportContact {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  type?: string;
  source?: string;
  tags?: string;
}

// POST /api/v1/contacts/import - Bulk import contacts
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

    const { contacts, skipDuplicates = true } = body as {
      contacts: ImportContact[];
      skipDuplicates: boolean;
    };

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided" },
        { status: 400 }
      );
    }

    // Limit to 1000 contacts per import
    if (contacts.length > 1000) {
      return NextResponse.json(
        { error: "Maximum 1000 contacts per import" },
        { status: 400 }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    // Get existing emails for duplicate detection
    let existingEmails = new Set<string>();
    if (skipDuplicates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingContacts } = await (supabase as any)
        .from("crm_contacts")
        .select("email")
        .eq("workspace_id", workspaceMember.workspace_id)
        .not("email", "is", null);

      if (existingContacts) {
        existingEmails = new Set(
          existingContacts
            .map((c: { email: string }) => c.email?.toLowerCase())
            .filter(Boolean)
        );
      }
    }

    // Process contacts in batches
    const batchSize = 50;
    const validContacts: Array<{
      workspace_id: string;
      first_name: string;
      last_name: string;
      email: string | null;
      phone: string | null;
      company_name: string | null;
      job_title: string | null;
      address_line1: string | null;
      city: string | null;
      state: string | null;
      zip_code: string | null;
      country: string;
      type: string;
      status: string;
      source: string | null;
      tags: string[];
      custom_fields: Json;
    }> = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const rowNumber = i + 1;

      // Validate required fields
      if (!contact.first_name || !contact.last_name) {
        errors.push(`Row ${rowNumber}: Missing first name or last name`);
        failedCount++;
        continue;
      }

      // Check for duplicates by email
      if (skipDuplicates && contact.email) {
        const normalizedEmail = contact.email.toLowerCase().trim();
        if (existingEmails.has(normalizedEmail)) {
          duplicateCount++;
          continue;
        }
        // Add to existing emails to catch duplicates within the import
        existingEmails.add(normalizedEmail);
      }

      // Validate email format if provided
      if (contact.email && !isValidEmail(contact.email)) {
        errors.push(`Row ${rowNumber}: Invalid email format`);
        failedCount++;
        continue;
      }

      // Parse tags if provided as comma-separated string
      let tags: string[] = [];
      if (contact.tags) {
        tags = contact.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      // Normalize contact type
      let type = "buyer";
      if (contact.type) {
        const normalizedType = contact.type.toLowerCase().trim();
        if (["buyer", "seller", "both", "investor", "other"].includes(normalizedType)) {
          type = normalizedType;
        }
      }

      validContacts.push({
        workspace_id: workspaceMember.workspace_id,
        first_name: contact.first_name.trim(),
        last_name: contact.last_name.trim(),
        email: contact.email?.trim() || null,
        phone: contact.phone?.trim() || null,
        company_name: contact.company_name?.trim() || null,
        job_title: contact.job_title?.trim() || null,
        address_line1: contact.address_line1?.trim() || null,
        city: contact.city?.trim() || null,
        state: contact.state?.trim() || null,
        zip_code: contact.zip_code?.trim() || null,
        country: contact.country?.trim() || "USA",
        type,
        status: "active",
        source: contact.source?.trim() || "import",
        tags,
        custom_fields: {} as Json,
      });
    }

    // Insert valid contacts in batches
    for (let i = 0; i < validContacts.length; i += batchSize) {
      const batch = validContacts.slice(i, i + batchSize);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("crm_contacts")
        .insert(batch);

      if (error) {
        console.error("Batch insert error:", error);
        failedCount += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: Database error`);
      } else {
        successCount += batch.length;
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      duplicates: duplicateCount,
      errors: errors.slice(0, 10), // Limit errors returned
    });
  } catch (error) {
    console.error("Error importing contacts:", error);
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
