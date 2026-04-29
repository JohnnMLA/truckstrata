import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary-foreground">
          <path
            d="M3 7h11v8H3V7zm0 0l2-3h7l2 3M14 10h4l3 4v1h-7v-5z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="17" r="1.6" fill="currentColor" />
          <circle cx="17" cy="17" r="1.6" fill="currentColor" />
        </svg>
      </div>
      <span className="text-base font-semibold tracking-tight text-foreground">
        TruckDispatchAI
      </span>
    </Link>
  );
}
