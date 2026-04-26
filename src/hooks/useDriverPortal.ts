import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { TablesUpdate } from "@/integrations/supabase/types";
import type { DBTrip, DBDriver, DBVehicle } from "./useFleetData";

export type DriverResponse = "pending" | "accepted" | "declined";

export interface DBDriverTrip extends DBTrip {
  driver_response: DriverResponse;
  driver_response_at: string | null;
  actual_pickup_at: string | null;
  actual_delivery_at: string | null;
}

type TripUpdate = TablesUpdate<"trips">;

/**
 * Returns the driver row linked to the currently authenticated user, if any.
 * `null` means the user is logged in but is not a driver in any org.
 */
export function useCurrentDriver() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["current-driver", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as DBDriver | null) ?? null;
    },
  });
}

/** Trips assigned to the current driver (RLS-scoped). */
export function useMyTrips() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-trips", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("scheduled_pickup_at", { ascending: true, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as DBDriverTrip[];
    },
  });
}

/** The vehicle currently assigned to the driver, if any. */
export function useMyVehicle(vehicleId: string | null | undefined) {
  return useQuery({
    queryKey: ["my-vehicle", vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId!)
        .maybeSingle();
      if (error) throw error;
      return data as DBVehicle | null;
    },
  });
}

interface RespondInput {
  trip: DBDriverTrip;
  response: "accepted" | "declined";
  reason?: string | null;
}

/**
 * Driver accepts or declines an assignment. On success we also write a
 * notification back to the dispatcher so they see the decision live.
 */
export function useRespondToTrip() {
  const qc = useQueryClient();
  const { data: driver } = useCurrentDriver();
  return useMutation({
    mutationFn: async ({ trip, response, reason }: RespondInput) => {
      if (!driver) throw new Error("No driver profile linked to this account");

      const tripUpdate: Record<string, unknown> = {
        driver_response: response,
        driver_response_at: new Date().toISOString(),
      };
      // If declined, return to planned and clear the assignment so dispatcher can reassign.
      if (response === "declined") {
        tripUpdate.status = "planned";
        tripUpdate.driver_id = null;
      }

      const { error: tripErr } = await supabase
        .from("trips")
        .update(tripUpdate)
        .eq("id", trip.id);
      if (tripErr) throw tripErr;

      // Notify the dispatcher who created the assignment (org-wide notification).
      const route = `${trip.origin_label} → ${trip.destination_label}`;
      const verb = response === "accepted" ? "accepted" : "declined";
      const { error: notifErr } = await supabase.from("notifications").insert({
        organization_id: driver.organization_id,
        type: "info",
        title: `${driver.full_name} ${verb} ${trip.reference ?? route}`,
        body: reason || `${route} · ${verb} at ${new Date().toLocaleTimeString()}`,
        trip_id: trip.id,
        link: "/trips",
      });
      if (notifErr) throw notifErr;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["my-trips"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success(
        vars.response === "accepted" ? "Trip accepted" : "Trip declined",
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not update trip");
    },
  });
}

interface StatusInput {
  trip: DBDriverTrip;
  action: "start_pickup" | "mark_in_transit" | "mark_delivered";
}

/**
 * Driver progresses a trip through its lifecycle. Each transition writes a
 * notification so the dispatcher gets a live update.
 */
export function useUpdateTripProgress() {
  const qc = useQueryClient();
  const { data: driver } = useCurrentDriver();
  return useMutation({
    mutationFn: async ({ trip, action }: StatusInput) => {
      if (!driver) throw new Error("No driver profile linked to this account");
      const now = new Date().toISOString();
      const update: Record<string, unknown> = {};
      let label = "";

      if (action === "start_pickup") {
        update.actual_pickup_at = now;
        update.status = "in_transit";
        label = "picked up";
      } else if (action === "mark_in_transit") {
        update.status = "in_transit";
        label = "in transit";
      } else if (action === "mark_delivered") {
        update.actual_delivery_at = now;
        update.status = "delivered";
        label = "delivered";
      }

      const { error: tripErr } = await supabase
        .from("trips")
        .update(update)
        .eq("id", trip.id);
      if (tripErr) throw tripErr;

      const route = `${trip.origin_label} → ${trip.destination_label}`;
      const { error: notifErr } = await supabase.from("notifications").insert({
        organization_id: driver.organization_id,
        type: "info",
        title: `${driver.full_name} · ${label} ${trip.reference ?? ""}`.trim(),
        body: route,
        trip_id: trip.id,
        link: "/trips",
      });
      if (notifErr) throw notifErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-trips"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Status updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not update status");
    },
  });
}

/** Realtime patch for the driver's own trip list. */
export function useRealtimeMyTrips() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: driver } = useCurrentDriver();

  useEffect(() => {
    if (!user || !driver) return;
    const channel = supabase
      .channel(`my-trips-${driver.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trips",
          filter: `driver_id=eq.${driver.id}`,
        },
        (payload) => {
          qc.setQueryData<DBDriverTrip[]>(["my-trips", user.id], (prev) => {
            const list = prev ?? [];
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id?: string }).id;
              return list.filter((t) => t.id !== oldId);
            }
            const next = payload.new as DBDriverTrip;
            const filtered = list.filter((t) => t.id !== next.id);
            return [next, ...filtered];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, user, driver]);
}
