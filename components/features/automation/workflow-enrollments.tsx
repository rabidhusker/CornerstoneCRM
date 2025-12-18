"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Search,
  Loader2,
  AlertCircle,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Enrollment {
  id: string;
  workflow_id: string;
  contact_id: string;
  status: "active" | "completed" | "exited" | "paused" | "failed";
  current_step_id: string | null;
  current_step_index: number;
  enrolled_at: string;
  completed_at: string | null;
  exited_at: string | null;
  next_step_at: string | null;
  contact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
}

interface WorkflowEnrollmentsProps {
  workflowId: string;
  steps?: WorkflowStep[];
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  active: {
    label: "Active",
    icon: PlayCircle,
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  },
  exited: {
    label: "Exited",
    icon: LogOut,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  },
  paused: {
    label: "Paused",
    icon: PauseCircle,
    color: "text-slate-600 bg-slate-100 dark:bg-slate-900/30",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-600 bg-red-100 dark:bg-red-900/30",
  },
};

export function WorkflowEnrollments({
  workflowId,
  steps = [],
  className,
}: WorkflowEnrollmentsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(25);
  const [exitEnrollmentId, setExitEnrollmentId] = React.useState<string | null>(null);

  // Fetch enrollments
  const { data, isLoading, error } = useQuery({
    queryKey: ["workflow-enrollments", workflowId, statusFilter, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `/api/v1/workflows/${workflowId}/enroll?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch enrollments");
      }
      return response.json();
    },
  });

  // Exit enrollment mutation
  const exitMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await fetch(
        `/api/v1/workflows/${workflowId}/enrollments/${enrollmentId}/exit`,
        { method: "POST" }
      );
      if (!response.ok) {
        throw new Error("Failed to exit enrollment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contact exited",
        description: "The contact has been removed from the workflow.",
      });
      queryClient.invalidateQueries({
        queryKey: ["workflow-enrollments", workflowId],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to exit contact from workflow.",
        variant: "destructive",
      });
    },
  });

  const handleExitEnrollment = async () => {
    if (!exitEnrollmentId) return;
    await exitMutation.mutateAsync(exitEnrollmentId);
    setExitEnrollmentId(null);
  };

  const enrollments = data?.enrollments || [];
  const pagination = data?.pagination || { page: 1, pageSize: 25, total: 0, totalPages: 0 };
  const statusBreakdown = data?.statusBreakdown || {};

  // Get current step name
  const getStepName = (stepId: string | null) => {
    if (!stepId) return "—";
    const step = steps.find((s) => s.id === stepId);
    return step?.name || "Unknown";
  };

  // Filter by search locally
  const filteredEnrollments = searchQuery
    ? enrollments.filter((e: Enrollment) => {
        const name = `${e.contact?.first_name || ""} ${e.contact?.last_name || ""}`.toLowerCase();
        const email = (e.contact?.email || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || email.includes(query);
      })
    : enrollments;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-muted-foreground">Failed to load enrollments</p>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Enrollments</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const config = statusConfig[status];
              if (!config || !count) return null;
              return (
                <div key={status} className="flex items-center gap-1">
                  <config.icon className={cn("h-4 w-4", config.color.split(" ")[0])} />
                  <span>{count as number}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="exited">Exited</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No enrollments found</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((enrollment: Enrollment) => {
                    const config = statusConfig[enrollment.status];
                    const StatusIcon = config?.icon || Clock;

                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {enrollment.contact?.first_name || ""}{" "}
                              {enrollment.contact?.last_name || ""}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.contact?.email || "No email"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", config?.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {config?.label || enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {enrollment.status === "completed"
                              ? "Completed"
                              : getStepName(enrollment.current_step_id)}
                          </span>
                          {enrollment.current_step_index > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (Step {enrollment.current_step_index + 1})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(enrollment.enrolled_at))} ago
                          </span>
                        </TableCell>
                        <TableCell>
                          {enrollment.next_step_at && enrollment.status === "active" ? (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(enrollment.next_step_at), "MMM d, h:mm a")}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {enrollment.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExitEnrollmentId(enrollment.id)}
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Exit Confirmation Dialog */}
      <AlertDialog
        open={!!exitEnrollmentId}
        onOpenChange={() => setExitEnrollmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit from Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this contact from the workflow? They will
              not receive any remaining steps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitEnrollment}>
              Exit Workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
