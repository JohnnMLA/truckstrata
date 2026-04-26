import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Upload,
  Download,
  Trash2,
  Image as ImageIcon,
  File as FileIcon,
  Receipt,
  Truck,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTripDocuments,
  useUploadTripDocument,
  useDeleteTripDocument,
  getSignedDocumentUrl,
  type TripDocument,
  type TripDocumentKind,
} from "@/hooks/useTripDocuments";

interface Props {
  tripId: string;
  organizationId: string;
  /** Hide upload UI for read-only viewers. */
  canUpload?: boolean;
  /** Hide delete buttons for read-only viewers. */
  canDelete?: boolean;
  /** Restrict the kind picker (e.g. drivers only upload pod / photo). */
  allowedKinds?: TripDocumentKind[];
}

const KIND_LABEL: Record<TripDocumentKind, string> = {
  bol: "Bill of Lading",
  pod: "Proof of Delivery",
  invoice: "Invoice",
  photo: "Photo",
  other: "Other",
};

const KIND_ICON: Record<TripDocumentKind, React.ComponentType<{ className?: string }>> = {
  bol: Truck,
  pod: ClipboardCheck,
  invoice: Receipt,
  photo: ImageIcon,
  other: FileIcon,
};

const ALL_KINDS: TripDocumentKind[] = ["bol", "pod", "invoice", "photo", "other"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (matches bucket limit)

export function TripDocuments({
  tripId,
  organizationId,
  canUpload = true,
  canDelete = true,
  allowedKinds,
}: Props) {
  const kinds = allowedKinds ?? ALL_KINDS;
  const { data: docs, isLoading } = useTripDocuments(tripId);
  const upload = useUploadTripDocument();
  const remove = useDeleteTripDocument();
  const fileRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<TripDocumentKind>(kinds[0] ?? "other");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File is over 10 MB.");
      return;
    }
    try {
      await upload.mutateAsync({
        tripId,
        organizationId,
        file,
        kind,
        notes: notes.trim() || undefined,
      });
      toast.success(`${file.name} uploaded`);
      setFile(null);
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleOpen(doc: TripDocument) {
    setOpeningId(doc.id);
    try {
      const url = await getSignedDocumentUrl(doc.storage_path, 60);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open file");
    } finally {
      setOpeningId(null);
    }
  }

  async function handleDelete(doc: TripDocument) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      await remove.mutateAsync(doc);
      toast.success("Deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <form onSubmit={handleUpload} className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-kind" className="text-xs">Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as TripDocumentKind)}>
                <SelectTrigger id="doc-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kinds.map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-file" className="text-xs">File (max 10 MB)</Label>
              <Input
                id="doc-file"
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-notes" className="text-xs">Notes (optional)</Label>
            <Input
              id="doc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Signed by warehouse manager"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={upload.isPending || !file}>
              {upload.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-3.5 w-3.5" />
              )}
              Upload
            </Button>
          </div>
        </form>
      )}

      <div>
        <h4 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Files
        </h4>
        {isLoading ? (
          <div className="grid place-items-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (docs ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-4 py-6 text-center text-xs text-muted-foreground">
            <FileText className="mx-auto mb-1.5 h-4 w-4" />
            No documents yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {(docs ?? []).map((doc) => {
              const Icon = KIND_ICON[doc.kind];
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {doc.file_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {KIND_LABEL[doc.kind]}
                      {typeof doc.size_bytes === "number" && (
                        <> · {formatBytes(doc.size_bytes)}</>
                      )}
                      {" · "}
                      {new Date(doc.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {doc.notes && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpen(doc)}
                    aria-label="Open"
                    disabled={openingId === doc.id}
                  >
                    {openingId === doc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {canDelete && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(doc)}
                      aria-label="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
