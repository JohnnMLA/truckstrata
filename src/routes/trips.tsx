import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Loader2, Plus, MapPin, ArrowRight, Inbox } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NewTripDialog } from "@/components/dashboard/NewTripDialog";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { AssignTripDialog } from "@/components/dashboard/AssignTripDialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  useTrips,
  useDrivers,
  useVehicles,
  type DBTrip,
} from "@/hooks/useFleetData";
import { useRealtimeNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "Trips · TruckStrata" },
      {
        name: "description",
        content:
          "Manage active and upcoming loads across your fleet — assignments, schedules, and revenue at a glance.",
      },
      { property: "og:title", content: "Trips · TruckStrata" },
      {
        property: "og:description",
        content: "Manage active and upcoming loads across your fleet.",
      },
    ],
  }),
  component: TripsPage,
});

const statusTone: Record<DBTrip["status"], string> = {
  planned: "bg-muted text-muted-foreground",
  assigned: "bg-primary/10 text-primary",
  in_transit: "bg-success/15 text-success",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
  delayed: "bg-warning/15 text-warning",
};

function TripsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: trips, isLoading } = useTrips();
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();
  useRealtimeNotifications();

  const driversById = useMemo(
    () => Object.fromEntries((drivers ?? []).map((d) => [d.id, d])),
    [drivers],
  );
  const vehiclesById = useMemo(
    () => Object.fromEntries((vehicles ?? []).map((v) => [v.id, v])),
    [vehicles],
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const list = trips ?? [];
  const totalRevenue = list.reduce((sum, t) => sum + (t.revenue_cents ?? 0), 0);
  const inTransit = list.filter((t) => t.status === "in_transit").length;
  const planned = list.filter((t) => t.status === "planned").length;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Trips</h1>
            <p className="text-xs text-muted-foreground">
              {list.length} load{list.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <NewTripDialog />
          </div>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 px-6 pt-5 md:grid-cols-3">
          <Kpi label="In transit" value={`${inTransit}`} />
          <Kpi label="Planned" value={`${planned}`} />
          <Kpi
            label="Booked revenue"
            value={`$${(totalRevenue / 100).toLocaleString()}`}
          />
        </div>

        <div className="flex-1 p-5">
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex h-full min-h-[360px] items-center justify-center">
              <div className="max-w-md rounded-3xl border border-dashed border-border/60 bg-card p-10 text-center shadow-[var(--shadow-soft)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Inbox className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                  No trips yet
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first load to start dispatching trucks.
                </p>
                <div className="mt-6 flex justify-center">
                  <NewTripDialog />
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-background/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium">Driver / Truck</th>
                    <th className="px-4 py-3 font-medium">Pickup</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => {
                    const driver = t.driver_id ? driversById[t.driver_id] : null;
                    const vehicle = t.vehicle_id ? vehiclesById[t.vehicle_id] : null;
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-border/40 last:border-0 transition hover:bg-background/40"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {t.reference ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate text-foreground">{t.origin_label}</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span className="truncate text-foreground">{t.destination_label}</span>
                          </div>
                          {typeof t.distance_miles === "number" && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {t.distance_miles.toLocaleString()} mi
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="text-foreground">{driver?.full_name ?? "—"}</span>
                            {vehicle && (
                              <span className="text-[11px] text-muted-foreground">
                                {vehicle.truck_number}
                              </span>
                            )}
                            {driver && t.driver_response && t.driver_response !== "pending" && (
                              <span
                                className={`mt-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                  t.driver_response === "accepted" ? "text-success" : "text-destructive"
                                }`}
                              >
                                Driver {t.driver_response}
                              </span>
                            )}
                            {driver && t.driver_response === "pending" && (
                              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                                Awaiting driver
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.scheduled_pickup_at
                            ? format(new Date(t.scheduled_pickup_at), "MMM d, h:mm a")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`rounded-full border-0 px-2 py-0.5 text-[11px] font-medium capitalize ${statusTone[t.status]}`}
                          >
                            {t.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          {typeof t.revenue_cents === "number"
                            ? `$${(t.revenue_cents / 100).toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AssignTripDialog trip={t} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
