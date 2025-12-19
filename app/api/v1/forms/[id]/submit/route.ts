import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type { FormConfig, FormSettings, FormField, ValidationRule } from "@/types/form";

// Validate field value against rules
function validateField(
  field: FormField,
  value: unknown
): { valid: boolean; error?: string } {
  const stringValue = String(value || "");

  // Check required
  if (field.required && (!value || stringValue.trim() === "")) {
    return { valid: false, error: `${field.label} is required` };
  }

  // Skip further validation if empty and not required
  if (!value || stringValue.trim() === "") {
    return { valid: true };
  }

  // Validate based on field type
  switch (field.type) {
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return { valid: false, error: "Please enter a valid email address" };
      }
      break;

    case "phone":
      const phoneRegex = /^[\d\s\-+()]{10,}$/;
      if (!phoneRegex.test(stringValue)) {
        return { valid: false, error: "Please enter a valid phone number" };
      }
      break;

    case "url":
      try {
        new URL(stringValue);
      } catch {
        return { valid: false, error: "Please enter a valid URL" };
      }
      break;

    case "number":
      const numValue = Number(stringValue);
      if (isNaN(numValue)) {
        return { valid: false, error: "Please enter a valid number" };
      }
      if (field.min !== undefined && numValue < field.min) {
        return { valid: false, error: `Value must be at least ${field.min}` };
      }
      if (field.max !== undefined && numValue > field.max) {
        return { valid: false, error: `Value must be at most ${field.max}` };
      }
      break;
  }

  // Check validation rules
  for (const rule of field.validation || []) {
    switch (rule.type) {
      case "minLength":
        if (stringValue.length < (rule.value as number)) {
          return {
            valid: false,
            error: rule.message || `Must be at least ${rule.value} characters`,
          };
        }
        break;

      case "maxLength":
        if (stringValue.length > (rule.value as number)) {
          return {
            valid: false,
            error: rule.message || `Must be at most ${rule.value} characters`,
          };
        }
        break;

      case "pattern":
        try {
          const regex = new RegExp(rule.value as string);
          if (!regex.test(stringValue)) {
            return { valid: false, error: rule.message || "Invalid format" };
          }
        } catch {
          // Invalid regex, skip
        }
        break;
    }
  }

  return { valid: true };
}

// POST /api/v1/forms/[id]/submit - Handle form submission
// No authentication required for public forms
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Get form configuration
    const { data: form, error: formError } = await (supabase as any)
      .from("crm_forms")
      .select("*")
      .eq("id", id)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Check form is active
    if (form.status !== "active") {
      return NextResponse.json(
        { error: "Form is not accepting submissions" },
        { status: 400 }
      );
    }

    const config = form.config as FormConfig;
    const settings = form.settings as FormSettings;
    const submissionData = body.data || {};

    // Check honeypot
    if (settings.honeypotEnabled && body._hp_field) {
      // Silently reject spam
      return NextResponse.json({ success: true });
    }

    // Validate all fields
    const errors: Record<string, string> = {};
    for (const field of config.fields || []) {
      const validation = validateField(field, submissionData[field.id]);
      if (!validation.valid) {
        errors[field.id] = validation.error || "Invalid value";
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Get request metadata
    const userAgent = request.headers.get("user-agent") || undefined;
    const referrer = request.headers.get("referer") || undefined;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0].trim() || undefined;

    // Create or update contact if enabled
    let contactId: string | null = null;

    if (settings.createContact) {
      // Find email field
      const emailField = (config.fields || []).find((f) => f.type === "email");
      const email = emailField ? submissionData[emailField.id] : null;

      // Find name fields
      const nameFields = (config.fields || []).filter(
        (f) =>
          f.label.toLowerCase().includes("name") ||
          f.label.toLowerCase().includes("first") ||
          f.label.toLowerCase().includes("last")
      );

      let firstName = "";
      let lastName = "";

      for (const field of nameFields) {
        const value = submissionData[field.id];
        if (value) {
          const label = field.label.toLowerCase();
          if (label.includes("first")) {
            firstName = String(value);
          } else if (label.includes("last")) {
            lastName = String(value);
          } else if (label.includes("name")) {
            const parts = String(value).split(" ");
            firstName = parts[0] || "";
            lastName = parts.slice(1).join(" ") || "";
          }
        }
      }

      // Find phone field
      const phoneField = (config.fields || []).find((f) => f.type === "phone");
      const phone = phoneField ? submissionData[phoneField.id] : null;

      if (email) {
        // Check if contact exists
        const { data: existingContact } = await (supabase as any)
          .from("crm_contacts")
          .select("id")
          .eq("workspace_id", form.workspace_id)
          .eq("email", email)
          .single();

        if (existingContact && settings.updateExistingContact) {
          contactId = existingContact.id;
          // Update existing contact
          await (supabase as any)
            .from("crm_contacts")
            .update({
              first_name: firstName || existingContact.first_name,
              last_name: lastName || existingContact.last_name,
              phone: phone || existingContact.phone,
              tags: settings.contactTags || [],
              updated_at: new Date().toISOString(),
            })
            .eq("id", contactId);
        } else if (!existingContact) {
          // Create new contact
          const { data: newContact, error: contactError } = await (supabase as any)
            .from("crm_contacts")
            .insert({
              workspace_id: form.workspace_id,
              first_name: firstName || "Unknown",
              last_name: lastName || "",
              email,
              phone: phone || null,
              source: "form",
              source_detail: form.name,
              tags: settings.contactTags || [],
              status: "active",
            })
            .select("id")
            .single();

          if (!contactError && newContact) {
            contactId = newContact.id;
          }
        } else {
          contactId = existingContact.id;
        }
      }
    }

    // Store submission
    const { data: submission, error: submissionError } = await (supabase as any)
      .from("crm_form_submissions")
      .insert({
        form_id: id,
        contact_id: contactId,
        data: submissionData as Json,
        metadata: (body.metadata || {}) as Json,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
      })
      .select()
      .single();

    if (submissionError) {
      throw submissionError;
    }

    // Update form stats
    const newSubmissionsCount = (form.submissions_count || 0) + 1;
    const viewsCount = form.views_count || 1;
    const conversionRate = (newSubmissionsCount / viewsCount) * 100;

    await (supabase as any)
      .from("crm_forms")
      .update({
        submissions_count: newSubmissionsCount,
        conversion_rate: conversionRate,
        last_submission_at: new Date().toISOString(),
      })
      .eq("id", id);

    // TODO: Trigger workflow if configured
    // if (settings.triggerWorkflowId) {
    //   // Queue workflow execution
    // }

    // TODO: Send notification email if configured
    // if (settings.notificationEmail) {
    //   // Send email notification
    // }

    // TODO: Send auto-response if enabled
    // if (settings.autoResponseEnabled) {
    //   // Send auto-response email
    // }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
      },
      redirectUrl: settings.redirectUrl || null,
      successMessage: settings.successMessage || "Thank you for your submission!",
    });
  } catch (error) {
    console.error("Error processing form submission:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
