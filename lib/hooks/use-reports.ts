"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  DateRange,
  DashboardMetrics,
  ContactAnalytics,
  DealAnalytics,
  ConversionFunnel,
  ActivitySummary,
  Leaderboard,
  ReportFilters,
} from "@/types/report";
import { format } from "date-fns";

// Query keys
export const reportKeys = {
  all: ["reports"] as const,
  dashboard: (startDate: string, endDate: string) =>
    [...reportKeys.all, "dashboard", startDate, endDate] as const,
  contacts: (startDate: string, endDate: string, filters?: Partial<ReportFilters>) =>
    [...reportKeys.all, "contacts", startDate, endDate, filters] as const,
  deals: (startDate: string, endDate: string, filters?: Partial<ReportFilters>) =>
    [...reportKeys.all, "deals", startDate, endDate, filters] as const,
  funnel: (startDate: string, endDate: string) =>
    [...reportKeys.all, "funnel", startDate, endDate] as const,
  activities: (startDate: string, endDate: string) =>
    [...reportKeys.all, "activities", startDate, endDate] as const,
  leaderboard: (startDate: string, endDate: string) =>
    [...reportKeys.all, "leaderboard", startDate, endDate] as const,
};

// Format date for API
function formatDateForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// Fetch dashboard metrics
async function fetchDashboardMetrics(
  startDate: string,
  endDate: string
): Promise<DashboardMetrics> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/v1/reports/dashboard?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard metrics");
  }

  const data = await response.json();
  return data.metrics;
}

// Fetch contact analytics
async function fetchContactAnalytics(
  startDate: string,
  endDate: string,
  filters?: Partial<ReportFilters>
): Promise<ContactAnalytics> {
  const params = new URLSearchParams({ startDate, endDate });
  if (filters?.groupBy) params.set("groupBy", filters.groupBy);
  if (filters?.source) params.set("source", filters.source);

  const response = await fetch(`/api/v1/reports/contacts?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch contact analytics");
  }

  const data = await response.json();
  return data.analytics;
}

// Fetch deal analytics
async function fetchDealAnalytics(
  startDate: string,
  endDate: string,
  filters?: Partial<ReportFilters>
): Promise<DealAnalytics> {
  const params = new URLSearchParams({ startDate, endDate });
  if (filters?.groupBy) params.set("groupBy", filters.groupBy);
  if (filters?.pipelineId) params.set("pipelineId", filters.pipelineId);

  const response = await fetch(`/api/v1/reports/deals?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch deal analytics");
  }

  const data = await response.json();
  return data.analytics;
}

// Fetch conversion funnel
async function fetchConversionFunnel(
  startDate: string,
  endDate: string
): Promise<ConversionFunnel> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/v1/reports/funnel?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch conversion funnel");
  }

  const data = await response.json();
  return data.funnel;
}

// Fetch activity summary
async function fetchActivitySummary(
  startDate: string,
  endDate: string
): Promise<ActivitySummary> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/v1/reports/activities?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch activity summary");
  }

  const data = await response.json();
  return data.activities;
}

// Fetch leaderboard
async function fetchLeaderboard(
  startDate: string,
  endDate: string
): Promise<Leaderboard> {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`/api/v1/reports/leaderboard?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }

  const data = await response.json();
  return data.leaderboard;
}

// Hook for dashboard metrics
export function useDashboardMetrics(dateRange: DateRange) {
  const startDate = formatDateForApi(dateRange.startDate);
  const endDate = formatDateForApi(dateRange.endDate);

  return useQuery({
    queryKey: reportKeys.dashboard(startDate, endDate),
    queryFn: () => fetchDashboardMetrics(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for contact analytics
export function useContactAnalytics(
  dateRange: DateRange,
  filters?: Partial<ReportFilters>
) {
  const startDate = formatDateForApi(dateRange.startDate);
  const endDate = formatDateForApi(dateRange.endDate);

  return useQuery({
    queryKey: reportKeys.contacts(startDate, endDate, filters),
    queryFn: () => fetchContactAnalytics(startDate, endDate, filters),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for deal analytics
export function useDealAnalytics(
  dateRange: DateRange,
  filters?: Partial<ReportFilters>
) {
  const startDate = formatDateForApi(dateRange.startDate);
  const endDate = formatDateForApi(dateRange.endDate);

  return useQuery({
    queryKey: reportKeys.deals(startDate, endDate, filters),
    queryFn: () => fetchDealAnalytics(startDate, endDate, filters),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for conversion funnel
export function useConversionFunnel(dateRange: DateRange) {
  const startDate = formatDateForApi(dateRange.startDate);
  const endDate = formatDateForApi(dateRange.endDate);

  return useQuery({
    queryKey: reportKeys.funnel(startDate, endDate),
    queryFn: () => fetchConversionFunnel(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for activity summary
export function useActivitySummary(dateRange: DateRange) {
  const startDate = formatDateForApi(dateRange.startDate);
  const endDate = formatDateForApi(dateRange.endDate);

  return useQuery({
    queryKey: reportKeys.activities(startDate, endDate),
    queryFn: () => fetchActivitySummary(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for leaderboard
export function useLeaderboard(dateRange: DateRange) {
  const startDate = formatDateForApi(dateRange.startDate);
  const endDate = formatDateForApi(dateRange.endDate);

  return useQuery({
    queryKey: reportKeys.leaderboard(startDate, endDate),
    queryFn: () => fetchLeaderboard(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}

// Combined hook for all report data
export function useReportData(dateRange: DateRange) {
  const dashboard = useDashboardMetrics(dateRange);
  const contacts = useContactAnalytics(dateRange);
  const deals = useDealAnalytics(dateRange);
  const funnel = useConversionFunnel(dateRange);
  const activities = useActivitySummary(dateRange);
  const leaderboard = useLeaderboard(dateRange);

  const isLoading =
    dashboard.isLoading ||
    contacts.isLoading ||
    deals.isLoading ||
    funnel.isLoading ||
    activities.isLoading ||
    leaderboard.isLoading;

  const isError =
    dashboard.isError ||
    contacts.isError ||
    deals.isError ||
    funnel.isError ||
    activities.isError ||
    leaderboard.isError;

  return {
    dashboard: dashboard.data,
    contacts: contacts.data,
    deals: deals.data,
    funnel: funnel.data,
    activities: activities.data,
    leaderboard: leaderboard.data,
    isLoading,
    isError,
    refetch: () => {
      dashboard.refetch();
      contacts.refetch();
      deals.refetch();
      funnel.refetch();
      activities.refetch();
      leaderboard.refetch();
    },
  };
}
