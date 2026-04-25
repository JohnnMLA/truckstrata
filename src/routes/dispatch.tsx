import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { FleetMap } from "@/components/dashboard/FleetMap";
import { VehicleCard, mockVehicles } from "@/components/dashboard/VehicleCard";
import { CopilotPanel } from "@/components/dashboard/CopilotPanel";
import { AlertCenter } from "@/components/dashboard/AlertCenter";
import { Button } from "@/components/ui/button";
import { Search, Bell, Plus } from "lucide-react";

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
  const [selected, setSelected] = useState<string>(mockVehicles[0].id);
  const driving = mockVehicles.filter((v) => v.status === "driving").length;
  const idle = mockVehicles.filter((v) => v.status === "idle").length;
  const offline = mockVehicles.filter((v) => v.status === "offline").length;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Dispatch</h1>
            <p className="text-xs text-muted-foreground">Tuesday, live overview</p>
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
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:text-foreground">
              <Bell className="h-4 w-4" strokeWidth={1.8} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <Button size="sm" className="rounded-full">
              <Plus className="mr-1 h-4 w-4" /> New trip
            </Button>
          </div>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 px-6 pt-5 md:grid-cols-4">
          <Kpi label="Active trucks" value={`${driving}`} sub={`of ${mockVehicles.length}`} tone="success" />
          <Kpi label="Idle" value={`${idle}`} sub="needs attention" tone="warning" />
          <Kpi label="Offline" value={`${offline}`} sub="last 1h" tone="muted" />
          <Kpi label="Fuel saved · today" value="$248" sub="↑ 12% vs avg" tone="primary" />
        </div>

        {/* Workspace */}
        <div className="grid flex-1 grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_360px] xl:grid-cols-[280px_1fr_360px]">
          {/* Vehicle list */}
          <section className="order-2 flex flex-col gap-3 xl:order-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fleet · {mockVehicles.length}
              </h2>
              <button className="text-xs font-medium text-primary hover:underline">Filter</button>
            </div>
            <div className="flex flex-col gap-3 xl:max-h-[calc(100vh-260px)] xl:overflow-y-auto xl:pr-1">
              {mockVehicles.map((v) => (
                <VehicleCard
                  key={v.id}
                  v={v}
                  active={v.id === selected}
                  onClick={() => setSelected(v.id)}
                />
              ))}
            </div>
          </section>

          {/* Map */}
          <section className="order-1 min-h-[420px] xl:order-2 xl:min-h-0">
            <FleetMap vehicles={mockVehicles} selectedId={selected} onSelect={setSelected} />
          </section>

          {/* Right column */}
          <section className="order-3 flex flex-col gap-4">
            <CopilotPanel />
            <AlertCenter />
          </section>
        </div>
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
