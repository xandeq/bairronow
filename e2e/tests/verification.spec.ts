import { test, expect, request } from "@playwright/test";
import path from "path";

const STRONG_PASSWORD = "TestPass123!";
const API_URL = process.env.BAIRRONOW_API_URL || "https://api.bairronow.com.br";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("verification flow", () => {
  test("register -> CEP -> proof upload -> admin approve -> verified badge", async ({
    page,
  }) => {
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD required"
    );

    const timestamp = Date.now();
    const email = `e2e+v${timestamp}@bairronow.test`;

    // Register via API to avoid the email-confirmation success screen.
    const apiContext = await request.newContext({ baseURL: API_URL });
    const regRes = await apiContext.post("/api/v1/auth/register", {
      data: {
        email,
        password: STRONG_PASSWORD,
        confirmPassword: STRONG_PASSWORD,
        acceptedPrivacyPolicy: true,
      },
    });
    expect(regRes.ok()).toBeTruthy();

    // Login in UI
    await page.goto("/login/");
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/senha/i).fill(STRONG_PASSWORD);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/\/cep-lookup/, { timeout: 15_000 });

    // CEP lookup
    await page.getByPlaceholder(/cep/i).first().fill("29101010");
    await page.getByRole("button", { name: /confirmar/i }).click();
    await page.waitForURL(/\/proof-upload/, { timeout: 15_000 });

    // Proof upload via hidden input (file picker workaround)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      path.join(__dirname, "..", "fixtures", "proof.png")
    );
    await page.getByRole("button", { name: /enviar|submeter/i }).click();
    await page.waitForURL(/\/pending/, { timeout: 20_000 });

    // Admin login + approve via API
    const adminLogin = await apiContext.post("/api/v1/auth/login", {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(adminLogin.ok()).toBeTruthy();
    const { accessToken: adminToken } = await adminLogin.json();

    const pendingRes = await apiContext.get(
      "/api/v1/admin/verifications?status=pending",
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(pendingRes.ok()).toBeTruthy();
    const pendingBody = await pendingRes.json();
    const items = Array.isArray(pendingBody)
      ? pendingBody
      : pendingBody.items || [];
    const mine = items.find(
      (x: { userEmail: string }) => x.userEmail === email
    );
    expect(mine, "new verification should appear in admin queue").toBeTruthy();

    const approveRes = await apiContext.post(
      `/api/v1/admin/verifications/${mine.id}/approve`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        data: {},
      }
    );
    expect(approveRes.ok()).toBeTruthy();

    // Visit profile, expect verified badge
    await page.goto("/profile/");
    await expect(page.getByText(/vizinho verificado/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
