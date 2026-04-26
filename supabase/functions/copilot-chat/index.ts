// AI Dispatch Copilot Chat — streaming conversational answers grounded in live fleet data.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase env missing");

    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Pull live fleet snapshot (RLS-scoped to caller's org).
    const [vehiclesRes, driversRes, tripsRes, alertsRes] = await Promise.all([
      supabase
        .from("vehicles")
        .select(
          "id, truck_number, status, current_location_label, fuel_level_pct, last_ping_at, current_driver_id, odometer_miles",
        ),
      supabase
        .from("drivers")
        .select("id, full_name, status, hos_remaining_minutes, current_vehicle_id, license_expiry"),
      supabase
        .from("trips")
        .select(
          "id, reference, origin_label, destination_label, status, vehicle_id, driver_id, distance_miles, revenue_cents, scheduled_pickup_at, scheduled_delivery_at",
        )
        .order("scheduled_pickup_at", { ascending: false, nullsFirst: false })
        .limit(25),
      supabase
        .from("alerts")
        .select("id, type, severity, title, message, vehicle_id, driver_id, created_at")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    if (vehiclesRes.error) throw vehiclesRes.error;
    if (driversRes.error) throw driversRes.error;
    if (tripsRes.error) throw tripsRes.error;
    if (alertsRes.error) throw alertsRes.error;

    const fleetSnapshot = {
      generated_at: new Date().toISOString(),
      vehicles: vehiclesRes.data ?? [],
      drivers: driversRes.data ?? [],
      recent_trips: tripsRes.data ?? [],
      open_alerts: alertsRes.data ?? [],
    };

    const systemPrompt = `You are TruckStrata's AI Dispatch Copilot, an expert fleet operator assisting a dispatcher in real time.

You have access to a live JSON snapshot of the dispatcher's fleet (vehicles, drivers, trips, alerts). Use it to answer questions concretely.

Style:
- Reference real truck numbers (e.g. TRK-204) and driver names from the snapshot.
- Cite real numbers: fuel %, HOS minutes, distances, revenue (in $).
- Be concise. Prefer short paragraphs and bullet lists.
- If asked something the snapshot can't answer, say so honestly and suggest what data would help.
- Use markdown for structure (lists, **bold**, tables). Never wrap your whole answer in a code block.
- Today is ${new Date().toISOString().slice(0, 10)}.

Live fleet snapshot:
\`\`\`json
${JSON.stringify(fleetSnapshot, null, 2)}
\`\`\``;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      },
    );

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Settings → Workspace → Usage.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "AI gateway error", detail: txt }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("copilot-chat error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
