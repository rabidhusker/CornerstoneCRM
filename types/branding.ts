// White-label branding types

export interface BrandingSettings {
  id: string;
  workspace_id: string;

  // Logos
  logo_light_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;

  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color?: string;

  // Text colors
  text_primary?: string;
  text_secondary?: string;

  // Background colors
  background_color?: string;
  surface_color?: string;

  // Custom CSS
  custom_css?: string;

  // Organization info for branding
  organization_name: string;
  tagline?: string;
  support_email?: string;
  support_url?: string;

  // Footer
  footer_text?: string;
  show_powered_by?: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface BrandingFormData {
  logo_light_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  text_primary?: string;
  text_secondary?: string;
  background_color?: string;
  surface_color?: string;
  custom_css?: string;
  organization_name: string;
  tagline?: string;
  support_email?: string;
  support_url?: string;
  footer_text?: string;
  show_powered_by?: boolean;
}

export interface CustomDomainSettings {
  id: string;
  workspace_id: string;
  domain: string;
  subdomain?: string;
  status: "pending" | "verifying" | "active" | "failed";
  ssl_status: "pending" | "provisioning" | "active" | "failed";
  dns_records: DnsRecord[];
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DnsRecord {
  type: "CNAME" | "A" | "TXT";
  name: string;
  value: string;
  verified: boolean;
}

// Default branding values
export const defaultBranding: Omit<BrandingSettings, "id" | "workspace_id" | "created_at" | "updated_at"> = {
  primary_color: "#0ea5e9",
  secondary_color: "#64748b",
  accent_color: "#f59e0b",
  text_primary: "#0f172a",
  text_secondary: "#64748b",
  background_color: "#ffffff",
  surface_color: "#f8fafc",
  organization_name: "My CRM",
  show_powered_by: true,
};

// Preset color themes
export const colorPresets = [
  { name: "Ocean", primary: "#0ea5e9", secondary: "#64748b" },
  { name: "Forest", primary: "#22c55e", secondary: "#71717a" },
  { name: "Sunset", primary: "#f59e0b", secondary: "#78716c" },
  { name: "Berry", primary: "#ec4899", secondary: "#6b7280" },
  { name: "Grape", primary: "#8b5cf6", secondary: "#71717a" },
  { name: "Crimson", primary: "#ef4444", secondary: "#737373" },
  { name: "Teal", primary: "#14b8a6", secondary: "#64748b" },
  { name: "Slate", primary: "#475569", secondary: "#94a3b8" },
];

// CSS variable mapping
export const cssVariableMap: Record<keyof Pick<BrandingSettings,
  "primary_color" | "secondary_color" | "accent_color" | "text_primary" | "text_secondary" | "background_color" | "surface_color"
>, string> = {
  primary_color: "--brand-primary",
  secondary_color: "--brand-secondary",
  accent_color: "--brand-accent",
  text_primary: "--brand-text-primary",
  text_secondary: "--brand-text-secondary",
  background_color: "--brand-background",
  surface_color: "--brand-surface",
};

// Convert branding to CSS variables
export function brandingToCssVariables(branding: Partial<BrandingSettings>): string {
  const lines: string[] = [];

  if (branding.primary_color) {
    lines.push(`--brand-primary: ${branding.primary_color};`);
    lines.push(`--brand-primary-foreground: #ffffff;`);
  }
  if (branding.secondary_color) {
    lines.push(`--brand-secondary: ${branding.secondary_color};`);
  }
  if (branding.accent_color) {
    lines.push(`--brand-accent: ${branding.accent_color};`);
  }
  if (branding.text_primary) {
    lines.push(`--brand-text-primary: ${branding.text_primary};`);
  }
  if (branding.text_secondary) {
    lines.push(`--brand-text-secondary: ${branding.text_secondary};`);
  }
  if (branding.background_color) {
    lines.push(`--brand-background: ${branding.background_color};`);
  }
  if (branding.surface_color) {
    lines.push(`--brand-surface: ${branding.surface_color};`);
  }

  return `:root {\n  ${lines.join("\n  ")}\n}`;
}

// Validate hex color
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Get contrast color (black or white) for a background
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
}
