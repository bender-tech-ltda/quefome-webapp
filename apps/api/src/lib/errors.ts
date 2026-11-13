import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Business/HTTP error with the contract's ApiError shape. */
export class ApiError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 503,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (code: string, message: string) => new ApiError(404, code, message);
export const unauthenticated = (message = "Acesso restrito") => new ApiError(401, "UNAUTHENTICATED", message);
export const invalid = (code: string, message: string, details?: unknown) => new ApiError(422, code, message, details);

export function sendError(c: Context, error: ApiError) {
  return c.json({ code: error.code, message: error.message, ...(error.details === undefined ? {} : { details: error.details }) }, error.status as ContentfulStatusCode);
}
