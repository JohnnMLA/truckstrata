import { useState } from "react";
import {
  AlertOctagon,
  Camera,
  CheckCircle2,
  Inbox,
  Loader2,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useIncidents,
  useResolveIncident,
  type DBIncident,
  type IncidentKind,
  type IncidentSeverity,
} from "@/hooks/useIncidents";
import { getSignedDocumentUrl } from "@/hooks/useTripDocuments";

const KIND_LABEL: Record<IncidentKind, string> = {
  breakdown: "Breakdown",
  accident: "Accident",
  mechanical: "Mechanical",
  traffic_delay: "Traffic delay",
  weather: "Weather",
  cargo_issue: "Cargo issue",
  other: "Issue",
};

const SEVERITY_TONE: Record<IncidentSeverity, string> = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-warning/15 text-warning",
  critical: "bg-destructive/15 text-destructive",
};

/**
 * Surfaces unresolved driver-reported incidents for dispatch. Shows the most
 * recent first with severity color, optional photo preview link, and a quick
 * resolve action.
 */
export function IncidentsPanel() {
  const { data: incidents, isLoading } = useIncidents({ onlyUnresolved: true });
  const resolve = useResolveIncident();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function onResolve(id: string) {
    setResolvingId(id);
    try {
      await resolve.mutateAsync(id);
      toast.success("Incident resolved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resolve");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold text-foreground">Driver incidents</h3>
        </div>
        {incidents && incidents.length > 0 && (
          <Badge variant="outline" className="rounded-full text-[10px]">
            {incidents.length} open
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : !incidents || incidents.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
          <Inbox className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
          <p className="text-xs font-medium text-foreground">No open incidents</p>
          <p className="text-[11px] text-muted-foreground">
            Drivers haven't reported any issues.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {incidents.map((inc) => (
            <IncidentRow
              key={inc.id}
              incident={inc}
              busy={resolvingId === inc.id}
              onResolve={() => onResolve(inc.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function IncidentRow({
  incident,
  busy,
  onResolve,
}: {
  incident: DBIncident;
  busy: boolean;
  onResolve: () => void;
}) {
  const [openingPhoto, setOpeningPhoto] = useState(false);

  async function openPhoto() {
    if (!incident.photo_storage_path) return;
    setOpeningPhoto(true);
    try {
      const url = await getSignedDocumentUrl(incident.photo_storage_path, 60);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open photo");
    } finally {
      setOpeningPhoto(false);
    }
  }

  return (
    <li className="rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-start gap-3">
        <div
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${SEVERITY_TONE[incident.severity]}`}
        >
          <AlertOctagon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {KIND_LABEL[incident.kind]}
            </p>
            <Badge
              variant="outline"
              className="rounded-full text-[9px] capitalize"
            >
              {incident.severity}
            </Badge>
          </div>
          {incident.notes && (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
              {incident.notes}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
            </span>
            {(incident.location_lat || incident.location_label) && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {incident.location_label ??
                  `${incident.location_lat?.toFixed(3)}, ${incident.location_lng?.toFixed(3)}`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5">
        {incident.photo_storage_path && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 rounded-full text-[11px]"
            onClick={openPhoto}
            disabled={openingPhoto}
          >
            {openingPhoto ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Camera className="mr-1 h-3 w-3" />
            )}
            Photo
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 rounded-full text-[11px]"
          onClick={onResolve}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-1 h-3 w-3" />
          )}
          Resolve
        </Button>
      </div>
    </li>
  );
}
