import type { NextRequest } from "next/server";

/**
 * Runtime same-origin proxy: /api/* -> ${API_BASE_URL}/api/* (read on every request, so the same build
 * can target the mock API, staging or production). In production this can be replaced by ingress routing.
 */
export const dynamic = "force-dynamic";

const FORWARDED_REQUEST_HEADERS = ["accept", "accept-language", "content-type", "cookie", "user-agent", "if-none-match"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "cache-control", "etag", "location", "retry-after"];

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const base = process.env.API_BASE_URL ?? "http://localhost:4020";
  const { path } = await context.params;
  const target = new URL(`/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`, base);

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json({ code: "UPSTREAM_UNAVAILABLE", message: "Serviço indisponível. Tente novamente em instantes." }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", cookie);
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };
