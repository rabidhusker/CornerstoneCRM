"use client";

import * as React from "react";
import { type NodeProps } from "reactflow";
import { BaseNode } from "./base-node";
import type { WorkflowNode } from "@/stores/workflow-store";
import type { WaitStepConfig } from "@/types/workflow";

export function WaitNode({ id, data, selected }: NodeProps<WorkflowNode["data"]>) {
  // Format wait duration for display
  const config = data.config as WaitStepConfig;
  let waitLabel = "Wait";

  if (config && config.duration && config.unit) {
    const duration = config.duration;
    const unit = config.unit;
    const unitLabel = duration === 1 ? unit.slice(0, -1) : unit;
    waitLabel = `Wait ${duration} ${unitLabel}`;
  }

  return (
    <BaseNode
      id={id}
      data={{ ...data, label: waitLabel }}
      selected={selected}
      category="wait"
      showTargetHandle={true}
      showSourceHandle={true}
    />
  );
}
