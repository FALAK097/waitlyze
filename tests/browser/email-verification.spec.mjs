import { test, expect } from "@playwright/test";

test("verification requires an explicit click and reveals referrals only after success", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/v1/sign_up/verify", async (route) => {
    requests += 1;
    expect(route.request().method()).toBe("POST");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Email verified successfully.",
        referral: { waitListName: "Launch list", position: 3, path: "/w/launch-list?r=invite-code" },
      }),
    });
  });

  await page.goto("/verify/test-token");
  await expect(page.getByRole("heading", { name: "Confirm your email" })).toBeVisible();
  expect(requests).toBe(0);

  await page.getByRole("button", { name: "Confirm email" }).click();
  await expect(page.getByRole("heading", { name: "You’re confirmed" })).toBeVisible();
  await expect(page.getByLabel("Your referral link")).toHaveValue(/\/w\/launch-list\?r=invite-code$/);
  await expect(page.getByText("Your position:")).toBeVisible();
  expect(requests).toBe(1);
});

test("expired verification link gives a recoverable error", async ({ page }) => {
  await page.route("**/api/v1/sign_up/verify", (route) => route.fulfill({
    status: 400,
    contentType: "application/json",
    body: JSON.stringify({ message: "This verification link is invalid, expired, or already used." }),
  }));
  await page.goto("/verify/expired-token?returnTo=%2Fw%2Flaunch-list");
  await page.getByRole("button", { name: "Confirm email" }).click();
  await expect(page.locator(".verify-error")).toContainText("expired");
  await expect(page.getByRole("link", { name: "Return to waitlist" })).toHaveAttribute("href", "/w/launch-list");
  await expect(page.getByRole("button", { name: "Confirm email" })).toHaveCount(0);
});
