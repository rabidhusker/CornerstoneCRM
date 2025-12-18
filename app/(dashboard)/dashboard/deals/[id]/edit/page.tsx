"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { Shell, ShellHeader, ShellContent } from "@/components/layouts/shell";
import { PageHeader } from "@/components/ui/page-header";
import { DealForm } from "@/components/features/pipelines/deal-form";
import { useDeal } from "@/lib/hooks/use-deals";

interface EditDealPageProps {
  params: Promise<{ id: string }>;
}

export default function EditDealPage({ params }: EditDealPageProps) {
  const { id } = use(params);
  const { data: deal, isLoading, isError } = useDeal(id);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (isError || !deal) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Deal not found</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ShellHeader>
        <PageHeader
          title={`Edit: ${deal.title}`}
          description="Update deal information"
          breadcrumbs={[
            { label: "Pipeline", href: "/dashboard/pipelines" },
            { label: "Edit Deal" },
          ]}
        />
      </ShellHeader>
      <ShellContent>
        <div className="max-w-2xl">
          <DealForm mode="edit" deal={deal} />
        </div>
      </ShellContent>
    </Shell>
  );
}
