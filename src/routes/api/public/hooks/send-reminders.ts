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
        if (!auth?.startsWith("Bearer ")) {
          return json({ error: "Missing authorization" }, 401);
        }
        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
          return json({ error: "Server not configured" }, 500);
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
