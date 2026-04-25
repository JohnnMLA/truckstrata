import { StatusDot, type Status } from "./StatusDot";
import { Truck } from "lucide-react";

export interface Vehicle {
  id: string;
  name: string;
  driver: string;
  route: string;
  speed: number;
  fuel: number;
  eta: string;
  status: Status;
  // position as % of map width/height for the mock map
  x: number;
  y: number;
}

export const mockVehicles: Vehicle[] = [
  { id: "TRK-204", name: "Truck 204", driver: "Marcus Reed", route: "Dallas → Phoenix", speed: 64, fuel: 72, eta: "4h 12m", status: "driving", x: 28, y: 56 },
  { id: "TRK-118", name: "Truck 118", driver: "Sara Lin", route: "Atlanta → Miami", speed: 0, fuel: 41, eta: "—", status: "break", x: 72, y: 70 },
  { id: "TRK-091", name: "Truck 091", driver: "Diego Alvarez", route: "Chicago → Denver", speed: 58, fuel: 88, eta: "9h 04m", status: "driving", x: 47, y: 38 },
  { id: "TRK-307", name: "Truck 307", driver: "Hannah Cole", route: "Seattle → Boise", speed: 0, fuel: 18, eta: "—", status: "idle", x: 14, y: 24 },
  { id: "TRK-562", name: "Truck 562", driver: "Jamal Rivers", route: "NYC → Boston", speed: 0, fuel: 64, eta: "—", status: "offline", x: 86, y: 28 },
];

export function VehicleCard({ v, active, onClick }: { v: Vehicle; active?: boolean; onClick?: () => void }) {
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
            <p className="text-sm font-semibold text-foreground">{v.name}</p>
            <p className="text-xs text-muted-foreground">{v.driver}</p>
          </div>
        </div>
        <StatusDot status={v.status} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{v.route}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <Stat label="Speed" value={`${v.speed} mph`} />
        <Stat label="Fuel" value={`${v.fuel}%`} tone={v.fuel < 25 ? "warn" : undefined} />
        <Stat label="ETA" value={v.eta} />
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
