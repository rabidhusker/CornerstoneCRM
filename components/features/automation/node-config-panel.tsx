"use client";

import * as React from "react";
import { X, Mail, Smartphone, Tag, Clock, GitBranch, Bell, Briefcase, CheckSquare, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkflowStore, useSelectedNode } from "@/stores/workflow-store";
import {
  triggerDefinitions,
  stepDefinitions,
  type TriggerType,
  type StepType,
  type SendEmailStepConfig,
  type SendSmsStepConfig,
  type WaitStepConfig,
  type AddTagStepConfig,
  type CreateTaskStepConfig,
  type SendNotificationStepConfig,
  type ConditionStepConfig,
  type TagTriggerConfig,
  type DealStageTriggerConfig,
  type DateBasedTriggerConfig,
} from "@/types/workflow";

interface NodeConfigPanelProps {
  className?: string;
  onClose?: () => void;
}

export function NodeConfigPanel({ className, onClose }: NodeConfigPanelProps) {
  const selectedNode = useSelectedNode();
  const { updateNodeData, clearSelection } = useWorkflowStore();

  if (!selectedNode) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-4 text-center border-l bg-background", className)}>
        <p className="text-muted-foreground">
          Select a node to configure its settings
        </p>
      </div>
    );
  }

  const definition =
    selectedNode.type === "trigger"
      ? triggerDefinitions[selectedNode.data.nodeType as TriggerType]
      : stepDefinitions[selectedNode.data.nodeType as StepType];

  const handleClose = () => {
    clearSelection();
    onClose?.();
  };

  return (
    <div className={cn("flex flex-col h-full border-l bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">{definition?.label || "Configure Node"}</h3>
          <p className="text-xs text-muted-foreground">{definition?.description}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Config Form */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Node name */}
          <div className="space-y-2">
            <Label htmlFor="node-name">Node Name</Label>
            <Input
              id="node-name"
              value={selectedNode.data.label}
              onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
              placeholder="Enter node name..."
            />
          </div>

          {/* Type-specific config */}
          <NodeTypeConfig
            nodeType={selectedNode.data.nodeType}
            config={selectedNode.data.config}
            onConfigChange={(config) =>
              updateNodeData(selectedNode.id, { config })
            }
          />
        </div>
      </ScrollArea>
    </div>
  );
}

interface NodeTypeConfigProps {
  nodeType: TriggerType | StepType;
  config: any;
  onConfigChange: (config: any) => void;
}

function NodeTypeConfig({ nodeType, config, onConfigChange }: NodeTypeConfigProps) {
  const updateConfig = (updates: Record<string, any>) => {
    onConfigChange({ ...config, ...updates });
  };

  switch (nodeType) {
    // Trigger configs
    case "tag_added":
    case "tag_removed":
      return (
        <TagTriggerConfigForm
          config={config as TagTriggerConfig}
          onChange={updateConfig}
        />
      );

    case "deal_stage_changed":
      return (
        <DealStageTriggerConfigForm
          config={config as DealStageTriggerConfig}
          onChange={updateConfig}
        />
      );

    case "date_based":
      return (
        <DateBasedTriggerConfigForm
          config={config as DateBasedTriggerConfig}
          onChange={updateConfig}
        />
      );

    // Step configs
    case "send_email":
      return (
        <SendEmailConfigForm
          config={config as SendEmailStepConfig}
          onChange={updateConfig}
        />
      );

    case "send_sms":
      return (
        <SendSmsConfigForm
          config={config as SendSmsStepConfig}
          onChange={updateConfig}
        />
      );

    case "wait":
      return (
        <WaitConfigForm
          config={config as WaitStepConfig}
          onChange={updateConfig}
        />
      );

    case "add_tag":
    case "remove_tag":
      return (
        <TagStepConfigForm
          config={config as AddTagStepConfig}
          onChange={updateConfig}
        />
      );

    case "create_task":
      return (
        <CreateTaskConfigForm
          config={config as CreateTaskStepConfig}
          onChange={updateConfig}
        />
      );

    case "send_notification":
      return (
        <SendNotificationConfigForm
          config={config as SendNotificationStepConfig}
          onChange={updateConfig}
        />
      );

    case "condition":
      return (
        <ConditionConfigForm
          config={config as ConditionStepConfig}
          onChange={updateConfig}
        />
      );

    default:
      return (
        <p className="text-sm text-muted-foreground">
          No additional configuration needed for this node type.
        </p>
      );
  }
}

// Tag Trigger Config Form
function TagTriggerConfigForm({
  config,
  onChange,
}: {
  config: TagTriggerConfig;
  onChange: (updates: Partial<TagTriggerConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Tags</Label>
        <p className="text-xs text-muted-foreground">
          Trigger when any of these tags are added/removed
        </p>
        {/* In production, this would be a tag selector component */}
        <Input
          placeholder="Tag IDs (comma-separated)"
          value={(config.tag_ids || []).join(", ")}
          onChange={(e) =>
            onChange({
              tag_ids: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    </div>
  );
}

// Deal Stage Trigger Config Form
function DealStageTriggerConfigForm({
  config,
  onChange,
}: {
  config: DealStageTriggerConfig;
  onChange: (updates: Partial<DealStageTriggerConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pipeline</Label>
        {/* In production, this would be a pipeline selector */}
        <Input
          placeholder="Pipeline ID"
          value={config.pipeline_id || ""}
          onChange={(e) => onChange({ pipeline_id: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-2">
        <Label>From Stage (optional)</Label>
        <Input
          placeholder="From Stage ID"
          value={config.from_stage_id || ""}
          onChange={(e) => onChange({ from_stage_id: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-2">
        <Label>To Stage</Label>
        <Input
          placeholder="To Stage ID"
          value={config.to_stage_id || ""}
          onChange={(e) => onChange({ to_stage_id: e.target.value })}
        />
      </div>
    </div>
  );
}

// Date-Based Trigger Config Form
function DateBasedTriggerConfigForm({
  config,
  onChange,
}: {
  config: DateBasedTriggerConfig;
  onChange: (updates: Partial<DateBasedTriggerConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Date Field</Label>
        <Select
          value={config.date_field || ""}
          onValueChange={(v) => onChange({ date_field: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="birthday">Birthday</SelectItem>
            <SelectItem value="anniversary">Anniversary</SelectItem>
            <SelectItem value="contract_end_date">Contract End Date</SelectItem>
            <SelectItem value="created_at">Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Offset (days)</Label>
        <p className="text-xs text-muted-foreground">
          Negative = before, Positive = after
        </p>
        <Input
          type="number"
          value={config.offset_days || 0}
          onChange={(e) => onChange({ offset_days: parseInt(e.target.value, 10) })}
        />
      </div>
      <div className="space-y-2">
        <Label>Time</Label>
        <Input
          type="time"
          value={config.time || "09:00"}
          onChange={(e) => onChange({ time: e.target.value })}
        />
      </div>
    </div>
  );
}

// Send Email Config Form
function SendEmailConfigForm({
  config,
  onChange,
}: {
  config: SendEmailStepConfig;
  onChange: (updates: Partial<SendEmailStepConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Email Template</Label>
        {/* In production, this would be a template selector */}
        <Input
          placeholder="Template ID (optional)"
          value={config.template_id || ""}
          onChange={(e) => onChange({ template_id: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-2">
        <Label>Subject Line</Label>
        <Input
          placeholder="Email subject..."
          value={config.subject || ""}
          onChange={(e) => onChange({ subject: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Use {"{{first_name}}"} for personalization
        </p>
      </div>
      <div className="space-y-2">
        <Label>From Name</Label>
        <Input
          placeholder="Sender name"
          value={config.from_name || ""}
          onChange={(e) => onChange({ from_name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>From Email</Label>
        <Input
          type="email"
          placeholder="sender@example.com"
          value={config.from_email || ""}
          onChange={(e) => onChange({ from_email: e.target.value })}
        />
      </div>
    </div>
  );
}

// Send SMS Config Form
function SendSmsConfigForm({
  config,
  onChange,
}: {
  config: SendSmsStepConfig;
  onChange: (updates: Partial<SendSmsStepConfig>) => void;
}) {
  const charCount = (config.message || "").length;
  const segments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          placeholder="Type your SMS message..."
          value={config.message || ""}
          onChange={(e) => onChange({ message: e.target.value })}
          rows={4}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{charCount} characters</span>
          <span>{segments} segment(s)</span>
        </div>
      </div>
    </div>
  );
}

// Wait Config Form
function WaitConfigForm({
  config,
  onChange,
}: {
  config: WaitStepConfig;
  onChange: (updates: Partial<WaitStepConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Duration</Label>
          <Input
            type="number"
            min={1}
            value={config.duration || 1}
            onChange={(e) =>
              onChange({ duration: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={config.unit || "days"}
            onValueChange={(v: WaitStepConfig["unit"]) => onChange({ unit: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Tag Step Config Form
function TagStepConfigForm({
  config,
  onChange,
}: {
  config: AddTagStepConfig;
  onChange: (updates: Partial<AddTagStepConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Tags</Label>
        {/* In production, this would be a tag selector component */}
        <Input
          placeholder="Tag IDs (comma-separated)"
          value={(config.tag_ids || []).join(", ")}
          onChange={(e) =>
            onChange({
              tag_ids: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    </div>
  );
}

// Create Task Config Form
function CreateTaskConfigForm({
  config,
  onChange,
}: {
  config: CreateTaskStepConfig;
  onChange: (updates: Partial<CreateTaskStepConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Task Title</Label>
        <Input
          placeholder="Follow up with contact"
          value={config.title || ""}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Task description..."
          value={config.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Due In (days)</Label>
          <Input
            type="number"
            min={0}
            value={config.due_in_days || ""}
            onChange={(e) =>
              onChange({
                due_in_days: e.target.value
                  ? parseInt(e.target.value, 10)
                  : undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={config.priority || "medium"}
            onValueChange={(v: "low" | "medium" | "high") =>
              onChange({ priority: v })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Send Notification Config Form
function SendNotificationConfigForm({
  config,
  onChange,
}: {
  config: SendNotificationStepConfig;
  onChange: (updates: Partial<SendNotificationStepConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Notification Type</Label>
        <Select
          value={config.type || "email"}
          onValueChange={(v: "email" | "in_app" | "slack") =>
            onChange({ type: v })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="in_app">In-App</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Recipients</Label>
        <Input
          placeholder="User IDs or 'owner'"
          value={(config.recipients || []).join(", ")}
          onChange={(e) =>
            onChange({
              recipients: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Subject</Label>
        <Input
          placeholder="Notification subject"
          value={config.subject || ""}
          onChange={(e) => onChange({ subject: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          placeholder="Notification message..."
          value={config.message || ""}
          onChange={(e) => onChange({ message: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}

// Condition Config Form
function ConditionConfigForm({
  config,
  onChange,
}: {
  config: ConditionStepConfig;
  onChange: (updates: Partial<ConditionStepConfig>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Logic</Label>
        <Select
          value={config.logic || "and"}
          onValueChange={(v: "and" | "or") => onChange({ logic: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">ALL conditions must match (AND)</SelectItem>
            <SelectItem value="or">ANY condition matches (OR)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Conditions</Label>
        <p className="text-xs text-muted-foreground">
          Configure conditions in the visual editor
        </p>
        <div className="p-3 border rounded-md bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {(config.conditions || []).length} condition(s) configured
          </p>
        </div>
      </div>
    </div>
  );
}
