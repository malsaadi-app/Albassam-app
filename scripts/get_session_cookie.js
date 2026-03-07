const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = 'https://app.albassam-app.com';
  await page.goto(`${base}/auth/login`, { waitUntil: 'networkidle' });

  // Wait for the first visible input fields to appear
  await page.waitForSelector('input', { timeout: 20000 });
  const inputs = await page.$$('input');
  if (inputs.length < 2) {
    console.error('Login inputs not found');
    process.exitCode = 2;
  }

  // Fill username & password using the first two inputs (stable in this UI)
  await inputs[0].fill('qa_admin');
  await inputs[1].fill('qa12345');
  // Submit by pressing Enter on password field
  await inputs[1].press('Enter');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {});

  const cookies = await page.context().cookies();
  // find likely session cookie
  const sessionCookie = cookies.find(c => /session|next-auth|auth/i.test(c.name));
  console.log('ALL_COOKIES:', JSON.stringify(cookies, null, 2));
  if (sessionCookie) {
    console.log('SESSION_COOKIE_NAME=' + sessionCookie.name);
    console.log('SESSION_COOKIE_VALUE=' + sessionCookie.value);
  } else {
    console.error('No session cookie found');
    process.exitCode = 2;
  }

  await browser.close();
})();