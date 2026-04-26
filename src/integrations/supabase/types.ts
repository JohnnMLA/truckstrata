export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          message: string | null
          organization_id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          trip_id: string | null
          type: Database["public"]["Enums"]["alert_type"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          message?: string | null
          organization_id: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          trip_id?: string | null
          type: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          trip_id?: string | null
          type?: Database["public"]["Enums"]["alert_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          current_vehicle_id: string | null
          email: string | null
          full_name: string
          hos_remaining_minutes: number | null
          id: string
          license_expiry: string | null
          license_number: string | null
          license_state: string | null
          organization_id: string
          phone: string | null
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_vehicle_id?: string | null
          email?: string | null
          full_name: string
          hos_remaining_minutes?: number | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          license_state?: string | null
          organization_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_vehicle_id?: string | null
          email?: string | null
          full_name?: string
          hos_remaining_minutes?: number | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          license_state?: string | null
          organization_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_current_vehicle_id_fkey"
            columns: ["current_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          organization_id: string
          read_at: string | null
          recipient_driver_id: string | null
          recipient_user_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          title: string
          trip_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          organization_id: string
          read_at?: string | null
          recipient_driver_id?: string | null
          recipient_user_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title: string
          trip_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          organization_id?: string
          read_at?: string | null
          recipient_driver_id?: string | null
          recipient_user_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title?: string
          trip_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_driver_id_fkey"
            columns: ["recipient_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: Database["public"]["Enums"]["org_plan"]
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["org_plan"]
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["org_plan"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          actual_delivery_at: string | null
          actual_pickup_at: string | null
          created_at: string
          destination_label: string
          destination_lat: number | null
          destination_lng: number | null
          distance_miles: number | null
          driver_id: string | null
          id: string
          notes: string | null
          organization_id: string
          origin_label: string
          origin_lat: number | null
          origin_lng: number | null
          reference: string | null
          revenue_cents: number | null
          scheduled_delivery_at: string | null
          scheduled_pickup_at: string | null
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          actual_delivery_at?: string | null
          actual_pickup_at?: string | null
          created_at?: string
          destination_label: string
          destination_lat?: number | null
          destination_lng?: number | null
          distance_miles?: number | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          origin_label: string
          origin_lat?: number | null
          origin_lng?: number | null
          reference?: string | null
          revenue_cents?: number | null
          scheduled_delivery_at?: string | null
          scheduled_pickup_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          actual_delivery_at?: string | null
          actual_pickup_at?: string | null
          created_at?: string
          destination_label?: string
          destination_lat?: number | null
          destination_lng?: number | null
          distance_miles?: number | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          origin_label?: string
          origin_lat?: number | null
          origin_lng?: number | null
          reference?: string | null
          revenue_cents?: number | null
          scheduled_delivery_at?: string | null
          scheduled_pickup_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          current_driver_id: string | null
          current_lat: number | null
          current_lng: number | null
          current_location_label: string | null
          fuel_level_pct: number | null
          id: string
          last_ping_at: string | null
          license_plate: string | null
          make: string | null
          model: string | null
          odometer_miles: number | null
          organization_id: string
          status: Database["public"]["Enums"]["vehicle_status"]
          truck_number: string
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          current_driver_id?: string | null
          current_lat?: number | null
          current_lng?: number | null
          current_location_label?: string | null
          fuel_level_pct?: number | null
          id?: string
          last_ping_at?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          odometer_miles?: number | null
          organization_id: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          truck_number: string
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          current_driver_id?: string | null
          current_lat?: number | null
          current_lng?: number | null
          current_location_label?: string | null
          fuel_level_pct?: number | null
          id?: string
          last_ping_at?: string | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          odometer_miles?: number | null
          organization_id?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          truck_number?: string
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_current_driver_fkey"
            columns: ["current_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_dispatcher_or_owner: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical"
      alert_type:
        | "hos_violation"
        | "maintenance_due"
        | "fuel_low"
        | "route_deviation"
        | "speeding"
        | "idle_excessive"
        | "eta_delay"
        | "document_expiring"
        | "other"
      app_role:
        | "super_admin"
        | "fleet_owner"
        | "dispatcher"
        | "driver"
        | "safety_manager"
        | "partner"
      driver_status:
        | "on_duty"
        | "off_duty"
        | "driving"
        | "sleeper"
        | "unavailable"
      notification_type: "trip_assignment" | "trip_reminder" | "info"
      org_plan: "trial" | "starter" | "pro" | "enterprise"
      trip_status:
        | "planned"
        | "assigned"
        | "in_transit"
        | "delivered"
        | "cancelled"
        | "delayed"
      vehicle_status: "active" | "idle" | "maintenance" | "out_of_service"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["info", "warning", "critical"],
      alert_type: [
        "hos_violation",
        "maintenance_due",
        "fuel_low",
        "route_deviation",
        "speeding",
        "idle_excessive",
        "eta_delay",
        "document_expiring",
        "other",
      ],
      app_role: [
        "super_admin",
        "fleet_owner",
        "dispatcher",
        "driver",
        "safety_manager",
        "partner",
      ],
      driver_status: [
        "on_duty",
        "off_duty",
        "driving",
        "sleeper",
        "unavailable",
      ],
      notification_type: ["trip_assignment", "trip_reminder", "info"],
      org_plan: ["trial", "starter", "pro", "enterprise"],
      trip_status: [
        "planned",
        "assigned",
        "in_transit",
        "delivered",
        "cancelled",
        "delayed",
      ],
      vehicle_status: ["active", "idle", "maintenance", "out_of_service"],
    },
  },
} as const
