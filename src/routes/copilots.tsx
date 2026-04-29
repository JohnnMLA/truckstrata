import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { CopilotPanel } from "@/components/dashboard/CopilotPanel";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/copilots")({
  head: () => ({
    meta: [
      { title: "Copilots · TruckDispatchAI" },
      {
        name: "description",
        content:
          "Chat with TruckDispatchAI's AI Dispatch Copilot — grounded in your live fleet, drivers, trips, alerts, and maintenance schedules.",
      },
      { property: "og:title", content: "AI Copilots · TruckDispatchAI" },
      {
        property: "og:description",
        content:
          "Ask the copilot anything about your fleet — get answers grounded in live data.",
      },
    ],
  }),
  component: CopilotsPage,
});

function CopilotsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

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
              Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              AI Copilots
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Your dispatcher's AI partner. It sees your live fleet, drivers,
              trips, alerts, and maintenance — ask it anything and it can deep
              link straight into the right place to act.
            </p>
          </div>
          <NotificationBell />
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <CopilotPanel />
          </div>
          <aside className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  What it knows
                </h2>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>· Vehicles, fuel %, odometer, last ping</li>
                <li>· Drivers, HOS, license expiry</li>
                <li>· Trips: 25 most recent + revenue</li>
                <li>· Open alerts (HOS, fuel, route, docs)</li>
                <li>· Maintenance: schedules + 15 most recent services</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
              <h2 className="text-sm font-semibold text-foreground">
                Try asking
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>"Which truck has the worst utilization this week?"</li>
                <li>"Pair my best driver with the highest-revenue load."</li>
                <li>"Any DOT inspections due in 30 days?"</li>
                <li>"What's blocking my unassigned trips?"</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-5">
              <p className="text-xs text-muted-foreground">
                The copilot can suggest where to act in the app. Click any
                pill-shaped link in its replies to jump straight there.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
