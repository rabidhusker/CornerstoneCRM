"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Eye,
  Mail,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  templateCategoryConfig,
  type EmailTemplateWithCreator,
} from "@/types/template";

interface TemplateCardProps {
  template: EmailTemplateWithCreator;
  onUse?: (template: EmailTemplateWithCreator) => void;
  onEdit?: (template: EmailTemplateWithCreator) => void;
  onDuplicate?: (template: EmailTemplateWithCreator) => void;
  onDelete?: (template: EmailTemplateWithCreator) => void;
  onPreview?: (template: EmailTemplateWithCreator) => void;
}

export function TemplateCard({
  template,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
  onPreview,
}: TemplateCardProps) {
  const router = useRouter();
  const categoryConfig = templateCategoryConfig[template.category];

  const handleClick = () => {
    router.push(`/dashboard/campaigns/templates/${template.id}`);
  };

  // Generate a simple preview from HTML content
  const previewText = React.useMemo(() => {
    if (!template.content_html) return "";
    return template.content_html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 150);
  }, [template.content_html]);

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all overflow-hidden"
      onClick={handleClick}
    >
      {/* Thumbnail Preview */}
      <div className="relative h-40 bg-muted overflow-hidden border-b">
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="w-full h-full object-cover object-top"
          />
        ) : template.content_html ? (
          <div className="w-full h-full p-3 overflow-hidden">
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
              <div className="text-muted-foreground line-clamp-6">
                {previewText}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <FileText className="h-12 w-12" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview?.(template);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUse?.(template);
                  }}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Use Template</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <Badge className={cn("text-xs", categoryConfig.color)}>
            {categoryConfig.label}
          </Badge>
        </div>

        {/* Default badge */}
        {template.is_default && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              Default
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate">{template.name}</h3>
            {template.subject_line && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {template.subject_line}
              </p>
            )}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUse?.(template)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Use Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(template)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(template)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(template)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 border-t bg-muted/30">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>
            Updated {formatDistanceToNow(new Date(template.updated_at))} ago
          </span>
          {template.creator && (
            <span>by {template.creator.full_name || "Unknown"}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Compact list view version
export function TemplateCardCompact({
  template,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
}: TemplateCardProps) {
  const router = useRouter();
  const categoryConfig = templateCategoryConfig[template.category];

  const handleClick = () => {
    router.push(`/dashboard/campaigns/templates/${template.id}`);
  };

  return (
    <div
      className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleClick}
    >
      {/* Mini preview */}
      <div className="w-16 h-12 bg-muted rounded overflow-hidden shrink-0 border">
        {template.content_html ? (
          <div className="w-full h-full p-1 overflow-hidden">
            <div className="w-full h-full bg-white rounded text-[4px] p-1 overflow-hidden">
              <div className="truncate">{template.subject_line}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <FileText className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{template.name}</h4>
          <Badge className={cn("text-xs shrink-0", categoryConfig.color)}>
            {categoryConfig.label}
          </Badge>
          {template.is_default && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Default
            </Badge>
          )}
        </div>
        {template.subject_line && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {template.subject_line}
          </p>
        )}
      </div>

      <div className="text-sm text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(template.updated_at))} ago
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onUse?.(template)}>
              <Mail className="mr-2 h-4 w-4" />
              Use Template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(template)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(template)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(template)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
