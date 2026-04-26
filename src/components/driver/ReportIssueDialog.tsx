import { useRef, useState } from "react";
import { Camera, Loader2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useReportIncident,
  type IncidentKind,
  type IncidentSeverity,
} from "@/hooks/useIncidents";

interface Props {
  tripId: string;
  organizationId: string;
  driverId: string;
  vehicleId?: string | null;
  trigger?: React.ReactNode;
}

const KIND_OPTIONS: Array<{ value: IncidentKind; label: string; severity: IncidentSeverity }> = [
  { value: "breakdown", label: "Truck breakdown", severity: "critical" },
  { value: "accident", label: "Accident", severity: "critical" },
  { value: "mechanical", label: "Mechanical issue", severity: "warning" },
  { value: "traffic_delay", label: "Traffic delay", severity: "info" },
  { value: "weather", label: "Weather delay", severity: "warning" },
  { value: "cargo_issue", label: "Cargo issue", severity: "warning" },
  { value: "other", label: "Other", severity: "info" },
];

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Driver-facing incident reporter. Optimized for mobile:
 * - Big primary call to action
 * - Single screen, defaults pre-filled
 * - Optional camera photo (rear camera via capture="environment")
 * - Captures geolocation in the background if permitted
 */
export function ReportIssueDialog({
  tripId,
  organizationId,
  driverId,
  vehicleId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const report = useReportIncident();
  const fileRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<IncidentKind>("breakdown");
  const [severity, setSeverity] = useState<IncidentSeverity>("critical");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  function reset() {
    setKind("breakdown");
    setSeverity("critical");
    setNotes("");
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onKindChange(next: IncidentKind) {
    setKind(next);
    const match = KIND_OPTIONS.find((k) => k.value === next);
    if (match) setSeverity(match.severity);
  }

  async function captureLocation(): Promise<{ lat?: number; lng?: number }> {
    if (typeof navigator === "undefined" || !navigator.geolocation) return {};
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({}),
        { timeout: 4000, maximumAge: 60_000 },
      );
    });
  }

  async function onSubmit() {
    const option = KIND_OPTIONS.find((k) => k.value === kind);
    if (!option) return;
    if (photo && photo.size > MAX_BYTES) {
      toast.error("Photo is over 10 MB.");
      return;
    }

    const loc = await captureLocation();

    try {
      await report.mutateAsync({
        tripId,
        organizationId,
        driverId,
        vehicleId,
        kind,
        severity,
        title: option.label,
        notes: notes.trim() || undefined,
        locationLat: loc.lat,
        locationLng: loc.lng,
        photo,
      });
      toast.success("Dispatch notified");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not report issue");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="h-11 w-full rounded-full border-destructive/40 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <TriangleAlert className="mr-2 h-4 w-4" />
            Report issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            Report an issue
          </DialogTitle>
          <DialogDescription>
            Dispatch is notified instantly with your location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="incident-kind" className="text-xs">
              What happened?
            </Label>
            <Select value={kind} onValueChange={(v) => onKindChange(v as IncidentKind)}>
              <SelectTrigger id="incident-kind" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIND_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="incident-severity" className="text-xs">
              Urgency
            </Label>
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as IncidentSeverity)}
            >
              <SelectTrigger id="incident-severity" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info — heads up</SelectItem>
                <SelectItem value="warning">Warning — needs attention</SelectItem>
                <SelectItem value="critical">Critical — urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="incident-notes" className="text-xs">
              Notes (optional)
            </Label>
            <Textarea
              id="incident-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's going on? Mile marker, exit, vehicle behavior…"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Photo (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              {photo ? `Photo attached · ${photo.name.slice(0, 24)}` : "Take photo"}
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setOpen(false)}
            disabled={report.isPending}
          >
            Cancel
          </Button>
          <Button
            className="h-11 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onSubmit}
            disabled={report.isPending}
          >
            {report.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TriangleAlert className="mr-2 h-4 w-4" />
            )}
            Send to dispatch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
