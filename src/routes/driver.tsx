import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Package,
  Truck,
  X,
  Loader2,
  PlayCircle,
  CircleDashed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  useCurrentDriver,
  useMyTrips,
  useMyVehicle,
  useRealtimeMyTrips,
  useRespondToTrip,
  useUpdateTripProgress,
  type DBDriverTrip,
} from "@/hooks/useDriverPortal";
import { toast } from "sonner";
import { TripDocumentsDialog } from "@/components/dashboard/TripDocumentsDialog";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "My Trips · Driver Portal" },
      {
        name: "description",
        content: "Driver portal for accepting trips and updating delivery status on the road.",
      },
      { property: "og:title", content: "Driver Portal · TruckStrata" },
      {
        property: "og:description",
        content: "Accept assignments, navigate, and update trip status from your phone.",
      },
    ],
  }),
  component: DriverPortalPage,
});

function DriverPortalPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

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
        (x) => x.driver_response === "pending" && x.status !== "delivered" && x.status !== "cancelled",
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
    <div className="min-h-dvh bg-gradient-to-b from-background to-card/40 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{driver.full_name}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <DriverStatusDot status={driver.status} />
                <span className="capitalize">{driver.status.replace("_", " ")}</span>
                {vehicle && <span>· {vehicle.truck_number}</span>}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              toast.success("Signed out");
              navigate({ to: "/" });
            }}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-4">
        {tripsLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <Section
              icon={<Clock className="h-4 w-4" />}
              title="New assignments"
              count={pending.length}
              empty="No pending offers right now."
            >
              {pending.map((trip) => (
                <PendingTripCard key={trip.id} trip={trip} />
              ))}
            </Section>

            <Section
              icon={<Truck className="h-4 w-4" />}
              title="In progress"
              count={active.length}
              empty="No active trips. Accept an assignment to get rolling."
            >
              {active.map((trip) => (
                <ActiveTripCard key={trip.id} trip={trip} />
              ))}
            </Section>

            {completed.length > 0 && (
              <Section
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="Recently delivered"
                count={completed.length}
              >
                {completed.slice(0, 5).map((trip) => (
                  <DeliveredTripCard key={trip.id} trip={trip} />
                ))}
              </Section>
            )}
          </div>
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

function Section({
  icon,
  title,
  count,
  children,
  empty,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children?: React.ReactNode;
  empty?: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">· {count}</span>
      </div>
      {count === 0 ? (
        empty && (
          <p className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-center text-xs text-muted-foreground">
            {empty}
          </p>
        )
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

function PendingTripCard({ trip }: { trip: DBDriverTrip }) {
  const respond = useRespondToTrip();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  return (
    <article className="rounded-2xl border border-primary/30 bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
          New offer
        </Badge>
        {trip.reference && (
          <span className="text-[11px] font-medium text-muted-foreground">{trip.reference}</span>
        )}
      </div>
      <RouteBlock trip={trip} />
      <TripMeta trip={trip} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="rounded-full"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("decline");
            try {
              await respond.mutateAsync({ trip, response: "declined" });
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === "decline" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
          Decline
        </Button>
        <Button
          className="rounded-full"
          disabled={busy !== null}
          onClick={async () => {
            setBusy("accept");
            try {
              await respond.mutateAsync({ trip, response: "accepted" });
            } finally {
              setBusy(null);
            }
          }}
        >
          {busy === "accept" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
          Accept
        </Button>
      </div>
    </article>
  );
}

function ActiveTripCard({ trip }: { trip: DBDriverTrip }) {
  const update = useUpdateTripProgress();
  const [busy, setBusy] = useState(false);

  const stage =
    trip.actual_delivery_at
      ? "delivered"
      : trip.actual_pickup_at
        ? "in_transit"
        : "ready";

  async function go(action: "start_pickup" | "mark_delivered") {
    setBusy(true);
    try {
      await update.mutateAsync({ trip, action });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="rounded-full capitalize">
          {trip.status.replace("_", " ")}
        </Badge>
        {trip.reference && (
          <span className="text-[11px] font-medium text-muted-foreground">{trip.reference}</span>
        )}
      </div>
      <RouteBlock trip={trip} />
      <TripMeta trip={trip} />

      <div className="mt-4 space-y-2">
        {stage === "ready" && (
          <Button className="w-full rounded-full" disabled={busy} onClick={() => go("start_pickup")}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Confirm pickup &amp; start trip
          </Button>
        )}
        {stage === "in_transit" && (
          <Button className="w-full rounded-full" disabled={busy} onClick={() => go("mark_delivered")}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Mark delivered
          </Button>
        )}
        <TripDocumentsDialog
          tripId={trip.id}
          organizationId={trip.organization_id}
          tripLabel={`${trip.origin_label} → ${trip.destination_label}`}
          allowedKinds={["pod", "photo", "bol", "other"]}
          trigger={
            <Button variant="outline" className="w-full rounded-full">
              <FileText className="mr-2 h-4 w-4" />
              Documents &amp; photos
            </Button>
          }
        />
      </div>
    </article>
  );
}

function DeliveredTripCard({ trip }: { trip: DBDriverTrip }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="rounded-full text-muted-foreground">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Delivered
        </Badge>
        {trip.reference && (
          <span className="text-[11px] font-medium text-muted-foreground">{trip.reference}</span>
        )}
      </div>
      <RouteBlock trip={trip} muted />
      {trip.actual_delivery_at && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Delivered {formatPretty(trip.actual_delivery_at)}
        </p>
      )}
    </article>
  );
}

function RouteBlock({ trip, muted }: { trip: DBDriverTrip; muted?: boolean }) {
  const tone = muted ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="mt-3 flex items-start gap-3">
      <div className="mt-1 flex flex-col items-center">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="my-1 h-6 w-px bg-border" />
        <MapPin className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pickup</p>
          <p className={`truncate text-sm font-medium ${tone}`}>{trip.origin_label}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Drop-off</p>
          <p className={`truncate text-sm font-medium ${tone}`}>{trip.destination_label}</p>
        </div>
      </div>
    </div>
  );
}

function TripMeta({ trip }: { trip: DBDriverTrip }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      {trip.scheduled_pickup_at && (
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Pickup {formatPretty(trip.scheduled_pickup_at)}
        </span>
      )}
      {trip.scheduled_delivery_at && (
        <span className="flex items-center gap-1">
          <ArrowRight className="h-3 w-3" /> Drop {formatPretty(trip.scheduled_delivery_at)}
        </span>
      )}
      {trip.distance_miles && (
        <span className="flex items-center gap-1">
          <Package className="h-3 w-3" /> {Math.round(trip.distance_miles)} mi
        </span>
      )}
    </div>
  );
}

function DriverStatusDot({ status }: { status: string }) {
  const color =
    status === "driving" || status === "on_duty"
      ? "bg-emerald-500"
      : status === "sleeper"
        ? "bg-sky-500"
        : status === "unavailable"
          ? "bg-rose-500"
          : "bg-muted-foreground/50";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

function NoDriverProfile({ email, onSignOut }: { email: string; onSignOut: () => Promise<void> }) {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto mb-3 flex justify-center">
          <Logo />
        </div>
        <CircleDashed className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="text-lg font-semibold text-foreground">No driver profile linked</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account ({email}) isn't connected to a driver record yet. Ask your dispatcher to link
          you, or open the dispatcher dashboard.
        </p>
        <div className="mt-5 grid gap-2">
          <Button onClick={() => navigate({ to: "/dispatch" })}>Go to dispatch</Button>
          <Button variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatPretty(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
