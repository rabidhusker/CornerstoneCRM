import { createClient } from "@/lib/supabase/server";
import type { BrandingSettings } from "@/types/branding";
import { defaultBranding } from "@/types/branding";

// Simple in-memory cache for branding (server-side)
const brandingCache = new Map<
  string,
  { data: BrandingSettings; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get branding settings for a workspace
 * Falls back to defaults if not found
 */
export async function getBranding(
  workspaceId: string
): Promise<BrandingSettings> {
  // Check cache first
  const cached = brandingCache.get(workspaceId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const supabase = await createClient();

    // First try to get from crm_branding table
    const { data: branding, error } = await (supabase as any)
      .from("crm_branding")
      .select("*")
      .eq("workspace_id", workspaceId)
      .single();

    if (error && error.code !== "PGRST116" && error.code !== "42P01") {
      console.error("Error fetching branding:", error);
    }

    if (branding) {
      const brandingSettings: BrandingSettings = {
        id: branding.id,
        workspace_id: branding.workspace_id,
        logo_light_url: branding.logo_light_url,
        logo_dark_url: branding.logo_dark_url,
        favicon_url: branding.favicon_url,
        primary_color: branding.primary_color || defaultBranding.primary_color,
        secondary_color: branding.secondary_color || defaultBranding.secondary_color,
        accent_color: branding.accent_color,
        text_primary: branding.text_primary,
        text_secondary: branding.text_secondary,
        background_color: branding.background_color,
        surface_color: branding.surface_color,
        custom_css: branding.custom_css,
        organization_name: branding.organization_name || defaultBranding.organization_name,
        tagline: branding.tagline,
        support_email: branding.support_email,
        support_url: branding.support_url,
        footer_text: branding.footer_text,
        show_powered_by: branding.show_powered_by ?? defaultBranding.show_powered_by,
        created_at: branding.created_at,
        updated_at: branding.updated_at,
      };

      // Cache the result
      brandingCache.set(workspaceId, {
        data: brandingSettings,
        timestamp: Date.now(),
      });

      return brandingSettings;
    }

    // Fall back to workspace data
    const { data: workspace } = await (supabase as any)
      .from("workspaces")
      .select("id, name, logo_url")
      .eq("id", workspaceId)
      .single();

    const fallbackBranding: BrandingSettings = {
      id: workspaceId,
      workspace_id: workspaceId,
      logo_light_url: workspace?.logo_url,
      primary_color: defaultBranding.primary_color,
      secondary_color: defaultBranding.secondary_color,
      organization_name: workspace?.name || defaultBranding.organization_name,
      show_powered_by: defaultBranding.show_powered_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Cache the fallback
    brandingCache.set(workspaceId, {
      data: fallbackBranding,
      timestamp: Date.now(),
    });

    return fallbackBranding;
  } catch (error) {
    console.error("Error in getBranding:", error);

    // Return defaults on error
    return {
      id: workspaceId,
      workspace_id: workspaceId,
      primary_color: defaultBranding.primary_color,
      secondary_color: defaultBranding.secondary_color,
      organization_name: defaultBranding.organization_name,
      show_powered_by: defaultBranding.show_powered_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Get branding by custom domain
 */
export async function getBrandingByDomain(
  domain: string
): Promise<BrandingSettings | null> {
  try {
    const supabase = await createClient();

    // Look up workspace by custom domain
    const { data: customDomain } = await (supabase as any)
      .from("crm_custom_domains")
      .select("workspace_id")
      .eq("domain", domain)
      .eq("status", "active")
      .single();

    if (customDomain?.workspace_id) {
      return getBranding(customDomain.workspace_id);
    }

    return null;
  } catch (error) {
    console.error("Error in getBrandingByDomain:", error);
    return null;
  }
}

/**
 * Get branding for a form/landing page by its ID
 */
export async function getBrandingForForm(
  formId: string
): Promise<BrandingSettings | null> {
  try {
    const supabase = await createClient();

    const { data: form } = await (supabase as any)
      .from("crm_forms")
      .select("workspace_id")
      .eq("id", formId)
      .single();

    if (form?.workspace_id) {
      return getBranding(form.workspace_id);
    }

    return null;
  } catch (error) {
    console.error("Error in getBrandingForForm:", error);
    return null;
  }
}

/**
 * Get branding for a landing page by slug
 */
export async function getBrandingForPage(
  slug: string
): Promise<{ branding: BrandingSettings; workspaceId: string } | null> {
  try {
    const supabase = await createClient();

    const { data: page } = await (supabase as any)
      .from("crm_landing_pages")
      .select("workspace_id")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (page?.workspace_id) {
      const branding = await getBranding(page.workspace_id);
      return { branding, workspaceId: page.workspace_id };
    }

    return null;
  } catch (error) {
    console.error("Error in getBrandingForPage:", error);
    return null;
  }
}

/**
 * Get branding for a booking page by user slug
 */
export async function getBrandingForBookingPage(
  userSlug: string
): Promise<{ branding: BrandingSettings; workspaceId: string } | null> {
  try {
    const supabase = await createClient();

    const { data: bookingPage } = await (supabase as any)
      .from("crm_booking_pages")
      .select("workspace_id")
      .eq("slug", userSlug)
      .eq("is_active", true)
      .single();

    if (bookingPage?.workspace_id) {
      const branding = await getBranding(bookingPage.workspace_id);
      return { branding, workspaceId: bookingPage.workspace_id };
    }

    return null;
  } catch (error) {
    console.error("Error in getBrandingForBookingPage:", error);
    return null;
  }
}

/**
 * Save branding settings
 */
export async function saveBranding(
  workspaceId: string,
  settings: Partial<BrandingSettings>
): Promise<{ success: boolean; branding?: BrandingSettings; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if branding exists
    const { data: existing } = await (supabase as any)
      .from("crm_branding")
      .select("id")
      .eq("workspace_id", workspaceId)
      .single();

    let result;

    if (existing) {
      // Update existing
      const { data, error } = await (supabase as any)
        .from("crm_branding")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      result = { data, error };
    } else {
      // Insert new
      const { data, error } = await (supabase as any)
        .from("crm_branding")
        .insert({
          workspace_id: workspaceId,
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Invalidate cache
    brandingCache.delete(workspaceId);

    return { success: true, branding: result.data };
  } catch (error) {
    console.error("Error saving branding:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save branding",
    };
  }
}

/**
 * Clear branding cache for a workspace
 */
export function clearBrandingCache(workspaceId: string): void {
  brandingCache.delete(workspaceId);
}

/**
 * Clear all branding caches
 */
export function clearAllBrandingCaches(): void {
  brandingCache.clear();
}
