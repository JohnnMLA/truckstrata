type Status = "driving" | "idle" | "break" | "offline";

const palette: Record<Status, { dot: string; label: string; ring: string }> = {
  driving: { dot: "bg-success", label: "Driving", ring: "ring-success/30" },
  idle: { dot: "bg-warning", label: "Idle", ring: "ring-warning/30" },
  break: { dot: "bg-primary", label: "On break", ring: "ring-primary/30" },
  offline: { dot: "bg-muted-foreground/50", label: "Offline", ring: "ring-border" },
};

export function StatusDot({ status }: { status: Status }) {
  const p = palette[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className={`relative inline-flex h-2 w-2 rounded-full ${p.dot}`}>
        {status === "driving" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
        )}
      </span>
      {p.label}
    </span>
  );
}

export type { Status };
