"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { ReportBuilder } from "@/components/features/reports/report-builder";
import { ScheduledReports } from "@/components/features/reports/scheduled-reports";
import type {
  CustomReportConfig,
  ReportPreviewResult,
  ReportSchedule,
} from "@/types/report";
import { useToast } from "@/hooks/use-toast";

// Save report
async function saveReport(data: {
  config: CustomReportConfig;
  schedule?: ReportSchedule;
}): Promise<any> {
  const response = await fetch("/api/v1/reports/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to save report");
  }

  return response.json();
}

// Preview report
async function previewReport(
  config: CustomReportConfig
): Promise<ReportPreviewResult> {
  const response = await fetch("/api/v1/reports/custom/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to preview report");
  }

  const data = await response.json();
  return data.result;
}

export default function NewReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ReportSchedule | undefined>();

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveReport,
    onSuccess: (data) => {
      toast({ title: "Report saved successfully" });
      router.push(`/dashboard/reports/custom/${data.report.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handle save
  const handleSave = (config: CustomReportConfig) => {
    saveMutation.mutate({ config, schedule });
  };

  // Handle preview
  const handlePreview = async (
    config: CustomReportConfig
  ): Promise<ReportPreviewResult> => {
    return previewReport(config);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/reports/custom">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            New Custom Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a new custom report to analyze your data
          </p>
        </div>
      </div>

      {/* Report builder */}
      <ReportBuilder onSave={handleSave} onPreview={handlePreview} />

      {/* Schedule configuration */}
      <ScheduledReports schedule={schedule} onChange={setSchedule} />
    </div>
  );
}
