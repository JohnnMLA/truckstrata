import { MapPin, Truck, Sparkles, Fuel, ShieldAlert, Users } from "lucide-react";

const pillars = [
  {
    icon: MapPin,
    title: "Live fleet map",
    body: "Real-time GPS, trip history, geofences and stop detection — all on one calm map.",
  },
  {
    icon: Truck,
    title: "Dispatcher cockpit",
    body: "Driver and vehicle status at a glance. Assign loads in two taps.",
  },
  {
    icon: Sparkles,
    title: "AI copilots",
    body: "Dispatch, route, and document copilots that suggest — never overwhelm.",
  },
  {
    icon: Fuel,
    title: "Road intelligence",
    body: "Cheapest diesel, parking and repair shops along every active route.",
  },
  {
    icon: ShieldAlert,
    title: "Smart alerts",
    body: "Geofence breaches, harsh events, offline trucks — only what matters.",
  },
  {
    icon: Users,
    title: "Driver-first mobile",
    body: "Thumb-friendly trip flow, hands-free voice, simple status updates.",
  },
];

export function Pillars() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">The platform</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything a small fleet needs.<br className="hidden sm:block" />
          Nothing it doesn't.
        </h2>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => (
          <div
            key={p.title}
            className="group rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <p.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-foreground">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
