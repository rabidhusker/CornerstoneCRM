interface UpdateFieldConfig {
  field: string;
  value: string | number | boolean;
}

interface Contact {
  id: string;
  custom_fields: Record<string, any>;
  [key: string]: any;
}

interface ActionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

// Standard contact fields that can be updated
const STANDARD_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "company_name",
  "job_title",
  "type",
  "status",
  "source",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "zip_code",
  "country",
];

/**
 * Execute update field action
 */
export async function executeUpdateField(
  config: UpdateFieldConfig,
  contact: Contact,
  supabase: any
): Promise<ActionResult> {
  try {
    if (!config.field) {
      return {
        success: false,
        error: "No field specified to update",
      };
    }

    const oldValue = getFieldValue(contact, config.field);
    const newValue = config.value;

    // Check if it's a standard field or custom field
    const isStandardField = STANDARD_FIELDS.includes(config.field);

    let updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (isStandardField) {
      // Update standard field
      updateData[config.field] = newValue;
    } else {
      // Update custom field
      const customFields = { ...contact.custom_fields };
      customFields[config.field] = newValue;
      updateData.custom_fields = customFields;
    }

    // Update contact
    const { error } = await supabase
      .from("crm_contacts")
      .update(updateData)
      .eq("id", contact.id);

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: {
        field: config.field,
        old_value: oldValue,
        new_value: newValue,
        is_custom_field: !isStandardField,
      },
    };
  } catch (error) {
    console.error("Error updating field:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update field",
    };
  }
}

function getFieldValue(contact: Contact, field: string): any {
  if (STANDARD_FIELDS.includes(field)) {
    return contact[field];
  }
  return contact.custom_fields?.[field];
}
