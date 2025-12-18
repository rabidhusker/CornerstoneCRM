import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  Workflow,
  WorkflowStep,
  WorkflowTrigger,
  WorkflowSettings,
  TriggerType,
  StepType,
  StepConfig,
  TriggerConfig,
} from "@/types/workflow";

// React Flow types
export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition" | "wait";
  position: { x: number; y: number };
  data: {
    nodeType: TriggerType | StepType;
    label: string;
    config: TriggerConfig | StepConfig;
    branches?: {
      id: string;
      name: string;
      condition?: any;
    }[];
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
  label?: string;
}

interface WorkflowBuilderState {
  // Workflow metadata
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;
  workflowStatus: "draft" | "active" | "paused" | "archived";
  workflowSettings: WorkflowSettings;

  // Canvas state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // UI state
  isDirty: boolean;
  isValidating: boolean;
  validationErrors: Record<string, string[]>;
  zoom: number;
  panPosition: { x: number; y: number };

  // Sidebar state
  sidebarTab: "nodes" | "settings";
  searchQuery: string;

  // Actions - Workflow
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  setWorkflowStatus: (status: "draft" | "active" | "paused" | "archived") => void;
  setWorkflowSettings: (settings: Partial<WorkflowSettings>) => void;

  // Actions - Nodes
  addNode: (node: Omit<WorkflowNode, "id">) => string;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  updateNodeData: (id: string, data: Partial<WorkflowNode["data"]>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => string | null;

  // Actions - Edges
  addEdge: (edge: Omit<WorkflowEdge, "id">) => string;
  updateEdge: (id: string, updates: Partial<WorkflowEdge>) => void;
  removeEdge: (id: string) => void;
  removeEdgesForNode: (nodeId: string) => void;

  // Actions - Selection
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  clearSelection: () => void;

  // Actions - Canvas
  setZoom: (zoom: number) => void;
  setPanPosition: (position: { x: number; y: number }) => void;
  fitView: () => void;

  // Actions - Sidebar
  setSidebarTab: (tab: "nodes" | "settings") => void;
  setSearchQuery: (query: string) => void;

  // Actions - Validation
  setValidationErrors: (errors: Record<string, string[]>) => void;
  clearValidationErrors: () => void;
  validateWorkflow: () => boolean;

  // Actions - Persistence
  loadWorkflow: (workflow: Workflow) => void;
  exportWorkflow: () => Partial<Workflow>;
  resetWorkflow: () => void;
  setIsDirty: (dirty: boolean) => void;
}

const defaultSettings: WorkflowSettings = {
  allow_re_enrollment: false,
  enrollment_limit: undefined,
  timezone: "UTC",
  working_hours_only: false,
};

const initialState = {
  workflowId: null,
  workflowName: "Untitled Workflow",
  workflowDescription: "",
  workflowStatus: "draft" as const,
  workflowSettings: defaultSettings,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isDirty: false,
  isValidating: false,
  validationErrors: {},
  zoom: 1,
  panPosition: { x: 0, y: 0 },
  sidebarTab: "nodes" as const,
  searchQuery: "",
};

export const useWorkflowStore = create<WorkflowBuilderState>()((set, get) => ({
  ...initialState,

  // Workflow metadata actions
  setWorkflowId: (id) => set({ workflowId: id }),

  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),

  setWorkflowDescription: (description) =>
    set({ workflowDescription: description, isDirty: true }),

  setWorkflowStatus: (status) => set({ workflowStatus: status }),

  setWorkflowSettings: (settings) =>
    set((state) => ({
      workflowSettings: { ...state.workflowSettings, ...settings },
      isDirty: true,
    })),

  // Node actions
  addNode: (node) => {
    const id = nanoid();
    set((state) => ({
      nodes: [...state.nodes, { ...node, id }],
      isDirty: true,
    }));
    return id;
  },

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
      isDirty: true,
    })),

  updateNodeData: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
      isDirty: true,
    })),

  updateNodePosition: (id, position) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node
      ),
      isDirty: true,
    })),

  removeNode: (id) => {
    const state = get();
    // Also remove connected edges
    const edgesToRemove = state.edges.filter(
      (e) => e.source === id || e.target === id
    );
    set({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter(
        (e) => e.source !== id && e.target !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      isDirty: true,
    });
  },

  duplicateNode: (id) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === id);
    if (!node) return null;

    const newId = nanoid();
    const newNode: WorkflowNode = {
      ...node,
      id: newId,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
      },
    };

    set({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newId,
      isDirty: true,
    });

    return newId;
  },

  // Edge actions
  addEdge: (edge) => {
    const state = get();
    // Prevent duplicate edges
    const exists = state.edges.some(
      (e) =>
        e.source === edge.source &&
        e.target === edge.target &&
        e.sourceHandle === edge.sourceHandle
    );
    if (exists) return "";

    const id = nanoid();
    set({
      edges: [...state.edges, { ...edge, id }],
      isDirty: true,
    });
    return id;
  },

  updateEdge: (id, updates) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id ? { ...edge, ...updates } : edge
      ),
      isDirty: true,
    })),

  removeEdge: (id) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
      isDirty: true,
    })),

  removeEdgesForNode: (nodeId) =>
    set((state) => ({
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      isDirty: true,
    })),

  // Selection actions
  setSelectedNodeId: (id) =>
    set({ selectedNodeId: id, selectedEdgeId: null }),

  setSelectedEdgeId: (id) =>
    set({ selectedEdgeId: id, selectedNodeId: null }),

  clearSelection: () =>
    set({ selectedNodeId: null, selectedEdgeId: null }),

  // Canvas actions
  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 0.25), 2) }),

  setPanPosition: (position) => set({ panPosition: position }),

  fitView: () => {
    // This would typically be handled by React Flow's fitView
    set({ zoom: 1, panPosition: { x: 0, y: 0 } });
  },

  // Sidebar actions
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Validation actions
  setValidationErrors: (errors) => set({ validationErrors: errors }),

  clearValidationErrors: () => set({ validationErrors: {} }),

  validateWorkflow: () => {
    const state = get();
    const errors: Record<string, string[]> = {};

    // Check for workflow name
    if (!state.workflowName.trim()) {
      errors.workflow = ["Workflow name is required"];
    }

    // Check for trigger node
    const triggerNodes = state.nodes.filter((n) => n.type === "trigger");
    if (triggerNodes.length === 0) {
      errors.workflow = [...(errors.workflow || []), "A trigger is required"];
    } else if (triggerNodes.length > 1) {
      errors.workflow = [...(errors.workflow || []), "Only one trigger is allowed"];
    }

    // Check for disconnected nodes (except trigger which has no input)
    const nodeIds = new Set(state.nodes.map((n) => n.id));
    const connectedTargets = new Set(state.edges.map((e) => e.target));
    const connectedSources = new Set(state.edges.map((e) => e.source));

    for (const node of state.nodes) {
      if (node.type !== "trigger") {
        // Non-trigger nodes should have an input
        if (!connectedTargets.has(node.id)) {
          errors[node.id] = [...(errors[node.id] || []), "Node is not connected"];
        }
      }

      // Check if node has required config based on type
      // (More specific validation would be added here)
    }

    set({ validationErrors: errors });
    return Object.keys(errors).length === 0;
  },

  // Persistence actions
  loadWorkflow: (workflow) => {
    // Convert workflow steps to nodes
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];

    // Add trigger node
    const triggerId = nanoid();
    nodes.push({
      id: triggerId,
      type: "trigger",
      position: { x: 250, y: 50 },
      data: {
        nodeType: workflow.trigger.type,
        label: getTriggerLabel(workflow.trigger.type),
        config: workflow.trigger.config,
      },
    });

    // Convert steps to nodes
    const stepIdMap = new Map<string, string>();
    let yOffset = 150;

    for (const step of workflow.steps) {
      const nodeId = nanoid();
      stepIdMap.set(step.id, nodeId);

      const nodeType = getNodeTypeForStep(step.type);
      nodes.push({
        id: nodeId,
        type: nodeType,
        position: step.position || { x: 250, y: yOffset },
        data: {
          nodeType: step.type,
          label: step.name,
          config: step.config,
          branches: step.branches,
        },
      });

      yOffset += 100;
    }

    // Create edges based on next_step_id
    if (workflow.steps.length > 0) {
      // Connect trigger to first step
      const firstStepId = stepIdMap.get(workflow.steps[0].id);
      if (firstStepId) {
        edges.push({
          id: nanoid(),
          source: triggerId,
          target: firstStepId,
        });
      }

      // Connect steps
      for (const step of workflow.steps) {
        const sourceId = stepIdMap.get(step.id);
        if (sourceId && step.next_step_id) {
          const targetId = stepIdMap.get(step.next_step_id);
          if (targetId) {
            edges.push({
              id: nanoid(),
              source: sourceId,
              target: targetId,
            });
          }
        }

        // Handle branches
        if (step.branches) {
          for (const branch of step.branches) {
            if (branch.next_step_id) {
              const targetId = stepIdMap.get(branch.next_step_id);
              if (targetId && sourceId) {
                edges.push({
                  id: nanoid(),
                  source: sourceId,
                  target: targetId,
                  sourceHandle: branch.id,
                  label: branch.name,
                });
              }
            }
          }
        }
      }
    }

    set({
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowDescription: workflow.description || "",
      workflowStatus: workflow.status,
      workflowSettings: workflow.settings,
      nodes,
      edges,
      isDirty: false,
      selectedNodeId: null,
      selectedEdgeId: null,
      validationErrors: {},
    });
  },

  exportWorkflow: () => {
    const state = get();

    // Find trigger node
    const triggerNode = state.nodes.find((n) => n.type === "trigger");
    if (!triggerNode) {
      throw new Error("Workflow must have a trigger");
    }

    // Build trigger
    const trigger: WorkflowTrigger = {
      type: triggerNode.data.nodeType as TriggerType,
      config: triggerNode.data.config as TriggerConfig,
    };

    // Convert nodes to steps (excluding trigger)
    const steps: WorkflowStep[] = [];
    const nodeIdToStepId = new Map<string, string>();

    // Create step IDs
    for (const node of state.nodes) {
      if (node.type !== "trigger") {
        const stepId = nanoid();
        nodeIdToStepId.set(node.id, stepId);
      }
    }

    // Build steps
    for (const node of state.nodes) {
      if (node.type === "trigger") continue;

      const stepId = nodeIdToStepId.get(node.id)!;

      // Find outgoing edges
      const outgoingEdges = state.edges.filter((e) => e.source === node.id);
      const nextStepId = outgoingEdges.length > 0
        ? nodeIdToStepId.get(outgoingEdges[0].target) || null
        : null;

      // Build branches if applicable
      let branches = undefined;
      if (node.data.branches && node.data.branches.length > 0) {
        branches = node.data.branches.map((branch) => {
          const branchEdge = outgoingEdges.find(
            (e) => e.sourceHandle === branch.id
          );
          return {
            ...branch,
            next_step_id: branchEdge
              ? nodeIdToStepId.get(branchEdge.target) || null
              : null,
          };
        });
      }

      steps.push({
        id: stepId,
        type: node.data.nodeType as StepType,
        name: node.data.label,
        config: node.data.config as StepConfig,
        position: node.position,
        next_step_id: branches ? undefined : nextStepId,
        branches,
      });
    }

    return {
      id: state.workflowId || undefined,
      name: state.workflowName,
      description: state.workflowDescription || undefined,
      status: state.workflowStatus,
      trigger,
      steps,
      settings: state.workflowSettings,
    };
  },

  resetWorkflow: () => set(initialState),

  setIsDirty: (dirty) => set({ isDirty: dirty }),
}));

// Helper functions
function getTriggerLabel(type: TriggerType): string {
  const labels: Record<TriggerType, string> = {
    contact_created: "Contact Created",
    contact_updated: "Contact Updated",
    tag_added: "Tag Added",
    tag_removed: "Tag Removed",
    deal_stage_changed: "Deal Stage Changed",
    deal_created: "Deal Created",
    form_submitted: "Form Submitted",
    date_based: "Date-based",
    manual: "Manual Enrollment",
  };
  return labels[type] || type;
}

function getNodeTypeForStep(type: StepType): WorkflowNode["type"] {
  const logicTypes: StepType[] = ["wait", "condition", "split", "go_to", "end"];
  if (logicTypes.includes(type)) {
    return type === "wait" ? "wait" : "condition";
  }
  return "action";
}

// Selector hooks
export const useWorkflowNodes = () =>
  useWorkflowStore((state) => state.nodes);

export const useWorkflowEdges = () =>
  useWorkflowStore((state) => state.edges);

export const useSelectedNode = () => {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const nodes = useWorkflowStore((state) => state.nodes);
  return selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
};

export const useWorkflowIsDirty = () =>
  useWorkflowStore((state) => state.isDirty);

export const useWorkflowValidationErrors = () =>
  useWorkflowStore((state) => state.validationErrors);
