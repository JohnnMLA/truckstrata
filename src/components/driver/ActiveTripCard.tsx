import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Navigation,
  PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TripDocumentsDialog } from "@/components/dashboard/TripDocumentsDialog";
import { useUpdateTripProgress, type DBDriverTrip } from "@/hooks/useDriverPortal";
import { QuickCaptureButton } from "./QuickCaptureButton";
import { ReportIssueDialog } from "./ReportIssueDialog";
import { RouteBlock, TripMeta, buildDirectionsUrl } from "./TripBits";

interface Props {
  trip: DBDriverTrip;
  driverId: string;
  vehicleId?: string | null;
}

/**
 * An accepted, in-progress trip. Surfaces the single most important next
 * action as a large primary button (Confirm pickup → Mark delivered),
 * plus quick photo capture and an in-app navigation handoff.
 */
export function ActiveTripCard({ trip }: Props) {
  const update = useUpdateTripProgress();
  const [busy, setBusy] = useState(false);

  const stage = trip.actual_delivery_at
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

  const navTarget = stage === "ready" ? "pickup" : "dropoff";

  return (
    <article className="rounded-3xl border border-border/60 bg-card p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="rounded-full text-[11px] font-semibold capitalize">
          {trip.status.replace("_", " ")}
        </Badge>
        {trip.reference && (
          <span className="text-[11px] font-semibold text-muted-foreground">{trip.reference}</span>
        )}
      </div>

      <RouteBlock trip={trip} />
      <TripMeta trip={trip} />

      {/* Navigation handoff — opens Google Maps in the system app */}
      <a
        href={buildDirectionsUrl(trip, navTarget)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-card text-sm font-semibold text-foreground transition-colors hover:bg-accent"
      >
        <Navigation className="h-4 w-4" />
        Navigate to {navTarget === "pickup" ? "pickup" : "drop-off"}
      </a>

      <div className="mt-2.5 space-y-2.5">
        {stage === "ready" && (
          <Button
            size="lg"
            className="h-12 w-full rounded-full text-base font-semibold"
            disabled={busy}
            onClick={() => go("start_pickup")}
          >
            {busy ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-5 w-5" />
            )}
            Confirm pickup &amp; start
          </Button>
        )}

        {stage === "in_transit" && (
          <>
            <QuickCaptureButton
              tripId={trip.id}
              organizationId={trip.organization_id}
              kind="pod"
              label="Take POD photo"
            />
            <Button
              size="lg"
              variant="default"
              className="h-12 w-full rounded-full text-base font-semibold"
              disabled={busy}
              onClick={() => go("mark_delivered")}
            >
              {busy ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              Mark delivered
            </Button>
          </>
        )}

        <TripDocumentsDialog
          tripId={trip.id}
          organizationId={trip.organization_id}
          tripLabel={`${trip.origin_label} → ${trip.destination_label}`}
          allowedKinds={["pod", "photo", "bol", "other"]}
          trigger={
            <Button
              variant="ghost"
              className="h-10 w-full rounded-full text-sm font-medium text-muted-foreground"
            >
              <FileText className="mr-2 h-4 w-4" />
              All documents &amp; photos
            </Button>
          }
        />
      </div>
    </article>
  );
}
