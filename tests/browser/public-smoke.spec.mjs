import { test, expect } from "@playwright/test";

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

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

test("public landing uses the ink and lime system with a centered responsive preview", async ({ page }) => {
  await page.goto("/");
  const primaryAction = page.locator(".wl-hero-actions").getByRole("button", { name: "Create your waitlist", exact: true });
  await expect(primaryAction).toBeVisible();
  const action = await primaryAction.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return { background: style.backgroundColor, color: style.color, height: box.height };
  });
  expect(action.background).toBe("rgb(198, 254, 30)");
  expect(action.color).toBe("rgb(0, 22, 13)");
  expect(action.height).toBeGreaterThanOrEqual(44);
  expect(contrastRatio(action.color, action.background)).toBeGreaterThanOrEqual(4.5);

  const lede = await page.locator(".wl-lede").evaluate((element) => ({
    color: getComputedStyle(element).color,
    background: getComputedStyle(element.closest(".wl")).backgroundColor,
  }));
  expect(contrastRatio(lede.color, lede.background)).toBeGreaterThanOrEqual(4.5);
  await expect(page.locator(".wl-hero h1")).toHaveCSS("text-align", "center");

  const swatches = page.locator(".wl-swatches button");
  const hitAreas = await swatches.evaluateAll((elements) => elements.map((element) => {
    const { width, height } = element.getBoundingClientRect();
    return { width, height };
  }));
  expect(hitAreas.length).toBe(3);
  expect(hitAreas.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true);
  await expect(page.getByRole("button", { name: "Lime brand color" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Ink brand color" }).click();
  await expect(page.getByRole("button", { name: "Ink brand color" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".wl-preview-form-space form button")).toHaveCSS("background-color", "rgb(41, 59, 80)");

  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width === 1440) {
      const previewWidth = await page.locator(".wl-playground").evaluate((element) => element.getBoundingClientRect().width);
      expect(previewWidth).toBeGreaterThanOrEqual(1000);
    }
  }
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
