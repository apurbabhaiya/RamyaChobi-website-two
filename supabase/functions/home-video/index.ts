import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const bucket = "homepage-video";
const path = "featured.mp4";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { ...cors, "Cache-Control": "no-store" } });
}

function getSecret(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  return keys.default || keys.service_role || keys.serviceRole || Object.values(keys)[0] || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET" && req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const secret = getSecret();
    if (!url || !secret) return reply({ error: "Storage is unavailable" }, 503);

    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const files = admin.storage.from(bucket);

    if (req.method === "GET") {
      const { data, error } = await files.info(path);
      if (error?.status === 404 || error?.statusCode === "404") return reply({ videoUrl: null });
      if (error) throw error;
      const { data: { publicUrl } } = files.getPublicUrl(path);
      const videoUrl = new URL(publicUrl);
      videoUrl.searchParams.set("cacheNonce", data.version || data.etag || data.lastModified || "");
      return reply({ videoUrl: videoUrl.href });
    }

    const token = req.headers.get("x-admin-token")?.trim();
    if (!token || token.length > 256) return reply({ error: "Admin login required" }, 401);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const tokenHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    const { data: session, error: sessionError } = await admin
      .from("booking_admin_sessions")
      .select("expires_at")
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return reply({ error: "Admin session expired. Sign in again." }, 401);

    const { data, error } = await files.createSignedUploadUrl(path, { upsert: true });
    if (error) throw error;
    return reply({ path: data.path, token: data.token });
  } catch (error) {
    console.error("Homepage video request failed:", error instanceof Error ? error.message : "service error");
    return reply({ error: "Homepage video is temporarily unavailable" }, 503);
  }
});
