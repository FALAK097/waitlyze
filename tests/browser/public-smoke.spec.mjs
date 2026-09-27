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
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Your next launch starts here." });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
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
