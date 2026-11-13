/** The restaurant side of an order: live board, status progression, and the customer's WhatsApp updates. */
import { expect, test } from "@playwright/test";
import { CUSTOMER, addToCart, fillContact, goToCheckout, loginMerchant, resetApi, whatsappMessages } from "./helpers";

test.beforeEach(resetApi);

/** On phones each status is a tab; on desktop all columns are visible. */
async function showColumn(page: import("@playwright/test").Page, name: string) {
  const tab = page.getByRole("tab", { name: new RegExp(`^${name}`) });
  if (await tab.isVisible()) await tab.click();
}

async function placeOrder(page: import("@playwright/test").Page) {
  await page.goto("/burger-do-ze");
  await addToCart(page, "X-Bacon");
  await goToCheckout(page);
  await page.getByLabel("Retirar no balcão").check();
  await fillContact(page);
  await page.getByLabel(/^Cartão na entrega/).check();
  await page.getByRole("button", { name: /Enviar pedido/ }).click();
  await expect(page.getByRole("heading", { name: "Pedido #1" })).toBeVisible();
  return page.url();
}

test("a new order appears live on the board; each step notifies the customer on WhatsApp", async ({ page, browser }) => {
  await loginMerchant(page);
  await expect(page.getByText("Ao vivo")).toBeVisible();
  await expect(page.getByText("Nenhum pedido novo")).toBeVisible();

  const customer = await (await browser.newContext({ viewport: { width: 412, height: 900 }, isMobile: true })).newPage();
  const orderUrl = await placeOrder(customer);

  // arrives without reloading (SSE)
  const card = page.getByRole("article", { name: "Pedido #1" });
  await expect(card).toBeVisible();
  await expect(page).toHaveTitle(/^\(1\) /);
  await expect(card.getByText("1x X-Bacon")).toBeVisible();
  await expect(card.getByText("Cartão na entrega")).toBeVisible();

  await card.getByRole("button", { name: "Aceitar e preparar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Pedido #1 → Em preparo" })).toBeVisible();
  await showColumn(page, "Em preparo");
  await card.getByRole("button", { name: "Pronto para retirada" }).click();
  await showColumn(page, "Prontos");
  await expect(card.getByText("Cliente avisado no WhatsApp")).toBeVisible();
  await card.getByRole("button", { name: "Cliente retirou" }).click();
  await expect(page.getByRole("article", { name: "Pedido #1" })).toHaveCount(0); // delivered orders leave the board

  const toCustomer = (await whatsappMessages(CUSTOMER.e164)).map((m) => m.text);
  expect(toCustomer).toHaveLength(3);
  expect(toCustomer[0]).toContain("O restaurante confirmou e está preparando seu pedido.");
  expect(toCustomer[1]).toContain("Seu pedido está pronto para retirada!");
  expect(toCustomer[2]).toContain("Pedido retirado. Bom apetite!");
  expect(toCustomer[0]).toContain("/burger-do-ze/pedido/");

  await customer.goto(orderUrl);
  await expect(customer.getByText("Pedido retirado. Bom apetite!")).toBeVisible();
});

test("canceling requires a reason, which the customer receives", async ({ page, browser }) => {
  const customer = await (await browser.newContext()).newPage();
  await placeOrder(customer);
  await loginMerchant(page);
  const card = page.getByRole("article", { name: "Pedido #1" });
  await card.getByRole("button", { name: "Cancelar" }).click();
  await card.getByLabel("Motivo (o cliente recebe no WhatsApp)").selectOption("Produto em falta");
  await card.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(page.getByRole("article", { name: "Pedido #1" })).toHaveCount(0);
  const [msg] = await whatsappMessages(CUSTOMER.e164);
  expect(msg!.text).toContain("Seu pedido foi cancelado pelo restaurante.\nMotivo: Produto em falta");
});

test("pausing stops new orders; the menu says the store is closed", async ({ page, browser }) => {
  await loginMerchant(page);
  await page.getByRole("radio", { name: "Pausado" }).click();
  await expect(page.getByRole("radio", { name: "Pausado" })).toHaveAttribute("aria-checked", "true");
  const customer = await (await browser.newContext()).newPage();
  await customer.goto("/burger-do-ze");
  await expect(customer.getByText("Esse estabelecimento está fechado no momento.")).toBeVisible();
  await expect(customer.getByRole("button", { name: "Adicionar X-Bacon" })).toBeDisabled();
  await page.getByRole("radio", { name: "Aberto agora" }).click();
  await expect(page.getByRole("radio", { name: "Aberto agora" })).toHaveAttribute("aria-checked", "true");
  await customer.reload();
  await expect(customer.getByRole("button", { name: "Adicionar X-Bacon" })).toBeEnabled();
});

test("history shows the day's orders and totals", async ({ page, browser }) => {
  const customer = await (await browser.newContext()).newPage();
  await placeOrder(customer);
  await loginMerchant(page);
  await page.getByRole("link", { name: "Histórico" }).click();
  await expect(page.getByRole("status").filter({ hasText: "1 pedido" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Pedido #1" }).getByText("Novo")).toBeVisible();
});
