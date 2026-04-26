import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUploadTripDocument, type TripDocumentKind } from "@/hooks/useTripDocuments";

interface Props {
  tripId: string;
  organizationId: string;
  /** Defaults to "pod" (proof of delivery) — the most common driver capture. */
  kind?: TripDocumentKind;
  label?: string;
  /**
   * Set to true to render in a smaller pill style for inline placement.
   * Default false renders a full-width primary action.
   */
  compact?: boolean;
}

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * One-tap camera capture optimized for drivers. Opens the device camera
 * (not the gallery) on mobile via `capture="environment"`, immediately
 * uploads the photo against the trip, and never blocks the driver behind
 * a multi-step dialog.
 */
export function QuickCaptureButton({
  tripId,
  organizationId,
  kind = "pod",
  label,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadTripDocument();
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("Photo is over 10 MB. Try again.");
      return;
    }
    setBusy(true);
    try {
      await upload.mutateAsync({
        tripId,
        organizationId,
        file,
        kind,
      });
      toast.success(kind === "pod" ? "POD uploaded" : "Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const text = label ?? (kind === "pod" ? "Capture POD photo" : "Capture photo");

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        size={compact ? "sm" : "lg"}
        variant={compact ? "outline" : "default"}
        className={
          compact
            ? "rounded-full"
            : "h-12 w-full rounded-full text-base font-semibold"
        }
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Camera className="mr-2 h-5 w-5" />
        )}
        {text}
      </Button>
    </>
  );
}
