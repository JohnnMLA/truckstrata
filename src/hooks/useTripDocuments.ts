import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export type TripDocumentKind = Database["public"]["Enums"]["trip_document_kind"];

export interface TripDocument {
  id: string;
  trip_id: string;
  organization_id: string;
  uploaded_by: string | null;
  kind: TripDocumentKind;
  file_name: string;
  storage_path: string;
  content_type: string | null;
  size_bytes: number | null;
  notes: string | null;
  created_at: string;
}

const BUCKET = "trip-documents";

/** Slugify a filename so storage paths stay clean. */
function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  const cleanBase =
    base
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  return `${cleanBase}${ext.toLowerCase()}`;
}

/** Fetch documents for a single trip. */
export function useTripDocuments(tripId: string | undefined) {
  return useQuery({
    queryKey: ["trip-documents", tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_documents")
        .select("*")
        .eq("trip_id", tripId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TripDocument[];
    },
  });
}

export interface UploadTripDocInput {
  tripId: string;
  organizationId: string;
  file: File;
  kind: TripDocumentKind;
  notes?: string;
}

export function useUploadTripDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: UploadTripDocInput) => {
      const stamp = Date.now();
      const cleanName = safeName(input.file.name);
      const path = `${input.organizationId}/${input.tripId}/${stamp}-${cleanName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.file, {
          contentType: input.file.type || undefined,
          upsert: false,
        });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("trip_documents").insert({
        trip_id: input.tripId,
        organization_id: input.organizationId,
        uploaded_by: user?.id ?? null,
        kind: input.kind,
        file_name: input.file.name,
        storage_path: path,
        content_type: input.file.type || null,
        size_bytes: input.file.size,
        notes: input.notes || null,
      });
      if (insErr) {
        // Best-effort cleanup if metadata insert fails
        await supabase.storage.from(BUCKET).remove([path]);
        throw insErr;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trip-documents", vars.tripId] });
    },
  });
}

/** Create a short-lived signed URL for a private document. */
export async function getSignedDocumentUrl(path: string, expiresInSec = 60) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

export function useDeleteTripDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Pick<TripDocument, "id" | "storage_path" | "trip_id">) => {
      // Remove file first (RLS will gate it). If file removal fails the row stays.
      const { error: rmErr } = await supabase.storage
        .from(BUCKET)
        .remove([doc.storage_path]);
      if (rmErr) throw rmErr;
      const { error } = await supabase.from("trip_documents").delete().eq("id", doc.id);
      if (error) throw error;
      return doc;
    },
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["trip-documents", doc.trip_id] });
    },
  });
}
