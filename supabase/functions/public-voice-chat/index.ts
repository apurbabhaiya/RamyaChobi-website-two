type Link = { label: string; href: string };
const origins = new Set([
  "https://ramyachobi-website-two.vercel.app",
  "https://ramyachobi-website-two-piufoto93-2719.vercel.app",
  "https://apurba-roy-three.vercel.app",
  "https://ramyachobi-client.vercel.app",
]);
const ipHits = new Map<string, number[]>();
function allowed(origin: string) {
  return origins.has(origin)
    || /^https:\/\/ramyachobi-website-[a-z0-9-]+-piufoto93-2719\.vercel\.app$/.test(origin)
    || /^https:\/\/ramyachobi-website-two-git-[a-z0-9-]+-piufoto93-2719\.vercel\.app$/.test(origin);
}
function replyEnglish(message: string) {
  const text = message.trim().toLowerCase();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/.test(text))
    return "Welcome to RamyaChobi! Are you looking for wedding photography, cinematography, or a casual photoshoot?";
  if (/price|cost|package|budget|how much|quote|quotation/.test(text))
    return "We offer regular, outdoor, and wedding photography packages. The current prices and approved discounts are shown on our Packages and Booking pages. Please enter your event details in Booking for an accurate estimate.";
  if (/book|reserve|date|availability|available/.test(text))
    return "Please select your event, location, date, and package on the Booking page. Our office verifies team availability, payment, and terms before confirming any booking.";
  if (/discount|offer|promo/.test(text))
    return "The current approved discount is shown in the Booking calculator. Our office must approve any additional discount.";
  if (/advance|deposit|payment|pay/.test(text))
    return "The Booking page shows the applicable advance and payment schedule. Payment verification and final confirmation are handled by our team.";
  if (/portfolio|sample|previous work|stories|show.*photo/.test(text))
    return "You can explore our published photography and event stories on the Portfolio page.";
  if (/gallery|download|delivery|my photos|face search/.test(text))
    return "You can access your own photos through the private Client Gallery or Delivery pages. This public assistant cannot access private client information.";
  if (/contact|human|person|whatsapp|phone|call/.test(text))
    return "You can contact our team via WhatsApp or call 01776044951.";
  if (/photo|video|wedding|cinema|holud|reception|birthday|event|drone/.test(text))
    return "RamyaChobi provides wedding, event, outdoor, and family photography and cinematography. Please explore the Packages and Portfolio pages to find a suitable option.";
  return "I can help with photography packages, booking requests, portfolio samples, and photo delivery. What would you like to know?";
}
function send(data: unknown, status: number, origin: string | null) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (origin && allowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(data), { status, headers });
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !allowed(origin)) return send({ reply: "Origin not allowed." }, 403, null);
  if (req.method === "OPTIONS") {
    if (!origin) return send({ reply: "Origin required." }, 403, null);
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "3600",
        "Vary": "Origin",
      },
    });
  }
  if (req.method !== "POST") return send({ reply: "Method not allowed." }, 405, origin);
  const key = req.headers.get("apikey");
  if (!key) return send({ reply: "API key required." }, 401, origin);
  const now = Date.now();
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].slice(0, 64);
  const hits = (ipHits.get(ip) || []).filter(value => now - value < 60_000);
  if (hits.length >= 12) return send({ reply: "Please try again in a minute." }, 429, origin);
  ipHits.set(ip, [...hits, now]);
  if (ipHits.size > 4000) ipHits.clear();
  let body: any;
  try {
    const text = await req.text();
    if (text.length > 5000) return send({ reply: "Request is too long." }, 413, origin);
    body = JSON.parse(text);
  } catch { return send({ reply: "Invalid request." }, 400, origin); }
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1200) return send({ reply: "Please enter a question of 1–1200 characters." }, 400, origin);
  const english = body?.language === "en";
  const links: Link[] = english
    ? [{ label: "View packages", href: "/packages" }, { label: "Booking calculator", href: "/booking" }, { label: "Portfolio", href: "/portfolio" }]
    : [{ label: "প্যাকেজ দেখুন", href: "/packages" }, { label: "বুকিং করুন", href: "/booking" }, { label: "পোর্টফোলিও", href: "/portfolio" }];
  if (english) return send({ reply: replyEnglish(message), links }, 200, origin);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://izfmwvqveiphyuufvxoq.supabase.co";
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") || key;
  const history: string[] = Array.isArray(body.history)
    ? body.history.filter((item: unknown) => typeof item === "string").slice(-8).map((item: string) => item.slice(0, 1200))
    : [];
  try {
    const upstream = await fetch(supabaseUrl + "/functions/v1/public-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": publishableKey },
      body: JSON.stringify({ message, history }),
      signal: AbortSignal.timeout(7500),
    });
    const response = await upstream.json();
    if (!upstream.ok) throw new Error("Upstream unavailable");
    return send({
      reply: typeof response?.reply === "string" ? response.reply : "এই মুহূর্তে উত্তর পাওয়া যাচ্ছে না।",
      links: Array.isArray(response?.links) ? response.links : links,
    }, 200, origin);
  } catch {
    return send({
      reply: "এই মুহূর্তে উত্তর পাওয়া যাচ্ছে না। আবার চেষ্টা করুন অথবা WhatsApp-এ যোগাযোগ করুন।",
      links,
    }, 503, origin);
  }
});
