import { Link } from "@tanstack/react-router";
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
} from "lucide-react";

const nav = [
  { label: "Overview", icon: LayoutGrid, to: "/dispatch" as const, active: true },
  { label: "Live map", icon: Map },
  { label: "Vehicles", icon: Truck },
  { label: "Drivers", icon: Users },
  { label: "Alerts", icon: Bell, badge: 3 },
  { label: "Documents", icon: FileText },
  { label: "Copilots", icon: Sparkles },
  { label: "Marketplace", icon: Store },
];

export function DashboardSidebar() {
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
      <button
        type="button"
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-card hover:text-foreground"
      >
        <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
        Settings
      </button>
    </aside>
  );
}
