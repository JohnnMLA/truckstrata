import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface DBVehicle {
  id: string;
  organization_id: string;
  truck_number: string;
  make: string | null;
  model: string | null;
  year?: number | null;
  license_plate?: string | null;
  vin?: string | null;
  status: "active" | "idle" | "maintenance" | "out_of_service";
  current_lat: number | null;
  current_lng: number | null;
  current_location_label: string | null;
  fuel_level_pct: number | null;
  odometer_miles: number | null;
  last_ping_at: string | null;
  current_driver_id: string | null;
}

export interface DBDriver {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string | null;
  email?: string | null;
  status: "on_duty" | "off_duty" | "driving" | "sleeper" | "unavailable";
  current_vehicle_id: string | null;
  hos_remaining_minutes: number | null;
  user_id: string | null;
  license_number?: string | null;
  license_state?: string | null;
  license_expiry?: string | null;
}

export interface DBTrip {
  id: string;
  organization_id: string;
  reference: string | null;
  origin_label: string;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_label: string;
  destination_lat?: number | null;
  destination_lng?: number | null;
  status: "planned" | "assigned" | "in_transit" | "delivered" | "cancelled" | "delayed";
  vehicle_id: string | null;
  driver_id: string | null;
  scheduled_pickup_at: string | null;
  scheduled_delivery_at: string | null;
  distance_miles: number | null;
  revenue_cents: number | null;
  driver_response?: "pending" | "accepted" | "declined";
  driver_response_at?: string | null;
  actual_pickup_at?: string | null;
  actual_delivery_at?: string | null;
  share_token?: string | null;
  created_at?: string | null;
}

export interface DBAlert {
  id: string;
  organization_id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string | null;
  vehicle_id: string | null;
  resolved: boolean;
  created_at: string;
}

export function useOrganization() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["organization", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id, role, organizations(id, name, slug, plan)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useVehicles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["vehicles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("truck_number", { ascending: true });
      if (error) throw error;
      return data as DBVehicle[];
    },
  });
}

export function useDrivers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["drivers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data as DBDriver[];
    },
  });
}

export function useTrips() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["trips", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("scheduled_pickup_at", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data as DBTrip[];
    },
  });
}

export function useAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["alerts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as DBAlert[];
    },
  });
}

export interface CreateTripInput {
  reference?: string | null;
  origin_label: string;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_label: string;
  destination_lat?: number | null;
  destination_lng?: number | null;
  vehicle_id?: string | null;
  driver_id?: string | null;
  scheduled_pickup_at?: string | null;
  scheduled_delivery_at?: string | null;
  notes?: string | null;
}

export function useCreateTrip() {
  const qc = useQueryClient();
  const { data: org } = useOrganization();
  return useMutation({
    mutationFn: async (input: CreateTripInput) => {
      if (!org?.organization_id) throw new Error("No organization yet");
      const status = input.driver_id && input.vehicle_id ? "assigned" : "planned";
      const { data, error } = await supabase
        .from("trips")
        .insert({
          ...input,
          organization_id: org.organization_id,
          status,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as DBTrip;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

/** Seed demo fleet data for the current user's organization. */
export function useSeedDemoFleet() {
  const qc = useQueryClient();
  const { data: org } = useOrganization();
  return useMutation({
    mutationFn: async () => {
      if (!org?.organization_id) throw new Error("No organization yet");
      const orgId = org.organization_id;

      const drivers = [
        { full_name: "Marcus Reed", phone: "+1 214 555 0142", status: "driving" as const, hos_remaining_minutes: 380 },
        { full_name: "Sara Lin", phone: "+1 305 555 0113", status: "off_duty" as const, hos_remaining_minutes: 600 },
        { full_name: "Diego Alvarez", phone: "+1 312 555 0188", status: "driving" as const, hos_remaining_minutes: 240 },
        { full_name: "Hannah Cole", phone: "+1 206 555 0166", status: "off_duty" as const, hos_remaining_minutes: 420 },
        { full_name: "Jamal Rivers", phone: "+1 718 555 0199", status: "off_duty" as const, hos_remaining_minutes: 540 },
      ].map((d) => ({ ...d, organization_id: orgId }));

      const { data: insertedDrivers, error: dErr } = await supabase
        .from("drivers")
        .insert(drivers)
        .select("id, full_name");
      if (dErr) throw dErr;

      const byName = Object.fromEntries(insertedDrivers.map((d) => [d.full_name, d.id]));

      const vehicles = [
        { truck_number: "TRK-204", make: "Freightliner", model: "Cascadia", status: "active" as const, current_lat: 32.7767, current_lng: -96.7970, current_location_label: "Dallas, TX", fuel_level_pct: 72, current_driver_id: byName["Marcus Reed"] },
        { truck_number: "TRK-118", make: "Peterbilt", model: "579", status: "idle" as const, current_lat: 33.7490, current_lng: -84.3880, current_location_label: "Atlanta, GA", fuel_level_pct: 41, current_driver_id: byName["Sara Lin"] },
        { truck_number: "TRK-091", make: "Kenworth", model: "T680", status: "active" as const, current_lat: 41.8781, current_lng: -87.6298, current_location_label: "Chicago, IL", fuel_level_pct: 88, current_driver_id: byName["Diego Alvarez"] },
        { truck_number: "TRK-307", make: "Volvo", model: "VNL 860", status: "idle" as const, current_lat: 47.6062, current_lng: -122.3321, current_location_label: "Seattle, WA", fuel_level_pct: 18, current_driver_id: byName["Hannah Cole"] },
        { truck_number: "TRK-562", make: "Mack", model: "Anthem", status: "out_of_service" as const, current_lat: 40.7128, current_lng: -74.0060, current_location_label: "New York, NY", fuel_level_pct: 64, current_driver_id: byName["Jamal Rivers"] },
      ].map((v) => ({ ...v, organization_id: orgId, last_ping_at: new Date().toISOString() }));

      const { data: insertedVehicles, error: vErr } = await supabase
        .from("vehicles")
        .insert(vehicles)
        .select("id, truck_number");
      if (vErr) throw vErr;

      const byTruck = Object.fromEntries(insertedVehicles.map((v) => [v.truck_number, v.id]));

      const trips = [
        { reference: "L-2041", origin_label: "Dallas, TX", destination_label: "Phoenix, AZ", status: "in_transit" as const, vehicle_id: byTruck["TRK-204"], driver_id: byName["Marcus Reed"], distance_miles: 1066, revenue_cents: 285000 },
        { reference: "L-1187", origin_label: "Atlanta, GA", destination_label: "Miami, FL", status: "planned" as const, vehicle_id: byTruck["TRK-118"], driver_id: byName["Sara Lin"], distance_miles: 661, revenue_cents: 172000 },
        { reference: "L-0913", origin_label: "Chicago, IL", destination_label: "Denver, CO", status: "in_transit" as const, vehicle_id: byTruck["TRK-091"], driver_id: byName["Diego Alvarez"], distance_miles: 1003, revenue_cents: 264000 },
      ].map((t) => ({ ...t, organization_id: orgId }));

      const { error: tErr } = await supabase.from("trips").insert(trips);
      if (tErr) throw tErr;

      const alerts = [
        { type: "fuel_low" as const, severity: "warning" as const, title: "Low fuel · TRK-307", message: "Fuel level at 18% — nearest station 24 miles away.", vehicle_id: byTruck["TRK-307"] },
        { type: "route_deviation" as const, severity: "critical" as const, title: "Geofence breach · TRK-091", message: "Vehicle is 2.3 mi off planned route.", vehicle_id: byTruck["TRK-091"] },
        { type: "other" as const, severity: "info" as const, title: "TRK-562 offline · 38 min", message: "Last ping 38 minutes ago. Check ELD device.", vehicle_id: byTruck["TRK-562"] },
      ].map((a) => ({ ...a, organization_id: orgId }));

      const { error: aErr } = await supabase.from("alerts").insert(alerts);
      if (aErr) throw aErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

/**
 * Subscribe to live changes on the vehicles table and patch the React Query
 * cache so any component reading useVehicles() updates without a refetch.
 */
export function useRealtimeVehicles() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("vehicles-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        (payload) => {
          qc.setQueryData<DBVehicle[]>(["vehicles", user.id], (prev) => {
            if (!prev) return prev;
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id?: string }).id;
              return prev.filter((v) => v.id !== oldId);
            }
            const next = payload.new as DBVehicle;
            const idx = prev.findIndex((v) => v.id === next.id);
            if (idx === -1) return [...prev, next];
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], ...next };
            return copy;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, user]);
}

/**
 * Demo helper: nudge each active vehicle's lat/lng by a tiny random offset to
 * simulate GPS pings. Used to showcase realtime updates without ELD hardware.
 */
export function useSimulateVehiclePings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: vehicles, error } = await supabase
        .from("vehicles")
        .select("id, current_lat, current_lng, status")
        .neq("status", "out_of_service");
      if (error) throw error;
      if (!vehicles?.length) return 0;

      // Move each vehicle by ~0.05° (~3-4 miles) in a random direction
      const updates = vehicles
        .filter((v) => v.current_lat !== null && v.current_lng !== null)
        .map((v) => {
          const dLat = (Math.random() - 0.5) * 0.1;
          const dLng = (Math.random() - 0.5) * 0.1;
          return supabase
            .from("vehicles")
            .update({
              current_lat: Number(v.current_lat) + dLat,
              current_lng: Number(v.current_lng) + dLng,
              last_ping_at: new Date().toISOString(),
            })
            .eq("id", v.id);
        });

      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error);
      if (firstError?.error) throw firstError.error;
      return updates.length;
    },
    onSuccess: () => {
      // Realtime will patch the cache, but invalidate as a safety net.
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

/**
 * Subscribe to live changes on the alerts table and patch the cache. Notifies
 * via toast when a new critical/warning alert is created.
 */
export function useRealtimeAlerts() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("alerts-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        (payload) => {
          qc.setQueryData<DBAlert[]>(["alerts", user.id], (prev) => {
            if (!prev) return prev;
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id?: string }).id;
              return prev.filter((a) => a.id !== oldId);
            }
            const next = payload.new as DBAlert;
            // Only show unresolved alerts in the live list
            const filtered = prev.filter((a) => a.id !== next.id);
            if (next.resolved) return filtered;
            return [next, ...filtered].slice(0, 20);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, user]);
}
