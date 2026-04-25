import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/MarketingHeader";
import { Hero } from "@/components/landing/Hero";
import { Pillars } from "@/components/landing/Pillars";
import { CTA } from "@/components/landing/CTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TruckStrata · The AI-native trucking OS" },
      {
        name: "description",
        content:
          "TruckStrata replaces Samsara and Motive with a calmer, smarter operating system for owner-operators and small fleets.",
      },
      { property: "og:title", content: "TruckStrata · The AI-native trucking OS" },
      {
        property: "og:description",
        content: "Live fleet tracking, AI dispatch copilots, and road intelligence — for half the cost.",
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
        <CTA />
      </main>
    </div>
  );
}
