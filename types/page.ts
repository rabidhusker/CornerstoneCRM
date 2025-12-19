import type { Database } from "./database";

// Re-export base types from database
export type LandingPage = Database["public"]["Tables"]["crm_landing_pages"]["Row"];
export type LandingPageInsert = Database["public"]["Tables"]["crm_landing_pages"]["Insert"];
export type LandingPageUpdate = Database["public"]["Tables"]["crm_landing_pages"]["Update"];

// Page status
export type PageStatus = "draft" | "published" | "archived";

// Block types
export type BlockType =
  | "hero"
  | "text"
  | "image"
  | "form"
  | "features"
  | "testimonial"
  | "faq"
  | "footer"
  | "spacer"
  | "video"
  | "cta";

// Base block interface
export interface BaseBlock {
  id: string;
  type: BlockType;
  visible: boolean;
}

// Hero block
export interface HeroBlock extends BaseBlock {
  type: "hero";
  data: {
    heading: string;
    subheading?: string;
    ctaText?: string;
    ctaUrl?: string;
    ctaStyle?: "primary" | "secondary" | "outline";
    secondaryCtaText?: string;
    secondaryCtaUrl?: string;
    backgroundImage?: string;
    backgroundColor?: string;
    textColor?: string;
    alignment?: "left" | "center" | "right";
    minHeight?: string;
    overlay?: boolean;
    overlayOpacity?: number;
  };
}

// Text block
export interface TextBlock extends BaseBlock {
  type: "text";
  data: {
    content: string;
    alignment?: "left" | "center" | "right";
    fontSize?: "sm" | "base" | "lg" | "xl";
    maxWidth?: string;
  };
}

// Image block
export interface ImageBlock extends BaseBlock {
  type: "image";
  data: {
    src: string;
    alt: string;
    caption?: string;
    width?: string;
    alignment?: "left" | "center" | "right";
    linkUrl?: string;
    borderRadius?: string;
  };
}

// Form block
export interface FormBlock extends BaseBlock {
  type: "form";
  data: {
    formId: string;
    title?: string;
    description?: string;
    backgroundColor?: string;
    padding?: string;
  };
}

// Feature item
export interface FeatureItem {
  id: string;
  icon?: string;
  title: string;
  description: string;
}

// Features block
export interface FeaturesBlock extends BaseBlock {
  type: "features";
  data: {
    heading?: string;
    subheading?: string;
    columns?: 2 | 3 | 4;
    features: FeatureItem[];
    style?: "cards" | "icons" | "minimal";
  };
}

// Testimonial item
export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
}

// Testimonial block
export interface TestimonialBlock extends BaseBlock {
  type: "testimonial";
  data: {
    heading?: string;
    layout?: "single" | "grid" | "carousel";
    testimonials: TestimonialItem[];
  };
}

// FAQ item
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// FAQ block
export interface FAQBlock extends BaseBlock {
  type: "faq";
  data: {
    heading?: string;
    subheading?: string;
    items: FAQItem[];
  };
}

// Footer link
export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

// Footer block
export interface FooterBlock extends BaseBlock {
  type: "footer";
  data: {
    companyName?: string;
    tagline?: string;
    links?: FooterLink[];
    showSocial?: boolean;
    socialLinks?: {
      facebook?: string;
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
    copyright?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

// Spacer block
export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  data: {
    height: string;
  };
}

// Video block
export interface VideoBlock extends BaseBlock {
  type: "video";
  data: {
    url: string;
    title?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
  };
}

// CTA block
export interface CTABlock extends BaseBlock {
  type: "cta";
  data: {
    heading: string;
    subheading?: string;
    buttonText: string;
    buttonUrl: string;
    buttonStyle?: "primary" | "secondary" | "outline";
    backgroundColor?: string;
    textColor?: string;
  };
}

// Union type of all blocks
export type PageBlock =
  | HeroBlock
  | TextBlock
  | ImageBlock
  | FormBlock
  | FeaturesBlock
  | TestimonialBlock
  | FAQBlock
  | FooterBlock
  | SpacerBlock
  | VideoBlock
  | CTABlock;

// Page configuration
export interface PageConfig {
  blocks: PageBlock[];
}

// Page settings
export interface PageSettings {
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;

  // Styling
  fontFamily?: string;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;

  // Analytics
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  customHeadCode?: string;
  customBodyCode?: string;

  // Custom domain
  customDomain?: string;

  // Favicon
  favicon?: string;
}

// Default settings
export const defaultPageSettings: PageSettings = {
  fontFamily: "system-ui, -apple-system, sans-serif",
  primaryColor: "#3b82f6",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
};

// Page with creator info
export interface PageWithCreator extends LandingPage {
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Page status configuration
export const pageStatusConfig: Record<
  PageStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  published: {
    label: "Published",
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  archived: {
    label: "Archived",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
};

// Block type configuration
export const blockTypeConfig: Record<
  BlockType,
  { label: string; description: string; icon: string }
> = {
  hero: {
    label: "Hero Section",
    description: "Eye-catching header with headline and CTA",
    icon: "layout-template",
  },
  text: {
    label: "Text Block",
    description: "Rich text content",
    icon: "type",
  },
  image: {
    label: "Image",
    description: "Image with optional caption",
    icon: "image",
  },
  form: {
    label: "Form Embed",
    description: "Embed a lead capture form",
    icon: "file-text",
  },
  features: {
    label: "Features Grid",
    description: "Showcase features or benefits",
    icon: "grid-3x3",
  },
  testimonial: {
    label: "Testimonials",
    description: "Customer testimonials",
    icon: "quote",
  },
  faq: {
    label: "FAQ",
    description: "Frequently asked questions",
    icon: "help-circle",
  },
  footer: {
    label: "Footer",
    description: "Page footer with links",
    icon: "align-end-horizontal",
  },
  spacer: {
    label: "Spacer",
    description: "Add vertical spacing",
    icon: "move-vertical",
  },
  video: {
    label: "Video",
    description: "Embed a video",
    icon: "play",
  },
  cta: {
    label: "Call to Action",
    description: "Prominent CTA section",
    icon: "megaphone",
  },
};

// Form data for creating/updating pages
export interface PageFormData {
  title: string;
  slug?: string;
  description?: string;
  status?: PageStatus;
  config?: PageConfig;
  settings?: PageSettings;
}

// Filters for pages
export interface PageFilters {
  status?: PageStatus[];
  search?: string;
}

// Create a new block with defaults
export function createBlock(type: BlockType): PageBlock {
  const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  switch (type) {
    case "hero":
      return {
        id,
        type: "hero",
        visible: true,
        data: {
          heading: "Welcome to Our Website",
          subheading: "Discover amazing things we have to offer",
          ctaText: "Get Started",
          ctaUrl: "#",
          alignment: "center",
          minHeight: "500px",
        },
      };

    case "text":
      return {
        id,
        type: "text",
        visible: true,
        data: {
          content: "Add your content here...",
          alignment: "left",
          fontSize: "base",
        },
      };

    case "image":
      return {
        id,
        type: "image",
        visible: true,
        data: {
          src: "",
          alt: "Image description",
          alignment: "center",
        },
      };

    case "form":
      return {
        id,
        type: "form",
        visible: true,
        data: {
          formId: "",
          title: "Contact Us",
          description: "Fill out the form below",
        },
      };

    case "features":
      return {
        id,
        type: "features",
        visible: true,
        data: {
          heading: "Features",
          columns: 3,
          style: "cards",
          features: [
            { id: "f1", title: "Feature 1", description: "Description of feature 1" },
            { id: "f2", title: "Feature 2", description: "Description of feature 2" },
            { id: "f3", title: "Feature 3", description: "Description of feature 3" },
          ],
        },
      };

    case "testimonial":
      return {
        id,
        type: "testimonial",
        visible: true,
        data: {
          heading: "What Our Customers Say",
          layout: "grid",
          testimonials: [
            {
              id: "t1",
              quote: "Amazing product! Highly recommended.",
              author: "John Doe",
              role: "CEO",
              company: "Acme Inc",
            },
          ],
        },
      };

    case "faq":
      return {
        id,
        type: "faq",
        visible: true,
        data: {
          heading: "Frequently Asked Questions",
          items: [
            { id: "q1", question: "What is your product?", answer: "Our product is..." },
            { id: "q2", question: "How does it work?", answer: "It works by..." },
          ],
        },
      };

    case "footer":
      return {
        id,
        type: "footer",
        visible: true,
        data: {
          companyName: "Your Company",
          copyright: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
        },
      };

    case "spacer":
      return {
        id,
        type: "spacer",
        visible: true,
        data: {
          height: "64px",
        },
      };

    case "video":
      return {
        id,
        type: "video",
        visible: true,
        data: {
          url: "",
          autoplay: false,
          loop: false,
          muted: true,
        },
      };

    case "cta":
      return {
        id,
        type: "cta",
        visible: true,
        data: {
          heading: "Ready to Get Started?",
          subheading: "Join thousands of satisfied customers",
          buttonText: "Sign Up Now",
          buttonUrl: "#",
          buttonStyle: "primary",
        },
      };
  }
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}
