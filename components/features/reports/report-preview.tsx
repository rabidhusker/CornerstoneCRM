"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { ReportPreviewResult, CustomChartConfig, ReportColumn } from "@/types/report";
import { formatReportValue, exportToCSV } from "@/lib/reports/report-engine";
import { ReportChart } from "./chart-builder";

interface ReportPreviewProps {
  data?: ReportPreviewResult;
  loading?: boolean;
  error?: string;
  chartConfig?: CustomChartConfig;
  onRefresh?: () => void;
  onExport?: (format: "csv" | "pdf" | "excel") => void;
}

export function ReportPreview({
  data,
  loading,
  error,
  chartConfig,
  onRefresh,
  onExport,
}: ReportPreviewProps) {
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Calculate pagination
  const totalPages = data ? Math.ceil(data.rows.length / pageSize) : 0;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRows = data?.rows.slice(startIndex, endIndex) || [];

  // Handle export
  const handleExport = (format: "csv" | "pdf" | "excel") => {
    if (onExport) {
      onExport(format);
    } else if (data && format === "csv") {
      // Default CSV export
      const csvContent = exportToCSV(data);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Report Preview</CardTitle>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load report
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.rows.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Report Preview</CardTitle>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Report
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No data to display
            </h3>
            <p className="text-muted-foreground">
              Configure your report and click &quot;Run Report&quot; to see results
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Report Preview</CardTitle>
            <Badge variant="secondary">
              {data.totalRows.toLocaleString()} row
              {data.totalRows !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {data.executionTime}ms
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            {chartConfig?.enabled && (
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "chart" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode("chart")}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Refresh button */}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "chart" && chartConfig?.enabled ? (
          <ReportChart config={chartConfig} data={data.rows} height={400} />
        ) : (
          <>
            {/* Data table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {data.columns.map((col) => (
                        <TableHead key={col.field} className="font-medium">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {data.columns.map((col) => (
                          <TableCell key={col.field}>
                            {formatReportValue(row[col.field], col.type)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, data.rows.length)} of {data.rows.length}{" "}
                  results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Compact table preview for builder
export function ReportTablePreview({
  columns,
  rows,
  maxRows = 5,
}: {
  columns: ReportColumn[];
  rows: Record<string, any>[];
  maxRows?: number;
}) {
  const displayRows = rows.slice(0, maxRows);

  if (displayRows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col.id} className="font-medium text-xs">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((col) => (
                  <TableCell key={col.id} className="text-sm">
                    {formatReportValue(row[col.field], col.format || "string")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {rows.length > maxRows && (
        <div className="text-center py-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Showing {maxRows} of {rows.length} rows
          </p>
        </div>
      )}
    </div>
  );
}
