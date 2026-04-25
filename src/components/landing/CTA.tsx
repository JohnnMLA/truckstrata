import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 pb-24">
      <div
        className="overflow-hidden rounded-3xl border border-border/60 px-8 py-16 text-center shadow-[var(--shadow-elevated)] md:px-16 md:py-20"
        style={{ background: "var(--gradient-hero)" }}
      >
        <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Half the cost of Samsara. Twice the intelligence.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Get early access pricing for owner-operators and fleets under 50 trucks.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/dispatch">
            <Button size="lg" className="rounded-full px-8">Try the dashboard</Button>
          </Link>
          <Button size="lg" variant="outline" className="rounded-full px-8">
            Talk to sales
          </Button>
        </div>
      </div>
      <p className="mt-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TruckStrata, Inc. · truckstrata.com
      </p>
    </section>
  );
}
