import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/MarketingHeader";

export const Route = createFileRoute("/pricing/compare")({
  head: () => ({
    meta: [
      { title: "Compare Plans — TruckDispatchAI" },
      {
        name: "description",
        content:
          "Detailed feature-by-feature comparison of TruckDispatchAI plans: Starter Solo, Fleet Core, Fleet Pro, and Fleet Enterprise.",
      },
      { property: "og:title", content: "Compare Plans — TruckDispatchAI" },
      {
        property: "og:description",
        content:
          "See exactly what's included in each TruckDispatchAI plan, side by side.",
      },
    ],
  }),
  component: ComparePage,
});

type Row = { label: string; values: [string, string, string, string] };

const sections: { title: string; rows: Row[] }[] = [
  {
    title: "Pricing & contract",
    rows: [
      {
        label: "Base price",
        values: ["$25/mo", "$35/truck/mo", "$49/truck/mo", "$69/truck/mo"],
      },
      {
        label: "Fleet size",
        values: ["1 truck", "2–15 trucks", "16–75 trucks", "76–500 trucks"],
      },
      {
        label: "Contract",
        values: ["Month-to-month", "18 months", "18 months", "18 months"],
      },
      {
        label: "Setup fee",
        values: ["$99", "from $299", "from $799", "from $2,500"],
      },
    ],
  },
  {
    title: "AI agents",
    rows: [
      {
        label: "AI Super Dispatcher™",
        values: ["—", "Included", "Included", "Included"],
      },
      {
        label: "Truck Support Agent",
        values: ["—", "Included", "Included", "Included"],
      },
      {
        label: "Document AI",
        values: ["—", "Included", "Included", "Included"],
      },
      {
        label: "Custom AI configuration",
        values: ["—", "—", "—", "Included"],
      },
    ],
  },
  {
    title: "Operations",
    rows: [
      {
        label: "GPS tracking",
        values: ["✓", "✓", "✓", "✓"],
      },
      {
        label: "Driver comms",
        values: ["✓", "✓", "✓", "✓"],
      },
      {
        label: "Document upload",
        values: ["✓", "✓", "✓", "✓"],
      },
      {
        label: "Smart dispatch board",
        values: ["—", "✓", "✓", "✓"],
      },
      {
        label: "Trailer tracking",
        values: ["—", "—", "✓", "✓"],
      },
      {
        label: "Dashcam service",
        values: ["—", "—", "✓", "✓"],
      },
      {
        label: "ELD integration",
        values: ["—", "—", "✓", "✓"],
      },
    ],
  },
  {
    title: "Support & access",
    rows: [
      {
        label: "Email support",
        values: ["✓", "✓", "✓", "✓"],
      },
      {
        label: "Phone support",
        values: ["—", "—", "✓", "✓"],
      },
      {
        label: "Dedicated CSM",
        values: ["—", "—", "—", "✓"],
      },
      {
        label: "Full API access",
        values: ["—", "—", "—", "✓"],
      },
    ],
  },
];

const planNames = ["Starter Solo", "Fleet Core", "Fleet Pro", "Fleet Enterprise"];

function ComparePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Compare plans
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Every feature, side by side.
          </p>
          <Link
            to="/pricing"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to pricing
          </Link>
        </div>

        <div className="mt-12 overflow-x-auto rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-6 py-4 text-left font-semibold">Feature</th>
                {planNames.map((name, i) => (
                  <th
                    key={name}
                    className={
                      "px-6 py-4 text-left font-semibold " +
                      (i === 1 ? "text-primary" : "")
                    }
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
                      className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr
                      key={section.title + row.label}
                      className="border-t border-border/40"
                    >
                      <td className="px-6 py-3 text-foreground/90">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td
                          key={i}
                          className={
                            "px-6 py-3 " +
                            (v === "—"
                              ? "text-muted-foreground"
                              : "text-foreground")
                          }
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
