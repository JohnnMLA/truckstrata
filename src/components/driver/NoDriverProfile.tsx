import { useNavigate } from "@tanstack/react-router";
import { CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

interface Props {
  email: string;
  onSignOut: () => Promise<void>;
}

export function NoDriverProfile({ email, onSignOut }: Props) {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card p-6 text-center shadow-[var(--shadow-soft)]">
        <div className="mx-auto mb-3 flex justify-center">
          <Logo />
        </div>
        <CircleDashed className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
        <h1 className="text-lg font-semibold text-foreground">No driver profile linked</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account ({email}) isn't connected to a driver record yet. Ask your dispatcher to link
          you, or open the dispatcher dashboard.
        </p>
        <div className="mt-5 grid gap-2">
          <Button onClick={() => navigate({ to: "/dispatch" })}>Go to dispatch</Button>
          <Button variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
