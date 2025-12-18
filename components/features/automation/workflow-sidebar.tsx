"use client";

import * as React from "react";
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
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useWorkflowStore } from "@/stores/workflow-store";
import {
  triggerDefinitions,
  stepDefinitions,
  type TriggerType,
  type StepType,
} from "@/types/workflow";

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

interface DraggableNodeProps {
  type: "trigger" | "action" | "condition" | "wait";
  nodeType: TriggerType | StepType;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

function DraggableNode({
  type,
  nodeType,
  label,
  description,
  icon: Icon,
  color,
}: DraggableNodeProps) {
  const handleDragStart = (event: React.DragEvent) => {
    const nodeData = JSON.stringify({
      type,
      nodeType,
      label,
      config: getDefaultConfig(nodeType),
    });
    event.dataTransfer.setData("application/workflow-node", nodeData);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-grab",
        "hover:border-primary hover:bg-accent transition-colors",
        "active:cursor-grabbing"
      )}
    >
      <div className={cn("p-2 rounded-md", color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </div>
  );
}

function getDefaultConfig(nodeType: TriggerType | StepType): Record<string, any> {
  switch (nodeType) {
    case "wait":
      return { duration: 1, unit: "days" };
    case "condition":
      return { conditions: [], logic: "and" };
    case "split":
      return {
        split_type: "percentage",
        variants: [
          { id: "a", name: "Variant A", percentage: 50 },
          { id: "b", name: "Variant B", percentage: 50 },
        ],
      };
    case "send_email":
      return { subject: "", content_html: "" };
    case "send_sms":
      return { message: "" };
    case "add_tag":
    case "remove_tag":
      return { tag_ids: [] };
    case "create_task":
      return { title: "", priority: "medium" };
    case "create_deal":
      return { title: "", pipeline_id: "", stage_id: "" };
    case "send_notification":
      return { type: "email", recipients: [], subject: "", message: "" };
    default:
      return {};
  }
}

interface WorkflowSidebarProps {
  className?: string;
}

export function WorkflowSidebar({ className }: WorkflowSidebarProps) {
  const { sidebarTab, setSidebarTab, searchQuery, setSearchQuery, nodes } =
    useWorkflowStore();

  // Check if workflow already has a trigger
  const hasTrigger = nodes.some((node) => node.type === "trigger");

  // Filter nodes by search
  const filterBySearch = <T extends { label: string; description: string }>(items: T[]): T[] => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  };

  // Group triggers
  const triggers = Object.entries(triggerDefinitions).map(([type, def]) => ({
    type: "trigger" as const,
    nodeType: type as TriggerType,
    label: def.label,
    description: def.description,
    icon: iconMap[type as TriggerType],
    color: def.color,
  }));

  // Group steps by category
  const actionSteps = Object.entries(stepDefinitions)
    .filter(([, def]) => def.category === "action")
    .map(([type, def]) => ({
      type: "action" as const,
      nodeType: type as StepType,
      label: def.label,
      description: def.description,
      icon: iconMap[type as StepType],
      color: def.color,
    }));

  const logicSteps = Object.entries(stepDefinitions)
    .filter(([, def]) => def.category === "logic")
    .map(([type, def]) => ({
      type: (type === "wait" ? "wait" : "condition") as
        | "condition"
        | "wait",
      nodeType: type as StepType,
      label: def.label,
      description: def.description,
      icon: iconMap[type as StepType],
      color: def.color,
    }));

  const filteredTriggers = filterBySearch(triggers);
  const filteredActions = filterBySearch(actionSteps);
  const filteredLogic = filterBySearch(logicSteps);

  return (
    <div className={cn("flex flex-col h-full border-r bg-background", className)}>
      <Tabs
        value={sidebarTab}
        onValueChange={(v) => setSidebarTab(v as "nodes" | "settings")}
        className="flex flex-col h-full"
      >
        <TabsList className="w-full justify-start rounded-none border-b px-4 py-6 h-auto">
          <TabsTrigger value="nodes" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Nodes
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="flex-1 mt-0 overflow-hidden">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 h-[calc(100%-80px)]">
            <Accordion
              type="multiple"
              defaultValue={["triggers", "actions", "logic"]}
              className="px-4 pb-4"
            >
              {/* Triggers */}
              <AccordionItem value="triggers">
                <AccordionTrigger className="text-sm font-semibold">
                  Triggers
                  {hasTrigger && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (1 max)
                    </span>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {filteredTriggers.map((trigger) => (
                      <div
                        key={trigger.nodeType}
                        className={cn(
                          hasTrigger && "opacity-50 pointer-events-none"
                        )}
                      >
                        <DraggableNode {...trigger} />
                      </div>
                    ))}
                    {filteredTriggers.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">
                        No triggers found
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Actions */}
              <AccordionItem value="actions">
                <AccordionTrigger className="text-sm font-semibold">
                  Actions
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {filteredActions.map((action) => (
                      <DraggableNode key={action.nodeType} {...action} />
                    ))}
                    {filteredActions.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">
                        No actions found
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Logic */}
              <AccordionItem value="logic">
                <AccordionTrigger className="text-sm font-semibold">
                  Logic & Flow
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {filteredLogic.map((logic) => (
                      <DraggableNode key={logic.nodeType} {...logic} />
                    ))}
                    {filteredLogic.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">
                        No logic nodes found
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 mt-0">
          <WorkflowSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowSettingsPanel() {
  const { workflowSettings, setWorkflowSettings } = useWorkflowStore();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Enrollment Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={workflowSettings.allow_re_enrollment}
                onChange={(e) =>
                  setWorkflowSettings({ allow_re_enrollment: e.target.checked })
                }
                className="rounded border-input"
              />
              <div>
                <p className="text-sm font-medium">Allow re-enrollment</p>
                <p className="text-xs text-muted-foreground">
                  Contacts can enter this workflow multiple times
                </p>
              </div>
            </label>

            <div>
              <label className="text-sm font-medium">Enrollment limit</label>
              <p className="text-xs text-muted-foreground mb-2">
                Maximum number of contacts that can be enrolled
              </p>
              <Input
                type="number"
                placeholder="Unlimited"
                value={workflowSettings.enrollment_limit || ""}
                onChange={(e) =>
                  setWorkflowSettings({
                    enrollment_limit: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                min={1}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Timing Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Timezone</label>
              <p className="text-xs text-muted-foreground mb-2">
                Used for date-based triggers and scheduling
              </p>
              <select
                value={workflowSettings.timezone || "UTC"}
                onChange={(e) =>
                  setWorkflowSettings({ timezone: e.target.value })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={workflowSettings.working_hours_only || false}
                onChange={(e) =>
                  setWorkflowSettings({ working_hours_only: e.target.checked })
                }
                className="rounded border-input"
              />
              <div>
                <p className="text-sm font-medium">Working hours only</p>
                <p className="text-xs text-muted-foreground">
                  Only send emails/SMS during business hours
                </p>
              </div>
            </label>

            {workflowSettings.working_hours_only && (
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div>
                  <label className="text-xs text-muted-foreground">Start</label>
                  <Input
                    type="time"
                    value={workflowSettings.working_hours?.start || "09:00"}
                    onChange={(e) =>
                      setWorkflowSettings({
                        working_hours: {
                          ...workflowSettings.working_hours,
                          start: e.target.value,
                          end: workflowSettings.working_hours?.end || "17:00",
                          days: workflowSettings.working_hours?.days || [
                            1, 2, 3, 4, 5,
                          ],
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End</label>
                  <Input
                    type="time"
                    value={workflowSettings.working_hours?.end || "17:00"}
                    onChange={(e) =>
                      setWorkflowSettings({
                        working_hours: {
                          ...workflowSettings.working_hours,
                          start:
                            workflowSettings.working_hours?.start || "09:00",
                          end: e.target.value,
                          days: workflowSettings.working_hours?.days || [
                            1, 2, 3, 4, 5,
                          ],
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
