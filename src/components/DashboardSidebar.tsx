import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import {
  LayoutGrid,
  Map,
  Truck,
  Users,
  Bell,
  FileText,
  Sparkles,
  Settings,
  Store,
  LogOut,
  Route as RouteIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const nav = [
  { label: "Overview", icon: LayoutGrid, to: "/dispatch" as const },
  { label: "Trips", icon: RouteIcon, to: "/trips" as const },
  { label: "Live map", icon: Map },
  { label: "Vehicles", icon: Truck },
  { label: "Drivers", icon: Users },
  { label: "Alerts", icon: Bell },
  { label: "Documents", icon: FileText },
  { label: "Copilots", icon: Sparkles },
  { label: "Marketplace", icon: Store },
];

export function DashboardSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Account";
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border/60 bg-card/40 p-4 lg:flex">
      <div className="px-2 py-2">
        <Logo />
      </div>
      <nav className="mt-6 flex flex-1 flex-col gap-0.5">
        {nav.map((item) => {
          const inner = (
            <>
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                  {item.badge}
                </span>
              )}
            </>
          );
          const className = `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
            item.active
              ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
              : "text-muted-foreground hover:bg-card hover:text-foreground"
          }`;
          return item.to ? (
            <Link key={item.label} to={item.to} className={className}>
              {inner}
            </Link>
          ) : (
            <button key={item.label} type="button" className={`${className} text-left`}>
              {inner}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-card hover:text-foreground"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
          Settings
        </button>

        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/60 bg-card p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{fullName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-foreground"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  );
}
