import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/lib/auth";
import { useVehicles } from "@/hooks/useFleetData";
import {
  MAINT_KIND_LABEL,
  getDueStatus,
  useDeleteSchedule,
  useLogMaintenance,
  useMaintenanceRecords,
  useMaintenanceSchedules,
  useUpsertSchedule,
  type MaintenanceKind,
  type MaintenanceSchedule,
} from "@/hooks/useMaintenance";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance · TruckStrata" },
      {
        name: "description",
        content:
          "Track service intervals, DOT inspections, and recurring PM tasks per vehicle. Stay ahead of due dates and avoid downtime.",
      },
      { property: "og:title", content: "Maintenance · TruckStrata" },
      {
        property: "og:description",
        content:
          "Service intervals, DOT inspections, and PM tasks for your fleet.",
      },
    ],
  }),
  component: MaintenancePage,
});

const KIND_OPTIONS: MaintenanceKind[] = [
  "oil_change",
  "tire_rotation",
  "brake_inspection",
  "dot_inspection",
  "annual_inspection",
  "transmission_service",
  "coolant_flush",
  "air_filter",
  "other",
];

function MaintenancePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: vehicles } = useVehicles();
  const { data: schedules, isLoading: schedLoading } = useMaintenanceSchedules();
  const { data: records } = useMaintenanceRecords();

  const vehiclesById = useMemo(
    () => Object.fromEntries((vehicles ?? []).map((v) => [v.id, v])),
    [vehicles],
  );

  const enriched = useMemo(() => {
    return (schedules ?? []).map((s) => {
      const v = vehiclesById[s.vehicle_id];
      const status = getDueStatus(s, v?.odometer_miles ?? null);
      return { schedule: s, vehicle: v, status };
    });
  }, [schedules, vehiclesById]);

  const counts = useMemo(() => {
    const c = { overdue: 0, soon: 0, ok: 0 };
    for (const e of enriched) c[e.status.level] += 1;
    return c;
  }, [enriched]);

  const sorted = useMemo(() => {
    const order = { overdue: 0, soon: 1, ok: 2 } as const;
    return [...enriched].sort(
      (a, b) => order[a.status.level] - order[b.status.level],
    );
  }, [enriched]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Fleet care
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Maintenance & Inspections
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {schedules?.length ?? 0} active schedules · {records?.length ?? 0}{" "}
              services logged
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScheduleDialog vehicles={vehicles ?? []}>
              <Button size="sm" className="rounded-xl">
                <Plus className="mr-1.5 h-4 w-4" /> New schedule
              </Button>
            </ScheduleDialog>
            <NotificationBell />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Overdue"
            value={counts.overdue}
            icon={AlertTriangle}
            tone="overdue"
          />
          <SummaryCard
            label="Due soon"
            value={counts.soon}
            icon={Clock}
            tone="soon"
          />
          <SummaryCard
            label="Up to date"
            value={counts.ok}
            icon={CheckCircle2}
            tone="ok"
          />
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Service schedules
            </h2>
          </div>
          {schedLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState vehicles={vehicles ?? []} />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {sorted.map(({ schedule, vehicle, status }) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  vehicleLabel={vehicle?.truck_number ?? "Unknown truck"}
                  currentMiles={vehicle?.odometer_miles ?? null}
                  level={status.level}
                  daysLeft={status.daysLeft}
                  milesLeft={status.milesLeft}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Recent service log
            </h2>
            <span className="text-xs text-muted-foreground">
              Last {Math.min(records?.length ?? 0, 20)} entries
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Truck</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Odometer</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                </tr>
              </thead>
              <tbody>
                {(records ?? []).slice(0, 20).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/40 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-foreground">
                      {format(new Date(r.performed_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {vehiclesById[r.vehicle_id]?.truck_number ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {MAINT_KIND_LABEL[r.kind]}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.odometer_miles
                        ? `${r.odometer_miles.toLocaleString()} mi`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.cost_cents != null
                        ? `$${(r.cost_cents / 100).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.vendor ?? "—"}
                    </td>
                  </tr>
                ))}
                {(!records || records.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-xs text-muted-foreground"
                    >
                      No services logged yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  tone: "overdue" | "soon" | "ok";
}) {
  const toneClass =
    tone === "overdue"
      ? "bg-destructive/10 text-destructive"
      : tone === "soon"
        ? "bg-warning/15 text-warning"
        : "bg-success/15 text-success";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ vehicles }: { vehicles: { id: string }[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center">
      <Wrench className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 text-sm font-semibold text-foreground">
        No maintenance schedules yet
      </h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
        Add recurring services like oil changes, DOT inspections, and tire
        rotations. We&apos;ll flag them as they come due.
      </p>
      {vehicles.length === 0 && (
        <p className="mt-3 text-xs text-warning">
          Add a vehicle first in Settings to schedule maintenance.
        </p>
      )}
    </div>
  );
}

function ScheduleCard({
  schedule,
  vehicleLabel,
  currentMiles,
  level,
  daysLeft,
  milesLeft,
}: {
  schedule: MaintenanceSchedule;
  vehicleLabel: string;
  currentMiles: number | null;
  level: "ok" | "soon" | "overdue";
  daysLeft: number | null;
  milesLeft: number | null;
}) {
  const log = useLogMaintenance();
  const del = useDeleteSchedule();
  const [logOpen, setLogOpen] = useState(false);

  const tone =
    level === "overdue"
      ? "border-destructive/30 bg-destructive/5"
      : level === "soon"
        ? "border-warning/30 bg-warning/5"
        : "border-border/60 bg-card";

  const badge =
    level === "overdue" ? (
      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">
        Overdue
      </Badge>
    ) : level === "soon" ? (
      <Badge className="bg-warning/15 text-warning hover:bg-warning/15">
        Due soon
      </Badge>
    ) : (
      <Badge className="bg-success/15 text-success hover:bg-success/15">
        On track
      </Badge>
    );

  return (
    <div
      className={`rounded-2xl border p-5 shadow-[var(--shadow-soft)] ${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {schedule.label || MAINT_KIND_LABEL[schedule.kind]}
            </p>
            {badge}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Truck {vehicleLabel} · {MAINT_KIND_LABEL[schedule.kind]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this maintenance schedule?")) {
              del.mutate(schedule.id, {
                onSuccess: () => toast.success("Schedule removed"),
                onError: (e) => toast.error((e as Error).message),
              });
            }
          }}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-destructive"
          aria-label="Delete schedule"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Next due</p>
          <p className="mt-0.5 font-medium text-foreground">
            {schedule.next_due_at
              ? `${format(new Date(schedule.next_due_at), "MMM d, yyyy")}${
                  daysLeft != null
                    ? ` · ${daysLeft >= 0 ? `in ${daysLeft}d` : `${Math.abs(daysLeft)}d ago`}`
                    : ""
                }`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">At odometer</p>
          <p className="mt-0.5 font-medium text-foreground">
            {schedule.next_due_miles != null
              ? `${schedule.next_due_miles.toLocaleString()} mi${
                  milesLeft != null
                    ? ` · ${milesLeft >= 0 ? `${milesLeft.toLocaleString()} mi left` : `${Math.abs(milesLeft).toLocaleString()} mi over`}`
                    : ""
                }`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Interval</p>
          <p className="mt-0.5 font-medium text-foreground">
            {[
              schedule.interval_days ? `${schedule.interval_days}d` : null,
              schedule.interval_miles
                ? `${schedule.interval_miles.toLocaleString()} mi`
                : null,
            ]
              .filter(Boolean)
              .join(" / ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Last service</p>
          <p className="mt-0.5 font-medium text-foreground">
            {schedule.last_service_at
              ? formatDistanceToNow(new Date(schedule.last_service_at), {
                  addSuffix: true,
                })
              : "Never"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Dialog open={logOpen} onOpenChange={setLogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-xl">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
              Log service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log maintenance</DialogTitle>
            </DialogHeader>
            <LogServiceForm
              schedule={schedule}
              currentMiles={currentMiles}
              onSubmit={async (input) => {
                try {
                  await log.mutateAsync({
                    organization_id: schedule.organization_id,
                    vehicle_id: schedule.vehicle_id,
                    schedule_id: schedule.id,
                    kind: schedule.kind,
                    ...input,
                  });
                  toast.success("Service logged");
                  setLogOpen(false);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              busy={log.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function LogServiceForm({
  schedule,
  currentMiles,
  onSubmit,
  busy,
}: {
  schedule: MaintenanceSchedule;
  currentMiles: number | null;
  onSubmit: (input: {
    performed_at: string;
    odometer_miles: number | null;
    cost_cents: number | null;
    vendor: string | null;
    notes: string | null;
  }) => void;
  busy: boolean;
}) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [miles, setMiles] = useState<string>(
    currentMiles ? String(currentMiles) : "",
  );
  const [cost, setCost] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          performed_at: new Date(date).toISOString(),
          odometer_miles: miles ? Number(miles) : null,
          cost_cents: cost ? Math.round(Number(cost) * 100) : null,
          vendor: vendor || null,
          notes: notes || null,
        });
      }}
      className="space-y-3"
    >
      <p className="text-xs text-muted-foreground">
        {schedule.label || MAINT_KIND_LABEL[schedule.kind]}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="miles">Odometer (mi)</Label>
          <Input
            id="miles"
            type="number"
            min="0"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cost">Cost ($)</Label>
          <Input
            id="cost"
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Pilot, Loves..."
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save service
        </Button>
      </DialogFooter>
    </form>
  );
}

function ScheduleDialog({
  vehicles,
  children,
}: {
  vehicles: { id: string; truck_number: string; organization_id: string }[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const upsert = useUpsertSchedule();

  const [vehicleId, setVehicleId] = useState("");
  const [kind, setKind] = useState<MaintenanceKind>("oil_change");
  const [label, setLabel] = useState("");
  const [intervalMiles, setIntervalMiles] = useState("");
  const [intervalDays, setIntervalDays] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [lastMiles, setLastMiles] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setVehicleId("");
    setKind("oil_change");
    setLabel("");
    setIntervalMiles("");
    setIntervalDays("");
    setLastDate("");
    setLastMiles("");
    setNotes("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New maintenance schedule</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const v = vehicles.find((vv) => vv.id === vehicleId);
            if (!v) {
              toast.error("Pick a vehicle");
              return;
            }
            try {
              await upsert.mutateAsync({
                organization_id: v.organization_id,
                vehicle_id: v.id,
                kind,
                label: label || null,
                interval_miles: intervalMiles ? Number(intervalMiles) : null,
                interval_days: intervalDays ? Number(intervalDays) : null,
                last_service_at: lastDate
                  ? new Date(lastDate).toISOString()
                  : null,
                last_service_miles: lastMiles ? Number(lastMiles) : null,
                notes: notes || null,
              });
              toast.success("Schedule created");
              setOpen(false);
              reset();
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a truck" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      Truck {v.truck_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Service type</Label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as MaintenanceKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {MAINT_KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="label">Custom label (optional)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Synthetic oil change"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="im">Every (miles)</Label>
              <Input
                id="im"
                type="number"
                min="0"
                value={intervalMiles}
                onChange={(e) => setIntervalMiles(e.target.value)}
                placeholder="25000"
              />
            </div>
            <div>
              <Label htmlFor="id">Every (days)</Label>
              <Input
                id="id"
                type="number"
                min="0"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                placeholder="180"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ld">Last serviced on</Label>
              <Input
                id="ld"
                type="date"
                value={lastDate}
                onChange={(e) => setLastDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lm">Last serviced at (mi)</Label>
              <Input
                id="lm"
                type="number"
                min="0"
                value={lastMiles}
                onChange={(e) => setLastMiles(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
