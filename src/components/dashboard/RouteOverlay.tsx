import { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { DBTrip, DBVehicle } from "@/hooks/useFleetData";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

/**
 * Per-trip computed ETA + drawn route. Lives only as long as the map is mounted.
 *
 * For each trip that is `in_transit` and has a known vehicle position + a
 * destination string, we ask Google Directions for the best route and
 * `duration_in_traffic`. We draw the polyline directly on the map, store an
 * ETA, and surface delays.
 */

export interface TripEta {
  tripId: string;
  vehicleId: string;
  etaIso: string; // current best ETA
  durationSeconds: number;
  distanceMeters: number;
  delayedMinutes: number; // positive when behind schedule
  isDelayed: boolean;
}

interface Props {
  vehicles: DBVehicle[];
  trips: DBTrip[];
  onEtas?: (etas: Map<string, TripEta>) => void;
  selectedVehicleId?: string;
}

const HEX_PRIMARY = "#5B7CFA";
const HEX_DANGER = "#E5484D";
const DELAY_THRESHOLD_MIN = 15;
const REFRESH_MS = 60_000;

export function RouteOverlay({ vehicles, trips, onEtas, selectedVehicleId }: Props) {
  const map = useMap();
  const [etas, setEtas] = useState<Map<string, TripEta>>(new Map());
  // One DirectionsRenderer + last computed signature per trip
  const renderersRef = useRef<Map<string, google.maps.DirectionsRenderer>>(new Map());
  const lastSigRef = useRef<Map<string, string>>(new Map());
  const alertedRef = useRef<Set<string>>(new Set());

  // Build the set of trips we should currently visualize.
  const activeTrips = useMemo(() => {
    const vById = new Map(vehicles.map((v) => [v.id, v] as const));
    return trips
      .filter((t) => t.status === "in_transit" && t.vehicle_id)
      .map((t) => ({ trip: t, vehicle: vById.get(t.vehicle_id!) }))
      .filter(
        (x): x is { trip: DBTrip; vehicle: DBVehicle } =>
          !!x.vehicle &&
          typeof x.vehicle.current_lat === "number" &&
          typeof x.vehicle.current_lng === "number",
      );
  }, [vehicles, trips]);

  // Compute / refresh routes whenever active trips or positions change.
  useEffect(() => {
    if (!map || typeof google === "undefined" || !google.maps) return;
    const directions = new google.maps.DirectionsService();
    let cancelled = false;

    const liveIds = new Set(activeTrips.map((x) => x.trip.id));

    // Tear down renderers that are no longer relevant
    for (const [id, renderer] of renderersRef.current) {
      if (!liveIds.has(id)) {
        renderer.setMap(null);
        renderersRef.current.delete(id);
        lastSigRef.current.delete(id);
      }
    }

    async function computeOne({ trip, vehicle }: { trip: DBTrip; vehicle: DBVehicle }) {
      const origin = {
        lat: Number(vehicle.current_lat),
        lng: Number(vehicle.current_lng),
      };
      // Prefer explicit lat/lng, else fall back to destination_label string
      const dest =
        typeof trip.destination_lat === "number" && typeof trip.destination_lng === "number"
          ? { lat: Number(trip.destination_lat), lng: Number(trip.destination_lng) }
          : trip.destination_label;
      if (!dest) return;

      // Cache key: only recompute when origin moved or destination changed
      const sig = `${typeof dest === "string" ? dest : `${dest.lat},${dest.lng}`}|${origin.lat.toFixed(2)},${origin.lng.toFixed(2)}`;
      if (lastSigRef.current.get(trip.id) === sig && renderersRef.current.has(trip.id)) {
        return;
      }

      try {
        const result = await directions.route({
          origin,
          destination: dest,
          travelMode: google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
        });
        if (cancelled) return;

        const leg = result.routes[0]?.legs[0];
        if (!leg) return;
        const durationSec = leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0;
        const distanceM = leg.distance?.value ?? 0;
        const eta = new Date(Date.now() + durationSec * 1000);

        let delayedMin = 0;
        let isDelayed = false;
        if (trip.scheduled_delivery_at) {
          const sched = new Date(trip.scheduled_delivery_at).getTime();
          delayedMin = Math.round((eta.getTime() - sched) / 60_000);
          isDelayed = delayedMin > DELAY_THRESHOLD_MIN;
        }

        // Draw polyline
        const isSelected = selectedVehicleId === vehicle.id;
        const color = isDelayed ? HEX_DANGER : HEX_PRIMARY;
        let renderer = renderersRef.current.get(trip.id);
        if (!renderer) {
          renderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: color,
              strokeOpacity: isSelected ? 0.95 : 0.55,
              strokeWeight: isSelected ? 5 : 3,
            },
          });
          renderersRef.current.set(trip.id, renderer);
        } else {
          renderer.setOptions({
            polylineOptions: {
              strokeColor: color,
              strokeOpacity: isSelected ? 0.95 : 0.55,
              strokeWeight: isSelected ? 5 : 3,
            },
          });
        }
        renderer.setDirections(result);
        lastSigRef.current.set(trip.id, sig);

        const etaEntry: TripEta = {
          tripId: trip.id,
          vehicleId: vehicle.id,
          etaIso: eta.toISOString(),
          durationSeconds: durationSec,
          distanceMeters: distanceM,
          delayedMinutes: delayedMin,
          isDelayed,
        };
        setEtas((prev) => {
          const next = new Map(prev);
          next.set(trip.id, etaEntry);
          return next;
        });

        // Fire alert once per session per trip while delayed.
        if (isDelayed && !alertedRef.current.has(trip.id)) {
          alertedRef.current.add(trip.id);
          await maybeCreateDelayAlert(trip, vehicle, etaEntry);
        }
        if (!isDelayed) {
          alertedRef.current.delete(trip.id);
        }
      } catch (err) {
        // Silently swallow — most likely zero results or quota
        if (import.meta.env.DEV) {
          console.warn("Directions failed for trip", trip.id, err);
        }
      }
    }

    activeTrips.forEach(computeOne);

    // Periodic refresh — recompute against latest traffic
    const interval = window.setInterval(() => {
      // Force-bust the cache by clearing signatures
      lastSigRef.current.clear();
      activeTrips.forEach(computeOne);
    }, REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [map, activeTrips, selectedVehicleId]);

  // Cleanup on unmount: remove every polyline
  useEffect(() => {
    const renderers = renderersRef.current;
    return () => {
      for (const r of renderers.values()) r.setMap(null);
      renderers.clear();
    };
  }, []);

  // Surface ETAs to the parent (e.g. for InfoWindow)
  useEffect(() => {
    onEtas?.(etas);
  }, [etas, onEtas]);

  return null;
}

async function maybeCreateDelayAlert(trip: DBTrip, vehicle: DBVehicle, eta: TripEta) {
  // Dedup: skip if there is already an unresolved eta_delay alert for this trip
  const { data: existing } = await supabase
    .from("alerts")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("type", "eta_delay")
    .eq("resolved", false)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  const insert: TablesInsert<"alerts"> = {
    organization_id: trip.organization_id,
    type: "eta_delay",
    severity: eta.delayedMinutes > 60 ? "critical" : "warning",
    title: `ETA delay · ${vehicle.truck_number}`,
    message: `${trip.reference ?? `${trip.origin_label} → ${trip.destination_label}`} running ${eta.delayedMinutes} min behind schedule`,
    vehicle_id: vehicle.id,
    trip_id: trip.id,
    driver_id: trip.driver_id ?? null,
  };
  await supabase.from("alerts").insert(insert);
}
