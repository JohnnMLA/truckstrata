import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron-invoked endpoint that "sends" all scheduled reminders that have come
 * due. Since this is in-app only for MVP, sending = stamping `sent_at` so the
 * realtime stream pushes them to dashboards and the bell.
 *
 * Auth: pg_cron passes the project anon key as a Bearer token, which we use
 * to construct an RLS-respecting Supabase client. Without a JWT, this client
 * will only see/modify rows that anon RLS allows — which currently is none.
 * That's fine: we use the service role here because cron has no user context.
 */
export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.toLowerCase().startsWith("bearer ")
          ? auth.slice(7).trim()
          : null;
        if (!token) {
          return json({ error: "Missing authorization" }, 401);
        }
        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey =
          process.env.SUPABASE_ANON_KEY ??
          process.env.SUPABASE_PUBLISHABLE_KEY ??
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !serviceKey) {
          return json({ error: "Server not configured" }, 500);
        }
        // Constant-time-ish check: token must match either the anon/publishable
        // key or the service role key. Without this, anyone hitting the public
        // route with any Bearer string could trigger reminder dispatch.
        const expected = [anonKey, serviceKey].filter(Boolean) as string[];
        const ok = expected.some(
          (k) => k.length === token.length && timingSafeEqual(k, token),
        );
        if (!ok) {
          return json({ error: "Unauthorized" }, 401);
        }
        const supabase = createClient(url, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from("notifications")
          .update({ sent_at: nowIso })
          .is("sent_at", null)
          .lte("scheduled_for", nowIso)
          .select("id");

        if (error) {
          console.error("send-reminders error:", error);
          return json({ error: error.message }, 500);
        }
        return json({ ok: true, delivered: data?.length ?? 0 });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Length-constant string comparison to avoid leaking key bytes via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
