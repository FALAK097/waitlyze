import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function appearance(page, theme) {
  await page.getByRole("button", { name: theme, exact: true }).click();
  await expect(page.getByRole("button", { name: theme, exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveClass(new RegExp(theme.toLowerCase()));
}

for (const theme of ["Light", "Dark"]) {
  test(`${theme}: preview and dialog have no automated accessibility violations`, async ({ page }, testInfo) => {
    await page.goto("/design-system");
    await appearance(page, theme);
    await page.screenshot({ path: testInfo.outputPath(`foundation-${theme.toLowerCase()}.png`), fullPage: true });
    expect((await new AxeBuilder({ page }).include(".product-stage").analyze()).violations).toEqual([]);
    await page.getByRole("button", { name: "Try campaign dialog" }).click();
    await expect(page.getByRole("dialog", { name: "Rehearse a campaign draft" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`dialog-${theme.toLowerCase()}.png`) });
    expect((await new AxeBuilder({ page }).include(".product-dialog").analyze()).violations).toEqual([]);
  });

  test(`${theme}: rendered text, action, boundary and focus pairs meet contrast floors`, async ({ page }) => {
    await page.goto("/design-system");
    await appearance(page, theme);
    const pairs = await page.locator(".product-stage").evaluate((root) => {
      const token = (name) => {
        const probe = document.createElement("span");
        probe.style.color = `var(${name})`;
        root.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const luminance = (color) => {
        const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const contrast = (a, b) => {
        const x = luminance(token(a)), y = luminance(token(b));
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const result = [];
      for (const fg of ["--product-text-primary", "--product-text-secondary", "--product-success-text", "--product-danger-text"]) {
        for (const bg of ["--product-bg-page", "--product-bg-surface", "--product-bg-inset"]) result.push({ fg, bg, ratio: contrast(fg, bg), floor: 4.5 });
      }
      for (const bg of ["--product-accent-solid", "--product-accent-hover"]) result.push({ fg: "--product-accent-label", bg, ratio: contrast("--product-accent-label", bg), floor: 4.5 });
      for (const fg of ["--product-border-control", "--product-accent-border", "--product-focus"]) {
        for (const bg of ["--product-bg-page", "--product-bg-surface", "--product-bg-inset"]) result.push({ fg, bg, ratio: contrast(fg, bg), floor: 3 });
      }
      return result;
    });
    console.log(theme, JSON.stringify(pairs));
    for (const pair of pairs) expect(pair.ratio, `${pair.fg} on ${pair.bg}`).toBeGreaterThanOrEqual(pair.floor);
  });
}

test("Base UI composition traps focus, validates, announces a preview and restores focus", async ({ page }) => {
  await page.goto("/design-system");
  const trigger = page.getByRole("button", { name: "Try campaign dialog" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Rehearse a campaign draft" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("Tab");
    await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.getByRole("button", { name: "Complete preview" }).click();
  const field = page.getByRole("textbox", { name: "Campaign name" });
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toHaveAccessibleDescription("Enter a campaign name to try the preview.");
  await field.fill("A new chapter");
  await page.getByRole("button", { name: "Complete preview" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("status").filter({ hasText: "Preview complete" })).toContainText("No campaign was created.");
  await trigger.press("Enter");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

for (const width of [320, 375, 768, 1280, 1440]) {
  test(`reflows at ${width}px including dialog`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/design-system");
    const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await noOverflow()).toBe(true);
    await page.getByRole("button", { name: "Try campaign dialog" }).click();
    expect(await noOverflow()).toBe(true);
    await expect(page.getByRole("textbox", { name: "Campaign name" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  });
}

test("keyboard focus is visible; reduced motion avoids scale; avatars stay local", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/design-system");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  const trigger = page.getByRole("button", { name: "Try campaign dialog" });
  await trigger.focus();
  expect(await trigger.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe("2px");
  expect(await trigger.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  expect(await page.locator(".product-avatar").getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
  await expect(page.locator(".product-avatar")).toHaveAttribute("alt", "");
});

test("RTL and enlarged text retain actions", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("/design-system");
  await page.evaluate(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.style.fontSize = "200%";
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Try campaign dialog" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
});
