"use client";

import * as React from "react";
import Script from "next/script";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  HeroBlockDisplay,
  TextBlockDisplay,
  ImageBlockDisplay,
  FormBlockDisplay,
  FeaturesBlockDisplay,
  TestimonialBlockDisplay,
  FAQBlockDisplay,
  FooterBlockDisplay,
  SpacerBlockDisplay,
  VideoBlockDisplay,
  CTABlockDisplay,
} from "@/components/features/pages/blocks";
import type { PageBlock, PageSettings } from "@/types/page";
import type { BrandingSettings } from "@/types/branding";

interface PublicPageRendererProps {
  blocks: PageBlock[];
  settings: PageSettings;
  branding?: BrandingSettings | null;
}

export function PublicPageRenderer({ blocks, settings, branding }: PublicPageRendererProps) {
  const visibleBlocks = blocks.filter((block) => block.visible);

  // Check if there's a footer block - if not, we may add branded footer
  const hasFooterBlock = visibleBlocks.some((block) => block.type === "footer");

  return (
    <>
      {/* Google Analytics */}
      {settings.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {settings.facebookPixelId && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${settings.facebookPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Custom Head Code */}
      {settings.customHeadCode && (
        <Script id="custom-head-code" strategy="afterInteractive">
          {settings.customHeadCode}
        </Script>
      )}

      {/* Custom CSS from branding - sanitized to prevent XSS */}
      {branding?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(branding.custom_css, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) }} />
      )}

      {/* Page Content */}
      <main
        style={{
          fontFamily: settings.fontFamily || "system-ui, -apple-system, sans-serif",
          backgroundColor: settings.backgroundColor || "#ffffff",
          color: settings.textColor || "#1f2937",
          minHeight: "100vh",
        }}
      >
        {/* Optional branded header with logo */}
        {branding?.logo_light_url && !hasFooterBlock && (
          <header
            className="border-b py-4"
            style={{
              backgroundColor: branding.surface_color || "#f8fafc",
              borderColor: `${branding.text_secondary || "#64748b"}20`,
            }}
          >
            <div className="container mx-auto px-4">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src={branding.logo_light_url}
                  alt={branding.organization_name}
                  className="h-8 max-w-[180px] object-contain"
                />
              </Link>
            </div>
          </header>
        )}

        {visibleBlocks.length === 0 ? (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">This page is empty</p>
          </div>
        ) : (
          visibleBlocks.map((block) => (
            <BlockRenderer key={block.id} block={block} settings={settings} />
          ))
        )}

        {/* Branded footer if no footer block and branding enabled */}
        {!hasFooterBlock && branding && (
          <footer
            className="border-t py-6"
            style={{
              backgroundColor: branding.surface_color || "#f8fafc",
              borderColor: `${branding.text_secondary || "#64748b"}20`,
            }}
          >
            <div className="container mx-auto px-4 text-center">
              {branding.footer_text ? (
                <p
                  className="text-sm"
                  style={{ color: branding.text_secondary || "#64748b" }}
                >
                  {branding.footer_text}
                </p>
              ) : (
                <p
                  className="text-sm"
                  style={{ color: branding.text_secondary || "#64748b" }}
                >
                  &copy; {new Date().getFullYear()} {branding.organization_name}. All rights reserved.
                </p>
              )}
              {branding.show_powered_by !== false && (
                <p
                  className="text-xs mt-2"
                  style={{ color: branding.text_secondary || "#64748b" }}
                >
                  Powered by Cornerstone CRM
                </p>
              )}
            </div>
          </footer>
        )}
      </main>

      {/* Custom Body Code */}
      {settings.customBodyCode && (
        <Script id="custom-body-code" strategy="afterInteractive">
          {settings.customBodyCode}
        </Script>
      )}
    </>
  );
}

interface BlockRendererProps {
  block: PageBlock;
  settings: PageSettings;
}

function BlockRenderer({ block, settings }: BlockRendererProps) {
  // Create settings with defaults
  const fullSettings: PageSettings = {
    fontFamily: "system-ui, -apple-system, sans-serif",
    primaryColor: "#3b82f6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    ...settings,
  };

  switch (block.type) {
    case "hero":
      return <HeroBlockDisplay block={block} settings={fullSettings} />;
    case "text":
      return <TextBlockDisplay block={block} settings={fullSettings} />;
    case "image":
      return <ImageBlockDisplay block={block} settings={fullSettings} />;
    case "form":
      return <FormBlockDisplay block={block} settings={fullSettings} />;
    case "features":
      return <FeaturesBlockDisplay block={block} settings={fullSettings} />;
    case "testimonial":
      return <TestimonialBlockDisplay block={block} settings={fullSettings} />;
    case "faq":
      return <FAQBlockDisplay block={block} settings={fullSettings} />;
    case "footer":
      return <FooterBlockDisplay block={block} settings={fullSettings} />;
    case "spacer":
      return <SpacerBlockDisplay block={block} />;
    case "video":
      return <VideoBlockDisplay block={block} settings={fullSettings} />;
    case "cta":
      return <CTABlockDisplay block={block} settings={fullSettings} />;
    default:
      return null;
  }
}
