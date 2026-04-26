import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export type IncidentKind = Database["public"]["Enums"]["incident_kind"];
export type IncidentSeverity = Database["public"]["Enums"]["alert_severity"];

export interface DBIncident {
  id: string;
  organization_id: string;
  trip_id: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  reported_by: string | null;
  kind: IncidentKind;
  severity: IncidentSeverity;
  title: string;
  notes: string | null;
  location_label: string | null;
  location_lat: number | null;
  location_lng: number | null;
  photo_storage_path: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = "trip-documents";

export interface ReportIncidentInput {
  tripId: string;
  organizationId: string;
  driverId: string;
  vehicleId?: string | null;
  kind: IncidentKind;
  severity: IncidentSeverity;
  title: string;
  notes?: string;
  locationLabel?: string;
  locationLat?: number;
  locationLng?: number;
  photo?: File | null;
}

/** Slugify a filename for storage. */
function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  const cleanBase =
    base
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "incident";
  return `${cleanBase}${ext.toLowerCase() || ".jpg"}`;
}

/**
 * Driver reports an incident on the road. Uploads optional photo to the
 * existing trip-documents bucket, inserts the incident row (which fires the
 * DB trigger that creates an alert for dispatch), and also writes a
 * notification so the alert center sees a live ping.
 */
export function useReportIncident() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ReportIncidentInput) => {
      let photoPath: string | null = null;

      if (input.photo) {
        const stamp = Date.now();
        const cleanName = safeName(input.photo.name);
        photoPath = `${input.organizationId}/incidents/${input.tripId}/${stamp}-${cleanName}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(photoPath, input.photo, {
            contentType: input.photo.type || undefined,
            upsert: false,
          });
        if (upErr) throw upErr;
      }

      const { data: incident, error: insErr } = await supabase
        .from("incidents")
        .insert({
          organization_id: input.organizationId,
          trip_id: input.tripId,
          driver_id: input.driverId,
          vehicle_id: input.vehicleId ?? null,
          reported_by: user?.id ?? null,
          kind: input.kind,
          severity: input.severity,
          title: input.title,
          notes: input.notes ?? null,
          location_label: input.locationLabel ?? null,
          location_lat: input.locationLat ?? null,
          location_lng: input.locationLng ?? null,
          photo_storage_path: photoPath,
        })
        .select("*")
        .single();
      if (insErr) {
        if (photoPath) {
          await supabase.storage.from(BUCKET).remove([photoPath]);
        }
        throw insErr;
      }

      // Dispatcher notification — keeps the live alert bell in sync.
      await supabase.from("notifications").insert({
        organization_id: input.organizationId,
        type: "info",
        title: `Incident: ${input.title}`,
        body: input.notes || input.locationLabel || "Driver reported an issue",
        trip_id: input.tripId,
        link: "/dispatch",
      });

      return incident as DBIncident;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Read incidents for the current org (RLS scoped). */
export function useIncidents(opts: { onlyUnresolved?: boolean } = {}) {
  return useQuery({
    queryKey: ["incidents", { onlyUnresolved: !!opts.onlyUnresolved }],
    queryFn: async () => {
      let q = supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (opts.onlyUnresolved) q = q.eq("resolved", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DBIncident[];
    },
  });
}

export function useResolveIncident() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("incidents")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
