import { test } from "@playwright/test";

test("screenshot login page desktop and mobile", async ({ page, browser }) => {
  // Desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/login/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "C:/tmp/login_desktop.png", fullPage: false });

  // Mobile
  const mobile = await browser.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto("/login/");
  await mobile.waitForLoadState("networkidle");
  await mobile.screenshot({ path: "C:/tmp/login_mobile.png", fullPage: false });
  await mobile.close();
});
