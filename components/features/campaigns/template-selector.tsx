"use client";

import * as React from "react";
import {
  Search,
  FileText,
  Clock,
  Sparkles,
  Check,
  Eye,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailPreviewModal } from "./email-preview";
import {
  templateCategoryConfig,
  type EmailTemplate,
  type TemplateCategory,
} from "@/types/template";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: EmailTemplate | null) => void;
  templates: EmailTemplate[];
  isLoading?: boolean;
  recentTemplateIds?: string[];
}

export function TemplateSelector({
  open,
  onOpenChange,
  onSelect,
  templates,
  isLoading = false,
  recentTemplateIds = [],
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<TemplateCategory | "all" | "recent">("all");
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = React.useState<EmailTemplate | null>(null);

  // Filter templates based on search and category
  const filteredTemplates = React.useMemo(() => {
    let result = templates;

    // Filter by category
    if (selectedCategory === "recent") {
      result = result.filter((t) => recentTemplateIds.includes(t.id));
    } else if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.subject_line?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [templates, selectedCategory, searchQuery, recentTemplateIds]);

  // Get recent templates
  const recentTemplates = React.useMemo(() => {
    return templates.filter((t) => recentTemplateIds.includes(t.id));
  }, [templates, recentTemplateIds]);

  // Categories with counts
  const categoriesWithCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };

    for (const template of templates) {
      if (!counts[template.category]) {
        counts[template.category] = 0;
      }
      counts[template.category]++;
    }

    return counts;
  }, [templates]);

  const handleSelect = () => {
    onSelect(selectedTemplate);
    onOpenChange(false);
    setSelectedTemplate(null);
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const handleStartFromScratch = () => {
    onSelect(null);
    onOpenChange(false);
    setSelectedTemplate(null);
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Select a template to start with or create from scratch
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Categories */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Tabs
              value={selectedCategory}
              onValueChange={(v) => setSelectedCategory(v as TemplateCategory | "all" | "recent")}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all" className="gap-1">
                  All
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {categoriesWithCounts.all || 0}
                  </Badge>
                </TabsTrigger>
                {recentTemplates.length > 0 && (
                  <TabsTrigger value="recent" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Recent
                  </TabsTrigger>
                )}
                {Object.entries(templateCategoryConfig).map(([key, config]) => {
                  const count = categoriesWithCounts[key] || 0;
                  if (count === 0) return null;
                  return (
                    <TabsTrigger key={key} value={key} className="gap-1">
                      {config.label}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {count}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value={selectedCategory} className="flex-1 mt-4 min-h-0">
                <ScrollArea className="h-full">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pr-4">
                      {/* Start from scratch option */}
                      <button
                        type="button"
                        onClick={handleStartFromScratch}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors hover:border-primary hover:bg-primary/5 text-center min-h-[200px]",
                          !selectedTemplate && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="p-3 bg-primary/10 rounded-full mb-3">
                          <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <p className="font-semibold">Start from Scratch</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create a new email from a blank canvas
                        </p>
                      </button>

                      {/* Template cards */}
                      {filteredTemplates.map((template) => (
                        <TemplatePreviewCard
                          key={template.id}
                          template={template}
                          isSelected={selectedTemplate?.id === template.id}
                          onSelect={() => setSelectedTemplate(template)}
                          onPreview={() => setPreviewTemplate(template)}
                        />
                      ))}

                      {filteredTemplates.length === 0 && searchQuery && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          No templates found matching &quot;{searchQuery}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelect}>
              {selectedTemplate ? "Use Template" : "Start from Scratch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewTemplate && (
        <EmailPreviewModal
          open={!!previewTemplate}
          onOpenChange={() => setPreviewTemplate(null)}
          subjectLine={previewTemplate.subject_line || ""}
          contentHtml={previewTemplate.content_html || ""}
        />
      )}
    </>
  );
}

// Internal template preview card component
interface TemplatePreviewCardProps {
  template: EmailTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

function TemplatePreviewCard({
  template,
  isSelected,
  onSelect,
  onPreview,
}: TemplatePreviewCardProps) {
  const categoryConfig = templateCategoryConfig[template.category];

  // Generate preview text from HTML
  const previewText = React.useMemo(() => {
    if (!template.content_html) return "";
    return template.content_html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);
  }, [template.content_html]);

  return (
    <div
      className={cn(
        "relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}

      {/* Preview thumbnail */}
      <div className="h-32 bg-muted p-2 overflow-hidden">
        {template.content_html ? (
          <div
            className="w-full h-full bg-white rounded shadow-sm p-2 text-[6px] leading-tight overflow-hidden"
            style={{
              transform: "scale(0.5)",
              transformOrigin: "top left",
              width: "200%",
              height: "200%",
            }}
          >
            <div className="text-xs font-medium mb-1 truncate">
              {template.subject_line || "No subject"}
            </div>
            <div className="text-muted-foreground">{previewText}</div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <FileText className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm line-clamp-1">{template.name}</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Badge className={cn("text-xs", categoryConfig.color)}>
          {categoryConfig.label}
        </Badge>
        {template.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {template.description}
          </p>
        )}
      </div>
    </div>
  );
}
