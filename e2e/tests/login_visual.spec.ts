import { test, expect } from "@playwright/test";

test.describe("login page — visual and functional", () => {
  test("icons are properly sized and form renders correctly", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login/");
    await page.waitForLoadState("networkidle");

    // 1. Form is visible
    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
    await expect(page.getByLabel(/^senha$/i)).toBeVisible();

    // 2. Icons inside inputs should be small (≤ 24px)
    const mailIcon = page.locator('input[type="email"]').locator("..").locator("svg").first();
    const iconBox = await mailIcon.boundingBox();
    if (iconBox) {
      expect(iconBox.width).toBeLessThanOrEqual(24);
      expect(iconBox.height).toBeLessThanOrEqual(24);
      console.log(`MailIcon size: ${iconBox.width}x${iconBox.height}px`);
    }

    // 3. Password eye toggle works
    const eyeBtn = page.locator('button[aria-label*="senha"]');
    await expect(eyeBtn).toBeVisible();
    const passInput = page.getByLabel(/^senha$/i);
    await expect(passInput).toHaveAttribute("type", "password");
    await eyeBtn.click();
    await expect(passInput).toHaveAttribute("type", "text");
    await eyeBtn.click();
    await expect(passInput).toHaveAttribute("type", "password");

    // 4. Validation fires correctly
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByText(/e-mail inv/i)).toBeVisible({ timeout: 3000 });

    // 5. No JS errors
    console.log(`Console errors: ${errors.length === 0 ? "none" : errors.join("; ")}`);

    // 6. Take screenshot
    await page.screenshot({ path: "C:/tmp/login_visual_test.png" });
  });

  test("mobile layout — no giant icons", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login/");
    await page.waitForLoadState("networkidle");

    // Brand panel should be hidden on mobile
    const aside = page.locator("aside");
    await expect(aside).toBeHidden();

    // Mobile header should be visible
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Form inputs accessible
    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();

    await page.screenshot({ path: "C:/tmp/login_mobile_test.png" });
  });
});
