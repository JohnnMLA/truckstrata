import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ShieldCheck, Clock, Wallet } from "lucide-react";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Button } from "@/components/ui/button";
import { CTA } from "@/components/landing/CTA";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — TruckDispatchAI" },
      {
        name: "description",
        content:
          "Transparent per-truck pricing for TruckDispatchAI. Starter Solo, Fleet Core, Fleet Pro, and Fleet Enterprise — half the cost of Samsara.",
      },
      { property: "og:title", content: "Pricing — TruckDispatchAI" },
      {
        property: "og:description",
        content:
          "Per-truck pricing with AI Super Dispatcher™ included on Fleet Core and up. 18-month contracts, 30-day money-back guarantee.",
      },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  name: string;
  price: string;
  priceUnit: string;
  range: string;
  contract: string;
  setup?: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    name: "Starter Solo",
    price: "$25",
    priceUnit: "/mo flat",
    range: "1 truck",
    contract: "12-month contract",
    features: [
      "Built-in driver comms",
      "Basic Truck Support Agent",
      "Trip & document basics",
      "Mobile driver app",
      "No AI Super Dispatcher",
    ],
    cta: "Start with Solo",
  },
  {
    name: "Fleet Core",
    price: "$35",
    priceUnit: "/truck/mo",
    range: "2–15 trucks",
    contract: "18-month contract",
    setup: "Setup fee $299–$599",
    highlight: true,
    badge: "Most popular",
    features: [
      "AI Super Dispatcher™ included",
      "Full Truck Support Agent included",
      "Smart dispatch board",
      "Document AI",
      "Built-in driver comms",
    ],
    cta: "Choose Fleet Core",
  },
  {
    name: "Fleet Pro",
    price: "$49",
    priceUnit: "/truck/mo",
    range: "16–75 trucks",
    contract: "18-month contract",
    setup: "Setup fee $799–$1,999",
    features: [
      "Everything in Fleet Core",
      "Trailer tracking",
      "Dashcam service ($15/truck)",
      "ELD integration",
      "Phone support",
    ],
    cta: "Choose Fleet Pro",
  },
  {
    name: "Fleet Enterprise",
    price: "$69",
    priceUnit: "/truck/mo",
    range: "76–500 trucks",
    contract: "18-month contract",
    setup: "Setup fee $2,500+",
    features: [
      "Everything in Fleet Pro",
      "Dedicated customer success manager",
      "Full API access",
      "Custom AI configuration",
      "Priority onboarding",
    ],
    cta: "Talk to sales",
  },
];

const trustItems = [
  {
    icon: Clock,
    title: "18-month contract",
    body: "Half of Samsara's standard 36-month commitment.",
  },
  {
    icon: Wallet,
    title: "50% early termination fee",
    body: "Versus Samsara's 100% remaining-balance penalty.",
  },
  {
    icon: ShieldCheck,
    title: "30-day money-back guarantee",
    body: "From AI activation date. SaaS subscription only — hardware is yours to keep.",
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10"
            style={{ background: "var(--gradient-hero)" }}
            aria-hidden
          />
          <div className="mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Transparent per-truck pricing
              </div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                Half the cost of Samsara.
                <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
                  {" "}Twice the intelligence.
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Pick a plan that fits your fleet size. AI Super Dispatcher™ is included
                starting on Fleet Core.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)] transition",
                  plan.highlight
                    ? "border-primary/60 ring-1 ring-primary/40 shadow-[var(--shadow-elevated)]"
                    : "border-border/60",
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground shadow-[var(--shadow-soft)]">
                    {plan.badge}
                  </span>
                )}
                <header>
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.range}</p>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.priceUnit}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{plan.contract}</p>
                  {plan.setup && (
                    <p className="mt-1 text-xs text-muted-foreground">{plan.setup}</p>
                  )}
                </header>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link to="/auth">
                    <Button
                      className="w-full rounded-full"
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Annual prepay saves 10%.</span>{" "}
            <span className="font-medium text-foreground">18-month prepay saves 15%.</span>
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur md:grid-cols-3 md:p-8">
            {trustItems.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <CTA />
      </main>
    </div>
  );
}
