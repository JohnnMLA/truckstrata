import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOrganization } from "@/hooks/useFleetData";
import { toast } from "sonner";

export type NotificationType = "trip_assignment" | "trip_reminder" | "info";

export interface DBNotification {
  id: string;
  organization_id: string;
  recipient_user_id: string | null;
  recipient_driver_id: string | null;
  trip_id: string | null;
  vehicle_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  read_at: string | null;
  created_by: string | null;
  created_at: string;
}

/** Recent notifications for the current org, newest first. */
export function useNotifications(limit = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as DBNotification[];
    },
  });
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  trip_id?: string | null;
  vehicle_id?: string | null;
  recipient_driver_id?: string | null;
  recipient_user_id?: string | null;
  scheduled_for?: string | null;
}

export function useCreateNotification() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: org } = useOrganization();
  return useMutation({
    mutationFn: async (input: CreateNotificationInput) => {
      if (!org?.organization_id) throw new Error("No organization");
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          organization_id: org.organization_id,
          created_by: user?.id ?? null,
          ...input,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as DBNotification;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Realtime patch + toast for new sent notifications. */
export function useRealtimeNotifications() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          qc.setQueryData<DBNotification[]>(
            ["notifications", user.id],
            (prev) => {
              const list = prev ?? [];
              if (payload.eventType === "DELETE") {
                const oldId = (payload.old as { id?: string }).id;
                return list.filter((n) => n.id !== oldId);
              }
              const next = payload.new as DBNotification;
              const filtered = list.filter((n) => n.id !== next.id);
              if (
                payload.eventType === "INSERT" &&
                next.sent_at &&
                next.type !== "info"
              ) {
                toast(next.title, { description: next.body ?? undefined });
              }
              return [next, ...filtered].slice(0, 30);
            },
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, user]);
}
