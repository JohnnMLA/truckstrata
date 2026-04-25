import { AlertTriangle, ShieldAlert, WifiOff, Fuel, Clock, Inbox } from "lucide-react";
import { useAlerts, type DBAlert } from "@/hooks/useFleetData";
import { formatDistanceToNow } from "date-fns";

const iconByType: Record<string, typeof AlertTriangle> = {
  fuel_low: Fuel,
  hos_violation: Clock,
  route_deviation: ShieldAlert,
  speeding: AlertTriangle,
  maintenance_due: AlertTriangle,
  eta_delay: Clock,
  document_expiring: AlertTriangle,
  idle_excessive: Clock,
  other: WifiOff,
};

const tones = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-warning/15 text-warning",
  critical: "bg-destructive/15 text-destructive",
} as const;

export function AlertCenter() {
  const { data: alerts, isLoading } = useAlerts();

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Alert center</h3>
        <button className="text-xs font-medium text-primary hover:underline">View all</button>
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : !alerts || alerts.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
          <Inbox className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
          <p className="text-xs font-medium text-foreground">All clear</p>
          <p className="text-[11px] text-muted-foreground">No active alerts right now.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {alerts.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AlertRow({ alert }: { alert: DBAlert }) {
  const Icon = iconByType[alert.type] ?? AlertTriangle;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 transition hover:bg-card">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[alert.severity]}`}>
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{alert.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </p>
      </div>
    </li>
  );
}
