import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Truck,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  useCurrentDriver,
  useMyTrips,
  useMyVehicle,
  useRealtimeMyTrips,
  type DBDriverTrip,
} from "@/hooks/useDriverPortal";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { toast } from "sonner";
import { PendingTripCard } from "@/components/driver/PendingTripCard";
import { ActiveTripCard } from "@/components/driver/ActiveTripCard";
import { DeliveredTripCard } from "@/components/driver/DeliveredTripCard";
import { NoDriverProfile } from "@/components/driver/NoDriverProfile";
import { DriverStatusDot } from "@/components/driver/TripBits";

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "My Trips · Driver Portal" },
      {
        name: "description",
        content:
          "Driver portal for accepting trips and updating delivery status on the road.",
      },
      { property: "og:title", content: "Driver Portal · TruckStrata" },
      {
        property: "og:description",
        content:
          "Accept assignments, navigate, and update trip status from your phone.",
      },
    ],
  }),
  component: DriverPortalPage,
});

type Tab = "active" | "offers" | "done";

function DriverPortalPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const online = useOnlineStatus();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: driver, isLoading: driverLoading } = useCurrentDriver();
  const { data: trips, isLoading: tripsLoading } = useMyTrips();
  const { data: vehicle } = useMyVehicle(driver?.current_vehicle_id);
  useRealtimeMyTrips();

  const { pending, active, completed } = useMemo(() => {
    const t = trips ?? [];
    return {
      pending: t.filter(
        (x) =>
          x.driver_response === "pending" &&
          x.status !== "delivered" &&
          x.status !== "cancelled",
      ),
      active: t.filter(
        (x) =>
          x.driver_response === "accepted" &&
          x.status !== "delivered" &&
          x.status !== "cancelled",
      ),
      completed: t.filter((x) => x.status === "delivered"),
    };
  }, [trips]);

  // Default to whichever bucket has work; bias to "offers" when there's a new
  // pending offer so the driver sees it instantly.
  const [tab, setTab] = useState<Tab>("active");
  useEffect(() => {
    if (pending.length > 0) setTab("offers");
    else if (active.length > 0) setTab("active");
    else if (completed.length > 0) setTab("done");
  }, [pending.length, active.length, completed.length]);

  if (loading || driverLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!driver) {
    return <NoDriverProfile email={user?.email ?? ""} onSignOut={signOut} />;
  }

  const initials = driver.full_name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-card/40 pb-20">
      {/* Sticky status bar — at-a-glance: who you are, your status, your truck */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-foreground">
                {driver.full_name}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <DriverStatusDot status={driver.status} />
                <span className="capitalize">{driver.status.replace("_", " ")}</span>
                {vehicle && <span>· {vehicle.truck_number}</span>}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={async () => {
              await signOut();
              toast.success("Signed out");
              navigate({ to: "/" });
            }}
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Tab bar — large hit targets, badge counts so drivers know where new work is */}
        <nav className="mx-auto flex max-w-xl gap-1 px-3 pb-2" role="tablist">
          <TabButton
            active={tab === "active"}
            onClick={() => setTab("active")}
            icon={<Truck className="h-4 w-4" />}
            label="In progress"
            count={active.length}
          />
          <TabButton
            active={tab === "offers"}
            onClick={() => setTab("offers")}
            icon={<Clock className="h-4 w-4" />}
            label="Offers"
            count={pending.length}
            highlight={pending.length > 0}
          />
          <TabButton
            active={tab === "done"}
            onClick={() => setTab("done")}
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Delivered"
            count={completed.length}
          />
        </nav>
      </header>

      {!online && (
        <div className="mx-auto max-w-xl px-4 pt-3">
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-700 dark:text-amber-300">
            <WifiOff className="h-3.5 w-3.5" />
            You're offline. Updates will sync when you reconnect.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-xl px-4 pt-4">
        {tripsLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TabPanel
            tab={tab}
            pending={pending}
            active={active}
            completed={completed}
          />
        )}

        <p className="mt-10 text-center text-[11px] text-muted-foreground">
          <Link to="/dispatch" className="underline-offset-2 hover:underline">
            Switch to dispatcher view
          </Link>
        </p>
      </main>
    </div>
  );
}

/* ----------------------------- subcomponents ----------------------------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-[13px] font-semibold transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted/60",
      ].join(" ")}
    >
      <span className={active ? "" : "text-muted-foreground"}>{icon}</span>
      <span>{label}</span>
      {count > 0 && (
        <span
          className={[
            "ml-0.5 grid h-5 min-w-[20px] place-items-center rounded-full px-1.5 text-[10px] font-bold",
            active
              ? "bg-background/20 text-background"
              : highlight
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function TabPanel({
  tab,
  pending,
  active,
  completed,
}: {
  tab: Tab;
  pending: DBDriverTrip[];
  active: DBDriverTrip[];
  completed: DBDriverTrip[];
}) {
  if (tab === "offers") {
    if (pending.length === 0) return <EmptyState message="No new offers right now." />;
    return (
      <div className="space-y-3">
        {pending.map((trip) => (
          <PendingTripCard key={trip.id} trip={trip} />
        ))}
      </div>
    );
  }

  if (tab === "active") {
    if (active.length === 0)
      return (
        <EmptyState message="No active trips. Accept an offer to get rolling." />
      );
    return (
      <div className="space-y-3">
        {active.map((trip) => (
          <ActiveTripCard key={trip.id} trip={trip} />
        ))}
      </div>
    );
  }

  if (completed.length === 0) return <EmptyState message="No completed trips yet." />;
  return (
    <div className="space-y-3">
      {completed.slice(0, 10).map((trip) => (
        <DeliveredTripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-3xl border border-dashed border-border/60 bg-card/40 px-4 py-12 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
