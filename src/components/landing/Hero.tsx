import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-truck.jpg";
import { Clock, TrendingDown, Truck } from "lucide-react";

const stats = [
  { icon: Clock, value: "10 min", label: "to onboard your first truck" },
  { icon: TrendingDown, value: "50%", label: "lower total cost vs. Samsara" },
  { icon: Truck, value: "1–50", label: "trucks supported on day one" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            AI-native trucking OS · Now in early access
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Run your fleet like the
            <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent"> top 1%.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            TruckDispatchAI replaces Samsara and Motive with a calmer, smarter
            operating system — built for owner-operators and small fleets.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/dispatch">
              <Button size="lg" className="rounded-full px-7 shadow-[var(--shadow-soft)]">
                Open the dashboard
              </Button>
            </Link>
            <a href="#ai">
              <Button size="lg" variant="ghost" className="rounded-full px-7">
                See how AI helps →
              </Button>
            </a>
          </div>

          <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <li
                key={s.label}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-left backdrop-blur"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.value}</p>
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-elevated)]">
            <img
              src={heroImg}
              alt="A modern semi-truck on a desert highway at golden hour"
              width={1920}
              height={1280}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
