import { test, expect } from "@playwright/test";

test.describe("login auth flow", () => {
  test("invalid credentials shows real error from API", async ({ page }) => {
    const apiCalls: { method: string; url: string; status: number; body: string }[] = [];
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("response", async (resp) => {
      if (resp.url().includes("/api/")) {
        let body = "";
        try { body = await resp.text(); } catch { /* ignore */ }
        apiCalls.push({
          method: resp.request().method(),
          url: resp.url(),
          status: resp.status(),
          body: body.substring(0, 300),
        });
      }
    });

    await page.goto("/login/");
    await page.waitForLoadState("networkidle");

    // Fill invalid credentials
    await page.getByLabel(/e-?mail/i).fill("test@test.com");
    await page.getByLabel(/^senha$/i).fill("wrongpassword");

    // Submit
    await page.getByRole("button", { name: /entrar/i }).click();

    // Wait for server error alert with non-empty text
    // (not the ARIA live region which is always present but empty)
    const errorAlert = page.locator('[role="alert"]:has(p)');
    await expect(errorAlert).toBeVisible({ timeout: 8000 });

    // Verify it shows actual error text (not generic)
    const alertText = await errorAlert.locator('p').innerText();
    console.log("Alert text:", alertText);
    expect(alertText.length).toBeGreaterThan(5);
    // Should NOT show completely generic text
    expect(alertText).not.toMatch(/^Erro$/i);

    // Log API calls
    console.log("API calls:", JSON.stringify(apiCalls, null, 2));
    console.log("Console errors:", errors.length === 0 ? "none" : errors.join("; "));

    // Verify login API was called directly (no refresh chain)
    const loginCall = apiCalls.find((c) => c.url.includes("/auth/login") && c.method === "POST");
    console.log("Login call:", JSON.stringify(loginCall));
    expect(loginCall).toBeDefined();

    // Status should be 401 for wrong credentials
    expect(loginCall?.status).toBe(401);

    // Should NOT have tried to refresh (interceptor fix)
    const refreshCalls = apiCalls.filter((c) => c.url.includes("/auth/refresh"));
    console.log("Refresh calls (should be 0):", refreshCalls.length);
    expect(refreshCalls.length).toBe(0);

    // No JS errors
    expect(errors).toHaveLength(0);

    await page.screenshot({ path: "C:/tmp/login_auth_error.png" });
  });

  test("empty form shows validation error", async ({ page }) => {
    await page.goto("/login/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /entrar/i }).click();

    // Zod validation should fire without API call
    await expect(page.getByText(/e-mail inv/i)).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: "C:/tmp/login_validation.png" });
  });

  test("password toggle preserves entered value", async ({ page }) => {
    await page.goto("/login/");
    await page.waitForLoadState("networkidle");

    const pass = page.getByLabel(/^senha$/i);
    await pass.fill("myTestPassword");
    await expect(pass).toHaveAttribute("type", "password");

    await page.locator('button[aria-label*="senha"]').click();
    await expect(pass).toHaveAttribute("type", "text");

    // Value preserved after toggle
    await expect(pass).toHaveValue("myTestPassword");
  });
});
