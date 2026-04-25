import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { APIProvider } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import { Loader2, Plus, ArrowRight } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDrivers, useVehicles, useCreateTrip } from "@/hooks/useFleetData";
import { supabase } from "@/integrations/supabase/client";
import { PlacesAutocomplete, type PlaceValue } from "./PlacesAutocomplete";

const UNASSIGNED = "__unassigned__";

interface Props {
  trigger?: React.ReactNode;
}

export function NewTripDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> New trip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {open && <NewTripForm onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function NewTripForm({ onDone }: { onDone: () => void }) {
  const { data: vehicles } = useVehicles();
  const { data: drivers } = useDrivers();
  const createTrip = useCreateTrip();

  const keyQuery = useQuery({
    queryKey: ["maps-config"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        apiKey: string;
        error?: string;
      }>("maps-config", { body: {} });
      if (error) throw new Error(error.message);
      if (!data?.apiKey) throw new Error(data?.error ?? "No API key");
      return data.apiKey;
    },
  });

  const [reference, setReference] = useState("");
  const [origin, setOrigin] = useState<PlaceValue>({ label: "", lat: null, lng: null });
  const [destination, setDestination] = useState<PlaceValue>({ label: "", lat: null, lng: null });
  const [vehicleId, setVehicleId] = useState<string>(UNASSIGNED);
  const [driverId, setDriverId] = useState<string>(UNASSIGNED);
  const [pickupAt, setPickupAt] = useState("");
  const [deliveryAt, setDeliveryAt] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin.label.trim() || !destination.label.trim()) {
      toast.error("Add an origin and a destination.");
      return;
    }
    try {
      await createTrip.mutateAsync({
        reference: reference.trim() || null,
        origin_label: origin.label.trim(),
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_label: destination.label.trim(),
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        vehicle_id: vehicleId === UNASSIGNED ? null : vehicleId,
        driver_id: driverId === UNASSIGNED ? null : driverId,
        scheduled_pickup_at: pickupAt ? new Date(pickupAt).toISOString() : null,
        scheduled_delivery_at: deliveryAt ? new Date(deliveryAt).toISOString() : null,
        notes: notes.trim() || null,
      });
      toast.success("Trip created.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create trip");
    }
  }

  // Wrap autocomplete inputs in APIProvider so Places library loads on demand.
  // Plain inputs render immediately; Places enhances them once loaded.
  return (
    <APIProvider apiKey={keyQuery.data ?? ""} libraries={["places"]}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>New trip</DialogTitle>
          <DialogDescription>
            Create a load and optionally assign it to a driver and truck.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            placeholder="L-2042"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="origin">Origin</Label>
            <PlacesAutocomplete
              id="origin"
              value={origin}
              onChange={setOrigin}
              placeholder="Pickup city or address"
            />
          </div>
          <ArrowRight className="hidden h-4 w-4 self-center text-muted-foreground sm:block" />
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <PlacesAutocomplete
              id="destination"
              value={destination}
              onChange={setDestination}
              placeholder="Drop-off city or address"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Driver</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
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
                <SelectValue placeholder="Unassigned" />
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
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <Label htmlFor="delivery">Delivery</Label>
            <Input
              id="delivery"
              type="datetime-local"
              value={deliveryAt}
              onChange={(e) => setDeliveryAt(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Special handling, dock instructions…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={createTrip.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createTrip.isPending}>
            {createTrip.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create trip
          </Button>
        </DialogFooter>
      </form>
    </APIProvider>
  );
}
