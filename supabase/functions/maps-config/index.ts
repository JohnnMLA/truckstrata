// Returns the Google Maps API key for browser use.
// Key is publishable (protected by HTTP referrer restrictions in Google Cloud Console).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ apiKey }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Cache aggressively — key rarely changes.
      "Cache-Control": "public, max-age=3600",
    },
  });
});
