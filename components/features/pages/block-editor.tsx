"use client";

import * as React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForms } from "@/lib/hooks/use-forms";
import type {
  PageBlock,
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
  FeatureItem,
  TestimonialItem,
  FAQItem,
} from "@/types/page";

interface BlockEditorProps {
  block: PageBlock;
  onChange: (block: PageBlock) => void;
}

export function BlockEditor({ block, onChange }: BlockEditorProps) {
  switch (block.type) {
    case "hero":
      return <HeroBlockEditor block={block} onChange={onChange} />;
    case "text":
      return <TextBlockEditor block={block} onChange={onChange} />;
    case "image":
      return <ImageBlockEditor block={block} onChange={onChange} />;
    case "form":
      return <FormBlockEditor block={block} onChange={onChange} />;
    case "features":
      return <FeaturesBlockEditor block={block} onChange={onChange} />;
    case "testimonial":
      return <TestimonialBlockEditor block={block} onChange={onChange} />;
    case "faq":
      return <FAQBlockEditor block={block} onChange={onChange} />;
    case "footer":
      return <FooterBlockEditor block={block} onChange={onChange} />;
    case "spacer":
      return <SpacerBlockEditor block={block} onChange={onChange} />;
    case "video":
      return <VideoBlockEditor block={block} onChange={onChange} />;
    case "cta":
      return <CTABlockEditor block={block} onChange={onChange} />;
    default:
      return <div>Unknown block type</div>;
  }
}

// Hero Block Editor
function HeroBlockEditor({
  block,
  onChange,
}: {
  block: HeroBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<HeroBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading">Heading</Label>
        <Input
          id="heading"
          value={block.data.heading}
          onChange={(e) => updateData({ heading: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subheading">Subheading</Label>
        <Textarea
          id="subheading"
          value={block.data.subheading || ""}
          onChange={(e) => updateData({ subheading: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="ctaText">Button Text</Label>
        <Input
          id="ctaText"
          value={block.data.ctaText || ""}
          onChange={(e) => updateData({ ctaText: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ctaUrl">Button URL</Label>
        <Input
          id="ctaUrl"
          value={block.data.ctaUrl || ""}
          onChange={(e) => updateData({ ctaUrl: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ctaStyle">Button Style</Label>
        <Select
          value={block.data.ctaStyle || "primary"}
          onValueChange={(value) =>
            updateData({ ctaStyle: value as "primary" | "secondary" | "outline" })
          }
        >
          <SelectTrigger id="ctaStyle">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="secondaryCtaText">Secondary Button Text</Label>
        <Input
          id="secondaryCtaText"
          value={block.data.secondaryCtaText || ""}
          onChange={(e) => updateData({ secondaryCtaText: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="secondaryCtaUrl">Secondary Button URL</Label>
        <Input
          id="secondaryCtaUrl"
          value={block.data.secondaryCtaUrl || ""}
          onChange={(e) => updateData({ secondaryCtaUrl: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="alignment">Text Alignment</Label>
        <Select
          value={block.data.alignment || "center"}
          onValueChange={(value) =>
            updateData({ alignment: value as "left" | "center" | "right" })
          }
        >
          <SelectTrigger id="alignment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minHeight">Minimum Height</Label>
        <Input
          id="minHeight"
          value={block.data.minHeight || ""}
          placeholder="e.g., 500px"
          onChange={(e) => updateData({ minHeight: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="backgroundImage">Background Image URL</Label>
        <Input
          id="backgroundImage"
          value={block.data.backgroundImage || ""}
          onChange={(e) => updateData({ backgroundImage: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="backgroundColor">Background Color</Label>
        <div className="flex gap-2">
          <Input
            id="backgroundColor"
            type="color"
            className="w-12 h-10 p-1"
            value={block.data.backgroundColor || "#1f2937"}
            onChange={(e) => updateData({ backgroundColor: e.target.value })}
          />
          <Input
            value={block.data.backgroundColor || ""}
            onChange={(e) => updateData({ backgroundColor: e.target.value })}
            placeholder="#1f2937"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="textColor">Text Color</Label>
        <div className="flex gap-2">
          <Input
            id="textColor"
            type="color"
            className="w-12 h-10 p-1"
            value={block.data.textColor || "#ffffff"}
            onChange={(e) => updateData({ textColor: e.target.value })}
          />
          <Input
            value={block.data.textColor || ""}
            onChange={(e) => updateData({ textColor: e.target.value })}
            placeholder="#ffffff"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="overlay">Show Overlay</Label>
        <Switch
          id="overlay"
          checked={block.data.overlay || false}
          onCheckedChange={(checked) => updateData({ overlay: checked })}
        />
      </div>

      {block.data.overlay && (
        <div className="space-y-2">
          <Label htmlFor="overlayOpacity">
            Overlay Opacity: {block.data.overlayOpacity || 50}%
          </Label>
          <input
            type="range"
            id="overlayOpacity"
            min="0"
            max="100"
            value={block.data.overlayOpacity || 50}
            onChange={(e) =>
              updateData({ overlayOpacity: parseInt(e.target.value) })
            }
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

// Text Block Editor
function TextBlockEditor({
  block,
  onChange,
}: {
  block: TextBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<TextBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={block.data.content}
          onChange={(e) => updateData({ content: e.target.value })}
          rows={8}
          placeholder="Enter your text content..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alignment">Alignment</Label>
        <Select
          value={block.data.alignment || "left"}
          onValueChange={(value) =>
            updateData({ alignment: value as "left" | "center" | "right" })
          }
        >
          <SelectTrigger id="alignment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fontSize">Font Size</Label>
        <Select
          value={block.data.fontSize || "base"}
          onValueChange={(value) =>
            updateData({ fontSize: value as "sm" | "base" | "lg" | "xl" })
          }
        >
          <SelectTrigger id="fontSize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="base">Normal</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="xl">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxWidth">Max Width</Label>
        <Input
          id="maxWidth"
          value={block.data.maxWidth || ""}
          placeholder="e.g., 800px"
          onChange={(e) => updateData({ maxWidth: e.target.value })}
        />
      </div>
    </div>
  );
}

// Image Block Editor
function ImageBlockEditor({
  block,
  onChange,
}: {
  block: ImageBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<ImageBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="src">Image URL</Label>
        <Input
          id="src"
          value={block.data.src}
          onChange={(e) => updateData({ src: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alt">Alt Text</Label>
        <Input
          id="alt"
          value={block.data.alt}
          onChange={(e) => updateData({ alt: e.target.value })}
          placeholder="Image description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caption">Caption</Label>
        <Input
          id="caption"
          value={block.data.caption || ""}
          onChange={(e) => updateData({ caption: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="width">Width</Label>
        <Input
          id="width"
          value={block.data.width || ""}
          placeholder="e.g., 100% or 600px"
          onChange={(e) => updateData({ width: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alignment">Alignment</Label>
        <Select
          value={block.data.alignment || "center"}
          onValueChange={(value) =>
            updateData({ alignment: value as "left" | "center" | "right" })
          }
        >
          <SelectTrigger id="alignment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkUrl">Link URL (optional)</Label>
        <Input
          id="linkUrl"
          value={block.data.linkUrl || ""}
          onChange={(e) => updateData({ linkUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="borderRadius">Border Radius</Label>
        <Input
          id="borderRadius"
          value={block.data.borderRadius || ""}
          placeholder="e.g., 8px"
          onChange={(e) => updateData({ borderRadius: e.target.value })}
        />
      </div>
    </div>
  );
}

// Form Block Editor
function FormBlockEditor({
  block,
  onChange,
}: {
  block: FormBlock;
  onChange: (block: PageBlock) => void;
}) {
  const { data: forms, isLoading } = useForms();

  const updateData = (updates: Partial<FormBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="formId">Select Form</Label>
        <Select
          value={block.data.formId}
          onValueChange={(value) => updateData({ formId: value })}
          disabled={isLoading}
        >
          <SelectTrigger id="formId">
            <SelectValue placeholder={isLoading ? "Loading forms..." : "Select a form"} />
          </SelectTrigger>
          <SelectContent>
            {forms?.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Section Title</Label>
        <Input
          id="title"
          value={block.data.title || ""}
          onChange={(e) => updateData({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={block.data.description || ""}
          onChange={(e) => updateData({ description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="backgroundColor">Background Color</Label>
        <div className="flex gap-2">
          <Input
            id="backgroundColor"
            type="color"
            className="w-12 h-10 p-1"
            value={block.data.backgroundColor || "#f9fafb"}
            onChange={(e) => updateData({ backgroundColor: e.target.value })}
          />
          <Input
            value={block.data.backgroundColor || ""}
            onChange={(e) => updateData({ backgroundColor: e.target.value })}
            placeholder="#f9fafb"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="padding">Padding</Label>
        <Input
          id="padding"
          value={block.data.padding || ""}
          placeholder="e.g., 48px"
          onChange={(e) => updateData({ padding: e.target.value })}
        />
      </div>
    </div>
  );
}

// Features Block Editor
function FeaturesBlockEditor({
  block,
  onChange,
}: {
  block: FeaturesBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<FeaturesBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  const addFeature = () => {
    const newFeature: FeatureItem = {
      id: `f_${Date.now()}`,
      title: "New Feature",
      description: "Feature description",
    };
    updateData({ features: [...block.data.features, newFeature] });
  };

  const updateFeature = (id: string, updates: Partial<FeatureItem>) => {
    updateData({
      features: block.data.features.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  };

  const removeFeature = (id: string) => {
    updateData({ features: block.data.features.filter((f) => f.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading">Section Heading</Label>
        <Input
          id="heading"
          value={block.data.heading || ""}
          onChange={(e) => updateData({ heading: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subheading">Subheading</Label>
        <Input
          id="subheading"
          value={block.data.subheading || ""}
          onChange={(e) => updateData({ subheading: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="columns">Columns</Label>
        <Select
          value={String(block.data.columns || 3)}
          onValueChange={(value) => updateData({ columns: parseInt(value) as 2 | 3 | 4 })}
        >
          <SelectTrigger id="columns">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="style">Style</Label>
        <Select
          value={block.data.style || "cards"}
          onValueChange={(value) =>
            updateData({ style: value as "cards" | "icons" | "minimal" })
          }
        >
          <SelectTrigger id="style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="icons">Icons</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Features</Label>
          <Button type="button" variant="outline" size="sm" onClick={addFeature}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {block.data.features.map((feature, index) => (
            <div key={feature.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Feature {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeFeature(feature.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={feature.title}
                onChange={(e) => updateFeature(feature.id, { title: e.target.value })}
                placeholder="Title"
              />
              <Textarea
                value={feature.description}
                onChange={(e) =>
                  updateFeature(feature.id, { description: e.target.value })
                }
                placeholder="Description"
                rows={2}
              />
              <Input
                value={feature.icon || ""}
                onChange={(e) => updateFeature(feature.id, { icon: e.target.value })}
                placeholder="Icon name (optional)"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Testimonial Block Editor
function TestimonialBlockEditor({
  block,
  onChange,
}: {
  block: TestimonialBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<TestimonialBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  const addTestimonial = () => {
    const newTestimonial: TestimonialItem = {
      id: `t_${Date.now()}`,
      quote: "Add your testimonial here...",
      author: "Customer Name",
      role: "Position",
      company: "Company",
    };
    updateData({ testimonials: [...block.data.testimonials, newTestimonial] });
  };

  const updateTestimonial = (id: string, updates: Partial<TestimonialItem>) => {
    updateData({
      testimonials: block.data.testimonials.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    });
  };

  const removeTestimonial = (id: string) => {
    updateData({
      testimonials: block.data.testimonials.filter((t) => t.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading">Section Heading</Label>
        <Input
          id="heading"
          value={block.data.heading || ""}
          onChange={(e) => updateData({ heading: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="layout">Layout</Label>
        <Select
          value={block.data.layout || "grid"}
          onValueChange={(value) =>
            updateData({ layout: value as "single" | "grid" | "carousel" })
          }
        >
          <SelectTrigger id="layout">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Testimonials</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTestimonial}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {block.data.testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Testimonial {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeTestimonial(testimonial.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Textarea
                value={testimonial.quote}
                onChange={(e) =>
                  updateTestimonial(testimonial.id, { quote: e.target.value })
                }
                placeholder="Quote"
                rows={3}
              />
              <Input
                value={testimonial.author}
                onChange={(e) =>
                  updateTestimonial(testimonial.id, { author: e.target.value })
                }
                placeholder="Author name"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={testimonial.role || ""}
                  onChange={(e) =>
                    updateTestimonial(testimonial.id, { role: e.target.value })
                  }
                  placeholder="Role"
                />
                <Input
                  value={testimonial.company || ""}
                  onChange={(e) =>
                    updateTestimonial(testimonial.id, { company: e.target.value })
                  }
                  placeholder="Company"
                />
              </div>
              <Input
                value={testimonial.avatar || ""}
                onChange={(e) =>
                  updateTestimonial(testimonial.id, { avatar: e.target.value })
                }
                placeholder="Avatar URL (optional)"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// FAQ Block Editor
function FAQBlockEditor({
  block,
  onChange,
}: {
  block: FAQBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<FAQBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  const addItem = () => {
    const newItem: FAQItem = {
      id: `q_${Date.now()}`,
      question: "New Question?",
      answer: "Answer goes here...",
    };
    updateData({ items: [...block.data.items, newItem] });
  };

  const updateItem = (id: string, updates: Partial<FAQItem>) => {
    updateData({
      items: block.data.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  };

  const removeItem = (id: string) => {
    updateData({ items: block.data.items.filter((item) => item.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading">Section Heading</Label>
        <Input
          id="heading"
          value={block.data.heading || ""}
          onChange={(e) => updateData({ heading: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subheading">Subheading</Label>
        <Input
          id="subheading"
          value={block.data.subheading || ""}
          onChange={(e) => updateData({ subheading: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>FAQ Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {block.data.items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Question {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={item.question}
                onChange={(e) => updateItem(item.id, { question: e.target.value })}
                placeholder="Question"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => updateItem(item.id, { answer: e.target.value })}
                placeholder="Answer"
                rows={3}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Footer Block Editor
function FooterBlockEditor({
  block,
  onChange,
}: {
  block: FooterBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<FooterBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={block.data.companyName || ""}
          onChange={(e) => updateData({ companyName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={block.data.tagline || ""}
          onChange={(e) => updateData({ tagline: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="copyright">Copyright Text</Label>
        <Input
          id="copyright"
          value={block.data.copyright || ""}
          onChange={(e) => updateData({ copyright: e.target.value })}
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="showSocial">Show Social Links</Label>
        <Switch
          id="showSocial"
          checked={block.data.showSocial || false}
          onCheckedChange={(checked) => updateData({ showSocial: checked })}
        />
      </div>

      {block.data.showSocial && (
        <div className="space-y-2">
          <Input
            value={block.data.socialLinks?.facebook || ""}
            onChange={(e) =>
              updateData({
                socialLinks: { ...block.data.socialLinks, facebook: e.target.value },
              })
            }
            placeholder="Facebook URL"
          />
          <Input
            value={block.data.socialLinks?.twitter || ""}
            onChange={(e) =>
              updateData({
                socialLinks: { ...block.data.socialLinks, twitter: e.target.value },
              })
            }
            placeholder="Twitter URL"
          />
          <Input
            value={block.data.socialLinks?.linkedin || ""}
            onChange={(e) =>
              updateData({
                socialLinks: { ...block.data.socialLinks, linkedin: e.target.value },
              })
            }
            placeholder="LinkedIn URL"
          />
          <Input
            value={block.data.socialLinks?.instagram || ""}
            onChange={(e) =>
              updateData({
                socialLinks: { ...block.data.socialLinks, instagram: e.target.value },
              })
            }
            placeholder="Instagram URL"
          />
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="backgroundColor">Background Color</Label>
        <div className="flex gap-2">
          <Input
            id="backgroundColor"
            type="color"
            className="w-12 h-10 p-1"
            value={block.data.backgroundColor || "#1f2937"}
            onChange={(e) => updateData({ backgroundColor: e.target.value })}
          />
          <Input
            value={block.data.backgroundColor || ""}
            onChange={(e) => updateData({ backgroundColor: e.target.value })}
            placeholder="#1f2937"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="textColor">Text Color</Label>
        <div className="flex gap-2">
          <Input
            id="textColor"
            type="color"
            className="w-12 h-10 p-1"
            value={block.data.textColor || "#ffffff"}
            onChange={(e) => updateData({ textColor: e.target.value })}
          />
          <Input
            value={block.data.textColor || ""}
            onChange={(e) => updateData({ textColor: e.target.value })}
            placeholder="#ffffff"
          />
        </div>
      </div>
    </div>
  );
}

// Spacer Block Editor
function SpacerBlockEditor({
  block,
  onChange,
}: {
  block: SpacerBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<SpacerBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="height">Height</Label>
        <Input
          id="height"
          value={block.data.height}
          onChange={(e) => updateData({ height: e.target.value })}
          placeholder="e.g., 64px"
        />
      </div>

      <div className="space-y-2">
        <Label>Quick Presets</Label>
        <div className="flex flex-wrap gap-2">
          {["32px", "48px", "64px", "96px", "128px"].map((height) => (
            <Button
              key={height}
              type="button"
              variant={block.data.height === height ? "default" : "outline"}
              size="sm"
              onClick={() => updateData({ height })}
            >
              {height}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Video Block Editor
function VideoBlockEditor({
  block,
  onChange,
}: {
  block: VideoBlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<VideoBlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">Video URL</Label>
        <Input
          id="url"
          value={block.data.url}
          onChange={(e) => updateData({ url: e.target.value })}
          placeholder="YouTube, Vimeo, or direct video URL"
        />
        <p className="text-xs text-muted-foreground">
          Supports YouTube, Vimeo, and direct video URLs
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          value={block.data.title || ""}
          onChange={(e) => updateData({ title: e.target.value })}
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="autoplay">Autoplay</Label>
        <Switch
          id="autoplay"
          checked={block.data.autoplay || false}
          onCheckedChange={(checked) => updateData({ autoplay: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="loop">Loop</Label>
        <Switch
          id="loop"
          checked={block.data.loop || false}
          onCheckedChange={(checked) => updateData({ loop: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="muted">Muted</Label>
        <Switch
          id="muted"
          checked={block.data.muted || false}
          onCheckedChange={(checked) => updateData({ muted: checked })}
        />
      </div>
    </div>
  );
}

// CTA Block Editor
function CTABlockEditor({
  block,
  onChange,
}: {
  block: CTABlock;
  onChange: (block: PageBlock) => void;
}) {
  const updateData = (updates: Partial<CTABlock["data"]>) => {
    onChange({ ...block, data: { ...block.data, ...updates } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heading">Heading</Label>
        <Input
          id="heading"
          value={block.data.heading}
          onChange={(e) => updateData({ heading: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subheading">Subheading</Label>
        <Textarea
          id="subheading"
          value={block.data.subheading || ""}
          onChange={(e) => updateData({ subheading: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="buttonText">Button Text</Label>
        <Input
          id="buttonText"
          value={block.data.buttonText}
          onChange={(e) => updateData({ buttonText: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonUrl">Button URL</Label>
        <Input
          id="buttonUrl"
          value={block.data.buttonUrl}
          onChange={(e) => updateData({ buttonUrl: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonStyle">Button Style</Label>
        <Select
          value={block.data.buttonStyle || "primary"}
          onValueChange={(value) =>
            updateData({ buttonStyle: value as "primary" | "secondary" | "outline" })
          }
        >
          <SelectTrigger id="buttonStyle">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="outline">Outline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="backgroundColor">Background Color</Label>
        <div className="flex gap-2">
          <Input
            id="backgroundColor"
            type="color"
            className="w-12 h-10 p-1"
            value={block.data.backgroundColor || "#3b82f6"}
            onChange={(e) => updateData({ backgroundColor: e.target.value })}
          />
          <Input
            value={block.data.backgroundColor || ""}
            onChange={(e) => updateData({ backgroundColor: e.target.value })}
            placeholder="#3b82f6"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="textColor">Text Color</Label>
        <div className="flex gap-2">
          <Input
            id="textColor"
            type="color"
            className="w-12 h-10 p-1"
            value={block.data.textColor || "#ffffff"}
            onChange={(e) => updateData({ textColor: e.target.value })}
          />
          <Input
            value={block.data.textColor || ""}
            onChange={(e) => updateData({ textColor: e.target.value })}
            placeholder="#ffffff"
          />
        </div>
      </div>
    </div>
  );
}
