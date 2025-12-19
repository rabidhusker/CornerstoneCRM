"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AppointmentWithDetails,
  AppointmentFilters,
  DateRange,
} from "@/types/appointment";

// Keys for React Query
const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: AppointmentFilters) =>
    [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

// Fetch appointments with filters
async function fetchAppointments(
  filters: AppointmentFilters
): Promise<AppointmentWithDetails[]> {
  const params = new URLSearchParams();

  if (filters.userId) params.set("userId", filters.userId);
  if (filters.contactId) params.set("contactId", filters.contactId);
  if (filters.dealId) params.set("dealId", filters.dealId);
  if (filters.status?.length) params.set("status", filters.status.join(","));
  if (filters.type?.length) params.set("type", filters.type.join(","));
  if (filters.dateRange) {
    params.set("startDate", filters.dateRange.start.toISOString());
    params.set("endDate", filters.dateRange.end.toISOString());
  }

  const response = await fetch(`/api/v1/appointments?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch appointments");
  }
  const data = await response.json();
  return data.appointments;
}

// Fetch single appointment
async function fetchAppointment(id: string): Promise<AppointmentWithDetails> {
  const response = await fetch(`/api/v1/appointments/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch appointment");
  }
  const data = await response.json();
  return data.appointment;
}

// Create appointment
async function createAppointment(
  data: Record<string, unknown>
): Promise<AppointmentWithDetails> {
  const response = await fetch("/api/v1/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create appointment");
  }
  const result = await response.json();
  return result.appointment;
}

// Update appointment
async function updateAppointment({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}): Promise<AppointmentWithDetails> {
  const response = await fetch(`/api/v1/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update appointment");
  }
  const result = await response.json();
  return result.appointment;
}

// Cancel appointment
async function cancelAppointment(id: string): Promise<void> {
  const response = await fetch(`/api/v1/appointments/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel appointment");
  }
}

// Hook to fetch appointments
export function useAppointments(filters: AppointmentFilters = {}) {
  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: () => fetchAppointments(filters),
  });
}

// Hook to fetch appointments for a date range
export function useCalendarAppointments(dateRange: DateRange, userId?: string) {
  const filters: AppointmentFilters = {
    dateRange,
    userId,
  };

  return useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: () => fetchAppointments(filters),
    staleTime: 30000, // 30 seconds
  });
}

// Hook to fetch single appointment
export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => fetchAppointment(id),
    enabled: !!id,
  });
}

// Hook to create appointment
export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

// Hook to update appointment
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppointment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.setQueryData(appointmentKeys.detail(data.id), data);
    },
  });
}

// Hook to cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

// Hook to mark appointment as complete
export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      updateAppointment({ id, data: { status: "completed" } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.setQueryData(appointmentKeys.detail(data.id), data);
    },
  });
}

// Hook to mark appointment as no-show
export function useNoShowAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      updateAppointment({ id, data: { status: "no_show" } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.setQueryData(appointmentKeys.detail(data.id), data);
    },
  });
}
