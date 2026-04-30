import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus } from "lucide-react";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing/compare")({
  head: () => ({
    meta: [
      { title: "Compare All Plans — TruckDispatchAI" },
      {
        name: "description",
        content:
          "Full feature comparison of TruckDispatchAI plans plus a side-by-side competitor comparison vs Samsara, Motive, and Verizon Connect.",
      },
      { property: "og:title", content: "Compare All Plans — TruckDispatchAI" },
      {
        property: "og:description",
        content:
          "Every feature, every plan, plus how we compare to Samsara, Motive, and Verizon Connect.",
      },
    ],
  }),
  component: ComparePage,
});

type Cell = "yes" | "no" | string;
type Row = { label: string; values: [Cell, Cell, Cell, Cell] };

const planNames = ["Owner-Operator", "Fleet Core", "Fleet Pro", "Fleet Enterprise"];

const sections: { title: string; subtitle?: string; rows: Row[] }[] = [
  {
    title: "Core Platform",
    rows: [
      { label: "Real-time GPS tracking", values: ["yes", "yes", "yes", "yes"] },
      { label: "Smart dispatch board", values: ["no", "yes", "yes", "yes"] },
      { label: "Built-in driver comms", values: ["yes", "yes", "yes", "yes"] },
      { label: "Document AI upload", values: ["Limited", "yes", "yes", "yes"] },
      { label: "Geofences and alerts", values: ["yes", "yes", "yes", "yes"] },
      { label: "Live fleet map", values: ["yes", "yes", "yes", "yes"] },
      { label: "Mobile driver app", values: ["yes", "yes", "yes", "yes"] },
    ],
  },
  {
    title: "AI Agents",
    subtitle: "Included in all paid plans — never an add-on",
    rows: [
      { label: "AI Super Dispatcher™", values: ["no", "Included", "Included", "Included"] },
      { label: "Truck Support Agent", values: ["Basic", "Included", "Included", "Included"] },
      { label: "Customer Service Agent", values: ["no", "Phase 2", "Phase 2", "Phase 2"] },
      { label: "Severity-based approval rules", values: ["no", "yes", "yes", "yes"] },
      { label: "Full audit trail for every AI action", values: ["no", "yes", "yes", "yes"] },
      { label: "90-day supervised mode for new fleets", values: ["no", "yes", "yes", "yes"] },
    ],
  },
  {
    title: "Hardware",
    subtitle: "Customer-owned forever — never leased",
    rows: [
      { label: "GPS OBD-II Tracker — $129 one-time", values: ["yes", "yes", "yes", "yes"] },
      { label: "Trailer Battery Tracker — $129 + $12/mo", values: ["yes", "yes", "yes", "yes"] },
      { label: "Single-channel AI Dashcam — $179 + $15/mo", values: ["yes", "yes", "yes", "yes"] },
      { label: "Dual-channel AI Dashcam — $249 + $19/mo", values: ["yes", "yes", "yes", "yes"] },
      { label: "Self-install in under 30 minutes", values: ["yes", "yes", "yes", "yes"] },
      { label: "Hardware is yours if you ever leave", values: ["yes", "yes", "yes", "yes"] },
    ],
  },
  {
    title: "Contract and Support",
    rows: [
      { label: "Contract length", values: ["18 months", "18 months", "18 months", "18 months"] },
      {
        label: "Early termination fee",
        values: [
          "50% remaining",
          "50% remaining",
          "50% remaining",
          "50% remaining",
        ],
      },
      { label: "18-Month Plan discount", values: ["Save 20%", "Save 20%", "Save 20%", "Save 20%"] },
      { label: "Pay in 3 installments over first 3 months", values: ["yes", "yes", "yes", "yes"] },
      { label: "30-day money-back guarantee from AI activation", values: ["yes", "yes", "yes", "yes"] },
      {
        label: "Support level",
        values: ["Email", "Email + Chat", "Phone + Email", "Dedicated CSM"],
      },
      {
        label: "API access",
        values: ["no", "no", "yes", "Full + Webhooks"],
      },
    ],
  },
];

function CellContent({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-muted text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  }
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

const competitorRows: { label: string; values: [string, string, string, string] }[] = [
  {
    label: "Monthly price per truck",
    values: ["$27–$60", "$25–$35", "$23–$45", "$25–$69 (AI included)"],
  },
  {
    label: "Contract length",
    values: ["36 months", "12 months", "36 months", "18 months"],
  },
  {
    label: "Hardware",
    values: [
      "Leased — return at end",
      "Leased — return at end",
      "Leased — return at end",
      "OWNED — keep forever",
    ],
  },
  {
    label: "AI agents included",
    values: [
      "Add-on cost extra",
      "No autonomous dispatcher",
      "Minimal AI",
      "INCLUDED in all paid plans",
    ],
  },
  {
    label: "Early termination fee",
    values: [
      "100% remaining balance",
      "Full balance",
      "Full balance",
      "50% remaining balance",
    ],
  },
  {
    label: "Money-back guarantee",
    values: ["None", "None", "None", "30 days from AI activation"],
  },
  {
    label: "Switch penalty",
    values: [
      "Return hardware + full contract cost",
      "Return hardware",
      "Return hardware + full contract",
      "Keep your hardware — we cover your exit",
    ],
  },
];

const competitors = ["Samsara", "Motive", "Verizon Connect", "TruckDispatchAI"];

const addOns = [
  "IFTA automation — $29/mo per company",
  "Extra user seats — $15/user/mo",
  "CARB compliance (CA) — $39/mo per company",
  "AI Customization Tier 2 — $499–$1,500 one-time",
  "AI Customization Tier 3 — coming Phase 2 — $2,500–$5,000",
];

const switchCards = [
  {
    title: "Your Contract Already Expired",
    body: "Zero setup fee. Hardware ships in 3 days. You are running on AI by Friday.",
    cta: "Switch Now — Zero Setup Fee",
  },
  {
    title: "You Have a Hardware Return Bill",
    body: "Show us your non-return penalty notice. We credit up to $1,500 toward your first invoice. Zero setup fee on top.",
    cta: "Claim Your $1,500 Credit",
  },
  {
    title: "You Are Still Mid-Contract",
    body: "Sign today and lock in your pricing now. We activate your account immediately so you can learn the system. Your billing starts the day your old contract ends.",
    cta: "Lock In My Rate Today",
  },
];

function ComparePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            to="/pricing"
            className="mb-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to Pricing
          </Link>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Compare All Plans Side by Side
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Every feature, every plan — plus how we stack up against the competition.
          </p>
        </div>

        {/* Plan comparison table */}
        <div className="mt-12 overflow-x-auto rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-6 py-4 text-left font-semibold">Feature</th>
                {planNames.map((name, i) => (
                  <th
                    key={name}
                    className={cn(
                      "px-6 py-4 text-left font-semibold",
                      i === 1 && "text-primary",
                    )}
                  >
                    {name}
                    {i === 1 && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Popular
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <>
                  <tr key={section.title} className="bg-muted/20">
                    <td
                      colSpan={5}
                      className="px-6 py-3"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                        {section.title}
                      </div>
                      {section.subtitle && (
                        <div className="mt-0.5 text-[11px] font-normal normal-case text-muted-foreground">
                          {section.subtitle}
                        </div>
                      )}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr
                      key={section.title + row.label}
                      className="border-t border-border/40"
                    >
                      <td className="px-6 py-3 text-foreground/90">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-6 py-3">
                          <CellContent value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Competitor comparison */}
        <div className="mt-20">
          <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            How We Compare to the Competition
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
            Apples-to-apples on price, contract terms, hardware ownership, and AI.
          </p>

          <div className="mt-10 overflow-x-auto rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-6 py-4 text-left font-semibold"> </th>
                  {competitors.map((name, i) => {
                    const isUs = i === competitors.length - 1;
                    return (
                      <th
                        key={name}
                        className={cn(
                          "px-6 py-4 text-left font-semibold",
                          isUs && "bg-primary text-primary-foreground",
                        )}
                      >
                        {name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {competitorRows.map((row) => (
                  <tr key={row.label} className="border-t border-border/40">
                    <td className="px-6 py-3 font-medium text-foreground/90">
                      {row.label}
                    </td>
                    {row.values.map((v, i) => {
                      const isUs = i === row.values.length - 1;
                      return (
                        <td
                          key={i}
                          className={cn(
                            "px-6 py-3",
                            isUs
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add-ons */}
        <div className="mt-20">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Add-ons
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Optional extras you can layer onto any plan.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {addOns.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-sm shadow-[var(--shadow-soft)]"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Switch program callout */}
      <section className="bg-[#0b1220] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Trapped in a Samsara, Motive, or Verizon Contract?{" "}
              <span className="text-primary">We Will Get You Out.</span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {switchCards.map((c) => (
              <article
                key={c.title}
                className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/70">
                  {c.body}
                </p>
                <div className="mt-6">
                  <Link to="/auth">
                    <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                      {c.cta}
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-4xl text-center text-xs leading-relaxed text-white/60">
            Switch Program terms: Hardware return credit up to $1,500 per fleet.
            Requires proof of non-return penalty from prior provider. Zero setup
            fee applies to all verified switchers from Samsara, Motive, Verizon
            Connect, Geotab, or Azuga. 18-month TruckDispatchAI contract
            required. 30-day money-back guarantee applies from Agent Activation
            Date.
          </p>
        </div>
      </section>
    </div>
  );
}
