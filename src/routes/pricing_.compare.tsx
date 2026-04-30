import { Fragment } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Minus,
  ArrowLeft,
  LockOpen,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing_/compare")({
  head: () => ({
    meta: [
      { title: "Compare All Plans — TruckDispatchAI" },
      {
        name: "description",
        content:
          "Full feature comparison of TruckDispatchAI plans plus a side-by-side competitor comparison vs Samsara, Motive, Verizon Connect, Geotab, and Azuga.",
      },
      { property: "og:title", content: "Compare All Plans — TruckDispatchAI" },
      {
        property: "og:description",
        content:
          "Every feature, every plan, plus how we compare to Samsara, Motive, Verizon Connect, Geotab, and Azuga.",
      },
    ],
  }),
  component: ComparePage,
});

type Cell = "yes" | "no" | { text: string; bold?: boolean; tone?: "green" };
type Row = { label: string; values: [Cell, Cell, Cell, Cell] };

const planNames = ["Owner-Operator", "Fleet Core", "Fleet Pro", "Fleet Enterprise"];

const sections: { title: string; subtitle?: string; rows: Row[] }[] = [
  {
    title: "Core Platform",
    rows: [
      { label: "Real-time GPS tracking", values: ["yes", "yes", "yes", "yes"] },
      { label: "Smart dispatch board", values: ["no", "yes", "yes", "yes"] },
      { label: "Built-in driver comms", values: ["yes", "yes", "yes", "yes"] },
      {
        label: "Document AI",
        values: [{ text: "Limited" }, "yes", "yes", "yes"],
      },
      { label: "Geofences and alerts", values: ["yes", "yes", "yes", "yes"] },
      { label: "Live fleet map", values: ["yes", "yes", "yes", "yes"] },
      { label: "Mobile driver app", values: ["yes", "yes", "yes", "yes"] },
    ],
  },
  {
    title: "AI Agents",
    subtitle: "Included in every paid plan. Never an add-on.",
    rows: [
      {
        label: "AI Super Dispatcher™",
        values: [
          "no",
          { text: "Included", bold: true },
          { text: "Included", bold: true },
          { text: "Included", bold: true },
        ],
      },
      {
        label: "Truck Support Agent",
        values: [
          { text: "Basic" },
          { text: "Included", bold: true },
          { text: "Included", bold: true },
          { text: "Included", bold: true },
        ],
      },
      {
        label: "Customer Service Agent",
        values: [
          "no",
          { text: "Phase 2" },
          { text: "Phase 2" },
          { text: "Phase 2" },
        ],
      },
      {
        label: "Severity-based approval rules",
        values: ["no", "yes", "yes", "yes"],
      },
      { label: "Full AI audit trail", values: ["no", "yes", "yes", "yes"] },
      { label: "90-day supervised mode", values: ["no", "yes", "yes", "yes"] },
    ],
  },
  {
    title: "Hardware",
    subtitle: "Customer-owned forever. Never leased.",
    rows: [
      {
        label: "GPS OBD-II Tracker — $129 one-time",
        values: ["yes", "yes", "yes", "yes"],
      },
      {
        label: "Trailer Battery Tracker — $129 + $12/mo",
        values: ["yes", "yes", "yes", "yes"],
      },
      {
        label: "Single-channel AI Dashcam — $179 + $15/mo",
        values: ["yes", "yes", "yes", "yes"],
      },
      {
        label: "Dual-channel AI Dashcam — $249 + $19/mo",
        values: ["yes", "yes", "yes", "yes"],
      },
      {
        label: "Self-install in under 30 minutes",
        values: ["yes", "yes", "yes", "yes"],
      },
      {
        label: "Hardware stays with you if you ever leave",
        values: [
          { text: "Yes", bold: true, tone: "green" },
          { text: "Yes", bold: true, tone: "green" },
          { text: "Yes", bold: true, tone: "green" },
          { text: "Yes", bold: true, tone: "green" },
        ],
      },
    ],
  },
  {
    title: "Contract & Pricing",
    rows: [
      {
        label: "Contract length",
        values: [
          { text: "18 months" },
          { text: "18 months" },
          { text: "18 months" },
          { text: "18 months" },
        ],
      },
      {
        label: "Save 20% with 18-Month Plan",
        values: ["yes", "yes", "yes", "yes"],
      },
      {
        label: "Pay in 3 installments — same 20% discount",
        values: ["no", "yes", "yes", "yes"],
      },
      {
        label: "Early termination — 50% remaining (half of Samsara)",
        values: ["yes", "yes", "yes", "yes"],
      },
      {
        label: "30-day money-back guarantee from AI activation",
        values: ["yes", "yes", "yes", "yes"],
      },
      {
        label: "Support",
        values: [
          { text: "Email" },
          { text: "Email + Chat" },
          { text: "Phone + Email" },
          { text: "Dedicated CSM" },
        ],
      },
      {
        label: "API access",
        values: [
          "no",
          "no",
          "yes",
          { text: "Full + Webhooks", bold: true },
        ],
      },
    ],
  },
];

type CompetitorRow = {
  label: string;
  samsara: string;
  motive: string;
  verizon: string;
  geotab: string;
  azuga: string;
  truck: { text: string; bold?: boolean };
};

const competitorRows: CompetitorRow[] = [
  {
    label: "Monthly price per truck",
    samsara: "$27–$60",
    motive: "$25–$35",
    verizon: "$23–$45",
    geotab: "Quote only",
    azuga: "$25–$35",
    truck: { text: "$25–$69 — AI included", bold: true },
  },
  {
    label: "Contract length",
    samsara: "36 months",
    motive: "12 months",
    verizon: "36 months",
    geotab: "Varies",
    azuga: "Flexible",
    truck: { text: "18 months", bold: true },
  },
  {
    label: "Hardware",
    samsara: "Leased — return at end",
    motive: "Leased — return at end",
    verizon: "Leased — return at end",
    geotab: "Leased",
    azuga: "Leased",
    truck: { text: "OWNED — keep forever", bold: true },
  },
  {
    label: "AI agents",
    samsara: "Add-on, extra cost",
    motive: "No autonomous dispatcher",
    verizon: "Minimal AI",
    geotab: "None",
    azuga: "None",
    truck: { text: "INCLUDED in all paid plans", bold: true },
  },
  {
    label: "Early termination",
    samsara: "100% remaining",
    motive: "Full balance",
    verizon: "Full balance",
    geotab: "Varies",
    azuga: "Low",
    truck: { text: "50% remaining", bold: true },
  },
  {
    label: "Money-back guarantee",
    samsara: "None",
    motive: "None",
    verizon: "None",
    geotab: "None",
    azuga: "None",
    truck: { text: "30 days from AI activation", bold: true },
  },
  {
    label: "New hardware = new contract",
    samsara: "Yes",
    motive: "Yes",
    verizon: "Yes",
    geotab: "Yes",
    azuga: "Yes",
    truck: { text: "No — buy devices anytime", bold: true },
  },
];

const addOns = [
  "IFTA automation — $29/mo per company",
  "Extra user seats — $15/user/mo",
  "CARB compliance (California) — $39/mo per company",
  "AI Customization Tier 2 — custom agent prompts — $499–$1,500 one-time",
  "AI Customization Tier 3 — industry-specific templates (Phase 2) — $2,500–$5,000",
];

const switchCards = [
  {
    Icon: LockOpen,
    title: "Your Contract Already Expired",
    body:
      "Zero setup fee. Hardware ships in 3 days. Self-install in under 30 minutes. Running on AI by Friday.",
    cta: "Switch Now — Zero Setup Fee",
  },
  {
    Icon: ShieldCheck,
    title: "You Have a Hardware Return Bill",
    body:
      "Show us your non-return penalty notice. We credit up to $1,500 toward your first invoice. Zero setup fee on top.",
    cta: "Claim Your $1,500 Credit",
  },
  {
    Icon: CalendarCheck,
    title: "You're Still Mid-Contract",
    body:
      "Sign today and lock in your pricing now. We activate your account immediately so your team learns the system. Billing starts the day your old contract ends.",
    cta: "Lock In My Rate Today",
  },
];

function CellContent({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === "no") {
    return <Minus className="h-4 w-4 text-muted-foreground/60" />;
  }
  return (
    <span
      className={cn(
        "text-sm",
        value.bold ? "font-semibold" : "font-normal",
        value.tone === "green" ? "text-[#15803D]" : "text-foreground/90",
      )}
    >
      {value.text}
    </span>
  );
}

function ComparePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main>
        {/* Header */}
        <section className="mx-auto max-w-7xl px-6 pt-16 pb-8 md:pt-20">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pricing
          </Link>
          <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Compare All Plans and See How We Stack Up Against the Competition.
          </h1>
        </section>

        {/* Section 1 — Plan comparison */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="w-[30%] px-6 py-4 text-sm font-semibold text-foreground">
                      Feature
                    </th>
                    {planNames.map((p) => (
                      <th
                        key={p}
                        className="px-4 py-4 text-center text-sm font-semibold text-foreground"
                      >
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => (
                    <Fragment key={section.title}>
                      <tr className="bg-muted/20">
                        <td colSpan={5} className="px-6 py-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                            {section.title}
                          </p>
                          {section.subtitle && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {section.subtitle}
                            </p>
                          )}
                        </td>
                      </tr>
                      {section.rows.map((row, i) => (
                        <tr
                          key={`${section.title}-${row.label}`}
                          className={cn(
                            "border-t border-border/40",
                            i % 2 === 1 && "bg-muted/10",
                          )}
                        >
                          <td className="px-6 py-3 text-sm text-foreground/90">
                            {row.label}
                          </td>
                          {row.values.map((v, idx) => (
                            <td
                              key={idx}
                              className="px-4 py-3 text-center align-middle"
                            >
                              <CellContent value={v} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 2 — Competitor table */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            How We Compare to Samsara, Motive, Verizon, Geotab and Azuga.
          </h2>
          <div className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="w-[22%] px-5 py-4 text-sm font-semibold text-foreground"></th>
                    <th className="px-3 py-4 text-center text-sm font-semibold text-foreground">
                      Samsara
                    </th>
                    <th className="px-3 py-4 text-center text-sm font-semibold text-foreground">
                      Motive
                    </th>
                    <th className="px-3 py-4 text-center text-sm font-semibold text-foreground">
                      Verizon Connect
                    </th>
                    <th className="px-3 py-4 text-center text-sm font-semibold text-foreground">
                      Geotab
                    </th>
                    <th className="px-3 py-4 text-center text-sm font-semibold text-foreground">
                      Azuga
                    </th>
                    <th
                      className="px-3 py-4 text-center text-sm font-bold text-primary"
                      style={{ backgroundColor: "#EFF6FF" }}
                    >
                      TruckDispatchAI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competitorRows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={cn(
                        "border-t border-border/40",
                        i % 2 === 1 && "bg-muted/10",
                      )}
                    >
                      <td className="px-5 py-3 text-sm font-medium text-foreground">
                        {row.label}
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-foreground/80">
                        {row.samsara}
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-foreground/80">
                        {row.motive}
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-foreground/80">
                        {row.verizon}
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-foreground/80">
                        {row.geotab}
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-foreground/80">
                        {row.azuga}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-3 text-center text-sm",
                          row.truck.bold ? "font-bold text-primary" : "text-foreground",
                        )}
                        style={{ backgroundColor: "#EFF6FF" }}
                      >
                        {row.truck.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3 — Add-Ons */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            Optional Add-Ons.
          </h2>
          <ul className="mt-6 divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
            {addOns.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 px-6 py-4 text-sm text-foreground/90"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 4 — Switch Program */}
        <section
          className="px-6 py-16 md:py-20"
          style={{ backgroundColor: "#0F172A" }}
        >
          <div className="mx-auto max-w-7xl text-white">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Trapped in a Samsara, Motive or Verizon Contract? We Will Get You Out.
            </h2>
            <p className="mt-4 max-w-3xl text-base text-white/75 sm:text-lg">
              Most fleets want to switch but feel stuck. We built a program to
              remove every obstacle. Pick the option that fits your situation.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {switchCards.map(({ Icon, title, body, cta }) => (
                <article
                  key={title}
                  className="flex flex-col rounded-2xl p-6 shadow-lg"
                  style={{ backgroundColor: "#1E3A5F" }}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-white/80">
                    {body}
                  </p>
                  <a href="mailto:hello@truckdispatchai.com?subject=Switch%20Program" className="mt-6">
                    <Button
                      className="w-full rounded-full font-semibold text-white"
                      style={{ backgroundColor: "#2563EB" }}
                    >
                      {cta}
                    </Button>
                  </a>
                </article>
              ))}
            </div>

            <p className="mt-10 max-w-4xl text-xs leading-relaxed text-white/60">
              Switch Program terms: Hardware return credit up to $1,500 per
              fleet. Requires proof of non-return penalty from prior provider.
              Zero setup fee for verified switchers from Samsara, Motive,
              Verizon Connect, Geotab or Azuga. 18-month TruckDispatchAI
              contract required. 30-day money-back guarantee applies from Agent
              Activation Date.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col items-start gap-6 rounded-3xl border border-border/60 bg-card p-8 shadow-[var(--shadow-soft)] md:flex-row md:items-center md:justify-between md:p-10">
            <p
              className="max-w-2xl text-lg font-bold sm:text-xl"
              style={{ color: "#0F172A" }}
            >
              Questions about switching? Talk to an Account Partner — we will
              map out your exact switching cost and timeline in 20 minutes.
            </p>
            <a href="mailto:hello@truckdispatchai.com?subject=20-Minute%20Switch%20Call">
              <Button size="lg" className="rounded-full px-8 font-semibold">
                Book a 20-Minute Switch Call
              </Button>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
