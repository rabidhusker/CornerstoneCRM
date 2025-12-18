"use client";

import * as React from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Workflow, WorkflowStep } from "@/types/workflow";

interface WorkflowStatsProps {
  workflow: Workflow;
  enrollmentStats?: {
    active: number;
    completed: number;
    exited: number;
    paused: number;
    failed: number;
  };
  stepStats?: Array<{
    step_id: string;
    step_name: string;
    entered: number;
    completed: number;
    avg_time_seconds?: number;
  }>;
  className?: string;
}

export function WorkflowStats({
  workflow,
  enrollmentStats,
  stepStats,
  className,
}: WorkflowStatsProps) {
  const totalEnrolled = workflow.enrolled_count || 0;
  const totalCompleted = workflow.completed_count || 0;
  const completionRate = totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0;

  // Calculate active enrollments
  const activeEnrollments = enrollmentStats?.active || 0;

  // Calculate average time to complete (mock data for now)
  const avgCompletionTime = calculateAvgCompletionTime(stepStats);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Enrolled"
          value={totalEnrolled}
          icon={Users}
          description="All time enrollments"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Active"
          value={activeEnrollments}
          icon={Clock}
          description="Currently in workflow"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Completed"
          value={totalCompleted}
          icon={CheckCircle2}
          description="Finished all steps"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          icon={TrendingUp}
          description={avgCompletionTime || "N/A"}
          iconColor="text-purple-600"
        />
      </div>

      {/* Enrollment Breakdown */}
      {enrollmentStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <EnrollmentBar
                label="Active"
                count={enrollmentStats.active}
                total={totalEnrolled}
                color="bg-emerald-500"
              />
              <EnrollmentBar
                label="Completed"
                count={enrollmentStats.completed}
                total={totalEnrolled}
                color="bg-blue-500"
              />
              <EnrollmentBar
                label="Exited"
                count={enrollmentStats.exited}
                total={totalEnrolled}
                color="bg-amber-500"
              />
              {enrollmentStats.paused > 0 && (
                <EnrollmentBar
                  label="Paused"
                  count={enrollmentStats.paused}
                  total={totalEnrolled}
                  color="bg-slate-500"
                />
              )}
              {enrollmentStats.failed > 0 && (
                <EnrollmentBar
                  label="Failed"
                  count={enrollmentStats.failed}
                  total={totalEnrolled}
                  color="bg-red-500"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-by-Step Conversion */}
      {stepStats && stepStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Step Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stepStats.map((step, index) => {
                const conversionRate =
                  step.entered > 0
                    ? (step.completed / step.entered) * 100
                    : 0;
                const nextStep = stepStats[index + 1];
                const dropOff = nextStep
                  ? ((step.completed - nextStep.entered) / step.completed) * 100
                  : 0;

                return (
                  <div key={step.step_id}>
                    <div className="flex items-center gap-4">
                      {/* Step indicator */}
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {step.step_name}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={conversionRate}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {conversionRate.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground min-w-[120px]">
                        <span>{step.entered} entered</span>
                        <span>{step.completed} completed</span>
                      </div>
                    </div>

                    {/* Drop-off indicator */}
                    {nextStep && dropOff > 0 && (
                      <div className="flex items-center gap-2 ml-8 mt-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {dropOff.toFixed(1)}% drop-off
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Performance Tips */}
      {completionRate < 50 && totalEnrolled > 10 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <TrendingUp className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Low Completion Rate
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Your workflow has a {completionRate.toFixed(0)}% completion rate.
                  Consider reviewing steps where drop-off occurs and optimizing the
                  workflow path.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  description: string;
  iconColor?: string;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  iconColor = "text-primary",
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={cn("p-3 rounded-full bg-muted", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EnrollmentBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function EnrollmentBar({ label, count, total, color }: EnrollmentBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm w-24">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground w-16 text-right">
        {count} ({percentage.toFixed(0)}%)
      </span>
    </div>
  );
}

function calculateAvgCompletionTime(
  stepStats?: Array<{ avg_time_seconds?: number }>
): string | null {
  if (!stepStats || stepStats.length === 0) return null;

  const totalSeconds = stepStats.reduce(
    (sum, step) => sum + (step.avg_time_seconds || 0),
    0
  );

  if (totalSeconds === 0) return null;

  // Convert to human-readable format
  if (totalSeconds < 60) {
    return `Avg. ${totalSeconds}s to complete`;
  } else if (totalSeconds < 3600) {
    return `Avg. ${Math.round(totalSeconds / 60)}m to complete`;
  } else if (totalSeconds < 86400) {
    return `Avg. ${Math.round(totalSeconds / 3600)}h to complete`;
  } else {
    return `Avg. ${Math.round(totalSeconds / 86400)}d to complete`;
  }
}

// Export individual components for flexible use
export { StatsCard, EnrollmentBar };
