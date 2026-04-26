import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_VALUES: AppRole[] = [
  "super_admin",
  "fleet_owner",
  "dispatcher",
  "driver",
  "safety_manager",
  "partner",
];

/**
 * Resolve the org + role for the calling user. Used by every team mutation
 * to enforce that only owners/dispatchers can manage members.
 */
async function getCallerOrgAndRole(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't belong to an organization yet");
  return { organizationId: data.organization_id, role: data.role as AppRole };
}

function assertCanManageTeam(role: AppRole) {
  if (role !== "fleet_owner" && role !== "dispatcher" && role !== "super_admin") {
    throw new Error("Only owners and dispatchers can manage the team");
  }
}

const InviteSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(ROLE_VALUES as [AppRole, ...AppRole[]]),
  fullName: z.string().min(1).max(120).optional(),
});

/**
 * Invite a teammate by email. If the user doesn't exist yet, send a Supabase
 * invite email. Either way, ensure they are added to this org with the
 * requested role.
 */
export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { organizationId, role } = await getCallerOrgAndRole(userId);
    assertCanManageTeam(role);

    const email = data.email.trim().toLowerCase();

    // 1) See if user already exists
    const { data: existing, error: lookupErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (lookupErr) throw new Error(lookupErr.message);
    let targetUserId =
      existing.users.find((u) => (u.email ?? "").toLowerCase() === email)?.id ??
      null;
    let invited = false;

    if (!targetUserId) {
      // 2) Send Supabase invite email (default Lovable template)
      const { data: invitedUser, error: inviteErr } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: data.fullName ? { full_name: data.fullName } : undefined,
        });
      if (inviteErr) throw new Error(inviteErr.message);
      targetUserId = invitedUser.user?.id ?? null;
      invited = true;
      if (!targetUserId) throw new Error("Failed to create invited user");
    }

    // 3) Upsert into org with requested role
    const { error: memberErr } = await supabaseAdmin
      .from("organization_members")
      .upsert(
        {
          organization_id: organizationId,
          user_id: targetUserId,
          role: data.role,
        },
        { onConflict: "organization_id,user_id" },
      );
    if (memberErr) throw new Error(memberErr.message);

    // 4) Mirror role into user_roles for has_role() helper
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: targetUserId, role: data.role },
        { onConflict: "user_id,role" },
      );

    return { invited, userId: targetUserId };
  });

const UpdateRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(ROLE_VALUES as [AppRole, ...AppRole[]]),
});

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateRoleSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { organizationId, role } = await getCallerOrgAndRole(userId);
    assertCanManageTeam(role);

    const { error } = await supabaseAdmin
      .from("organization_members")
      .update({ role: data.role })
      .eq("id", data.memberId)
      .eq("organization_id", organizationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const RemoveSchema = z.object({ memberId: z.string().uuid() });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RemoveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { organizationId, role } = await getCallerOrgAndRole(userId);
    assertCanManageTeam(role);

    // Don't let the last owner leave
    const { data: owners } = await supabaseAdmin
      .from("organization_members")
      .select("id, user_id, role")
      .eq("organization_id", organizationId)
      .eq("role", "fleet_owner");
    const target = owners?.find((m) => m.id === data.memberId);
    if (target && (owners?.length ?? 0) <= 1) {
      throw new Error("Cannot remove the only fleet owner");
    }

    const { error } = await supabaseAdmin
      .from("organization_members")
      .delete()
      .eq("id", data.memberId)
      .eq("organization_id", organizationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const InviteDriverSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(254).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  sendInvite: z.boolean().default(false),
});

/**
 * Create a driver record. Optionally send a Supabase invite email and link
 * the auth user to the driver row so they can sign in to the Driver Portal.
 */
export const inviteDriver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InviteDriverSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { organizationId, role } = await getCallerOrgAndRole(userId);
    assertCanManageTeam(role);

    const email = data.email?.trim().toLowerCase() || null;
    let driverUserId: string | null = null;
    let invited = false;

    if (email && data.sendInvite) {
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const found = existing?.users.find(
        (u) => (u.email ?? "").toLowerCase() === email,
      );
      if (found) {
        driverUserId = found.id;
      } else {
        const { data: invitedUser, error: invErr } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { full_name: data.fullName },
          });
        if (invErr) throw new Error(invErr.message);
        driverUserId = invitedUser.user?.id ?? null;
        invited = true;
      }

      if (driverUserId) {
        // Add to org as driver
        await supabaseAdmin
          .from("organization_members")
          .upsert(
            {
              organization_id: organizationId,
              user_id: driverUserId,
              role: "driver",
            },
            { onConflict: "organization_id,user_id" },
          );
        await supabaseAdmin
          .from("user_roles")
          .upsert(
            { user_id: driverUserId, role: "driver" },
            { onConflict: "user_id,role" },
          );
      }
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("drivers")
      .insert({
        organization_id: organizationId,
        full_name: data.fullName,
        email,
        phone: data.phone || null,
        user_id: driverUserId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return { driverId: inserted.id, invited };
  });
