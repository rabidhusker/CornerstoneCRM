/**
 * Workflow Automation Types
 */

// ============================================
// Workflow Types
// ============================================

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

export interface Workflow {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  settings: WorkflowSettings;
  enrolled_count: number;
  completed_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowWithCreator extends Workflow {
  creator?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface WorkflowSettings {
  allow_re_enrollment: boolean;
  enrollment_limit?: number;
  timezone?: string;
  working_hours_only?: boolean;
  working_hours?: {
    start: string; // "09:00"
    end: string; // "17:00"
    days: number[]; // [1, 2, 3, 4, 5] = Mon-Fri
  };
}

// ============================================
// Trigger Types
// ============================================

export type TriggerType =
  | "contact_created"
  | "contact_updated"
  | "tag_added"
  | "tag_removed"
  | "deal_stage_changed"
  | "deal_created"
  | "form_submitted"
  | "date_based"
  | "manual";

export interface WorkflowTrigger {
  type: TriggerType;
  config: TriggerConfig;
}

export type TriggerConfig =
  | ContactCreatedTriggerConfig
  | ContactUpdatedTriggerConfig
  | TagTriggerConfig
  | DealStageTriggerConfig
  | DealCreatedTriggerConfig
  | FormSubmittedTriggerConfig
  | DateBasedTriggerConfig
  | ManualTriggerConfig;

export interface ContactCreatedTriggerConfig {
  filters?: ContactFilter[];
}

export interface ContactUpdatedTriggerConfig {
  fields?: string[]; // Specific fields to watch
  filters?: ContactFilter[];
}

export interface TagTriggerConfig {
  tag_ids: string[];
  filters?: ContactFilter[];
}

export interface DealStageTriggerConfig {
  pipeline_id?: string;
  from_stage_id?: string;
  to_stage_id: string;
  filters?: DealFilter[];
}

export interface DealCreatedTriggerConfig {
  pipeline_id?: string;
  filters?: DealFilter[];
}

export interface FormSubmittedTriggerConfig {
  form_id: string;
}

export interface DateBasedTriggerConfig {
  date_field: string; // e.g., "birthday", "contract_end_date"
  offset_days: number; // Negative = before, positive = after
  time: string; // "09:00"
  filters?: ContactFilter[];
}

export interface ManualTriggerConfig {
  // No specific config needed
}

export interface ContactFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export interface DealFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export type FilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty"
  | "in"
  | "not_in";

// ============================================
// Step Types
// ============================================

export type StepType =
  | "send_email"
  | "send_sms"
  | "add_tag"
  | "remove_tag"
  | "update_field"
  | "create_task"
  | "create_deal"
  | "send_notification"
  | "wait"
  | "condition"
  | "split"
  | "go_to"
  | "end";

export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  config: StepConfig;
  position: { x: number; y: number };
  next_step_id?: string | null;
  // For condition/split nodes
  branches?: WorkflowBranch[];
}

export interface WorkflowBranch {
  id: string;
  name: string;
  condition?: BranchCondition;
  next_step_id?: string | null;
}

export interface BranchCondition {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export type StepConfig =
  | SendEmailStepConfig
  | SendSmsStepConfig
  | AddTagStepConfig
  | RemoveTagStepConfig
  | UpdateFieldStepConfig
  | CreateTaskStepConfig
  | CreateDealStepConfig
  | SendNotificationStepConfig
  | WaitStepConfig
  | ConditionStepConfig
  | SplitStepConfig
  | GoToStepConfig
  | EndStepConfig;

export interface SendEmailStepConfig {
  template_id?: string;
  subject?: string;
  content_html?: string;
  from_name?: string;
  from_email?: string;
}

export interface SendSmsStepConfig {
  message: string;
}

export interface AddTagStepConfig {
  tag_ids: string[];
}

export interface RemoveTagStepConfig {
  tag_ids: string[];
}

export interface UpdateFieldStepConfig {
  field: string;
  value: string | number | boolean;
}

export interface CreateTaskStepConfig {
  title: string;
  description?: string;
  due_in_days?: number;
  assigned_to?: string;
  priority?: "low" | "medium" | "high";
}

export interface CreateDealStepConfig {
  pipeline_id: string;
  stage_id: string;
  title: string;
  value?: number;
  assigned_to?: string;
}

export interface SendNotificationStepConfig {
  type: "email" | "in_app" | "slack";
  recipients: string[]; // User IDs or "owner"
  subject: string;
  message: string;
}

export interface WaitStepConfig {
  duration: number;
  unit: "minutes" | "hours" | "days" | "weeks";
}

export interface ConditionStepConfig {
  conditions: BranchCondition[];
  logic: "and" | "or";
}

export interface SplitStepConfig {
  split_type: "percentage" | "random";
  variants: Array<{
    id: string;
    name: string;
    percentage?: number;
  }>;
}

export interface GoToStepConfig {
  target_step_id: string;
}

export interface EndStepConfig {
  // No config needed
}

// ============================================
// Node Configuration for Builder
// ============================================

export interface NodeDefinition {
  type: TriggerType | StepType;
  category: "trigger" | "action" | "logic";
  label: string;
  description: string;
  icon: string;
  color: string;
  allowedConnections: {
    inputs: number; // 0 for triggers
    outputs: number | "unlimited"; // For conditions/splits
  };
}

export const triggerDefinitions: Record<TriggerType, NodeDefinition> = {
  contact_created: {
    type: "contact_created",
    category: "trigger",
    label: "Contact Created",
    description: "When a new contact is created",
    icon: "user-plus",
    color: "bg-blue-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
  contact_updated: {
    type: "contact_updated",
    category: "trigger",
    label: "Contact Updated",
    description: "When a contact is updated",
    icon: "user-cog",
    color: "bg-blue-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
  tag_added: {
    type: "tag_added",
    category: "trigger",
    label: "Tag Added",
    description: "When a tag is added to a contact",
    icon: "tag",
    color: "bg-green-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
  tag_removed: {
    type: "tag_removed",
    category: "trigger",
    label: "Tag Removed",
    description: "When a tag is removed from a contact",
    icon: "tag",
    color: "bg-orange-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
  deal_stage_changed: {
    type: "deal_stage_changed",
    category: "trigger",
    label: "Deal Stage Changed",
    description: "When a deal moves to a stage",
    icon: "git-branch",
    color: "bg-purple-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
  deal_created: {
    type: "deal_created",
    category: "trigger",
    label: "Deal Created",
    description: "When a new deal is created",
    icon: "briefcase",
    color: "bg-purple-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
  form_submitted: {
    type: "form_submitted",
    category: "trigger",
    label: "Form Submitted",
    description: "When a form is submitted",
    icon: "file-text",
    color: "bg-cyan-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
  date_based: {
    type: "date_based",
    category: "trigger",
    label: "Date-based",
    description: "Based on a date field",
    icon: "calendar",
    color: "bg-pink-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
  manual: {
    type: "manual",
    category: "trigger",
    label: "Manual Enrollment",
    description: "Manually enroll contacts",
    icon: "hand",
    color: "bg-gray-500",
    allowedConnections: { inputs: 0, outputs: 1 },
  },
};

export const stepDefinitions: Record<StepType, NodeDefinition> = {
  send_email: {
    type: "send_email",
    category: "action",
    label: "Send Email",
    description: "Send an email to the contact",
    icon: "mail",
    color: "bg-blue-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  send_sms: {
    type: "send_sms",
    category: "action",
    label: "Send SMS",
    description: "Send an SMS to the contact",
    icon: "smartphone",
    color: "bg-green-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  add_tag: {
    type: "add_tag",
    category: "action",
    label: "Add Tag",
    description: "Add tags to the contact",
    icon: "tag",
    color: "bg-emerald-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  remove_tag: {
    type: "remove_tag",
    category: "action",
    label: "Remove Tag",
    description: "Remove tags from the contact",
    icon: "x",
    color: "bg-orange-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  update_field: {
    type: "update_field",
    category: "action",
    label: "Update Field",
    description: "Update a contact field",
    icon: "edit",
    color: "bg-yellow-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  create_task: {
    type: "create_task",
    category: "action",
    label: "Create Task",
    description: "Create a task for the contact",
    icon: "check-square",
    color: "bg-indigo-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  create_deal: {
    type: "create_deal",
    category: "action",
    label: "Create Deal",
    description: "Create a deal for the contact",
    icon: "briefcase",
    color: "bg-purple-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  send_notification: {
    type: "send_notification",
    category: "action",
    label: "Send Notification",
    description: "Notify team members",
    icon: "bell",
    color: "bg-red-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  wait: {
    type: "wait",
    category: "logic",
    label: "Wait",
    description: "Wait for a period of time",
    icon: "clock",
    color: "bg-gray-500",
    allowedConnections: { inputs: 1, outputs: 1 },
  },
  condition: {
    type: "condition",
    category: "logic",
    label: "If/Else",
    description: "Branch based on conditions",
    icon: "git-branch",
    color: "bg-amber-500",
    allowedConnections: { inputs: 1, outputs: "unlimited" },
  },
  split: {
    type: "split",
    category: "logic",
    label: "Split (A/B Test)",
    description: "Split traffic for testing",
    icon: "shuffle",
    color: "bg-cyan-500",
    allowedConnections: { inputs: 1, outputs: "unlimited" },
  },
  go_to: {
    type: "go_to",
    category: "logic",
    label: "Go To",
    description: "Jump to another step",
    icon: "arrow-right",
    color: "bg-slate-500",
    allowedConnections: { inputs: 1, outputs: 0 },
  },
  end: {
    type: "end",
    category: "logic",
    label: "End",
    description: "End the workflow",
    icon: "square",
    color: "bg-slate-700",
    allowedConnections: { inputs: 1, outputs: 0 },
  },
};

// ============================================
// Workflow Form Data
// ============================================

export interface WorkflowFormData {
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  settings?: WorkflowSettings;
}

export interface WorkflowFilters {
  status?: WorkflowStatus;
  search?: string;
}
