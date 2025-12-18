"use client";

import { useSearchParams } from "next/navigation";
import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { DealForm } from "@/components/features/pipelines/deal-form";

export default function NewDealPage() {
  const searchParams = useSearchParams();
  const defaultPipelineId = searchParams.get("pipelineId") || undefined;
  const defaultStageId = searchParams.get("stageId") || undefined;

  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title="Create Deal"
          description="Add a new deal to your pipeline"
          breadcrumbs={[
            { label: "Pipeline", href: "/dashboard/pipelines" },
            { label: "New Deal" },
          ]}
        />
      </ShellHeader>
      <ShellContent>
        <div className="max-w-2xl">
          <DealForm
            mode="create"
            defaultPipelineId={defaultPipelineId}
            defaultStageId={defaultStageId}
          />
        </div>
      </ShellContent>
    </Shell>
  );
}
