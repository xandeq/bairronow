// Standalone Playwright script for UAT Test 5 UI evidence.
// Runs: login -> /profile/settings -> click Exportar -> screenshot (happy)
//        -> click Exportar again -> screenshot (rate-limit error)
// Produces PNGs under .playwright-mcp/

import { chromium } from '@playwright/test';
import path from 'node:path';

const FRONTEND = 'http://localhost:3000';
const EMAIL = 'uat@bairronow.test';
const PASSWORD = 'Uat@PasswordStr0ng!';
const SCREENSHOT_DIR = path.resolve('D:/claude-code/bairronow/.playwright-mcp');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Capture network events for later inspection
  const requests = [];
  page.on('response', async (r) => {
    const url = r.url();
    if (url.includes('/api/v1/account/export')) {
      requests.push({ url, status: r.status(), headers: r.headers() });
    }
  });

  console.log('STEP 1: Navigate to /login');
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'networkidle' });

  console.log('STEP 2: Fill credentials and submit');
  await page.getByLabel(/e-?mail/i).first().fill(EMAIL).catch(async () => {
    await page.locator('input[type="email"]').fill(EMAIL);
  });
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();

  console.log('STEP 3: Wait for navigation away from /login');
  await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 15000 }).catch(() => {});
  await sleep(1500);
  console.log('  currentUrl=', page.url());

  console.log('STEP 4: Navigate to /profile/settings');
  await page.goto(`${FRONTEND}/profile/settings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  console.log('  landedUrl=', page.url());

  console.log('STEP 5: Screenshot initial state');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat-test5-settings-before.png'), fullPage: true });

  console.log('STEP 6: Click "Exportar meus dados" (first time)');
  const exportBtn = page.getByRole('button', { name: /exportar meus dados/i });
  await exportBtn.click();

  // Wait for the response to settle
  await page.waitForResponse(r => r.url().includes('/api/v1/account/export'), { timeout: 15000 }).catch(() => {});
  await sleep(2000);

  console.log('STEP 7: Screenshot after first export (happy path)');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat-test5-export-blob.png'), fullPage: true });

  console.log('STEP 8: Click "Exportar meus dados" (second time for rate limit)');
  await exportBtn.click();
  await page.waitForResponse(r => r.url().includes('/api/v1/account/export'), { timeout: 15000 }).catch(() => {});
  await sleep(2000);

  console.log('STEP 9: Screenshot after second export (rate-limit path)');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat-test5-ratelimit.png'), fullPage: true });

  console.log('STEP 10: Network summary');
  for (const r of requests) {
    console.log(`  ${r.status} ${r.url}`);
  }

  await browser.close();
  console.log('DONE');
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
