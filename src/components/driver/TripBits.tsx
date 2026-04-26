import { ArrowRight, Clock, MapPin, Package } from "lucide-react";
import type { DBDriverTrip } from "@/hooks/useDriverPortal";

export function RouteBlock({ trip, muted }: { trip: DBDriverTrip; muted?: boolean }) {
  const tone = muted ? "text-muted-foreground" : "text-foreground";
  return (
    <div className="mt-3 flex items-start gap-3">
      <div className="mt-1 flex flex-col items-center">
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        <span className="my-1 h-7 w-px bg-border" />
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Pickup
          </p>
          <p className={`truncate text-[15px] font-semibold ${tone}`}>{trip.origin_label}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Drop-off
          </p>
          <p className={`truncate text-[15px] font-semibold ${tone}`}>{trip.destination_label}</p>
        </div>
      </div>
    </div>
  );
}

export function TripMeta({ trip }: { trip: DBDriverTrip }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
      {trip.scheduled_pickup_at && (
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Pickup {formatPretty(trip.scheduled_pickup_at)}
        </span>
      )}
      {trip.scheduled_delivery_at && (
        <span className="flex items-center gap-1.5">
          <ArrowRight className="h-3.5 w-3.5" /> Drop {formatPretty(trip.scheduled_delivery_at)}
        </span>
      )}
      {trip.distance_miles && (
        <span className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" /> {Math.round(trip.distance_miles)} mi
        </span>
      )}
    </div>
  );
}

export function formatPretty(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DriverStatusDot({ status }: { status: string }) {
  const color =
    status === "driving" || status === "on_duty"
      ? "bg-emerald-500"
      : status === "sleeper"
        ? "bg-sky-500"
        : status === "unavailable"
          ? "bg-rose-500"
          : "bg-muted-foreground/50";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

/** Build a Google Maps directions URL from the trip's coordinates / labels. */
export function buildDirectionsUrl(trip: DBDriverTrip, mode: "pickup" | "dropoff") {
  const dest =
    mode === "pickup"
      ? trip.origin_lat && trip.origin_lng
        ? `${trip.origin_lat},${trip.origin_lng}`
        : trip.origin_label
      : trip.destination_lat && trip.destination_lng
        ? `${trip.destination_lat},${trip.destination_lng}`
        : trip.destination_label;
  const q = encodeURIComponent(dest);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
}
