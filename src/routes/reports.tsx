import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileSpreadsheet, DollarSign, Users, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTrips, useDrivers, useVehicles } from "@/hooks/useFleetData";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toCSV, downloadCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · TruckStrata" },
      { name: "description", content: "Export trip, revenue, and driver activity reports as CSV." },
      { property: "og:title", content: "Reports · TruckStrata" },
      { property: "og:description", content: "Export trip, revenue, and driver activity reports." },
    ],
  }),
  component: ReportsPage,
});

function isoDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function ReportsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const [from, setFrom] = useState<string>(isoDate(startOfMonth(subMonths(today, 1))));
  const [to, setTo] = useState<string>(isoDate(endOfMonth(today)));

  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const driversById = useMemo(
    () => Object.fromEntries((drivers ?? []).map((d) => [d.id, d])),
    [drivers],
  );
  const vehiclesById = useMemo(
    () => Object.fromEntries((vehicles ?? []).map((v) => [v.id, v])),
    [vehicles],
  );

  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    const fromTs = new Date(from + "T00:00:00").getTime();
    const toTs = new Date(to + "T23:59:59").getTime();
    return trips.filter((t) => {
      const ref = t.scheduled_pickup_at ?? t.created_at ?? null;
      if (!ref) return true;
      const ts = new Date(ref as string).getTime();
      return ts >= fromTs && ts <= toTs;
    });
  }, [trips, from, to]);

  // Aggregates
  const stats = useMemo(() => {
    const total = filteredTrips.length;
    const delivered = filteredTrips.filter((t) => t.status === "delivered").length;
    const revenue = filteredTrips.reduce((s, t) => s + (t.revenue_cents ?? 0), 0);
    const miles = filteredTrips.reduce((s, t) => s + (t.distance_miles ?? 0), 0);
    return { total, delivered, revenue, miles };
  }, [filteredTrips]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  function exportTrips() {
    if (filteredTrips.length === 0) {
      toast.error("No trips in the selected range");
      return;
    }
    const rows = filteredTrips.map((t) => {
      const driver = t.driver_id ? driversById[t.driver_id] : null;
      const vehicle = t.vehicle_id ? vehiclesById[t.vehicle_id] : null;
      return {
        reference: t.reference ?? "",
        status: t.status,
        origin: t.origin_label,
        destination: t.destination_label,
        scheduled_pickup: t.scheduled_pickup_at ?? "",
        scheduled_delivery: t.scheduled_delivery_at ?? "",
        actual_pickup: t.actual_pickup_at ?? "",
        actual_delivery: t.actual_delivery_at ?? "",
        distance_miles: t.distance_miles ?? "",
        revenue_usd: t.revenue_cents != null ? (t.revenue_cents / 100).toFixed(2) : "",
        driver: driver?.full_name ?? "",
        truck: vehicle?.truck_number ?? "",
        driver_response: t.driver_response ?? "",
      };
    });
    downloadCSV(`trips_${from}_to_${to}.csv`, toCSV(rows));
    toast.success(`Exported ${rows.length} trips`);
  }

  function exportRevenue() {
    if (filteredTrips.length === 0) {
      toast.error("No trips in the selected range");
      return;
    }
    // Group by month
    const byMonth = new Map<string, { trips: number; delivered: number; revenue_cents: number; miles: number }>();
    for (const t of filteredTrips) {
      const ref = t.scheduled_pickup_at ?? t.created_at;
      if (!ref) continue;
      const month = format(new Date(ref as string), "yyyy-MM");
      const cur = byMonth.get(month) ?? { trips: 0, delivered: 0, revenue_cents: 0, miles: 0 };
      cur.trips += 1;
      if (t.status === "delivered") cur.delivered += 1;
      cur.revenue_cents += t.revenue_cents ?? 0;
      cur.miles += t.distance_miles ?? 0;
      byMonth.set(month, cur);
    }
    const rows = Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        month,
        trips: v.trips,
        delivered: v.delivered,
        revenue_usd: (v.revenue_cents / 100).toFixed(2),
        miles: v.miles.toFixed(0),
        revenue_per_mile: v.miles > 0 ? (v.revenue_cents / 100 / v.miles).toFixed(2) : "",
      }));
    downloadCSV(`revenue_${from}_to_${to}.csv`, toCSV(rows));
    toast.success(`Exported ${rows.length} months`);
  }

  function exportDrivers() {
    if (!drivers || drivers.length === 0) {
      toast.error("No drivers found");
      return;
    }
    const tripsByDriver = new Map<string, { total: number; delivered: number; miles: number; revenue_cents: number }>();
    for (const t of filteredTrips) {
      if (!t.driver_id) continue;
      const cur = tripsByDriver.get(t.driver_id) ?? { total: 0, delivered: 0, miles: 0, revenue_cents: 0 };
      cur.total += 1;
      if (t.status === "delivered") cur.delivered += 1;
      cur.miles += t.distance_miles ?? 0;
      cur.revenue_cents += t.revenue_cents ?? 0;
      tripsByDriver.set(t.driver_id, cur);
    }
    const rows = drivers.map((d) => {
      const stats = tripsByDriver.get(d.id) ?? { total: 0, delivered: 0, miles: 0, revenue_cents: 0 };
      return {
        driver: d.full_name,
        email: d.email ?? "",
        phone: d.phone ?? "",
        status: d.status,
        license_number: d.license_number ?? "",
        license_state: d.license_state ?? "",
        license_expiry: d.license_expiry ?? "",
        trips: stats.total,
        delivered: stats.delivered,
        miles: stats.miles.toFixed(0),
        revenue_usd: (stats.revenue_cents / 100).toFixed(2),
      };
    });
    downloadCSV(`drivers_${from}_to_${to}.csv`, toCSV(rows));
    toast.success(`Exported ${rows.length} drivers`);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Reports</h1>
            <p className="text-xs text-muted-foreground">CSV exports for accounting and operations</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        <div className="space-y-5 p-6">
          {/* Date range */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Date range</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              All exports use the range below (based on scheduled pickup date).
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  From
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  To
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <QuickRange
                  label="This month"
                  onClick={() => {
                    setFrom(isoDate(startOfMonth(today)));
                    setTo(isoDate(endOfMonth(today)));
                  }}
                />
                <QuickRange
                  label="Last month"
                  onClick={() => {
                    const lm = subMonths(today, 1);
                    setFrom(isoDate(startOfMonth(lm)));
                    setTo(isoDate(endOfMonth(lm)));
                  }}
                />
                <QuickRange
                  label="Last 3 months"
                  onClick={() => {
                    setFrom(isoDate(startOfMonth(subMonths(today, 2))));
                    setTo(isoDate(endOfMonth(today)));
                  }}
                />
                <QuickRange
                  label="YTD"
                  onClick={() => {
                    setFrom(`${today.getFullYear()}-01-01`);
                    setTo(isoDate(today));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Trips" value={stats.total.toString()} />
            <Kpi label="Delivered" value={stats.delivered.toString()} />
            <Kpi label="Revenue" value={`$${(stats.revenue / 100).toLocaleString()}`} />
            <Kpi label="Miles" value={stats.miles.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
          </div>

          {/* Export cards */}
          <div className="grid gap-3 md:grid-cols-3">
            <ExportCard
              icon={FileSpreadsheet}
              title="Trip log"
              description="Every trip with route, driver, truck, timestamps, and revenue."
              onExport={exportTrips}
              disabled={tripsLoading}
              count={filteredTrips.length}
              countLabel="trips"
            />
            <ExportCard
              icon={DollarSign}
              title="Revenue summary"
              description="Monthly totals: trip count, miles, revenue, and revenue per mile."
              onExport={exportRevenue}
              disabled={tripsLoading}
              count={filteredTrips.length}
              countLabel="trips"
            />
            <ExportCard
              icon={Users}
              title="Driver activity"
              description="Per-driver trip count, miles, and revenue contribution."
              onExport={exportDrivers}
              disabled={tripsLoading}
              count={drivers?.length ?? 0}
              countLabel="drivers"
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 text-xs text-muted-foreground shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Tips</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>CSV files open in Excel, Google Sheets, and accounting tools (QuickBooks, Xero).</li>
                  <li>Revenue is exported in USD (dollars), not cents.</li>
                  <li>Date filtering uses the trip's scheduled pickup time.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function QuickRange({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
    >
      {label}
    </button>
  );
}

function ExportCard({
  icon: Icon,
  title,
  description,
  onExport,
  disabled,
  count,
  countLabel,
}: {
  icon: typeof FileSpreadsheet;
  title: string;
  description: string;
  onExport: () => void;
  disabled?: boolean;
  count: number;
  countLabel: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {count} {countLabel} in range
        </span>
        <Button size="sm" onClick={onExport} disabled={disabled} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
