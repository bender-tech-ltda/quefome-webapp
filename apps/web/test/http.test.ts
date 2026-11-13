import { endpoints } from "@quefome/contract";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, request } from "@/lib/api/http";
import { store } from "./fixtures";

const respond = (status: number, body: unknown) => vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

afterEach(() => vi.restoreAllMocks());

describe("API client", () => {
  it("calls the same-origin path and validates the response against the contract", async () => {
    const fetchSpy = respond(200, store);
    await expect(request(endpoints.getStore, { params: { slug: "burger-do-ze" } })).resolves.toMatchObject({ slug: "burger-do-ze" });
    expect(fetchSpy.mock.calls[0]![0]).toBe("/api/stores/burger-do-ze");
  });

  it.each([
    [401, "INVALID_CREDENTIALS", "isUnauthenticated"],
    [404, "STORE_NOT_FOUND", "isNotFound"],
    [409, "VERSION_CONFLICT", "isConflict"],
    [422, "BELOW_MINIMUM", "isBusinessError"],
  ] as const)("maps HTTP %s to ApiRequestError(%s)", async (status, code, flag) => {
    respond(status, { code, message: "mensagem" });
    const error = await request(endpoints.getStore, { params: { slug: "x" } }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ status, code, message: "mensagem" });
    expect((error as ApiRequestError)[flag]).toBe(true);
  });

  it("reports network failures with a friendly message", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(request(endpoints.getStore, { params: { slug: "x" } })).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("rejects responses that drift from the contract instead of rendering garbage", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    respond(200, { ...store, deliveryFeeCents: 5.0001 });
    await expect(request(endpoints.getStore, { params: { slug: "x" } })).rejects.toMatchObject({ code: "CONTRACT_MISMATCH" });
  });

  it("refuses to send a body that violates the contract (our own bug)", async () => {
    const fetchSpy = respond(200, {});
    await expect(request(endpoints.staffLogin, { body: { email: "not-an-email", password: "x", keepLoggedIn: false } })).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
