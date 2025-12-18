"use client";

import * as React from "react";
import { type NodeProps } from "reactflow";
import { BaseNode } from "./base-node";
import type { WorkflowNode } from "@/stores/workflow-store";

export function ConditionNode({ id, data, selected }: NodeProps<WorkflowNode["data"]>) {
  // Condition nodes have "Yes" and "No" branches by default
  // Split nodes have custom branches
  const isCondition = data.nodeType === "condition";
  const isSplit = data.nodeType === "split";

  let sourceHandles: { id: string; label: string }[] = [];

  if (isCondition) {
    sourceHandles = [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ];
  } else if (isSplit && data.branches) {
    sourceHandles = data.branches.map((branch) => ({
      id: branch.id,
      label: branch.name,
    }));
  }

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      category="condition"
      showTargetHandle={true}
      showSourceHandle={true}
      sourceHandles={sourceHandles.length > 0 ? sourceHandles : undefined}
    />
  );
}
