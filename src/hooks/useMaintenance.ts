import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export type MaintenanceKind = Database["public"]["Enums"]["maintenance_kind"];

export interface MaintenanceSchedule {
  id: string;
  organization_id: string;
  vehicle_id: string;
  kind: MaintenanceKind;
  label: string | null;
  interval_miles: number | null;
  interval_days: number | null;
  last_service_at: string | null;
  last_service_miles: number | null;
  next_due_at: string | null;
  next_due_miles: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  organization_id: string;
  vehicle_id: string;
  schedule_id: string | null;
  kind: MaintenanceKind;
  performed_at: string;
  odometer_miles: number | null;
  cost_cents: number | null;
  vendor: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const MAINT_KIND_LABEL: Record<MaintenanceKind, string> = {
  oil_change: "Oil change",
  tire_rotation: "Tire rotation",
  brake_inspection: "Brake inspection",
  dot_inspection: "DOT inspection",
  annual_inspection: "Annual inspection",
  transmission_service: "Transmission service",
  coolant_flush: "Coolant flush",
  air_filter: "Air filter",
  other: "Other",
};

export function useMaintenanceSchedules() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["maintenance-schedules", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MaintenanceSchedule[]> => {
      const { data, error } = await supabase
        .from("maintenance_schedules")
        .select("*")
        .order("next_due_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as MaintenanceSchedule[];
    },
  });
}

export function useMaintenanceRecords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["maintenance-records", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MaintenanceRecord[]> => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("*")
        .order("performed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MaintenanceRecord[];
    },
  });
}

interface UpsertSchedule {
  id?: string;
  organization_id: string;
  vehicle_id: string;
  kind: MaintenanceKind;
  label?: string | null;
  interval_miles?: number | null;
  interval_days?: number | null;
  last_service_at?: string | null;
  last_service_miles?: number | null;
  notes?: string | null;
}

function computeNext(s: UpsertSchedule) {
  let next_due_at: string | null = null;
  let next_due_miles: number | null = null;
  if (s.last_service_at && s.interval_days) {
    const d = new Date(s.last_service_at);
    d.setDate(d.getDate() + s.interval_days);
    next_due_at = d.toISOString();
  }
  if (s.last_service_miles != null && s.interval_miles) {
    next_due_miles = s.last_service_miles + s.interval_miles;
  }
  return { next_due_at, next_due_miles };
}

export function useUpsertSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertSchedule) => {
      const next = computeNext(input);
      const payload = { ...input, ...next };
      if (input.id) {
        const { error } = await supabase
          .from("maintenance_schedules")
          .update(payload)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("maintenance_schedules")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-schedules"] });
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("maintenance_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-schedules"] });
    },
  });
}

interface InsertRecord {
  organization_id: string;
  vehicle_id: string;
  schedule_id?: string | null;
  kind: MaintenanceKind;
  performed_at: string;
  odometer_miles?: number | null;
  cost_cents?: number | null;
  vendor?: string | null;
  notes?: string | null;
}

export function useLogMaintenance() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: InsertRecord) => {
      const { error: recErr } = await supabase
        .from("maintenance_records")
        .insert({ ...input, created_by: user?.id ?? null });
      if (recErr) throw recErr;

      // Roll the schedule forward if linked
      if (input.schedule_id) {
        const { data: sched, error: schedErr } = await supabase
          .from("maintenance_schedules")
          .select("*")
          .eq("id", input.schedule_id)
          .maybeSingle();
        if (schedErr) throw schedErr;
        if (sched) {
          const updated = computeNext({
            organization_id: sched.organization_id,
            vehicle_id: sched.vehicle_id,
            kind: sched.kind,
            interval_days: sched.interval_days,
            interval_miles: sched.interval_miles,
            last_service_at: input.performed_at,
            last_service_miles: input.odometer_miles ?? sched.last_service_miles,
          });
          const { error: upErr } = await supabase
            .from("maintenance_schedules")
            .update({
              last_service_at: input.performed_at,
              last_service_miles: input.odometer_miles ?? sched.last_service_miles,
              next_due_at: updated.next_due_at,
              next_due_miles: updated.next_due_miles,
            })
            .eq("id", sched.id);
          if (upErr) throw upErr;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-records"] });
      qc.invalidateQueries({ queryKey: ["maintenance-schedules"] });
    },
  });
}

export interface DueStatus {
  level: "ok" | "soon" | "overdue";
  daysLeft: number | null;
  milesLeft: number | null;
}

export function getDueStatus(
  s: MaintenanceSchedule,
  currentMiles: number | null,
): DueStatus {
  let daysLeft: number | null = null;
  let milesLeft: number | null = null;

  if (s.next_due_at) {
    const diffMs = new Date(s.next_due_at).getTime() - Date.now();
    daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
  if (s.next_due_miles != null && currentMiles != null) {
    milesLeft = s.next_due_miles - currentMiles;
  }

  let level: DueStatus["level"] = "ok";
  if ((daysLeft != null && daysLeft < 0) || (milesLeft != null && milesLeft < 0)) {
    level = "overdue";
  } else if (
    (daysLeft != null && daysLeft <= 7) ||
    (milesLeft != null && milesLeft <= 500)
  ) {
    level = "soon";
  }
  return { level, daysLeft, milesLeft };
}
