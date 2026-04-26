import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Truck, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/track/$token")({
  head: ({ params }) => ({
    meta: [
      { title: `Track shipment · TruckStrata` },
      { name: "description", content: "Live tracking for your shipment." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Track your shipment" },
      { property: "og:description", content: "Live tracking link from your carrier." },
    ],
  }),
  component: PublicTrackPage,
});

interface PublicTrip {
  id: string;
  reference: string | null;
  origin_label: string;
  destination_label: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  status: "planned" | "assigned" | "in_transit" | "delivered" | "cancelled" | "delayed";
  scheduled_pickup_at: string | null;
  scheduled_delivery_at: string | null;
  actual_pickup_at: string | null;
  actual_delivery_at: string | null;
  distance_miles: number | null;
  vehicle_id: string | null;
}

interface PublicVehicle {
  truck_number: string;
  make: string | null;
  model: string | null;
  current_lat: number | null;
  current_lng: number | null;
  current_location_label: string | null;
  last_ping_at: string | null;
}

const statusLabel: Record<PublicTrip["status"], string> = {
  planned: "Scheduled",
  assigned: "Driver assigned",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  delayed: "Delayed",
};

const statusTone: Record<PublicTrip["status"], string> = {
  planned: "bg-muted text-muted-foreground",
  assigned: "bg-primary/10 text-primary",
  in_transit: "bg-success/15 text-success",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
  delayed: "bg-warning/15 text-warning",
};

function PublicTrackPage() {
  const { token } = Route.useParams();
  const [trip, setTrip] = useState<PublicTrip | null>(null);
  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_trip_by_share_token", {
        _token: token,
      });
      if (cancelled) return;
      const tripRow = Array.isArray(data) ? data[0] : null;
      if (error || !tripRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTrip(tripRow as PublicTrip);
      if (tripRow.vehicle_id) {
        const { data: v } = await supabase.rpc("get_vehicle_by_share_token", {
          _token: token,
        });
        const vRow = Array.isArray(v) ? v[0] : null;
        if (!cancelled && vRow) setVehicle(vRow as PublicVehicle);
      } else {
        setVehicle(null);
      }
      setLoading(false);
    }
    load();
    // refresh every 30s
    const i = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <AlertTriangle className="h-10 w-10 text-warning" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          Tracking link not found
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This shipment link is invalid or has been removed. Please contact your carrier for an updated link.
        </p>
        <Link to="/" className="mt-6 text-sm font-medium text-primary hover:underline">
          Return home
        </Link>
      </div>
    );
  }

  const steps: { key: PublicTrip["status"]; label: string }[] = [
    { key: "planned", label: "Scheduled" },
    { key: "assigned", label: "Assigned" },
    { key: "in_transit", label: "In transit" },
    { key: "delivered", label: "Delivered" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === trip.status);
  const isCancelled = trip.status === "cancelled";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <span className="text-xs text-muted-foreground">Live shipment tracker</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Status hero */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Shipment {trip.reference ?? trip.id.slice(0, 8)}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {statusLabel[trip.status]}
              </h1>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone[trip.status]}`}
            >
              {statusLabel[trip.status]}
            </span>
          </div>

          {/* Progress */}
          {!isCancelled && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {steps.map((s, idx) => {
                  const done = idx <= currentIdx;
                  const active = idx === currentIdx;
                  return (
                    <div key={s.key} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground"
                        } ${active ? "ring-4 ring-primary/20" : ""}`}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px]">{idx + 1}</span>}
                      </div>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wide ${
                          done ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="relative -mt-[26px] mx-[14px] h-0.5 bg-border" style={{ zIndex: -1 }}>
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${currentIdx <= 0 ? 0 : (currentIdx / (steps.length - 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Route */}
        <div className="mt-4 rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Route</h2>
          <div className="mt-4 space-y-4">
            <RouteRow
              label="Pickup"
              place={trip.origin_label}
              scheduled={trip.scheduled_pickup_at}
              actual={trip.actual_pickup_at}
            />
            <div className="ml-3 h-6 w-px bg-border" />
            <RouteRow
              label="Delivery"
              place={trip.destination_label}
              scheduled={trip.scheduled_delivery_at}
              actual={trip.actual_delivery_at}
            />
          </div>
          {typeof trip.distance_miles === "number" && (
            <p className="mt-4 text-xs text-muted-foreground">
              Total distance: {trip.distance_miles.toLocaleString()} mi
            </p>
          )}
        </div>

        {/* Vehicle */}
        {vehicle && (
          <div className="mt-4 rounded-3xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Carrier vehicle
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Truck {vehicle.truck_number}
                </p>
                {(vehicle.make || vehicle.model) && (
                  <p className="text-xs text-muted-foreground">
                    {[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
                  </p>
                )}
              </div>
            </div>
            {vehicle.current_location_label && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border/60 bg-background/40 p-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">Last known location</p>
                  <p className="text-xs text-muted-foreground">{vehicle.current_location_label}</p>
                  {vehicle.last_ping_at && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      Updated {format(new Date(vehicle.last_ping_at), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Powered by TruckStrata — auto-refreshes every 30 seconds
        </p>
      </main>
    </div>
  );
}

function RouteRow({
  label,
  place,
  scheduled,
  actual,
}: {
  label: string;
  place: string;
  scheduled: string | null;
  actual: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          actual ? "border-success bg-success text-white" : "border-border bg-background"
        }`}
      >
        {actual ? <CheckCircle2 className="h-3 w-3" /> : <MapPin className="h-3 w-3 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{place}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {scheduled && (
            <span>
              Scheduled {format(new Date(scheduled), "MMM d, h:mm a")}
            </span>
          )}
          {actual && (
            <span className="text-success">
              <CheckCircle2 className="mr-0.5 inline h-3 w-3" />
              {format(new Date(actual), "MMM d, h:mm a")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
