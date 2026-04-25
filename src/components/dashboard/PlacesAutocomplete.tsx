import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

export interface PlaceValue {
  label: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: PlaceValue;
  onChange: (next: PlaceValue) => void;
  placeholder?: string;
  id?: string;
}

/**
 * Google Places autocomplete input. Falls back gracefully to a plain text
 * input (no coordinates) if the Places library fails to load.
 */
export function PlacesAutocomplete({ value, onChange, placeholder, id }: Props) {
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState(value.label);

  useEffect(() => {
    setText(value.label);
  }, [value.label]);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"],
      types: ["geocode"],
    });

    const listener = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const label =
        place.formatted_address ?? place.name ?? inputRef.current?.value ?? "";
      const loc = place.geometry?.location;
      onChange({
        label,
        lat: loc ? loc.lat() : null,
        lng: loc ? loc.lng() : null,
      });
      setText(label);
    });

    return () => {
      listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        ref={inputRef}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          // Keep label in sync; clear coords if user types over a selection
          onChange({ label: e.target.value, lat: null, lng: null });
        }}
        className="pl-9"
      />
    </div>
  );
}
