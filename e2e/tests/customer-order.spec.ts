/** The customer flow on a phone: restaurant link → menu → cart → checkout → order page, and the restaurant's WhatsApp. */
import { expect, test } from "@playwright/test";
import { CUSTOMER, STORE_WHATSAPP, addToCart, appAlert, fillContact, goToCheckout, resetApi, whatsappMessages } from "./helpers";

test.beforeEach(resetApi);

test("order by delivery with cash: the order page shows progress and the restaurant gets the summary on WhatsApp", async ({ page }) => {
  await page.goto("/burger-do-ze");
  await expect(page.getByRole("heading", { level: 1, name: "Burger do Zé" })).toBeVisible();

  await addToCart(page, "X-Salada", async (d) => {
    await d.getByLabel(/^Bem passado/).check();
    await d.getByLabel(/^Bacon/).check();
    await d.getByLabel("Quantidade:").fill("2");
  });
  await addToCart(page, "Pizza Grande", async (d) => {
    await d.getByLabel(/^Calabresa/).check();
    await d.getByLabel(/^Quatro queijos/).check();
    await expect(d.getByLabel(/^Marguerita/)).toBeDisabled(); // max 2 flavors
  });
  await goToCheckout(page);

  await page.getByLabel("CEP").fill("92010-000");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText("Rua Quinze de Janeiro")).toBeVisible();
  await page.getByLabel("Número").fill("10");
  await page.getByLabel("Complemento").fill("ap 2");
  await fillContact(page);
  await page.getByLabel(/Dinheiro/).check();
  await page.getByLabel(/Troco para quanto/).fill("150");
  await page.getByLabel("Observações (opcional)").fill("Interfone quebrado");
  // (22,90 + 4,00) x 2 + 49,90 + 5,00 = 108,70
  await page.getByRole("button", { name: "Enviar pedido · R$ 108,70" }).click();

  await expect(page).toHaveURL(/\/burger-do-ze\/pedido\/[\w-]{20,}$/);
  await expect(page.getByRole("heading", { name: "Pedido #1" })).toBeVisible();
  await expect(page.getByText("Pedido enviado! Aguardando o restaurante confirmar.")).toBeVisible();
  await expect(page.getByText("O restaurante recebeu seu pedido no WhatsApp.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Falar com o restaurante no WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/5551988887777\?text=/);

  const [msg] = await whatsappMessages(STORE_WHATSAPP);
  expect(msg!.text).toContain("*Novo pedido #1* - Burger do Zé");
  expect(msg!.text).toContain(`Cliente: ${CUSTOMER.name} - ${CUSTOMER.whatsapp}`);
  expect(msg!.text).toContain("Entrega: Rua Quinze de Janeiro, nº 10, compl. ap 2 - Bairro Centro, Canoas");
  expect(msg!.text).toContain("2x X-Salada - R$ 53,80");
  expect(msg!.text).toContain("1x Pizza Grande - R$ 49,90");
  expect(msg!.text).toContain("*Total: R$ 108,70*");
  expect(msg!.text).toContain("Pagamento: Dinheiro (troco para R$ 150,00: levar R$ 41,30)");
  expect(msg!.text).toContain("Observações: Interfone quebrado");
});

test("pickup with Pix: the order page shows the key to pay and a button to send the receipt", async ({ page }) => {
  await page.goto("/burger-do-ze");
  await addToCart(page, "X-Bacon");
  await goToCheckout(page);
  await page.getByLabel("Retirar no balcão").check();
  await fillContact(page);
  await page.getByLabel(/^Pix/).check();
  await page.getByRole("button", { name: "Enviar pedido · R$ 27,90" }).click();

  await expect(page.getByRole("heading", { name: "Pague com Pix" })).toBeVisible();
  await expect(page.getByText("pix@burgerdoze.com.br")).toBeVisible();
  await expect(page.getByRole("link", { name: "Enviar comprovante no WhatsApp" })).toHaveAttribute("href", /wa\.me\/5551988887777/);
  const [msg] = await whatsappMessages(STORE_WHATSAPP);
  expect(msg!.text).toContain("Retirada no balcão");
  expect(msg!.text).toContain("Pagamento: Pix (conferir o comprovante)");
});

test("checkout blocks what the restaurant can't serve, with clear messages", async ({ page }) => {
  await page.goto("/burger-do-ze");
  await addToCart(page, "X-Bacon");
  await goToCheckout(page);
  await page.getByLabel("CEP").fill("92200-000"); // Estância Velha: outside the delivery area
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(appAlert(page).filter({ hasText: "O restaurante não entrega nesse endereço." })).toBeVisible();

  await page.getByLabel("Retirar no balcão").check();
  await page.getByLabel("Nome").fill("Ana");
  await page.getByLabel("WhatsApp").fill("(51) 3333-4444"); // landline: can't receive WhatsApp updates
  await page.getByLabel(/^Pix/).check();
  await page.getByRole("button", { name: /Enviar pedido/ }).click();
  await expect(appAlert(page)).toContainText("Informe um celular com DDD");
  await expect(page).toHaveURL(/finalizar$/);
});

test("returning customer: name, WhatsApp and address are remembered on the device", async ({ page }) => {
  await page.goto("/burger-do-ze");
  await addToCart(page, "X-Bacon");
  await goToCheckout(page);
  await page.getByLabel("CEP").fill("92010-000");
  await page.getByRole("button", { name: "Buscar" }).click();
  await page.getByLabel("Número").fill("10");
  await fillContact(page);
  await page.getByLabel(/^Cartão na entrega/).check();
  await page.getByRole("button", { name: /Enviar pedido/ }).click();
  await expect(page.getByRole("heading", { name: "Pedido #1" })).toBeVisible();

  await page.getByRole("link", { name: "Fazer outro pedido" }).click();
  await addToCart(page, "X-Bacon");
  await goToCheckout(page);
  await expect(page.getByLabel("Nome")).toHaveValue(CUSTOMER.name);
  await expect(page.getByLabel("WhatsApp")).toHaveValue(CUSTOMER.whatsapp);
  await expect(page.getByText("Rua Quinze de Janeiro")).toBeVisible();
  await expect(page.getByLabel("Número")).toHaveValue("10");
});

test("the restaurant link renders on the server with link-preview tags (WhatsApp/Instagram)", async ({ request }) => {
  const html = await (await request.get("/burger-do-ze")).text();
  expect(html).toContain('<meta property="og:title" content="Burger do Zé - Quefo.me"');
  expect(html).toContain("X-Salada");
  expect((await request.get("/nao-existe")).status()).toBe(404);
});
