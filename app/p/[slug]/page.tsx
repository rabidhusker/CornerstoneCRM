import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicPageRenderer } from "./public-page-renderer";
import type { PageConfig, PageSettings, LandingPage } from "@/types/page";
import type { BrandingSettings } from "@/types/branding";
import { defaultBranding } from "@/types/branding";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface PageWithBranding {
  page: LandingPage;
  branding: BrandingSettings | null;
}

async function getPage(slug: string): Promise<PageWithBranding | null> {
  const supabase = await createClient();

  const { data: page, error } = await (supabase as any)
    .from("crm_landing_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !page) {
    return null;
  }

  // Increment view count (fire and forget)
  (supabase as any)
    .from("crm_landing_pages")
    .update({ views_count: (page.views_count || 0) + 1 })
    .eq("id", page.id)
    .then(() => {});

  // Fetch organization branding
  let branding: BrandingSettings | null = null;
  if (page.workspace_id) {
    const { data: brandingData } = await (supabase as any)
      .from("crm_branding_settings")
      .select("*")
      .eq("workspace_id", page.workspace_id)
      .single();

    if (brandingData) {
      branding = brandingData as BrandingSettings;
    }
  }

  return { page: page as LandingPage, branding };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPage(slug);

  if (!result) {
    return {
      title: "Page Not Found",
    };
  }

  const { page, branding } = result;
  const settings = page.settings as PageSettings | null;

  // Use page settings, fall back to branding, then defaults
  const title = settings?.metaTitle || page.title;
  const description = settings?.metaDescription || page.description || branding?.tagline;
  const favicon = settings?.favicon || branding?.favicon_url;

  return {
    title: branding?.organization_name ? `${title} | ${branding.organization_name}` : title,
    description,
    openGraph: {
      title,
      description: description || undefined,
      images: settings?.ogImage ? [settings.ogImage] : undefined,
    },
    icons: favicon
      ? {
          icon: favicon,
        }
      : undefined,
  };
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPage(slug);

  if (!result) {
    notFound();
  }

  const { page, branding } = result;
  const config = page.config as PageConfig | null;
  const settings = page.settings as PageSettings | null;

  // Merge branding with page settings (page settings override branding)
  const mergedSettings: PageSettings = {
    // Start with branding defaults
    primaryColor: branding?.primary_color || defaultBranding.primary_color,
    backgroundColor: branding?.background_color || defaultBranding.background_color,
    textColor: branding?.text_primary || defaultBranding.text_primary,
    // Override with page-specific settings
    ...settings,
  };

  return (
    <PublicPageRenderer
      blocks={config?.blocks || []}
      settings={mergedSettings}
      branding={branding}
    />
  );
}
