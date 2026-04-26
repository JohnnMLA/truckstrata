import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DBDriverTrip } from "@/hooks/useDriverPortal";
import { RouteBlock, formatPretty } from "./TripBits";

export function DeliveredTripCard({ trip }: { trip: DBDriverTrip }) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className="rounded-full text-[11px] font-semibold text-muted-foreground"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" /> Delivered
        </Badge>
        {trip.reference && (
          <span className="text-[11px] font-semibold text-muted-foreground">{trip.reference}</span>
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
