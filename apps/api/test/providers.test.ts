import { afterEach, describe, expect, it, vi } from "vitest";
import { FallbackAddressProvider, FixtureAddressProvider, ViaCepAddressProvider } from "../src/modules/addresses";
import { createLogger } from "../src/lib/logger";

const logger = createLogger("silent");
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
afterEach(() => vi.restoreAllMocks());

describe("ViaCEP provider (legacy models/Address.js)", () => {
  it("maps the ViaCEP shape and caches lookups", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ cep: "92010-000", logradouro: "Rua Quinze de Janeiro", bairro: "Centro", localidade: "Canoas", uf: "RS" }));
    const provider = new ViaCepAddressProvider(logger);
    const first = await provider.lookupZipCode("92010-000");
    expect(first).toEqual({ zipCode: "92010-000", street: "Rua Quinze de Janeiro", neighborhood: "Centro", city: "Canoas", state: "RS" });
    expect(String(fetchSpy.mock.calls[0]![0])).toBe("https://viacep.com.br/ws/92010000/json/");
    await provider.lookupZipCode("92010000");
    expect(fetchSpy).toHaveBeenCalledTimes(1); // cached
  });

  it("treats ViaCEP's {erro:true}, malformed CEPs and empty street searches as not found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ erro: true }));
    const provider = new ViaCepAddressProvider(logger);
    expect(await provider.lookupZipCode("00000-000")).toBeNull();
    expect(await provider.lookupZipCode("123")).toBeNull();
    expect(await provider.searchStreet("ab", "Canoas", "RS")).toBeNull(); // ViaCEP requires 3+ chars
  });

  it("normalizes the street query the legacy way and takes the first result", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(json([{ cep: "92020-000", logradouro: "Avenida Getúlio Vargas", bairro: "Niterói", localidade: "Canoas", uf: "RS" }]));
    const found = await new ViaCepAddressProvider(logger).searchStreet("Av. Getúlio Vargas, 500", "Canoas", "RS");
    expect(found?.zipCode).toBe("92020-000");
    expect(decodeURIComponent(String(fetchSpy.mock.calls[0]![0]))).toBe("https://viacep.com.br/ws/rs/canoas/avenida getúlio vargas/json/");
  });

  it("propagates failures (timeouts, 5xx) so the caller can fall back", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({}, 503));
    await expect(new ViaCepAddressProvider(logger).lookupZipCode("92010-000")).rejects.toThrow(/viacep 503/);
  });
});

describe("fallback provider (dev only)", () => {
  it("uses the offline table when ViaCEP is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    const provider = new FallbackAddressProvider(new ViaCepAddressProvider(logger), new FixtureAddressProvider(), logger);
    expect((await provider.lookupZipCode("92010-000"))?.neighborhood).toBe("Centro");
    expect((await provider.searchStreet("Rua Boqueirão", "Canoas", "RS"))?.zipCode).toBe("92200-000");
  });
});
