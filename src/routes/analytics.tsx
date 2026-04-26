import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  DollarSign,
  Truck,
  Clock,
  Gauge,
  TrendingUp,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { KpiCard } from "@/components/analytics/KpiCard";
import { useAuth } from "@/lib/auth";
import { useAnalyticsTrips, type AnalyticsTrip } from "@/hooks/useAnalytics";
import { useVehicles, useDrivers } from "@/hooks/useFleetData";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · TruckStrata" },
      {
        name: "description",
        content:
          "Revenue, miles, on-time performance, and fleet utilization KPIs across your operation.",
      },
      { property: "og:title", content: "Fleet Analytics · TruckStrata" },
      {
        property: "og:description",
        content: "Track revenue, on-time delivery, and per-truck utilization.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

function currency(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function deltaPct(current: number, previous: number) {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function AnalyticsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: trips, isLoading } = useAnalyticsTrips(days);
  const { data: vehicles } = useVehicles();
  const { data: drivers } = useDrivers();

  const { current, previous } = useMemo(() => {
    const all = trips ?? [];
    const cutoff = subDays(new Date(), days).getTime();
    const cur: AnalyticsTrip[] = [];
    const prev: AnalyticsTrip[] = [];
    for (const t of all) {
      const ts = new Date(t.created_at).getTime();
      if (ts >= cutoff) cur.push(t);
      else prev.push(t);
    }
    return { current: cur, previous: prev };
  }, [trips, days]);

  const kpis = useMemo(() => {
    const sum = (arr: AnalyticsTrip[], key: keyof AnalyticsTrip) =>
      arr.reduce((s, t) => s + (Number(t[key]) || 0), 0);

    const revenueNow = sum(current, "revenue_cents");
    const revenuePrev = sum(previous, "revenue_cents");
    const milesNow = sum(current, "distance_miles");
    const milesPrev = sum(previous, "distance_miles");

    const delivered = current.filter((t) => t.status === "delivered");
    const onTime = delivered.filter((t) => {
      if (!t.scheduled_delivery_at || !t.actual_delivery_at) return false;
      return (
        new Date(t.actual_delivery_at).getTime() <=
        new Date(t.scheduled_delivery_at).getTime() + 15 * 60_000
      );
    });
    const deliveredPrev = previous.filter((t) => t.status === "delivered");
    const onTimePrev = deliveredPrev.filter(
      (t) =>
        t.scheduled_delivery_at &&
        t.actual_delivery_at &&
        new Date(t.actual_delivery_at).getTime() <=
          new Date(t.scheduled_delivery_at).getTime() + 15 * 60_000,
    );

    const fleetSize = vehicles?.length ?? 0;
    const activeVehicles = new Set(
      current.filter((t) => t.vehicle_id).map((t) => t.vehicle_id!),
    ).size;

    return {
      revenue: {
        value: currency(revenueNow),
        delta: deltaPct(revenueNow, revenuePrev),
      },
      miles: {
        value: milesNow.toLocaleString("en-US", { maximumFractionDigits: 0 }),
        delta: deltaPct(milesNow, milesPrev),
      },
      onTime: {
        value: `${pct(onTime.length, delivered.length).toFixed(1)}%`,
        delta:
          pct(onTime.length, delivered.length) -
          pct(onTimePrev.length, deliveredPrev.length),
        sublabel: `${onTime.length} of ${delivered.length} delivered`,
      },
      utilization: {
        value: `${pct(activeVehicles, fleetSize).toFixed(0)}%`,
        sublabel: `${activeVehicles} of ${fleetSize} trucks ran loads`,
      },
      revenuePerTruck: {
        value: fleetSize ? currency(revenueNow / fleetSize) : "$0",
        sublabel: "average across fleet",
      },
    };
  }, [current, previous, vehicles]);

  // Daily revenue + miles series
  const series = useMemo(() => {
    const buckets = new Map<string, { date: string; revenue: number; miles: number; trips: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      const key = format(d, "yyyy-MM-dd");
      buckets.set(key, { date: format(d, days <= 14 ? "EEE" : "MMM d"), revenue: 0, miles: 0, trips: 0 });
    }
    for (const t of current) {
      const key = format(startOfDay(new Date(t.created_at)), "yyyy-MM-dd");
      const b = buckets.get(key);
      if (!b) continue;
      b.revenue += (Number(t.revenue_cents) || 0) / 100;
      b.miles += Number(t.distance_miles) || 0;
      b.trips += 1;
    }
    return Array.from(buckets.values());
  }, [current, days]);

  // Status mix pie
  const statusMix = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of current) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    const order: AnalyticsTrip["status"][] = [
      "delivered",
      "in_transit",
      "assigned",
      "planned",
      "delayed",
      "cancelled",
    ];
    return order
      .filter((s) => counts[s])
      .map((s) => ({ name: s.replace("_", " "), value: counts[s], status: s }));
  }, [current]);

  const STATUS_COLORS: Record<string, string> = {
    delivered: "var(--success)",
    in_transit: "var(--primary)",
    assigned: "color-mix(in oklab, var(--primary) 50%, transparent)",
    planned: "color-mix(in oklab, var(--muted-foreground) 50%, transparent)",
    delayed: "var(--warning)",
    cancelled: "color-mix(in oklab, var(--muted-foreground) 30%, transparent)",
  };

  // Per-truck performance
  const perTruck = useMemo(() => {
    if (!vehicles) return [];
    const byVehicle = new Map<
      string,
      { truck: string; revenue: number; miles: number; trips: number }
    >();
    for (const v of vehicles) {
      byVehicle.set(v.id, { truck: v.truck_number, revenue: 0, miles: 0, trips: 0 });
    }
    for (const t of current) {
      if (!t.vehicle_id) continue;
      const row = byVehicle.get(t.vehicle_id);
      if (!row) continue;
      row.revenue += (Number(t.revenue_cents) || 0) / 100;
      row.miles += Number(t.distance_miles) || 0;
      row.trips += 1;
    }
    return Array.from(byVehicle.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [current, vehicles]);

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
              Reports
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Fleet Analytics
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {drivers?.length ?? 0} drivers · {vehicles?.length ?? 0} trucks ·{" "}
              {current.length} trips this period
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
              {RANGES.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setDays(r.days)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    days === r.days
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <NotificationBell />
          </div>
        </header>

        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard
                label="Revenue"
                value={kpis.revenue.value}
                icon={DollarSign}
                delta={kpis.revenue.delta}
              />
              <KpiCard
                label="Miles driven"
                value={kpis.miles.value}
                icon={Gauge}
                delta={kpis.miles.delta}
              />
              <KpiCard
                label="On-time"
                value={kpis.onTime.value}
                sublabel={kpis.onTime.sublabel}
                icon={Clock}
                delta={kpis.onTime.delta}
              />
              <KpiCard
                label="Fleet utilization"
                value={kpis.utilization.value}
                sublabel={kpis.utilization.sublabel}
                icon={Truck}
              />
              <KpiCard
                label="Revenue / truck"
                value={kpis.revenuePerTruck.value}
                sublabel={kpis.revenuePerTruck.sublabel}
                icon={TrendingUp}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)] lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Daily revenue
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Loads booked over the last {days} days
                    </p>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series} margin={{ left: 4, right: 4, top: 8 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#revenueFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
                <h2 className="text-sm font-semibold text-foreground">Trip status mix</h2>
                <p className="text-xs text-muted-foreground">Across the period</p>
                <div className="h-72">
                  {statusMix.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No trips in this range
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusMix}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {statusMix.map((entry) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
                <h2 className="text-sm font-semibold text-foreground">Miles per day</h2>
                <p className="text-xs text-muted-foreground">Total fleet miles by day</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series} margin={{ left: 4, right: 4, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${v.toLocaleString()} mi`, "Miles"]}
                      />
                      <Bar dataKey="miles" fill="color-mix(in oklab, var(--primary) 70%, transparent)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
                <h2 className="text-sm font-semibold text-foreground">Top trucks by revenue</h2>
                <p className="text-xs text-muted-foreground">Highest earners this period</p>
                {perTruck.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
                    No trip data yet
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {perTruck.map((row) => {
                      const max = perTruck[0].revenue || 1;
                      const width = Math.max(4, (row.revenue / max) * 100);
                      return (
                        <div key={row.truck} className="flex items-center gap-3 text-xs">
                          <span className="w-20 shrink-0 font-medium text-foreground">
                            {row.truck}
                          </span>
                          <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-muted/40">
                            <div
                              className="h-full rounded-lg bg-gradient-to-r from-primary/80 to-primary"
                              style={{ width: `${width}%` }}
                            />
                            <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-medium text-foreground">
                              ${row.revenue.toLocaleString()}
                            </span>
                          </div>
                          <span className="w-20 shrink-0 text-right text-muted-foreground">
                            {row.trips} trips · {row.miles.toLocaleString()} mi
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
