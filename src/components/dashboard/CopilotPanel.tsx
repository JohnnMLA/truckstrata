import { Sparkles, ArrowRight, Fuel, Route, FileText } from "lucide-react";

const suggestions = [
  {
    icon: Fuel,
    tag: "Route Copilot",
    title: "Save $42 on Truck 204",
    body: "Loves Travel Stop in El Paso is $0.18/gal cheaper. 8 mi detour, 12 min added.",
    cta: "Reroute",
  },
  {
    icon: Route,
    tag: "Dispatch Copilot",
    title: "Assign load #4821 to Sara Lin",
    body: "Best ETA match. Currently 22 mi from pickup, hours-of-service available.",
    cta: "Assign",
  },
  {
    icon: FileText,
    tag: "Document Copilot",
    title: "3 PODs ready to extract",
    body: "Detected new bills of lading uploaded by Marcus. Extract & file?",
    cta: "Process",
  },
];

export function CopilotPanel() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI suggestions</h3>
        <span className="ml-auto text-xs text-muted-foreground">Updated 2m ago</span>
      </div>
      <div className="mt-4 space-y-3">
        {suggestions.map((s) => (
          <div
            key={s.title}
            className="group rounded-xl border border-border/60 bg-background/60 p-3 transition hover:border-primary/30 hover:bg-card hover:shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <s.icon className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {s.tag}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </div>
            <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:gap-2">
              {s.cta} <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
