import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Truck,
  Users,
  Building2,
  User as UserIcon,
  Mail,
  Pencil,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useOrganization, useDrivers, useVehicles } from "@/hooks/useFleetData";
import {
  useOrgMembers,
  useInviteTeamMember,
  useUpdateMemberRole,
  useRemoveMember,
  useInviteDriver,
  useUpsertVehicle,
  useDeleteVehicle,
  useUpdateDriver,
  useDeleteDriver,
  useProfile,
  useUpdateProfile,
  useUpdateOrganization,
} from "@/hooks/useSettings";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLES: { value: AppRole; label: string; hint: string }[] = [
  { value: "fleet_owner", label: "Fleet owner", hint: "Full control" },
  { value: "dispatcher", label: "Dispatcher", hint: "Manage trips, drivers, vehicles" },
  { value: "safety_manager", label: "Safety manager", hint: "Compliance & alerts" },
  { value: "driver", label: "Driver", hint: "Driver Portal access" },
  { value: "partner", label: "Partner", hint: "Limited read-only" },
  { value: "super_admin", label: "Super admin", hint: "Platform-wide access" },
];

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · TruckStrata" },
      {
        name: "description",
        content:
          "Manage your profile, organization, team members, drivers and vehicles.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your profile, organization, team, drivers and trucks.
            </p>
          </div>
          <NotificationBell />
        </header>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 flex w-full max-w-2xl flex-wrap gap-1">
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" /> Organization
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" /> Team
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-2">
              <UserPlus className="h-4 w-4" /> Drivers
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2">
              <Truck className="h-4 w-4" /> Vehicles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="organization">
            <OrganizationTab />
          </TabsContent>
          <TabsContent value="team">
            <TeamTab />
          </TabsContent>
          <TabsContent value="drivers">
            <DriversTab />
          </TabsContent>
          <TabsContent value="vehicles">
            <VehiclesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------------- Profile ---------------- */

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const onSave = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: fullName, phone });
      toast.success("Profile updated");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <SectionCard
      title="Your profile"
      description="How you appear to your team."
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="grid gap-1.5">
            <Label>Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Cooper"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 0123"
            />
          </div>
          <div>
            <Button onClick={onSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ---------------- Organization ---------------- */

function OrganizationTab() {
  const { data: org, isLoading } = useOrganization();
  const updateOrg = useUpdateOrganization();
  const [name, setName] = useState("");

  useEffect(() => {
    const orgName = org?.organizations?.name;
    if (orgName) setName(orgName);
  }, [org]);

  const onSave = async () => {
    if (!org?.organization_id) return;
    try {
      await updateOrg.mutateAsync({ id: org.organization_id, name });
      toast.success("Organization updated");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <SectionCard title="Organization" description="Your company name and plan.">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid max-w-xl gap-4">
          <div className="grid gap-1.5">
            <Label>Company name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Plan</Label>
            <Input value={org?.organizations?.plan ?? "trial"} disabled />
          </div>
          <div>
            <Button onClick={onSave} disabled={updateOrg.isPending}>
              {updateOrg.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ---------------- Team ---------------- */

function TeamTab() {
  const { user } = useAuth();
  const { data: members, isLoading } = useOrgMembers();
  const invite = useInviteTeamMember();
  const updateRole = useUpdateMemberRole();
  const remove = useRemoveMember();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("dispatcher");

  const onInvite = async () => {
    try {
      const res = await invite.mutateAsync({ email, role, fullName });
      toast.success(
        res.invited
          ? `Invite email sent to ${email}`
          : `${email} added to your team`,
      );
      setInviteOpen(false);
      setEmail("");
      setFullName("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <SectionCard
      title="Team members"
      description="People who can access this workspace."
    >
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <Mail className="mr-2 h-4 w-4" />
          Invite member
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Member</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
                <th className="px-4 py-2 text-left font-medium">Joined</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m) => (
                <tr key={m.id} className="border-t border-border/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {m.full_name || m.email || "Pending invitee"}
                    </div>
                    {m.user_id === user?.id && (
                      <div className="text-[11px] text-muted-foreground">You</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={m.role}
                      onValueChange={(value) =>
                        updateRole
                          .mutateAsync({ memberId: m.id, role: value as AppRole })
                          .then(() => toast.success("Role updated"))
                          .catch((e) => toast.error((e as Error).message))
                      }
                      disabled={m.user_id === user?.id}
                    >
                      <SelectTrigger className="h-8 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(m.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          remove
                            .mutateAsync(m.id)
                            .then(() => toast.success("Member removed"))
                            .catch((e) => toast.error((e as Error).message))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {(members ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No members yet — invite your first teammate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              We'll send them an email with a sign-up link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Full name (optional)</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sam Driver"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col">
                        <span>{r.label}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {r.hint}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onInvite} disabled={!email || invite.isPending}>
              {invite.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

/* ---------------- Drivers ---------------- */

function DriversTab() {
  const { data: drivers, isLoading } = useDrivers();
  const inviteD = useInviteDriver();
  const updateD = useUpdateDriver();
  const deleteD = useDeleteDriver();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    license_number: "",
    license_state: "",
    license_expiry: "",
    sendInvite: true,
  });

  const onAdd = () => {
    setEditId(null);
    setForm({
      fullName: "",
      email: "",
      phone: "",
      license_number: "",
      license_state: "",
      license_expiry: "",
      sendInvite: true,
    });
    setOpen(true);
  };

  const onEdit = (id: string) => {
    const d = drivers?.find((x) => x.id === id);
    if (!d) return;
    setEditId(id);
    setForm({
      fullName: d.full_name,
      email: d.email ?? "",
      phone: d.phone ?? "",
      license_number: d.license_number ?? "",
      license_state: d.license_state ?? "",
      license_expiry: d.license_expiry ?? "",
      sendInvite: false,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      if (editId) {
        await updateD.mutateAsync({
          id: editId,
          full_name: form.fullName,
          phone: form.phone || null,
          email: form.email || null,
          license_number: form.license_number || null,
          license_state: form.license_state || null,
          license_expiry: form.license_expiry || null,
        });
        toast.success("Driver updated");
      } else {
        const res = await inviteD.mutateAsync({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          sendInvite: form.sendInvite,
        });
        // If license info was provided, save it now
        if (
          res.driverId &&
          (form.license_number || form.license_state || form.license_expiry)
        ) {
          await updateD.mutateAsync({
            id: res.driverId,
            license_number: form.license_number || null,
            license_state: form.license_state || null,
            license_expiry: form.license_expiry || null,
          });
        }
        toast.success(
          res.invited
            ? `Driver added · invite sent to ${form.email}`
            : "Driver added",
        );
      }
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <SectionCard
      title="Drivers"
      description="Roster of drivers in your fleet. Invite with email to give them Driver Portal access."
    >
      <div className="mb-4 flex justify-end">
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add driver
        </Button>
      </div>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Phone</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Portal access</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(drivers ?? []).map((d) => (
                <tr key={d.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {d.full_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {d.status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    {d.user_id ? (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                        Linked
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        Not invited
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(d.id)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteD
                          .mutateAsync(d.id)
                          .then(() => toast.success("Driver removed"))
                          .catch((e) => toast.error((e as Error).message))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(drivers ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No drivers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit driver" : "Add a driver"}</DialogTitle>
            <DialogDescription>
              {editId
                ? "Update this driver's contact info."
                : "Optionally send a Driver Portal invite by email."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Full name</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            {!editId && (
              <>
                <div className="grid gap-1.5">
                  <Label>Email (for portal invite)</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div>
                    <p className="text-sm font-medium">Send portal invite</p>
                    <p className="text-xs text-muted-foreground">
                      Email a sign-up link so they can use the Driver Portal.
                    </p>
                  </div>
                  <Switch
                    checked={form.sendInvite}
                    onCheckedChange={(v) => setForm({ ...form, sendInvite: v })}
                    disabled={!form.email}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={
                !form.fullName || inviteD.isPending || updateD.isPending
              }
            >
              {(inviteD.isPending || updateD.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editId ? "Save" : "Add driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

/* ---------------- Vehicles ---------------- */

function VehiclesTab() {
  const { data: vehicles, isLoading } = useVehicles();
  const upsert = useUpsertVehicle();
  const del = useDeleteVehicle();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    truck_number: "",
    make: "",
    model: "",
    year: "",
    license_plate: "",
    vin: "",
    status: "idle" as Database["public"]["Enums"]["vehicle_status"],
  });

  const onAdd = () => {
    setEditId(null);
    setForm({
      truck_number: "",
      make: "",
      model: "",
      year: "",
      license_plate: "",
      vin: "",
      status: "idle",
    });
    setOpen(true);
  };

  const onEdit = (id: string) => {
    const v = vehicles?.find((x) => x.id === id);
    if (!v) return;
    setEditId(id);
    setForm({
      truck_number: v.truck_number,
      make: v.make ?? "",
      model: v.model ?? "",
      year: "",
      license_plate: "",
      vin: "",
      status: v.status,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      await upsert.mutateAsync({
        id: editId ?? undefined,
        truck_number: form.truck_number,
        make: form.make || null,
        model: form.model || null,
        year: form.year ? Number(form.year) : null,
        license_plate: form.license_plate || null,
        vin: form.vin || null,
        status: form.status,
      });
      toast.success(editId ? "Truck updated" : "Truck added");
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const STATUSES: Database["public"]["Enums"]["vehicle_status"][] = [
    "active",
    "idle",
    "maintenance",
    "out_of_service",
  ];

  return (
    <SectionCard
      title="Vehicles"
      description="Trucks in your fleet. Add new equipment or update status."
    >
      <div className="mb-4 flex justify-end">
        <Button onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add truck
        </Button>
      </div>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Truck #</th>
                <th className="px-4 py-2 text-left font-medium">Make / Model</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Last ping</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(vehicles ?? []).map((v) => (
                <tr key={v.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {v.truck_number}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[v.make, v.model].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {v.status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {v.last_ping_at
                      ? format(new Date(v.last_ping_at), "MMM d HH:mm")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(v.id)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        del
                          .mutateAsync(v.id)
                          .then(() => toast.success("Truck removed"))
                          .catch((e) => toast.error((e as Error).message))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(vehicles ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No trucks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit truck" : "Add a truck"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Truck number</Label>
              <Input
                value={form.truck_number}
                onChange={(e) => setForm({ ...form, truck_number: e.target.value })}
                placeholder="TRK-204"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Make</Label>
                <Input
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Model</Label>
                <Input
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>License plate</Label>
                <Input
                  value={form.license_plate}
                  onChange={(e) =>
                    setForm({ ...form, license_plate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>VIN</Label>
              <Input
                value={form.vin}
                onChange={(e) => setForm({ ...form, vin: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    status: v as Database["public"]["Enums"]["vehicle_status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!form.truck_number || upsert.isPending}
            >
              {upsert.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editId ? "Save" : "Add truck"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
