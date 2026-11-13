import { ApiErrorSchema, type EndpointDef, buildPath } from "@quefome/contract";
import type { z } from "zod";

/** Normalized API failure. `status` 0 = network failure. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }

  get isNotFound() {
    return this.status === 404;
  }
  get isUnauthenticated() {
    return this.status === 401;
  }
  get isConflict() {
    return this.status === 409;
  }
  /** Business-rule rejection with a user-facing message (legacy HTTP 900 "business error"). */
  get isBusinessError() {
    return this.status === 409 || this.status === 422;
  }
}

/** Browser: same-origin (Next proxies /api). Server (RSC): talk to the API directly. */
function baseUrl(): string {
  if (typeof window !== "undefined") return "";
  return process.env.API_BASE_URL ?? "http://localhost:4020";
}

export interface RequestOptions {
  params?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | undefined>;
  signal?: AbortSignal;
  /** Server-side only: forwarded cookies. */
  cookie?: string;
  /** Extra request headers (e.g. Idempotency-Key). */
  headers?: Record<string, string>;
}

export async function request<E extends EndpointDef>(endpoint: E, options: RequestOptions = {}): Promise<z.infer<E["response"]>> {
  let url = baseUrl() + buildPath(endpoint.path, options.params);
  if (options.query) {
    const qs = new URLSearchParams(Object.entries(options.query).filter((e): e is [string, string] => !!e[1]));
    if ([...qs].length) url += `?${qs}`;
  }
  if (endpoint.request && options.body !== undefined) endpoint.request.parse(options.body); // fail fast on our own bugs

  let res: Response;
  try {
    res = await fetch(url, {
      method: endpoint.method,
      headers: {
        accept: "application/json",
        ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(options.cookie ? { cookie: options.cookie } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiRequestError(0, "NETWORK_ERROR", "Não foi possível conectar. Verifique sua internet e tente novamente.");
  }

  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const parsed = ApiErrorSchema.safeParse(payload);
    throw parsed.success
      ? new ApiRequestError(res.status, parsed.data.code, parsed.data.message, parsed.data.details)
      : new ApiRequestError(res.status, "UNEXPECTED_ERROR", "Desculpe, tivemos um problema. Tente novamente em instantes.");
  }

  const parsed = endpoint.response.safeParse(payload);
  if (!parsed.success) {
    console.error(`[api] response does not match contract: ${endpoint.method} ${endpoint.path}`, parsed.error.issues);
    throw new ApiRequestError(res.status, "CONTRACT_MISMATCH", "Desculpe, tivemos um problema. Tente novamente em instantes.");
  }
  return parsed.data as z.infer<E["response"]>;
}
