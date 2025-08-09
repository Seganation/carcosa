export interface Env {
  CARCOSA_BASE_URL: string; // e.g. https://api.example.com
  CARCOSA_TOKEN?: string;   // optional bearer token
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const upstream = new URL(env.CARCOSA_BASE_URL);
    upstream.pathname = "/api/v1/transform"; // pass-through if needed; or forward full path from client
    upstream.search = url.search;

    const cacheKey = new Request(upstream.toString(), { method: "GET" });
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const headers: HeadersInit = {};
    if (env.CARCOSA_TOKEN) headers["authorization"] = `Bearer ${env.CARCOSA_TOKEN}`;
    const res = await fetch(upstream.toString(), { headers });
    if (res.ok) {
      const resp = new Response(res.body, res);
      resp.headers.set("Cache-Control", "public, max-age=31536000, immutable");
      ctx.waitUntil(cache.put(cacheKey, resp.clone()));
      return resp;
    }
    return res;
  },
};

