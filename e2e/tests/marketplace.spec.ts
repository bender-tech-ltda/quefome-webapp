/** Secondary channel: customers who reach the platform directly find restaurants by cuisine or name. */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { resetApi } from "./helpers";

test.beforeEach(resetApi);

test("home → cuisine → store", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Pizzas" }).click();
  await expect(page).toHaveURL(/\/restaurantes\/pizzas$/);
  await expect(page.locator(".establishment-list .name")).toHaveText(["Burger do Zé", "Pizzaria Bella"]);
  await page.getByRole("link", { name: /Burger do Zé/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Burger do Zé" })).toBeVisible();
});

test("search by name", async ({ page }) => {
  await page.goto("/restaurantes");
  await page.getByLabel("Nome do estabelecimento").fill("sushi");
  await page.getByLabel("Nome do estabelecimento").press("Enter");
  await expect(page.locator(".establishment-list .name")).toHaveText(["Sushi Kazu"]);
});

for (const path of ["/", "/burger-do-ze"]) {
  test(`no critical accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const critical = (await new AxeBuilder({ page }).analyze()).violations.filter((v) => v.impact === "critical");
    expect(critical.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
