import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Twitter, Linkedin, ShieldCheck } from "lucide-react";

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com/truckdispatchai", Icon: Facebook },
  { label: "Instagram", href: "https://instagram.com/truckdispatchai", Icon: Instagram },
  { label: "X (Twitter)", href: "https://x.com/truckdispatchai", Icon: Twitter },
  { label: "LinkedIn", href: "https://linkedin.com/company/truckdispatchai", Icon: Linkedin },
];

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
          <Link to="/auth">
            <Button size="lg" className="rounded-full px-8">Start free trial</Button>
          </Link>
          <a href="mailto:hello@truckdispatchai.com?subject=TruckDispatchAI%20demo%20request">
            <Button size="lg" variant="outline" className="rounded-full px-8">
              Talk to sales
            </Button>
          </a>
        </div>
        <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          No credit card · Cancel anytime · Your data stays yours
        </p>
      </div>
      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          {socialLinks.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow TruckDispatchAI on ${label}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TruckDispatchAI, Inc. · truckdispatchai.com
        </p>
      </div>
    </section>
  );
}
