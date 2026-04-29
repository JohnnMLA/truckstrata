import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Hero } from "@/components/landing/Hero";
import { Pillars } from "@/components/landing/Pillars";
import { Copilots } from "@/components/landing/Copilots";
import { CTA } from "@/components/landing/CTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TruckDispatchAI · Run Your Fleet With Agents, Not Headaches" },
      {
        name: "description",
        content:
          "TruckDispatchAI's AI Super Dispatcher™ runs trips, drivers, and maintenance for owner-operators and small fleets.",
      },
      { property: "og:title", content: "TruckDispatchAI · Run Your Fleet With Agents, Not Headaches" },
      {
        property: "og:description",
        content: "Meet AI Super Dispatcher™ — the autonomous trucking OS for small fleets.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main>
        <Hero />
        <Pillars />
        <Copilots />
        <CTA />
      </main>
    </div>
  );
}
