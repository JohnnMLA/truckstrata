import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { VehicleCard } from "@/components/dashboard/VehicleCard";
import { CopilotPanel } from "@/components/dashboard/CopilotPanel";
import { AlertCenter } from "@/components/dashboard/AlertCenter";
import { NewTripDialog } from "@/components/dashboard/NewTripDialog";
import { Button } from "@/components/ui/button";
import { Search, Bell, Plus, Loader2, Sparkles, Truck, Radio } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  useVehicles,
  useDrivers,
  useSeedDemoFleet,
  useRealtimeVehicles,
  useRealtimeAlerts,
  useSimulateVehiclePings,
} from "@/hooks/useFleetData";
import { toast } from "sonner";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch · TruckStrata" },
      { name: "description", content: "Live fleet map, driver status, and AI copilots for your dispatch team." },
      { property: "og:title", content: "Dispatch · TruckStrata" },
      { property: "og:description", content: "Live fleet map, driver status, and AI copilots." },
    ],
  }),
  component: DispatchPage,
});

function DispatchPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | undefined>();

  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: drivers } = useDrivers();
  const seed = useSeedDemoFleet();
  const simulate = useSimulateVehiclePings();

  // Subscribe to live vehicle + alert updates
  useRealtimeVehicles();
  useRealtimeAlerts();

  const driversById = useMemo(
    () => Object.fromEntries((drivers ?? []).map((d) => [d.id, d])),
    [drivers],
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  // Auto-select first vehicle when data loads
  useEffect(() => {
    if (!selected && vehicles && vehicles.length > 0) {
      setSelected(vehicles[0].id);
    }
  }, [vehicles, selected]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const list = vehicles ?? [];
  const active = list.filter((v) => v.status === "active").length;
  const idle = list.filter((v) => v.status === "idle").length;
  const offline = list.filter((v) => v.status === "out_of_service").length;
  const isEmpty = !vehiclesLoading && list.length === 0;

  async function handleSeed() {
    try {
      await seed.mutateAsync();
      toast.success("Demo fleet loaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to seed demo fleet");
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Dispatch</h1>
            <p className="text-xs text-muted-foreground">Live overview</p>
          </div>
          <div className="ml-6 hidden flex-1 md:flex">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search trucks, drivers, loads…"
                className="w-full rounded-full border border-border/60 bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {list.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={simulate.isPending}
                onClick={async () => {
                  try {
                    const n = await simulate.mutateAsync();
                    toast.success(`Pinged ${n} truck${n === 1 ? "" : "s"}`);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed to ping");
                  }
                }}
              >
                {simulate.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="mr-1 h-4 w-4" />
                )}
                Simulate pings
              </Button>
            )}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:text-foreground">
              <Bell className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <NewTripDialog />
          </div>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 px-6 pt-5 md:grid-cols-4">
          <Kpi label="Active trucks" value={`${active}`} sub={`of ${list.length}`} tone="success" />
          <Kpi label="Idle" value={`${idle}`} sub="needs attention" tone="warning" />
          <Kpi label="Offline" value={`${offline}`} sub="out of service" tone="muted" />
          <Kpi label="Drivers on duty" value={`${(drivers ?? []).filter((d) => d.status === "driving" || d.status === "on_duty").length}`} sub={`of ${(drivers ?? []).length}`} tone="primary" />
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-md rounded-3xl border border-dashed border-border/60 bg-card p-10 text-center shadow-[var(--shadow-soft)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Truck className="h-6 w-6" strokeWidth={1.6} />
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                Your fleet is empty
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first truck, or load a demo fleet to explore the dashboard.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={handleSeed} disabled={seed.isPending} className="rounded-full">
                  {seed.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Load demo fleet
                </Button>
                <Button variant="outline" className="rounded-full">
                  <Plus className="mr-2 h-4 w-4" /> Add truck
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_360px] xl:grid-cols-[280px_1fr_360px]">
            {/* Vehicle list */}
            <section className="order-2 flex flex-col gap-3 xl:order-1">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fleet · {list.length}
                </h2>
                <button className="text-xs font-medium text-primary hover:underline">Filter</button>
              </div>
              <div className="flex flex-col gap-3 xl:max-h-[calc(100vh-260px)] xl:overflow-y-auto xl:pr-1">
                {vehiclesLoading
                  ? [0, 1, 2].map((i) => (
                      <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
                    ))
                  : list.map((v) => (
                      <VehicleCard
                        key={v.id}
                        vehicle={v}
                        driver={v.current_driver_id ? driversById[v.current_driver_id] : undefined}
                        active={v.id === selected}
                        onClick={() => setSelected(v.id)}
                      />
                    ))}
              </div>
            </section>

            {/* Map */}
            <section className="order-1 min-h-[420px] xl:order-2 xl:min-h-0">
              <FleetMap vehicles={list} selectedId={selected} onSelect={setSelected} />
            </section>

            {/* Right column */}
            <section className="order-3 flex flex-col gap-4">
              <CopilotPanel />
              <AlertCenter />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "success" | "warning" | "muted" | "primary";
}) {
  const toneClass = {
    success: "text-success",
    warning: "text-warning",
    muted: "text-muted-foreground",
    primary: "text-primary",
  }[tone];
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className={`mt-0.5 text-xs font-medium ${toneClass}`}>{sub}</p>
    </div>
  );
}
