"use client";

import { useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import type { BrandingSettings } from "@/types/branding";
import { brandingToCssVariables, getContrastColor, defaultBranding } from "@/types/branding";
import { cn } from "@/lib/utils";

interface BrandedLayoutProps {
  branding: BrandingSettings;
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  headerVariant?: "simple" | "full";
  centerContent?: boolean;
}

export function BrandedLayout({
  branding,
  children,
  className,
  showHeader = true,
  showFooter = true,
  headerVariant = "simple",
  centerContent = true,
}: BrandedLayoutProps) {
  // Generate CSS variables
  const cssVariables = useMemo(() => brandingToCssVariables(branding), [branding]);

  // Combine with custom CSS
  const fullStyles = useMemo(() => {
    let styles = cssVariables;
    if (branding.custom_css) {
      styles += "\n" + branding.custom_css;
    }
    return styles;
  }, [cssVariables, branding.custom_css]);

  const primaryContrast = getContrastColor(branding.primary_color);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fullStyles }} />

      <div
        className={cn("min-h-screen flex flex-col", className)}
        style={{
          backgroundColor: branding.background_color || "#ffffff",
          color: branding.text_primary || "#0f172a",
        }}
      >
        {/* Header */}
        {showHeader && (
          <BrandedHeader
            branding={branding}
            variant={headerVariant}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1",
            centerContent && "flex items-center justify-center"
          )}
        >
          {children}
        </main>

        {/* Footer */}
        {showFooter && <BrandedFooter branding={branding} />}
      </div>
    </>
  );
}

// Header Component
interface BrandedHeaderProps {
  branding: BrandingSettings;
  variant?: "simple" | "full";
}

export function BrandedHeader({ branding, variant = "simple" }: BrandedHeaderProps) {
  const primaryContrast = getContrastColor(branding.primary_color);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: branding.surface_color || "#f8fafc",
        borderColor: `${branding.text_secondary}20`,
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand Name */}
        <Link href="/" className="flex items-center gap-2">
          {branding.logo_light_url ? (
            <img
              src={branding.logo_light_url}
              alt={branding.organization_name}
              className="h-8 max-w-[180px] object-contain"
            />
          ) : (
            <span
              className="text-xl font-bold"
              style={{ color: branding.text_primary }}
            >
              {branding.organization_name}
            </span>
          )}
        </Link>

        {/* Optional: Full header with navigation */}
        {variant === "full" && (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: branding.text_secondary }}
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: branding.text_secondary }}
            >
              Pricing
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: branding.text_secondary }}
            >
              Contact
            </Link>
          </nav>
        )}

        {/* Optional: CTA Button */}
        {variant === "full" && (
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: branding.primary_color,
              color: primaryContrast,
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

// Footer Component
interface BrandedFooterProps {
  branding: BrandingSettings;
}

export function BrandedFooter({ branding }: BrandedFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t py-6"
      style={{
        backgroundColor: branding.surface_color || "#f8fafc",
        borderColor: `${branding.text_secondary}20`,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Copyright / Footer Text */}
          <p
            className="text-sm"
            style={{ color: branding.text_secondary }}
          >
            {branding.footer_text ||
              `© ${currentYear} ${branding.organization_name}. All rights reserved.`}
          </p>

          {/* Support Links */}
          {(branding.support_email || branding.support_url) && (
            <div
              className="flex items-center gap-4 text-sm"
              style={{ color: branding.text_secondary }}
            >
              {branding.support_email && (
                <a
                  href={`mailto:${branding.support_email}`}
                  className="hover:underline"
                >
                  Contact Support
                </a>
              )}
              {branding.support_url && (
                <a
                  href={branding.support_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Help Center
                </a>
              )}
            </div>
          )}
        </div>

        {/* Powered By */}
        {branding.show_powered_by && (
          <p
            className="text-center text-xs mt-4"
            style={{ color: branding.text_secondary }}
          >
            Powered by CRM Platform
          </p>
        )}
      </div>
    </footer>
  );
}

// Branded Card Container
interface BrandedCardProps {
  branding: BrandingSettings;
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function BrandedCard({
  branding,
  children,
  className,
  title,
  description,
}: BrandedCardProps) {
  return (
    <div
      className={cn("rounded-lg border shadow-sm", className)}
      style={{
        backgroundColor: branding.surface_color || "#ffffff",
        borderColor: `${branding.text_secondary}20`,
      }}
    >
      {(title || description) && (
        <div className="border-b px-6 py-4" style={{ borderColor: `${branding.text_secondary}20` }}>
          {title && (
            <h2
              className="text-lg font-semibold"
              style={{ color: branding.text_primary }}
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              className="text-sm mt-1"
              style={{ color: branding.text_secondary }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

// Branded Button
interface BrandedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  branding: BrandingSettings;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function BrandedButton({
  branding,
  variant = "primary",
  size = "md",
  children,
  className,
  style,
  ...props
}: BrandedButtonProps) {
  const primaryContrast = getContrastColor(branding.primary_color);
  const secondaryContrast = getContrastColor(branding.secondary_color);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary: {
      backgroundColor: branding.primary_color,
      color: primaryContrast,
    },
    secondary: {
      backgroundColor: branding.secondary_color,
      color: secondaryContrast,
    },
    outline: {
      backgroundColor: "transparent",
      color: branding.primary_color,
      borderColor: branding.primary_color,
      borderWidth: "1px",
    },
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-opacity hover:opacity-90 disabled:opacity-50",
        sizeClasses[size],
        className
      )}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

// Branded Input
interface BrandedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  branding: BrandingSettings;
  label?: string;
  error?: string;
}

export function BrandedInput({
  branding,
  label,
  error,
  className,
  style,
  id,
  ...props
}: BrandedInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
          style={{ color: branding.text_primary }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2",
          error && "border-red-500",
          className
        )}
        style={{
          backgroundColor: branding.background_color || "#ffffff",
          borderColor: error ? "#ef4444" : `${branding.text_secondary}40`,
          color: branding.text_primary,
          ...style,
        }}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// Branded Textarea
interface BrandedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  branding: BrandingSettings;
  label?: string;
  error?: string;
}

export function BrandedTextarea({
  branding,
  label,
  error,
  className,
  style,
  id,
  ...props
}: BrandedTextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-sm font-medium"
          style={{ color: branding.text_primary }}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 min-h-[100px]",
          error && "border-red-500",
          className
        )}
        style={{
          backgroundColor: branding.background_color || "#ffffff",
          borderColor: error ? "#ef4444" : `${branding.text_secondary}40`,
          color: branding.text_primary,
          ...style,
        }}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// Helper: Generate meta tags for branding
export function generateBrandingMeta(branding: BrandingSettings, pageTitle?: string) {
  const title = pageTitle
    ? `${pageTitle} | ${branding.organization_name}`
    : branding.organization_name;

  return {
    title,
    description: branding.tagline || `Welcome to ${branding.organization_name}`,
    icons: branding.favicon_url ? { icon: branding.favicon_url } : undefined,
    themeColor: branding.primary_color,
  };
}
