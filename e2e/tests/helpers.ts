import { type Page, expect, request } from "@playwright/test";
import { API_URL } from "../playwright.config";

export const STAFF = { email: "ze@burgerdoze.com.br", password: "senha123" };
export const STORE_WHATSAPP = "+5551988887777";
export const CUSTOMER = { name: "Ana Cliente", whatsapp: "(51) 99999-8888", e164: "+5551999998888" };

export async function resetApi() {
  const ctx = await request.newContext({ baseURL: API_URL });
  expect((await ctx.post("/__control/reset")).ok()).toBe(true);
  await ctx.dispose();
}

export async function control(path: string, body: unknown = {}) {
  const ctx = await request.newContext({ baseURL: API_URL });
  const res = await ctx.post(`/__control${path}`, { data: body });
  await ctx.dispose();
  return res;
}

export interface DevMessage {
  recipient: "STORE" | "CUSTOMER";
  to: string;
  text: string;
  status: string;
}

/** Messages recorded by the dev WhatsApp provider (what would be sent on WhatsApp). */
export async function whatsappMessages(to?: string): Promise<DevMessage[]> {
  const ctx = await request.newContext({ baseURL: API_URL });
  const list = (await (await ctx.get("/api/dev/messages")).json()) as DevMessage[];
  await ctx.dispose();
  return list.filter((m) => !to || m.to === to).reverse(); // oldest first
}

export async function addToCart(page: Page, product: string, choose?: (dialog: ReturnType<Page["getByRole"]>) => Promise<void>) {
  await page.getByRole("button", { name: `Adicionar ${product}` }).click();
  const dialog = page.getByRole("dialog", { name: `Personalizar ${product}` });
  if (choose) await choose(dialog);
  await dialog.getByRole("button", { name: "Adicionar ao Pedido" }).click();
  await expect(dialog).toBeHidden();
}

export async function goToCheckout(page: Page) {
  const panel = page.getByRole("region", { name: "Seu pedido" });
  await panel.getByRole("button", { name: "Finalizar Pedido" }).click();
  await panel.locator(".btn-finish-order").click();
  await expect(page).toHaveURL(/\/pedido\/finalizar$/);
}

export async function fillContact(page: Page, who = CUSTOMER) {
  await page.getByLabel("Nome").fill(who.name);
  await page.getByLabel("WhatsApp").fill(who.whatsapp);
}

export async function loginMerchant(page: Page, who = STAFF) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Senha").fill(who.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Our own role=alert elements (Next.js also renders an empty route announcer with role=alert). */
export const appAlert = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');
