"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Quote,
  Star,
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  HeroBlock,
  TextBlock,
  ImageBlock,
  FormBlock,
  FeaturesBlock,
  TestimonialBlock,
  FAQBlock,
  FooterBlock,
  SpacerBlock,
  VideoBlock,
  CTABlock,
  PageSettings,
} from "@/types/page";

// Hero Block Display
export function HeroBlockDisplay({
  block,
  settings,
}: {
  block: HeroBlock;
  settings: PageSettings;
}) {
  const { data } = block;

  const backgroundStyle: React.CSSProperties = {
    minHeight: data.minHeight || "500px",
    backgroundColor: data.backgroundColor || "transparent",
    backgroundImage: data.backgroundImage
      ? `url(${data.backgroundImage})`
      : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: data.textColor || settings.textColor,
    position: "relative",
  };

  const textAlign = data.alignment || "center";

  return (
    <section style={backgroundStyle}>
      {data.overlay && data.backgroundImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: (data.overlayOpacity || 50) / 100 }}
        />
      )}
      <div
        className={cn(
          "relative z-10 container mx-auto px-6 py-16 flex flex-col",
          textAlign === "center" && "items-center text-center",
          textAlign === "left" && "items-start text-left",
          textAlign === "right" && "items-end text-right"
        )}
        style={{ minHeight: data.minHeight || "500px", justifyContent: "center" }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-4xl">
          {data.heading}
        </h1>
        {data.subheading && (
          <p className="text-xl md:text-2xl mb-8 max-w-2xl opacity-90">
            {data.subheading}
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          {data.ctaText && (
            <Button
              asChild
              size="lg"
              variant={data.ctaStyle === "outline" ? "outline" : "default"}
              className={cn(
                data.ctaStyle === "secondary" && "bg-secondary text-secondary-foreground"
              )}
              style={
                data.ctaStyle === "primary"
                  ? { backgroundColor: settings.primaryColor }
                  : undefined
              }
            >
              <a href={data.ctaUrl || "#"}>{data.ctaText}</a>
            </Button>
          )}
          {data.secondaryCtaText && (
            <Button asChild size="lg" variant="outline">
              <a href={data.secondaryCtaUrl || "#"}>{data.secondaryCtaText}</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

// Text Block Display
export function TextBlockDisplay({
  block,
  settings,
}: {
  block: TextBlock;
  settings: PageSettings;
}) {
  const { data } = block;

  const fontSizeClasses = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  return (
    <section className="py-12 px-6">
      <div
        className={cn(
          "container mx-auto prose prose-lg dark:prose-invert",
          fontSizeClasses[data.fontSize || "base"]
        )}
        style={{
          maxWidth: data.maxWidth || "800px",
          textAlign: data.alignment || "left",
        }}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: data.content.replace(/\n/g, "<br />"),
          }}
        />
      </div>
    </section>
  );
}

// Image Block Display
export function ImageBlockDisplay({
  block,
  settings,
}: {
  block: ImageBlock;
  settings: PageSettings;
}) {
  const { data } = block;

  if (!data.src) {
    return (
      <section className="py-12 px-6">
        <div
          className={cn(
            "container mx-auto flex",
            data.alignment === "center" && "justify-center",
            data.alignment === "left" && "justify-start",
            data.alignment === "right" && "justify-end"
          )}
        >
          <div
            className="bg-muted rounded-lg flex items-center justify-center"
            style={{
              width: data.width || "100%",
              maxWidth: "800px",
              height: "300px",
              borderRadius: data.borderRadius || "8px",
            }}
          >
            <p className="text-muted-foreground">No image set</p>
          </div>
        </div>
      </section>
    );
  }

  const imageElement = (
    <img
      src={data.src}
      alt={data.alt}
      style={{
        width: data.width || "100%",
        maxWidth: "100%",
        borderRadius: data.borderRadius || "8px",
        height: "auto",
      }}
    />
  );

  return (
    <section className="py-12 px-6">
      <div
        className={cn(
          "container mx-auto flex flex-col",
          data.alignment === "center" && "items-center",
          data.alignment === "left" && "items-start",
          data.alignment === "right" && "items-end"
        )}
      >
        {data.linkUrl ? (
          <a href={data.linkUrl} target="_blank" rel="noopener noreferrer">
            {imageElement}
          </a>
        ) : (
          imageElement
        )}
        {data.caption && (
          <p className="text-sm text-muted-foreground mt-3">{data.caption}</p>
        )}
      </div>
    </section>
  );
}

// Form Block Display
export function FormBlockDisplay({
  block,
  settings,
}: {
  block: FormBlock;
  settings: PageSettings;
}) {
  const { data } = block;

  return (
    <section
      className="py-16 px-6"
      style={{
        backgroundColor: data.backgroundColor || "#f9fafb",
        padding: data.padding || "48px 24px",
      }}
    >
      <div className="container mx-auto max-w-xl">
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-4">{data.title}</h2>
        )}
        {data.description && (
          <p className="text-center text-muted-foreground mb-8">
            {data.description}
          </p>
        )}
        {data.formId ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Form will be embedded here (ID: {data.formId})
              </p>
              {/* In production, this would render the actual form */}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                No form selected. Choose a form in the block settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

// Features Block Display
export function FeaturesBlockDisplay({
  block,
  settings,
}: {
  block: FeaturesBlock;
  settings: PageSettings;
}) {
  const { data } = block;
  const columns = data.columns || 3;

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto">
        {(data.heading || data.subheading) && (
          <div className="text-center mb-12">
            {data.heading && (
              <h2 className="text-3xl font-bold mb-4">{data.heading}</h2>
            )}
            {data.subheading && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {data.subheading}
              </p>
            )}
          </div>
        )}

        <div className={cn("grid gap-8", gridCols[columns])}>
          {data.features.map((feature) => (
            <div
              key={feature.id}
              className={cn(
                data.style === "cards" &&
                  "bg-card rounded-lg p-6 border shadow-sm",
                data.style === "icons" && "text-center",
                data.style === "minimal" && "border-l-4 pl-4"
              )}
              style={
                data.style === "minimal"
                  ? { borderColor: settings.primaryColor }
                  : undefined
              }
            >
              {feature.icon && data.style === "icons" && (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto"
                  style={{ backgroundColor: settings.primaryColor + "20" }}
                >
                  <Check
                    className="h-6 w-6"
                    style={{ color: settings.primaryColor }}
                  />
                </div>
              )}
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonial Block Display
export function TestimonialBlockDisplay({
  block,
  settings,
}: {
  block: TestimonialBlock;
  settings: PageSettings;
}) {
  const { data } = block;

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="container mx-auto">
        {data.heading && (
          <h2 className="text-3xl font-bold text-center mb-12">{data.heading}</h2>
        )}

        {data.layout === "single" && data.testimonials[0] && (
          <div className="max-w-2xl mx-auto text-center">
            <Quote
              className="h-12 w-12 mx-auto mb-6 opacity-20"
              style={{ color: settings.primaryColor }}
            />
            <blockquote className="text-xl md:text-2xl mb-6">
              &ldquo;{data.testimonials[0].quote}&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={data.testimonials[0].avatar} />
                <AvatarFallback>
                  {data.testimonials[0].author[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-semibold">{data.testimonials[0].author}</p>
                <p className="text-sm text-muted-foreground">
                  {data.testimonials[0].role}
                  {data.testimonials[0].company &&
                    `, ${data.testimonials[0].company}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {data.layout === "grid" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <blockquote className="mb-4">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                        {testimonial.company && `, ${testimonial.company}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data.layout === "carousel" && (
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory">
            {data.testimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="min-w-[300px] md:min-w-[400px] snap-center flex-shrink-0"
              >
                <CardContent className="p-6">
                  <blockquote className="mb-4">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                        {testimonial.company && `, ${testimonial.company}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// FAQ Block Display
export function FAQBlockDisplay({
  block,
  settings,
}: {
  block: FAQBlock;
  settings: PageSettings;
}) {
  const { data } = block;

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-3xl">
        {(data.heading || data.subheading) && (
          <div className="text-center mb-12">
            {data.heading && (
              <h2 className="text-3xl font-bold mb-4">{data.heading}</h2>
            )}
            {data.subheading && (
              <p className="text-lg text-muted-foreground">{data.subheading}</p>
            )}
          </div>
        )}

        <Accordion type="single" collapsible className="w-full">
          {data.items.map((item, index) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// Footer Block Display
export function FooterBlockDisplay({
  block,
  settings,
}: {
  block: FooterBlock;
  settings: PageSettings;
}) {
  const { data } = block;

  const socialIcons = {
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
  };

  return (
    <footer
      className="py-12 px-6"
      style={{
        backgroundColor: data.backgroundColor || "#1f2937",
        color: data.textColor || "#ffffff",
      }}
    >
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            {data.companyName && (
              <p className="font-bold text-lg mb-1">{data.companyName}</p>
            )}
            {data.tagline && (
              <p className="opacity-80 text-sm">{data.tagline}</p>
            )}
          </div>

          {data.links && data.links.length > 0 && (
            <nav className="flex flex-wrap justify-center gap-6">
              {data.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  className="opacity-80 hover:opacity-100 transition-opacity text-sm"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {data.showSocial && data.socialLinks && (
            <div className="flex gap-4">
              {Object.entries(data.socialLinks).map(([platform, url]) => {
                if (!url) return null;
                const Icon = socialIcons[platform as keyof typeof socialIcons];
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {data.copyright && (
          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-sm opacity-60">{data.copyright}</p>
          </div>
        )}
      </div>
    </footer>
  );
}

// Spacer Block Display
export function SpacerBlockDisplay({ block }: { block: SpacerBlock }) {
  return <div style={{ height: block.data.height }} />;
}

// Video Block Display
export function VideoBlockDisplay({
  block,
  settings,
}: {
  block: VideoBlock;
  settings: PageSettings;
}) {
  const { data } = block;

  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch) {
      const params = new URLSearchParams();
      if (data.autoplay) params.set("autoplay", "1");
      if (data.loop) params.set("loop", "1");
      if (data.muted) params.set("mute", "1");
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?${params.toString()}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      const params = new URLSearchParams();
      if (data.autoplay) params.set("autoplay", "1");
      if (data.loop) params.set("loop", "1");
      if (data.muted) params.set("muted", "1");
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?${params.toString()}`;
    }

    return url;
  };

  if (!data.url) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">No video URL set</p>
          </div>
        </div>
      </section>
    );
  }

  const isEmbed =
    data.url.includes("youtube") ||
    data.url.includes("youtu.be") ||
    data.url.includes("vimeo");

  return (
    <section className="py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        {data.title && (
          <h3 className="text-2xl font-bold text-center mb-6">{data.title}</h3>
        )}
        <div className="aspect-video rounded-lg overflow-hidden">
          {isEmbed ? (
            <iframe
              src={getEmbedUrl(data.url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={data.url}
              className="w-full h-full object-cover"
              autoPlay={data.autoplay}
              loop={data.loop}
              muted={data.muted}
              controls
            />
          )}
        </div>
      </div>
    </section>
  );
}

// CTA Block Display
export function CTABlockDisplay({
  block,
  settings,
}: {
  block: CTABlock;
  settings: PageSettings;
}) {
  const { data } = block;

  return (
    <section
      className="py-16 px-6"
      style={{
        backgroundColor: data.backgroundColor || settings.primaryColor,
        color: data.textColor || "#ffffff",
      }}
    >
      <div className="container mx-auto text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{data.heading}</h2>
        {data.subheading && (
          <p className="text-lg opacity-90 mb-8">{data.subheading}</p>
        )}
        <Button
          asChild
          size="lg"
          variant={data.buttonStyle === "outline" ? "outline" : "default"}
          className={cn(
            data.buttonStyle === "outline" && "border-white text-white hover:bg-white/10",
            data.buttonStyle !== "outline" && "bg-white text-gray-900 hover:bg-white/90"
          )}
        >
          <a href={data.buttonUrl}>{data.buttonText}</a>
        </Button>
      </div>
    </section>
  );
}
