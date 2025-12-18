"use client";

import * as React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, Undo, Redo } from "lucide-react";
import {
  useWorkflowStore,
  type WorkflowNode as WorkflowNodeType,
  type WorkflowEdge as WorkflowEdgeType,
} from "@/stores/workflow-store";
import { TriggerNode, ActionNode, ConditionNode, WaitNode } from "./nodes";

// Define node types for React Flow
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  wait: WaitNode,
};

interface WorkflowCanvasProps {
  className?: string;
  onNodeSelect?: (nodeId: string | null) => void;
}

export function WorkflowCanvas({ className, onNodeSelect }: WorkflowCanvasProps) {
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);

  const {
    nodes: workflowNodes,
    edges: workflowEdges,
    selectedNodeId,
    addNode,
    updateNodePosition,
    addEdge: addWorkflowEdge,
    removeEdge,
    setSelectedNodeId,
    setZoom,
    setPanPosition,
  } = useWorkflowStore();

  // Convert workflow nodes/edges to React Flow format
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflowNodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: node.id === selectedNodeId,
    }))
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    workflowEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      animated: edge.animated,
      label: edge.label,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      style: {
        strokeWidth: 2,
      },
    }))
  );

  // Sync nodes when workflow store changes
  React.useEffect(() => {
    setNodes(
      workflowNodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        selected: node.id === selectedNodeId,
      }))
    );
  }, [workflowNodes, selectedNodeId, setNodes]);

  // Sync edges when workflow store changes
  React.useEffect(() => {
    setEdges(
      workflowEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        animated: edge.animated,
        label: edge.label,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: 2,
        },
      }))
    );
  }, [workflowEdges, setEdges]);

  // Handle node position changes
  const handleNodesChange: OnNodesChange = React.useCallback(
    (changes) => {
      onNodesChange(changes);

      // Update positions in workflow store
      changes.forEach((change) => {
        if (change.type === "position" && change.position && change.id) {
          updateNodePosition(change.id, change.position);
        }
      });
    },
    [onNodesChange, updateNodePosition]
  );

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange = React.useCallback(
    (changes) => {
      onEdgesChange(changes);

      // Handle edge removal
      changes.forEach((change) => {
        if (change.type === "remove") {
          removeEdge(change.id);
        }
      });
    },
    [onEdgesChange, removeEdge]
  );

  // Handle new connections
  const handleConnect: OnConnect = React.useCallback(
    (connection) => {
      if (connection.source && connection.target) {
        addWorkflowEdge({
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle || undefined,
          targetHandle: connection.targetHandle || undefined,
        });
      }
    },
    [addWorkflowEdge]
  );

  // Handle node selection
  const handleNodeClick = React.useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      onNodeSelect?.(node.id);
    },
    [setSelectedNodeId, onNodeSelect]
  );

  // Handle pane click (deselect)
  const handlePaneClick = React.useCallback(() => {
    setSelectedNodeId(null);
    onNodeSelect?.(null);
  }, [setSelectedNodeId, onNodeSelect]);

  // Handle drag over for dropping new nodes
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop for creating new nodes
  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const nodeData = event.dataTransfer.getData("application/workflow-node");
      if (!nodeData) return;

      const { type, nodeType, label, config } = JSON.parse(nodeData);

      // Get the position where the node was dropped
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Add the new node
      addNode({
        type,
        position,
        data: {
          nodeType,
          label,
          config: config || {},
        },
      });
    },
    [reactFlowInstance, addNode]
  );

  // Zoom controls
  const handleZoomIn = React.useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);

  const handleZoomOut = React.useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);

  const handleFitView = React.useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, [reactFlowInstance]);

  return (
    <div
      ref={reactFlowWrapper}
      className={cn("h-full w-full", className)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
          },
        }}
        connectionLineStyle={{
          strokeWidth: 2,
          stroke: "var(--primary)",
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--muted-foreground))" gap={16} size={1} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-background !border !border-border !rounded-lg"
        />

        {/* Custom Controls Panel */}
        <Panel position="bottom-right" className="flex gap-1 bg-background border rounded-lg p-1 shadow-sm">
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFitView} className="h-8 w-8">
            <Maximize className="h-4 w-4" />
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
