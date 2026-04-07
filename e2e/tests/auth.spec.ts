import { test, expect } from "@playwright/test";

const STRONG_PASSWORD = "TestPass123!";

test.describe("auth flow", () => {
  test("register -> redirect to cep-lookup, then login -> redirect", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const email = `e2e+${timestamp}@bairronow.test`;

    // Register
    await page.goto("/register/");
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/^senha$/i).fill(STRONG_PASSWORD);
    await page.getByLabel(/confirmar senha/i).fill(STRONG_PASSWORD);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /criar conta/i }).click();

    // Register currently shows a success message (email verification).
    await expect(page.getByText(/verifique seu e-?mail/i)).toBeVisible({
      timeout: 15_000,
    });

    // Login
    await page.goto("/login/");
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/senha/i).fill(STRONG_PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();

    // Should leave /login — a new unverified user lands on /cep-lookup.
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15_000,
    });
    expect(page.url()).toMatch(/\/cep-lookup|\/feed/);
  });
});
