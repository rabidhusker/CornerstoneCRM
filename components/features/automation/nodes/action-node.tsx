"use client";

import * as React from "react";
import { type NodeProps } from "reactflow";
import { BaseNode } from "./base-node";
import type { WorkflowNode } from "@/stores/workflow-store";

export function ActionNode({ id, data, selected }: NodeProps<WorkflowNode["data"]>) {
  // "end" and "go_to" nodes don't have source handles
  const showSourceHandle = data.nodeType !== "end" && data.nodeType !== "go_to";

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      category="action"
      showTargetHandle={true}
      showSourceHandle={showSourceHandle}
    />
  );
}
