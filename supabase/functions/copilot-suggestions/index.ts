// AI Dispatch Copilot — generates structured suggestions from live fleet data.
// Uses Lovable AI Gateway (Gemini) with tool calling for reliable JSON output.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUGGESTION_TOOL = {
  type: "function",
  function: {
    name: "emit_dispatch_suggestions",
    description:
      "Return 3 prioritized, actionable dispatch suggestions for the fleet operator based on live vehicles, drivers, trips, and alerts.",
    parameters: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["route", "dispatch", "fuel", "maintenance", "safety", "document"],
                description: "Domain of the suggestion.",
              },
              tag: {
                type: "string",
                description: "Short label like 'Route Copilot' or 'Fuel Copilot'.",
              },
              title: {
                type: "string",
                description: "Concrete one-line action with truck/driver references.",
              },
              body: {
                type: "string",
                description: "1–2 sentences explaining the impact and reasoning. Cite specific numbers from the data.",
              },
              cta: {
                type: "string",
                description: "Imperative button label, e.g. 'Reroute', 'Assign', 'Process'.",
              },
              vehicle_id: { type: "string", description: "Related vehicle UUID if any." },
              driver_id: { type: "string", description: "Related driver UUID if any." },
            },
            required: ["category", "tag", "title", "body", "cta"],
            additionalProperties: false,
          },
        },
      },
      required: ["suggestions"],
      additionalProperties: false,
    },
  },
};

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

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // RLS scopes everything to the caller's organization automatically.
    const [vehiclesRes, driversRes, tripsRes, alertsRes, maintRes] = await Promise.all([
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
          "id, reference, origin_label, destination_label, status, vehicle_id, driver_id, distance_miles, revenue_cents, scheduled_pickup_at",
        )
        .order("scheduled_pickup_at", { ascending: false, nullsFirst: false })
        .limit(20),
      supabase
        .from("alerts")
        .select("id, type, severity, title, message, vehicle_id, created_at")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("maintenance_schedules")
        .select("id, vehicle_id, kind, label, next_due_at, next_due_miles, last_service_at")
        .order("next_due_at", { ascending: true, nullsFirst: false })
        .limit(20),
    ]);

    if (vehiclesRes.error) throw vehiclesRes.error;
    if (driversRes.error) throw driversRes.error;
    if (tripsRes.error) throw tripsRes.error;
    if (alertsRes.error) throw alertsRes.error;
    if (maintRes.error) throw maintRes.error;

    const fleetSnapshot = {
      generated_at: new Date().toISOString(),
      vehicles: vehiclesRes.data ?? [],
      drivers: driversRes.data ?? [],
      recent_trips: tripsRes.data ?? [],
      open_alerts: alertsRes.data ?? [],
      maintenance_schedules: maintRes.data ?? [],
    };

    if (fleetSnapshot.vehicles.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], reason: "empty_fleet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `You are TruckStrata's AI Dispatch Copilot, an expert fleet operator.
You receive a JSON snapshot of a trucking fleet (vehicles, drivers, trips, alerts, maintenance schedules) and produce exactly 3 high-impact, actionable suggestions.

Rules:
- Reference real truck numbers (e.g. TRK-204) and driver names from the data.
- Cite real numbers: fuel %, HOS minutes, distances, revenue, miles to next service, days until DOT.
- Prioritize: critical safety/HOS > overdue maintenance > low fuel > unassigned trips > efficiency.
- Each suggestion must be something a dispatcher can act on in the next hour.
- Tags should match category: route → "Route Copilot", dispatch → "Dispatch Copilot", fuel → "Fuel Copilot", maintenance → "Maintenance Copilot", safety → "Safety Copilot", document → "Document Copilot".
- CTAs are short verbs: Reroute, Assign, Refuel, Schedule, Resolve, Process, Service.
- If data is sparse, still produce 3 plausible operational suggestions grounded in what's there.
- Always call the emit_dispatch_suggestions tool. Never reply in plain text.`;

    const userPrompt = `Live fleet snapshot:\n\`\`\`json\n${JSON.stringify(fleetSnapshot, null, 2)}\n\`\`\`\n\nGenerate 3 dispatch suggestions now.`;

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
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [SUGGESTION_TOOL],
          tool_choice: {
            type: "function",
            function: { name: "emit_dispatch_suggestions" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
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

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response", JSON.stringify(aiData));
      throw new Error("AI did not return structured suggestions");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        suggestions: parsed.suggestions ?? [],
        generated_at: fleetSnapshot.generated_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("copilot-suggestions error", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
