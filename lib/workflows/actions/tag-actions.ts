interface TagConfig {
  tag_ids: string[];
}

interface Contact {
  id: string;
  tags: string[];
  [key: string]: any;
}

interface ActionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Execute add tag action
 */
export async function executeAddTag(
  config: TagConfig,
  contact: Contact,
  supabase: any
): Promise<ActionResult> {
  try {
    if (!config.tag_ids || config.tag_ids.length === 0) {
      return {
        success: false,
        error: "No tags specified to add",
      };
    }

    // Get current tags
    const currentTags = contact.tags || [];

    // Add new tags (avoid duplicates)
    const newTags = [...new Set([...currentTags, ...config.tag_ids])];

    // Update contact
    const { error } = await supabase
      .from("crm_contacts")
      .update({
        tags: newTags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contact.id);

    if (error) {
      throw error;
    }

    // Log which tags were actually added
    const addedTags = config.tag_ids.filter((t) => !currentTags.includes(t));

    return {
      success: true,
      data: {
        added_tags: addedTags,
        total_tags: newTags.length,
      },
    };
  } catch (error) {
    console.error("Error adding tags:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add tags",
    };
  }
}

/**
 * Execute remove tag action
 */
export async function executeRemoveTag(
  config: TagConfig,
  contact: Contact,
  supabase: any
): Promise<ActionResult> {
  try {
    if (!config.tag_ids || config.tag_ids.length === 0) {
      return {
        success: false,
        error: "No tags specified to remove",
      };
    }

    // Get current tags
    const currentTags = contact.tags || [];

    // Remove specified tags
    const newTags = currentTags.filter((t: string) => !config.tag_ids.includes(t));

    // Update contact
    const { error } = await supabase
      .from("crm_contacts")
      .update({
        tags: newTags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contact.id);

    if (error) {
      throw error;
    }

    // Log which tags were actually removed
    const removedTags = config.tag_ids.filter((t) => currentTags.includes(t));

    return {
      success: true,
      data: {
        removed_tags: removedTags,
        total_tags: newTags.length,
      },
    };
  } catch (error) {
    console.error("Error removing tags:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove tags",
    };
  }
}
