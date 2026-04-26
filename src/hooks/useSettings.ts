import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  inviteTeamMember,
  updateMemberRole,
  removeMember,
  inviteDriver,
} from "@/server/team.functions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface OrgMemberRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email: string | null;
  full_name: string | null;
}

/** Fetch members of the current org along with their profile info. */
export function useOrgMembers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["org-members", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const userIds = (members ?? []).map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
      const byId = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p]),
      );
      // Email isn't accessible via profiles; we can only show it for the
      // current user. The invite flow shows the invited address inline.
      return (members ?? []).map<OrgMemberRow>((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
        full_name: byId[m.user_id]?.full_name ?? null,
        email: m.user_id === user?.id ? (user?.email ?? null) : null,
      }));
    },
  });
}

export function useInviteTeamMember() {
  const qc = useQueryClient();
  const fn = useServerFn(inviteTeamMember);
  return useMutation({
    mutationFn: (input: { email: string; role: AppRole; fullName?: string }) =>
      fn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-members"] }),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const fn = useServerFn(updateMemberRole);
  return useMutation({
    mutationFn: (input: { memberId: string; role: AppRole }) =>
      fn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-members"] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  const fn = useServerFn(removeMember);
  return useMutation({
    mutationFn: (memberId: string) => fn({ data: { memberId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-members"] }),
  });
}

export function useInviteDriver() {
  const qc = useQueryClient();
  const fn = useServerFn(inviteDriver);
  return useMutation({
    mutationFn: (input: {
      fullName: string;
      email?: string;
      phone?: string;
      sendInvite: boolean;
    }) => fn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["org-members"] });
    },
  });
}

/* ---------- Vehicle CRUD (RLS handles auth) ---------- */

export interface UpsertVehicleInput {
  id?: string;
  truck_number: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  license_plate?: string | null;
  vin?: string | null;
  status?: Database["public"]["Enums"]["vehicle_status"];
}

export function useUpsertVehicle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: UpsertVehicleInput) => {
      // Look up org via member row (RLS ensures row is theirs)
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!member) throw new Error("No organization found");

      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase
          .from("vehicles")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from("vehicles")
        .insert({ ...input, organization_id: member.organization_id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

/* ---------- Driver CRUD ---------- */

export interface UpdateDriverInput {
  id: string;
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  license_number?: string | null;
  license_state?: string | null;
  license_expiry?: string | null;
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateDriverInput) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("drivers").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

/* ---------- Profile + Org ---------- */

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  company_name?: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { error } = await supabase
        .from("profiles")
        .update(input)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { error } = await supabase
        .from("organizations")
        .update({ name: input.name })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organization"] }),
  });
}
