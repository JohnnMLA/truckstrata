import { Bot, Route as RouteIcon, FileSearch, ShieldCheck } from "lucide-react";

const copilots = [
  {
    icon: Bot,
    title: "Dispatch copilot",
    body: "Suggests the best driver–truck pairing for each new load based on HOS, location, and history.",
  },
  {
    icon: RouteIcon,
    title: "Route copilot",
    body: "Reroutes around weather, closures, and parking before your driver hits them.",
  },
  {
    icon: FileSearch,
    title: "Document copilot",
    body: "Reads BOLs and PODs the moment they're uploaded, flags missing signatures and totals.",
  },
  {
    icon: ShieldCheck,
    title: "Safety copilot",
    body: "Watches HOS, license expiry, and harsh-event patterns. Surfaces only what you must act on.",
  },
];

export function Copilots() {
  return (
    <section id="ai" className="relative overflow-hidden border-y border-border/40 bg-gradient-to-b from-card/30 to-background">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">AI copilots</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Quiet AI that earns its keep.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Four focused assistants that suggest decisions — never make them for
            you. Always one tap to accept, ignore, or ask why.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {copilots.map((c) => (
            <div
              key={c.title}
              className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
