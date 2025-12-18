"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Mail,
  Smartphone,
  Tag,
  X,
  Edit,
  CheckSquare,
  Briefcase,
  Bell,
  Clock,
  GitBranch,
  Shuffle,
  ArrowRight,
  Square,
  UserPlus,
  UserCog,
  Calendar,
  Hand,
  FileText,
  MoreVertical,
  Trash2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkflowStore, type WorkflowNode } from "@/stores/workflow-store";
import type { TriggerType, StepType } from "@/types/workflow";

// Icon mapping
const iconMap: Record<TriggerType | StepType, React.FC<{ className?: string }>> = {
  contact_created: UserPlus,
  contact_updated: UserCog,
  tag_added: Tag,
  tag_removed: Tag,
  deal_stage_changed: GitBranch,
  deal_created: Briefcase,
  form_submitted: FileText,
  date_based: Calendar,
  manual: Hand,
  send_email: Mail,
  send_sms: Smartphone,
  add_tag: Tag,
  remove_tag: X,
  update_field: Edit,
  create_task: CheckSquare,
  create_deal: Briefcase,
  send_notification: Bell,
  wait: Clock,
  condition: GitBranch,
  split: Shuffle,
  go_to: ArrowRight,
  end: Square,
};

// Color mapping by category
const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
  trigger: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
  },
  action: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  condition: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
  },
  wait: {
    bg: "bg-slate-50 dark:bg-slate-900/20",
    border: "border-slate-200 dark:border-slate-800",
    icon: "text-slate-600 dark:text-slate-400",
  },
};

interface BaseNodeProps {
  id: string;
  data: WorkflowNode["data"];
  selected: boolean;
  category: "trigger" | "action" | "condition" | "wait";
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  sourceHandles?: { id: string; label: string }[];
}

export function BaseNode({
  id,
  data,
  selected,
  category,
  showSourceHandle = true,
  showTargetHandle = true,
  sourceHandles,
}: BaseNodeProps) {
  const { removeNode, duplicateNode, setSelectedNodeId } = useWorkflowStore();
  const colors = colorMap[category];
  const Icon = iconMap[data.nodeType] || Square;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-lg border-2 shadow-sm min-w-[200px] max-w-[280px]",
        "transition-all duration-200",
        colors.bg,
        colors.border,
        selected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Target Handle (input) */}
      {showTargetHandle && category !== "trigger" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
        />
      )}

      {/* Node Content */}
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-md", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate">{data.label}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {category !== "trigger" && (
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Badge variant="secondary" className="mt-1 text-xs font-normal">
            {formatNodeType(data.nodeType)}
          </Badge>
        </div>
      </div>

      {/* Source Handle(s) */}
      {showSourceHandle && (
        <>
          {sourceHandles && sourceHandles.length > 0 ? (
            // Multiple handles for condition/split nodes
            <div className="absolute -bottom-3 left-0 right-0 flex justify-around px-4">
              {sourceHandles.map((handle, index) => (
                <div key={handle.id} className="relative flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">
                    {handle.label}
                  </span>
                  <Handle
                    type="source"
                    position={Position.Bottom}
                    id={handle.id}
                    className="!relative !transform-none !w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
                    style={{ position: "relative", left: 0, top: 0 }}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Single handle
            <Handle
              type="source"
              position={Position.Bottom}
              className="!w-3 !h-3 !bg-muted-foreground/50 !border-2 !border-background"
            />
          )}
        </>
      )}
    </div>
  );
}

function formatNodeType(type: TriggerType | StepType): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
