import { AlertTriangle, ShieldAlert, WifiOff } from "lucide-react";

const alerts = [
  { icon: AlertTriangle, tone: "warn", title: "Low fuel · Truck 307", time: "2m ago" },
  { icon: ShieldAlert, tone: "danger", title: "Geofence breach · Truck 091", time: "14m ago" },
  { icon: WifiOff, tone: "muted", title: "Truck 562 offline · 38 min", time: "38m ago" },
] as const;

const tones = {
  warn: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function AlertCenter() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Alert center</h3>
        <button className="text-xs font-medium text-primary hover:underline">View all</button>
      </div>
      <ul className="mt-3 space-y-2">
        {alerts.map((a) => (
          <li
            key={a.title}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 transition hover:bg-card"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[a.tone]}`}>
              <a.icon className="h-4 w-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
