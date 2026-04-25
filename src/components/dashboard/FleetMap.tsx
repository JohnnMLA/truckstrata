import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { Truck, Loader2, AlertTriangle } from "lucide-react";
import type { DBVehicle } from "@/hooks/useFleetData";
import { vehicleUiStatus } from "./VehicleCard";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  vehicles: DBVehicle[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

const MAP_ID = "truckstrata_fleet_map";

// Center of contiguous US — used as fallback when no vehicles have coordinates.
const US_CENTER = { lat: 39.5, lng: -98.35 };

export function FleetMap({ vehicles, selectedId, onSelect }: Props) {
  const keyQuery = useQuery({
    queryKey: ["maps-config"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        apiKey: string;
        error?: string;
      }>("maps-config", { body: {} });
      if (error) throw new Error(error.message);
      if (!data?.apiKey) throw new Error(data?.error ?? "No API key returned");
      return data.apiKey;
    },
  });

  const positioned = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          typeof v.current_lat === "number" &&
          typeof v.current_lng === "number",
      ),
    [vehicles],
  );

  const liveCount = vehicles.filter((v) => v.status !== "out_of_service").length;

  if (keyQuery.isLoading) {
    return (
      <MapShell>
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </MapShell>
    );
  }

  if (keyQuery.isError || !keyQuery.data) {
    return (
      <MapShell>
        <div className="flex h-full w-full items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-warning" />
            <p className="mt-2 text-sm font-semibold text-foreground">
              Map unavailable
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(keyQuery.error as Error)?.message ??
                "Couldn't load Google Maps API key."}
            </p>
          </div>
        </div>
      </MapShell>
    );
  }

  return (
    <MapShell>
      <APIProvider apiKey={keyQuery.data}>
        <Map
          mapId={MAP_ID}
          defaultCenter={US_CENTER}
          defaultZoom={4}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
          className="h-full w-full"
        >
          <FitBounds vehicles={positioned} selectedId={selectedId} />
          {positioned.map((v) => (
            <VehicleMarker
              key={v.id}
              vehicle={v}
              selected={v.id === selectedId}
              onSelect={() => onSelect(v.id)}
            />
          ))}
        </Map>
      </APIProvider>

      {/* Overlay: live status pill */}
      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
        </span>
        Live · {liveCount} of {vehicles.length} active
      </div>
    </MapShell>
  );
}

function MapShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
      {children}
    </div>
  );
}

function VehicleMarker({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: DBVehicle;
  selected: boolean;
  onSelect: () => void;
}) {
  const status = vehicleUiStatus(vehicle);
  const target = {
    lat: Number(vehicle.current_lat),
    lng: Number(vehicle.current_lng),
  };

  // Tween marker position from previous → new coords for smooth motion.
  const [position, setPosition] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    // Skip tween if first render or virtually unchanged
    const dist = Math.hypot(to.lat - from.lat, to.lng - from.lng);
    if (dist < 1e-6) {
      setPosition(to);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const e = 1 - Math.pow(1 - t, 3);
      setPosition({
        lat: from.lat + (to.lat - from.lat) * e,
        lng: from.lng + (to.lng - from.lng) * e,
      });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.lat, target.lng]);

  const tone =
    status === "offline"
      ? "bg-muted text-muted-foreground"
      : selected
        ? "bg-[image:var(--gradient-primary)] text-primary-foreground scale-110"
        : "bg-card text-primary";

  return (
    <>
      <AdvancedMarker position={position} onClick={onSelect}>
        <div className="relative flex flex-col items-center">
          {status === "driving" && !selected && (
            <span className="absolute -inset-2 animate-ping rounded-full bg-primary/25" />
          )}
          <div
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background shadow-[var(--shadow-elevated)] transition ${tone}`}
          >
            <Truck className="h-4 w-4" strokeWidth={2} />
          </div>
        </div>
      </AdvancedMarker>

      {selected && (
        <InfoWindow position={position} pixelOffset={[0, -38]} headerDisabled>
          <div className="min-w-[180px] px-1 py-0.5">
            <p className="text-sm font-semibold text-foreground">
              {vehicle.truck_number}
            </p>
            {vehicle.current_location_label && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {vehicle.current_location_label}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="capitalize">{vehicle.status.replace("_", " ")}</span>
              {typeof vehicle.fuel_level_pct === "number" && (
                <>
                  <span>·</span>
                  <span>Fuel {vehicle.fuel_level_pct}%</span>
                </>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

/** Auto-fit map to cover all vehicles when the set changes. */
function FitBounds({
  vehicles,
  selectedId,
}: {
  vehicles: DBVehicle[];
  selectedId?: string;
}) {
  const map = useMap();
  const [hasFit, setHasFit] = useState(false);

  // Fit all on first load
  useEffect(() => {
    if (!map || hasFit || vehicles.length === 0) return;
    if (vehicles.length === 1) {
      map.setCenter({
        lat: Number(vehicles[0].current_lat),
        lng: Number(vehicles[0].current_lng),
      });
      map.setZoom(8);
    } else {
      const bounds = new google.maps.LatLngBounds();
      vehicles.forEach((v) =>
        bounds.extend({
          lat: Number(v.current_lat),
          lng: Number(v.current_lng),
        }),
      );
      map.fitBounds(bounds, 64);
    }
    setHasFit(true);
  }, [map, vehicles, hasFit]);

  // Pan to selection
  useEffect(() => {
    if (!map || !selectedId) return;
    const v = vehicles.find((x) => x.id === selectedId);
    if (!v) return;
    map.panTo({ lat: Number(v.current_lat), lng: Number(v.current_lng) });
  }, [map, selectedId, vehicles]);

  return null;
}
