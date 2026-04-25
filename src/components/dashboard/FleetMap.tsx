import { Truck, Navigation } from "lucide-react";
import type { Vehicle } from "./VehicleCard";

interface Props {
  vehicles: Vehicle[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function FleetMap({ vehicles, selectedId, onSelect }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
      {/* Stylized "map" background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, oklch(0.96 0.02 230) 0%, transparent 60%), radial-gradient(circle at 75% 80%, oklch(0.95 0.025 200) 0%, transparent 55%), oklch(0.98 0.005 240)",
          }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-[0.35]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="oklch(0.85 0.01 240)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* fake highways */}
          <path d="M 0 320 Q 300 260 600 340 T 1200 260" stroke="oklch(0.78 0.05 230)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 200 0 Q 260 220 180 420 T 320 700" stroke="oklch(0.82 0.04 220)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 700 0 Q 660 200 820 380 T 900 720" stroke="oklch(0.82 0.04 220)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Vehicle markers */}
      {vehicles.map((v) => {
        const active = v.id === selectedId;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${v.x}%`, top: `${v.y}%` }}
          >
            <div className="relative flex flex-col items-center">
              {v.status === "driving" && (
                <span className="absolute -inset-2 animate-ping rounded-full bg-primary/20" />
              )}
              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background shadow-[var(--shadow-elevated)] transition ${
                  active
                    ? "scale-110 bg-[image:var(--gradient-primary)] text-primary-foreground"
                    : v.status === "offline"
                      ? "bg-muted text-muted-foreground"
                      : "bg-card text-primary hover:scale-105"
                }`}
              >
                <Truck className="h-4 w-4" strokeWidth={2} />
              </div>
              {active && (
                <div className="mt-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-0.5 text-[10px] font-medium text-background shadow">
                  {v.name}
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* Map controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-1 rounded-xl border border-border/60 bg-card/90 p-1 shadow-[var(--shadow-soft)] backdrop-blur">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">+</button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">−</button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
          <Navigation className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* Live indicator */}
      <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
        </span>
        Live · {vehicles.filter((v) => v.status !== "offline").length} of {vehicles.length} active
      </div>
    </div>
  );
}
