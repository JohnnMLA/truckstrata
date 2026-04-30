import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ShieldCheck, Clock, Wallet, Package } from "lucide-react";
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

type BillingCycle = "18month" | "monthly";

// 18-month is the base price. Monthly adds a 15% premium.
const billingOptions: { id: BillingCycle; label: string; multiplier: number }[] = [
  { id: "18month", label: "18-Month plan", multiplier: 1 },
  { id: "monthly", label: "Monthly (+15%)", multiplier: 1.15 },
];

type Plan = {
  name: string;
  basePrice: number;
  priceUnit: string;
  range: string;
  contractNote: string;
  setup: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    name: "Starter Solo",
    basePrice: 25,
    priceUnit: "/mo",
    range: "1 truck",
    contractNote: "18-month plan length",
    setup: "Setup fee $99",
    features: [
      "GPS tracking",
      "Driver comms",
      "Document upload",
      "Mobile driver app",
      "No AI agents",
    ],
    cta: "Start with Solo",
  },
  {
    name: "Fleet Core",
    basePrice: 35,
    priceUnit: "/truck/mo",
    range: "2–15 trucks",
    contractNote: "18-month plan length",
    setup: "Setup fee from $299",
    highlight: true,
    badge: "Most popular",
    features: [
      "AI Super Dispatcher™ included",
      "Truck Support Agent included",
      "Smart dispatch board",
      "Document AI",
      "Built-in driver comms",
    ],
    cta: "Choose Fleet Core",
  },
  {
    name: "Fleet Pro",
    basePrice: 49,
    priceUnit: "/truck/mo",
    range: "16–75 trucks",
    contractNote: "18-month plan length",
    setup: "Setup fee from $799",
    features: [
      "Everything in Fleet Core",
      "Trailer tracking",
      "Dashcam service",
      "ELD integration",
      "Phone support",
    ],
    cta: "Choose Fleet Pro",
  },
  {
    name: "Fleet Enterprise",
    basePrice: 69,
    priceUnit: "/truck/mo",
    range: "76–500 trucks",
    contractNote: "18-month plan length",
    setup: "Setup fee from $2,500",
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
    title: "18-month plan length",
    body: "Half of Samsara's 36-month standard.",
  },
  {
    icon: Wallet,
    title: "50% early termination",
    body: "Versus Samsara's 100% remaining-balance penalty.",
  },
  {
    icon: ShieldCheck,
    title: "30-day money-back guarantee",
    body: "From AI activation date.",
  },
  {
    icon: Package,
    title: "Hardware is yours",
    body: "Never leased — you own it from day one.",
  },
];

function formatPrice(base: number, discount: number) {
  const v = base * (1 - discount);
  // Show whole dollars when clean, else 2 decimals
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
}

function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const activeDiscount =
    billingOptions.find((o) => o.id === cycle)?.discount ?? 0;

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
          <div className="mx-auto max-w-7xl px-6 pt-20 pb-10 md:pt-28">
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
                Pick a plan that fits your fleet size. AI Super Dispatcher™ is
                included starting on Fleet Core.
              </p>

              {/* Billing toggle */}
              <div
                role="tablist"
                aria-label="Billing cycle"
                className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-[var(--shadow-soft)] backdrop-blur"
              >
                {billingOptions.map((opt) => {
                  const active = cycle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setCycle(opt.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
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
                    <span className="text-4xl font-semibold tracking-tight tabular-nums">
                      {formatPrice(plan.basePrice, activeDiscount)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.priceUnit}
                    </span>
                  </div>
                  {activeDiscount > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="line-through">
                        ${plan.basePrice}
                        {plan.priceUnit}
                      </span>{" "}
                      <span className="font-medium text-primary">
                        save {Math.round(activeDiscount * 100)}%
                      </span>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {plan.contractNote}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.setup}</p>
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

          <div className="mt-8 text-center">
            <Link
              to="/pricing/compare"
              className="text-sm font-medium text-primary hover:underline"
            >
              Compare all features in detail →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-4 rounded-3xl border border-border/60 bg-card/60 p-6 backdrop-blur sm:grid-cols-2 lg:grid-cols-4 md:p-8">
            {trustItems.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
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
