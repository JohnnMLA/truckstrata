import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, ArrowRight, Truck, Users, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ts:welcome-banner-dismissed";

interface Props {
  /** When true, show the banner. Parent decides based on data state. */
  show: boolean;
}

/**
 * First-run welcome banner shown on the dispatch page until the operator
 * dismisses it. Persisted per-browser via localStorage.
 */
export function WelcomeBanner({ show }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (!show || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  }

  return (
    <div className="mx-6 mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-4 p-5">
        <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary sm:grid">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Welcome to TruckStrata
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Three quick steps to get rolling — your dashboard comes alive as
                soon as you have a truck and a trip.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mt-1 -mr-1 h-7 w-7 shrink-0"
              onClick={dismiss}
              aria-label="Dismiss welcome"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <ol className="mt-4 grid gap-2 sm:grid-cols-3">
            <Step
              n={1}
              icon={Truck}
              label="Add your first truck"
              to="/settings"
            />
            <Step
              n={2}
              icon={Users}
              label="Invite a driver"
              to="/settings"
            />
            <Step
              n={3}
              icon={Map}
              label="Plan your first trip"
              to="/trips"
            />
          </ol>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  label,
  to,
}: {
  n: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 transition hover:border-primary/40 hover:bg-primary/5"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
          {n}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
        <span className="flex-1 text-xs font-medium text-foreground">{label}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </Link>
    </li>
  );
}
