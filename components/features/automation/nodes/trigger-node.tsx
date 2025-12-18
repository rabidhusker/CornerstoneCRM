"use client";

import * as React from "react";
import { type NodeProps } from "reactflow";
import { BaseNode } from "./base-node";
import type { WorkflowNode } from "@/stores/workflow-store";

export function TriggerNode({ id, data, selected }: NodeProps<WorkflowNode["data"]>) {
  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      category="trigger"
      showTargetHandle={false}
      showSourceHandle={true}
    />
  );
}
