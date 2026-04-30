import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "./ui/button";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#platform" className="text-sm text-muted-foreground transition hover:text-foreground">
            Platform
          </a>
          <a href="#ai" className="text-sm text-muted-foreground transition hover:text-foreground">
            AI Copilots
          </a>
          <Link to="/pricing" className="text-sm text-muted-foreground transition hover:text-foreground">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="rounded-full">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
