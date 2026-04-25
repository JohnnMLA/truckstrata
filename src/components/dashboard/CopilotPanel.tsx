import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  ArrowRight,
  Fuel,
  Route,
  FileText,
  Wrench,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Suggestion = {
  category: "route" | "dispatch" | "fuel" | "maintenance" | "safety" | "document";
  tag: string;
  title: string;
  body: string;
  cta: string;
  vehicle_id?: string;
  driver_id?: string;
};

type SuggestionsResponse = {
  suggestions: Suggestion[];
  generated_at?: string;
  reason?: "empty_fleet";
  error?: string;
};

const categoryIcon: Record<Suggestion["category"], typeof Fuel> = {
  fuel: Fuel,
  route: Route,
  dispatch: ClipboardList,
  document: FileText,
  maintenance: Wrench,
  safety: ShieldAlert,
};

export function CopilotPanel() {
  const { user } = useAuth();

  const query = useQuery<SuggestionsResponse>({
    queryKey: ["copilot-suggestions", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<SuggestionsResponse>(
        "copilot-suggestions",
        { body: {} },
      );
      if (error) {
        // FunctionsHttpError carries the response status; surface friendly text.
        const msg = (error as { message?: string }).message ?? "Copilot failed";
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      return data!;
    },
  });

  const suggestions = query.data?.suggestions ?? [];
  const isEmptyFleet = query.data?.reason === "empty_fleet";
  const updatedLabel = query.data?.generated_at
    ? `Updated ${formatDistanceToNow(new Date(query.data.generated_at), { addSuffix: true })}`
    : query.isFetching
      ? "Thinking…"
      : "—";

  const handleAction = (s: Suggestion) => {
    toast.success(`${s.cta} queued`, { description: s.title });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI suggestions</h3>
        <span className="ml-auto text-xs text-muted-foreground">{updatedLabel}</span>
        <button
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
          aria-label="Refresh suggestions"
        >
          {query.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {query.isLoading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
          ))
        ) : query.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Couldn't load suggestions</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {(query.error as Error).message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 rounded-full text-xs"
                  onClick={() => query.refetch()}
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        ) : isEmptyFleet || suggestions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-4 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">
              Add vehicles to your fleet — the copilot will start generating suggestions.
            </p>
          </div>
        ) : (
          suggestions.map((s, idx) => {
            const Icon = categoryIcon[s.category] ?? Sparkles;
            return (
              <div
                key={`${s.title}-${idx}`}
                className="group rounded-xl border border-border/60 bg-background/60 p-3 transition hover:border-primary/30 hover:bg-card hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {s.tag}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{s.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAction(s)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:gap-2"
                >
                  {s.cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
