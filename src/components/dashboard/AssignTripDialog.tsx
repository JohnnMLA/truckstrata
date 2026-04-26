import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDrivers,
  useVehicles,
  type DBTrip,
} from "@/hooks/useFleetData";
import { useCreateNotification } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const UNASSIGNED = "__unassigned__";

interface Props {
  trip: DBTrip;
  trigger?: React.ReactNode;
}

export function AssignTripDialog({ trip, trigger }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="rounded-full">
            <UserPlus className="mr-1 h-3.5 w-3.5" /> Assign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {open && <AssignForm trip={trip} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AssignForm({ trip, onDone }: { trip: DBTrip; onDone: () => void }) {
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();
  const createNotification = useCreateNotification();
  const qc = useQueryClient();

  const [driverId, setDriverId] = useState<string>(trip.driver_id ?? UNASSIGNED);
  const [vehicleId, setVehicleId] = useState<string>(trip.vehicle_id ?? UNASSIGNED);
  const [pickupAt, setPickupAt] = useState<string>(
    trip.scheduled_pickup_at
      ? toLocalInput(trip.scheduled_pickup_at)
      : "",
  );
  const [reminderHours, setReminderHours] = useState<string>("2");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (driverId === UNASSIGNED) {
      toast.error("Pick a driver to send the assignment.");
      return;
    }
    setSubmitting(true);
    try {
      const driver = (drivers ?? []).find((d) => d.id === driverId) ?? null;
      const vehicle =
        vehicleId === UNASSIGNED
          ? null
          : (vehicles ?? []).find((v) => v.id === vehicleId) ?? null;

      // Update the trip
      const pickupIso = pickupAt ? new Date(pickupAt).toISOString() : trip.scheduled_pickup_at;
      const { error: updErr } = await supabase
        .from("trips")
        .update({
          driver_id: driverId,
          vehicle_id: vehicleId === UNASSIGNED ? null : vehicleId,
          scheduled_pickup_at: pickupIso,
          status: trip.status === "planned" ? "assigned" : trip.status,
        })
        .eq("id", trip.id);
      if (updErr) throw updErr;

      // Immediate confirmation notification
      const route = `${trip.origin_label} → ${trip.destination_label}`;
      const title = `Assignment: ${trip.reference ?? route}`;
      const body =
        `${driver?.full_name ?? "Driver"} assigned to ${route}` +
        (vehicle ? ` · ${vehicle.truck_number}` : "") +
        (pickupIso ? ` · pickup ${formatPretty(pickupIso)}` : "");

      await createNotification.mutateAsync({
        type: "trip_assignment",
        title,
        body,
        trip_id: trip.id,
        vehicle_id: vehicleId === UNASSIGNED ? null : vehicleId,
        recipient_driver_id: driverId,
        link: "/trips",
      });

      // Optional pickup reminder
      const hours = Number(reminderHours);
      if (pickupIso && hours > 0) {
        const remindAt = new Date(new Date(pickupIso).getTime() - hours * 3600_000);
        if (remindAt.getTime() > Date.now()) {
          await createNotification.mutateAsync({
            type: "trip_reminder",
            title: `Pickup reminder · ${trip.reference ?? route}`,
            body: `Pickup at ${formatPretty(pickupIso)} — ${route}`,
            trip_id: trip.id,
            vehicle_id: vehicleId === UNASSIGNED ? null : vehicleId,
            recipient_driver_id: driverId,
            link: "/trips",
            scheduled_for: remindAt.toISOString(),
          });
        }
      }

      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Assignment sent.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign trip");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Assign &amp; notify</DialogTitle>
        <DialogDescription>
          {trip.origin_label} → {trip.destination_label}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label>Driver</Label>
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger>
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {(drivers ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Truck</Label>
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger>
            <SelectValue placeholder="Pick a truck" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {(vehicles ?? []).map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.truck_number}
                {v.make ? ` · ${v.make}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="pickup">Pickup</Label>
          <Input
            id="pickup"
            type="datetime-local"
            value={pickupAt}
            onChange={(e) => setPickupAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remind">Reminder before</Label>
          <Select value={reminderHours} onValueChange={setReminderHours}>
            <SelectTrigger id="remind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No reminder</SelectItem>
              <SelectItem value="1">1 hour</SelectItem>
              <SelectItem value="2">2 hours</SelectItem>
              <SelectItem value="4">4 hours</SelectItem>
              <SelectItem value="12">12 hours</SelectItem>
              <SelectItem value="24">24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assign &amp; notify
        </Button>
      </DialogFooter>
    </form>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatPretty(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
