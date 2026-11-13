/** A new restaurant: sign-up → setup → menu → publish → share link/QR → first order arrives on its WhatsApp. */
import { expect, test } from "@playwright/test";
import { addToCart, fillContact, goToCheckout, loginMerchant, resetApi, whatsappMessages } from "./helpers";

test.beforeEach(resetApi);

test("from sign-up to the first order", async ({ page, browser }) => {
  await page.goto("/admin/cadastro");
  await page.getByLabel("Nome do restaurante").fill("Lanches da Maria");
  await page.getByLabel("WhatsApp do restaurante").fill("(51) 97777-6666");
  await page.getByLabel("Seu nome").fill("Maria");
  await page.getByLabel("E-mail").fill("maria@lanches.com");
  await page.getByLabel("Senha (mínimo 8 caracteres)").fill("segura123");
  await page.getByRole("button", { name: "Criar minha loja" }).click();
  await expect(page).toHaveURL(/\/admin\/loja$/);

  // menu first (publishing requires at least one product)
  await page.getByRole("link", { name: "Cardápio" }).click();
  await page.getByRole("button", { name: "Nova categoria" }).click();
  await page.getByLabel("Nome").fill("Lanches");
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("button", { name: "+ Novo item em Lanches" }).click();
  await page.getByLabel("Nome").fill("X-Tudo");
  await page.getByLabel("Descrição").fill("Completo");
  await page.getByLabel("Preço (R$)").fill("32,00");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("X-Tudo")).toBeVisible();
  await expect(page.getByText("R$ 32,00")).toBeVisible();

  // store setup
  await page.getByRole("link", { name: "Loja" }).click();
  await page.getByLabel("Descrição").fill("Os melhores lanches de Canoas");
  await page.getByLabel("CEP").fill("92010-000");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByLabel("Cidade", { exact: true })).toHaveValue("Canoas");
  await page.getByLabel("Número").fill("5");
  for (const day of ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]) {
    await page.getByRole("checkbox", { name: day }).check();
    await page.getByLabel(`Abre ${day}`).fill("00:00");
    await page.getByLabel(`Fecha ${day}`).fill("23:59");
  }
  await page.getByLabel("Taxa de entrega (R$)").fill("7,00");
  await page.getByLabel(/Na cidade toda/).check();
  await page.getByRole("checkbox", { name: "Pix" }).check();
  await page.getByLabel("Chave Pix").fill("maria@lanches.com");
  await page.getByLabel("Nome do favorecido").fill("Maria");
  await page.getByRole("checkbox", { name: /Loja publicada/ }).check();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Salvo! Sua loja está publicada.")).toBeVisible();

  // share: link + QR code
  await expect(page.getByRole("heading", { name: "Divulgue sua loja" })).toBeVisible();
  await expect(page.getByRole("img", { name: /QR Code do link .*\/lanches-da-maria/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Baixar QR Code" })).toHaveAttribute("download", "qrcode-lanches-da-maria.png");

  // a customer opens the link and orders; the message goes to the new store's WhatsApp
  const customer = await (await browser.newContext()).newPage();
  await customer.goto("/lanches-da-maria");
  await addToCart(customer, "X-Tudo");
  await goToCheckout(customer);
  await customer.getByLabel("CEP").fill("92020-000"); // another neighborhood: whole-city delivery
  await customer.getByRole("button", { name: "Buscar" }).click();
  await customer.getByLabel("Número").fill("1");
  await fillContact(customer);
  await customer.getByLabel(/^Pix/).check();
  await customer.getByRole("button", { name: "Enviar pedido · R$ 39,00" }).click();
  await expect(customer.getByText("maria@lanches.com")).toBeVisible();
  const [msg] = await whatsappMessages("+5551977776666");
  expect(msg!.text).toContain("*Novo pedido #1* - Lanches da Maria");
});

test("out of stock: the item shows as 'Esgotado' for customers, back when re-enabled", async ({ page, browser }) => {
  await loginMerchant(page);
  await page.getByRole("link", { name: "Cardápio" }).click();
  await page.getByRole("checkbox", { name: "X-Bacon disponível" }).uncheck();
  const customer = await (await browser.newContext()).newPage();
  await customer.goto("/burger-do-ze");
  await expect(customer.getByRole("button", { name: "X-Bacon esgotado" })).toBeDisabled();
  await page.getByRole("checkbox", { name: "X-Bacon disponível" }).check();
  await customer.reload();
  await expect(customer.getByRole("button", { name: "Adicionar X-Bacon" })).toBeEnabled();
});

test("a price change shows on the menu right away", async ({ page, browser }) => {
  await loginMerchant(page);
  await page.getByRole("link", { name: "Cardápio" }).click();
  await page.getByRole("button", { name: "Editar X-Bacon" }).click();
  await page.getByLabel("Preço (R$)").fill("29,90");
  await page.getByRole("button", { name: "Salvar" }).click();
  const customer = await (await browser.newContext()).newPage();
  await customer.goto("/burger-do-ze");
  await expect(customer.locator(".product", { hasText: "X-Bacon" }).getByText("29,90")).toBeVisible();
});
