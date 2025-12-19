"use client";

import * as React from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "./blocks";
import type { PageBlock, PageSettings } from "@/types/page";

interface PagePreviewProps {
  blocks: PageBlock[];
  settings: PageSettings;
}

type DeviceType = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<DeviceType, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function PagePreview({ blocks, settings }: PagePreviewProps) {
  const [device, setDevice] = React.useState<DeviceType>("desktop");

  const visibleBlocks = blocks.filter((block) => block.visible);

  return (
    <div className="h-full flex flex-col">
      {/* Device Selector */}
      <div className="flex items-center justify-center gap-2 p-4 border-b bg-muted/30">
        <Button
          variant={device === "desktop" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDevice("desktop")}
        >
          <Monitor className="h-4 w-4 mr-2" />
          Desktop
        </Button>
        <Button
          variant={device === "tablet" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDevice("tablet")}
        >
          <Tablet className="h-4 w-4 mr-2" />
          Tablet
        </Button>
        <Button
          variant={device === "mobile" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDevice("mobile")}
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Mobile
        </Button>
      </div>

      {/* Preview Area */}
      <ScrollArea className="flex-1">
        <div className="p-6 flex justify-center">
          <div
            className={cn(
              "bg-background shadow-xl transition-all duration-300",
              device !== "desktop" && "rounded-lg border"
            )}
            style={{
              width: deviceWidths[device],
              maxWidth: "100%",
              minHeight: device === "desktop" ? "100%" : "600px",
              fontFamily: settings.fontFamily,
              backgroundColor: settings.backgroundColor,
              color: settings.textColor,
            }}
          >
            {visibleBlocks.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No visible blocks to preview</p>
              </div>
            ) : (
              <div>
                {visibleBlocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    settings={settings}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

interface BlockRendererProps {
  block: PageBlock;
  settings: PageSettings;
}

function BlockRenderer({ block, settings }: BlockRendererProps) {
  switch (block.type) {
    case "hero":
      return <HeroBlockDisplay block={block} settings={settings} />;
    case "text":
      return <TextBlockDisplay block={block} settings={settings} />;
    case "image":
      return <ImageBlockDisplay block={block} settings={settings} />;
    case "form":
      return <FormBlockDisplay block={block} settings={settings} />;
    case "features":
      return <FeaturesBlockDisplay block={block} settings={settings} />;
    case "testimonial":
      return <TestimonialBlockDisplay block={block} settings={settings} />;
    case "faq":
      return <FAQBlockDisplay block={block} settings={settings} />;
    case "footer":
      return <FooterBlockDisplay block={block} settings={settings} />;
    case "spacer":
      return <SpacerBlockDisplay block={block} />;
    case "video":
      return <VideoBlockDisplay block={block} settings={settings} />;
    case "cta":
      return <CTABlockDisplay block={block} settings={settings} />;
    default:
      return null;
  }
}
