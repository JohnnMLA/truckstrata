import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Truck } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { AssignTripDialog } from "@/components/dashboard/AssignTripDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  useDrivers,
  useTrips,
  useVehicles,
  useRealtimeVehicles,
  type DBTrip,
} from "@/hooks/useFleetData";
import { useRealtimeNotifications } from "@/hooks/useNotifications";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule · TruckDispatchAI" },
      {
        name: "description",
        content:
          "Weekly view of every truck's assigned loads. Assign drivers, set pickup times, and notify in one click.",
      },
      { property: "og:title", content: "Schedule · TruckDispatchAI" },
      {
        property: "og:description",
        content: "Weekly schedule for every truck in your fleet.",
      },
    ],
  }),
  component: SchedulePage,
});

function SchedulePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: vehicles, isLoading: vLoading } = useVehicles();
  const { data: trips } = useTrips();
  const { data: drivers } = useDrivers();
  useRealtimeVehicles();
  useRealtimeNotifications();

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const driversById = useMemo(
    () => Object.fromEntries((drivers ?? []).map((d) => [d.id, d])),
    [drivers],
  );

  // Group trips by vehicle + day key
  const tripsByCell = useMemo(() => {
    const map = new Map<string, DBTrip[]>();
    for (const t of trips ?? []) {
      if (!t.vehicle_id || !t.scheduled_pickup_at) continue;
      const dayKey = format(new Date(t.scheduled_pickup_at), "yyyy-MM-dd");
      const key = `${t.vehicle_id}__${dayKey}`;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [trips]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const list = vehicles ?? [];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Schedule
            </h1>
            <p className="text-xs text-muted-foreground">
              Week of {format(weekStart, "MMM d, yyyy")}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Today
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5">
          {vLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex h-full min-h-[360px] items-center justify-center">
              <div className="max-w-md rounded-3xl border border-dashed border-border/60 bg-card p-10 text-center shadow-[var(--shadow-soft)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Truck className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight">
                  No trucks yet
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a truck to start building schedules.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
              <div className="grid min-w-[900px] grid-cols-[180px_repeat(7,minmax(0,1fr))] border-b border-border/60 bg-background/40 text-xs uppercase tracking-wide text-muted-foreground">
                <div className="px-3 py-2 font-medium">Truck</div>
                {days.map((d) => (
                  <div
                    key={d.toISOString()}
                    className="px-3 py-2 font-medium"
                  >
                    {format(d, "EEE d")}
                  </div>
                ))}
              </div>
              <div className="min-w-[900px]">
                {list.map((v) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] border-b border-border/40 last:border-0"
                  >
                    <div className="px-3 py-3">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {v.truck_number}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {v.make ?? ""} {v.model ?? ""}
                      </p>
                    </div>
                    {days.map((d) => {
                      const key = `${v.id}__${format(d, "yyyy-MM-dd")}`;
                      const cellTrips = tripsByCell.get(key) ?? [];
                      return (
                        <div
                          key={d.toISOString()}
                          className="space-y-1 border-l border-border/40 px-2 py-2"
                        >
                          {cellTrips.map((t) => {
                            const driver = t.driver_id ? driversById[t.driver_id] : null;
                            return (
                              <AssignTripDialog
                                key={t.id}
                                trip={t}
                                trigger={
                                  <button className="w-full rounded-lg bg-primary/10 px-2 py-1.5 text-left text-[11px] text-primary transition hover:bg-primary/15">
                                    <p className="truncate font-medium">
                                      {t.reference ?? t.destination_label}
                                    </p>
                                    <p className="truncate text-[10px] opacity-80">
                                      {t.scheduled_pickup_at
                                        ? format(
                                            new Date(t.scheduled_pickup_at),
                                            "h:mm a",
                                          )
                                        : ""}{" "}
                                      {driver ? `· ${driver.full_name}` : ""}
                                    </p>
                                  </button>
                                }
                              />
                            );
                          })}
                          {cellTrips.length === 0 && (
                            <div className="h-1" aria-hidden />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
