import { StatusDot, type Status } from "./StatusDot";
import { Truck } from "lucide-react";
import type { DBVehicle, DBDriver } from "@/hooks/useFleetData";

/** Map DB status to UI status. */
export function vehicleUiStatus(v: DBVehicle): Status {
  if (v.status === "out_of_service") return "offline";
  if (v.status === "maintenance") return "idle";
  if (v.status === "active") return "driving";
  return "idle";
}

/** Map a vehicle's lat/lng to an x/y % on the stylized US map. Rough mercator-ish. */
export function vehicleMapPosition(v: DBVehicle): { x: number; y: number } {
  // Continental US bounds
  const minLng = -125;
  const maxLng = -66;
  const minLat = 24;
  const maxLat = 50;
  const lng = v.current_lng ?? -98;
  const lat = v.current_lat ?? 39;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
  return {
    x: Math.max(4, Math.min(96, x)),
    y: Math.max(6, Math.min(94, y)),
  };
}

interface Props {
  vehicle: DBVehicle;
  driver?: DBDriver;
  active?: boolean;
  onClick?: () => void;
}

export function VehicleCard({ vehicle, driver, active, onClick }: Props) {
  const status = vehicleUiStatus(vehicle);
  const fuel = vehicle.fuel_level_pct ?? 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border bg-card p-4 text-left transition hover:shadow-[var(--shadow-soft)] ${
        active ? "border-primary/40 ring-2 ring-primary/15" : "border-border/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Truck className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{vehicle.truck_number}</p>
            <p className="text-xs text-muted-foreground">
              {driver?.full_name ?? "Unassigned"}
            </p>
          </div>
        </div>
        <StatusDot status={status} />
      </div>
      <p className="mt-3 truncate text-xs text-muted-foreground">
        {vehicle.current_location_label ?? (`${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() || "—")}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <Stat label="Fuel" value={`${Math.round(fuel)}%`} tone={fuel < 25 ? "warn" : undefined} />
        <Stat label="Odo" value={vehicle.odometer_miles ? `${(vehicle.odometer_miles / 1000).toFixed(0)}k` : "—"} />
        <Stat label="HOS" value={driver?.hos_remaining_minutes ? `${Math.floor(driver.hos_remaining_minutes / 60)}h` : "—"} />
      </div>
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-xs font-semibold ${tone === "warn" ? "text-warning" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
