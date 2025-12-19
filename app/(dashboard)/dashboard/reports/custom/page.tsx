"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Star,
  StarOff,
  Play,
  Edit,
  Copy,
  Trash2,
  Calendar,
  Users,
  Briefcase,
  Activity,
  Mail,
  ArrowLeft,
} from "lucide-react";
import type { CustomReport, ReportDataSource } from "@/types/report";
import { ScheduleSummary } from "@/components/features/reports/scheduled-reports";

// Data source icons
const dataSourceIcons: Record<ReportDataSource, typeof Users> = {
  contacts: Users,
  deals: Briefcase,
  activities: Activity,
  campaigns: Mail,
};

// Data source labels
const dataSourceLabels: Record<ReportDataSource, string> = {
  contacts: "Contacts",
  deals: "Deals",
  activities: "Activities",
  campaigns: "Campaigns",
};

// Fetch custom reports
async function fetchCustomReports(search?: string): Promise<CustomReport[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const response = await fetch(`/api/v1/reports/custom?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch custom reports");
  }

  const data = await response.json();
  return data.reports || [];
}

// Delete report
async function deleteReport(id: string): Promise<void> {
  const response = await fetch(`/api/v1/reports/custom/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete report");
  }
}

// Toggle favorite
async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  const response = await fetch(`/api/v1/reports/custom/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_favorite: !isFavorite }),
  });

  if (!response.ok) {
    throw new Error("Failed to update report");
  }
}

// Report card component
function ReportCard({
  report,
  onDelete,
  onToggleFavorite,
}: {
  report: CustomReport;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}) {
  const router = useRouter();
  const Icon = dataSourceIcons[report.config.dataSource];

  return (
    <Card className="hover:border-gray-300 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Link
                href={`/dashboard/reports/custom/${report.id}`}
                className="font-medium hover:underline"
              >
                {report.name}
              </Link>
              {report.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                  {report.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {dataSourceLabels[report.config.dataSource]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {report.config.columns.length} columns
                </Badge>
                {report.schedule && <ScheduleSummary schedule={report.schedule} />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleFavorite(report.id, report.is_favorite || false)}
            >
              {report.is_favorite ? (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/reports/custom/${report.id}?execute=true`)
                  }
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Report
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/reports/custom/${report.id}/edit`)
                  }
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(report.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
          <span>
            Updated {new Date(report.updated_at).toLocaleDateString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => router.push(`/dashboard/reports/custom/${report.id}`)}
          >
            <Play className="h-3 w-3 mr-1" />
            Run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomReportsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch reports
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ["customReports", search],
    queryFn: () => fetchCustomReports(search),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customReports"] });
      setDeleteId(null);
    },
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      toggleFavorite(id, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customReports"] });
    },
  });

  // Handle delete
  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  // Separate favorites
  const favoriteReports = reports?.filter((r) => r.is_favorite) || [];
  const otherReports = reports?.filter((r) => !r.is_favorite) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Custom Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage custom reports
            </p>
          </div>
        </div>

        <Button onClick={() => router.push("/dashboard/reports/custom/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive mb-4">Failed to load reports</p>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["customReports"] })}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !error && reports?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No custom reports yet
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first custom report to analyze your data
            </p>
            <Button onClick={() => router.push("/dashboard/reports/custom/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Favorite reports */}
      {favoriteReports.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Favorites
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favoriteReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDelete={setDeleteId}
                onToggleFavorite={(id, isFavorite) =>
                  favoriteMutation.mutate({ id, isFavorite })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Other reports */}
      {otherReports.length > 0 && (
        <div className="space-y-3">
          {favoriteReports.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground">
              All Reports
            </h2>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDelete={setDeleteId}
                onToggleFavorite={(id, isFavorite) =>
                  favoriteMutation.mutate({ id, isFavorite })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
