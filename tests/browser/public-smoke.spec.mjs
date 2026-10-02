import { test, expect } from "@playwright/test";

// Public boundary only: never authenticate, submit signups, upload, or send messages.
test("public entry renders without uncaught client errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");
  expect(response.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("sign-in dialog supports keyboard dismissal and restores focus", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Sign in", exact: true });
  // The current public auth island disables activation while session lookup is pending.
  await expect(trigger).toBeEnabled();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Your next launch starts here." });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("keyboard focus stays visible on dark landing calls to action and footer links", async ({ page }) => {
  await page.goto("/");
  const finalAction = page.locator(".wl-final-cta").getByRole("button", { name: "Create your waitlist" });
  const footerLink = page.locator('.wl-footer a[href="/"]').first();
  await expect(finalAction).toBeVisible();
  await page.evaluate(() => document.activeElement?.blur());

  async function tabTo(target) {
    for (let index = 0; index < 80; index += 1) {
      await page.keyboard.press("Tab");
      if (await target.evaluate((element) => element === document.activeElement)) return;
    }
    throw new Error("Keyboard navigation did not reach the expected landing control.");
  }

  await tabTo(finalAction);
  expect(await finalAction.evaluate((element) => getComputedStyle(element).outlineColor)).toBe("rgb(255, 255, 255)");
  await page.keyboard.press("Tab");
  await expect(footerLink).toBeFocused();
  expect(await footerLink.evaluate((element) => getComputedStyle(element).outlineColor)).toBe("rgb(255, 255, 255)");
});

test("anonymous dashboard access returns to the public entry", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

for (const route of ["/terms", "/privacy"]) {
  test(`${route} remains publicly readable`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}
