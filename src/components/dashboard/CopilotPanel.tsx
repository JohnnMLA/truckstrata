import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
  Send,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "@tanstack/react-router";
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

type ChatMessage = { role: "user" | "assistant"; content: string };

const categoryIcon: Record<Suggestion["category"], typeof Fuel> = {
  fuel: Fuel,
  route: Route,
  dispatch: ClipboardList,
  document: FileText,
  maintenance: Wrench,
  safety: ShieldAlert,
};

const STARTER_PROMPTS = [
  "Which truck needs attention first?",
  "Any maintenance overdue?",
  "Unassigned trips I should plan?",
  "Summarize today's open alerts.",
];

// Routes the copilot is allowed to deep-link into.
const APP_ROUTES = new Set([
  "/trips",
  "/maintenance",
  "/schedule",
  "/analytics",
  "/driver",
  "/dispatch",
  "/settings",
]);

export function CopilotPanel() {
  const { user } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot-chat`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: next }),
        },
      );

      if (!resp.ok || !resp.body) {
        const errPayload = await resp.json().catch(() => ({ error: "Chat failed" }));
        if (resp.status === 429) {
          toast.error("Slow down — rate limit reached. Try again in a moment.");
        } else if (resp.status === 402) {
          toast.error("AI credits exhausted. Add credits in workspace settings.");
        } else {
          toast.error(errPayload.error ?? "Chat failed");
        }
        // remove the empty assistant placeholder
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: rDone } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantText += delta;
              setMessages((prev) =>
                prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantText } : m,
                ),
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast.error(e instanceof Error ? e.message : "Chat failed");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  const handleAction = (s: Suggestion) => {
    sendMessage(`Help me act on this: "${s.title}". ${s.body}`);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/60 p-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">AI Copilot</h3>
        <span className="ml-auto text-xs text-muted-foreground">{updatedLabel}</span>
        <button
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
          aria-label="Refresh suggestions"
        >
          {query.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Suggestions (collapsible) */}
      <div className="border-b border-border/60 p-4">
        <button
          onClick={() => setShowSuggestions((s) => !s)}
          className="mb-3 flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
        >
          Suggestions
          {showSuggestions ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
            {suggestions.length > 0 ? `${suggestions.length} ideas` : ""}
          </span>
        </button>

        {showSuggestions && (
          <div className="space-y-2.5">
            {query.isLoading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
              ))
            ) : query.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Couldn't load suggestions
                    </p>
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
                    className="group rounded-xl border border-border/60 bg-background/60 p-3 transition hover:border-primary/30 hover:bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                          {s.tag}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">
                          {s.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {s.body}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction(s)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:gap-2"
                    >
                      Ask copilot <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Chat thread */}
      <div className="flex flex-col">
        <div
          ref={scrollRef}
          className="max-h-[360px] min-h-[160px] overflow-y-auto px-4 py-3"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <MessageSquare className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">
                Ask anything about your fleet — pulls from live data.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "mr-auto max-w-[92%] rounded-2xl rounded-tl-sm bg-background/60 px-3 py-2 text-sm text-foreground"
                  }
                >
                  {m.role === "assistant" && !m.content ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Thinking…</span>
                    </div>
                  ) : m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_strong]:text-foreground">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children, ...props }) => {
                            const isInternal =
                              typeof href === "string" && APP_ROUTES.has(href);
                            if (isInternal) {
                              return (
                                <Link
                                  to={href as "/trips"}
                                  className="my-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary no-underline transition hover:bg-primary/15"
                                >
                                  {children}
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              );
                            }
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2 border-t border-border/60 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the copilot…"
            disabled={streaming}
            className="flex-1 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            {streaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
