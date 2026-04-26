import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface AnalyticsTrip {
  id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  status: "planned" | "assigned" | "in_transit" | "delivered" | "cancelled" | "delayed";
  distance_miles: number | null;
  revenue_cents: number | null;
  scheduled_delivery_at: string | null;
  actual_delivery_at: string | null;
  actual_pickup_at: string | null;
  created_at: string;
}

/**
 * Pulls the last N days of trips for the current org. Used by the analytics
 * dashboard to compute revenue, miles, on-time %, and per-truck utilization.
 */
export function useAnalyticsTrips(days: number = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analytics-trips", user?.id, days],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("trips")
        .select(
          "id, vehicle_id, driver_id, status, distance_miles, revenue_cents, scheduled_delivery_at, actual_delivery_at, actual_pickup_at, created_at",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data as AnalyticsTrip[];
    },
  });
}
