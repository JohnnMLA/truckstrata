import { useState } from "react";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRespondToTrip, type DBDriverTrip } from "@/hooks/useDriverPortal";
import { RouteBlock, TripMeta } from "./TripBits";

interface Props {
  trip: DBDriverTrip;
}

/**
 * A new (pending) trip offer. Two thumb-friendly actions, decline on the left
 * (secondary) and accept on the right (primary). Disabled while a request
 * is in flight to prevent double-taps.
 */
export function PendingTripCard({ trip }: Props) {
  const respond = useRespondToTrip();
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  return (
    <article className="rounded-3xl border border-primary/40 bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className="rounded-full border-primary/40 bg-primary/10 text-[11px] font-semibold text-primary"
        >
          <ArrowRight className="mr-1 h-3 w-3" /> New offer
        </Badge>
        {trip.reference && (
          <span className="text-[11px] font-semibold text-muted-foreground">{trip.reference}</span>
        )}
      </div>

      <RouteBlock trip={trip} />
      <TripMeta trip={trip} />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          size="lg"
          className="h-12 rounded-full text-sm font-semibold"
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
          {busy === "decline" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-1.5 h-4 w-4" />
          )}
          Decline
        </Button>
        <Button
          size="lg"
          className="h-12 rounded-full text-sm font-semibold"
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
          {busy === "accept" ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-4 w-4" />
          )}
          Accept
        </Button>
      </div>
    </article>
  );
}
