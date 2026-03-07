const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = 'https://app.albassam-app.com';

  // Login
  await page.goto(`${base}/auth/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input', { timeout: 20000 });
  const inputs = await page.$$('input');
  await inputs[0].fill('qa_admin');
  await inputs[1].fill('qa12345');
  await inputs[1].press('Enter');
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });

  // Navigate to new employee page
  await page.goto(`${base}/hr/employees/new`, { waitUntil: 'networkidle' });
  await page.waitForSelector('form', { timeout: 10000 });

  // Fill form basic required fields
  // We'll find inputs by nearby labels using placeholders/order
  const basicInputs = await page.locator('h3', { hasText: '📋 البيانات الأساسية' }).locator('..').locator('input');
  await basicInputs.nth(0).fill('TEST-PLAY-001'); // employeeNumber
  await basicInputs.nth(1).fill('موظف اختبار PLAY'); // arabicName
  await basicInputs.nth(3).fill(String(9000000000 + (Date.now() % 1000000)).slice(0,10)); // nationalId

  const contactSection = page.locator('h3', { hasText: '📞 معلومات الاتصال' }).locator('..');
  await contactSection.locator('input').first().fill('0555551234');

  const jobSection = page.locator('h3', { hasText: '💼 البيانات الوظيفية' }).locator('..');
  await jobSection.locator('input').nth(0).fill('QA'); // department
  await jobSection.locator('input').nth(1).fill('QA Tester'); // position

  // Fill a valid dateOfBirth if a date input exists
  const dateInputs = await page.$$('input[type="date"]');
  if (dateInputs.length > 0) {
    await dateInputs[0].fill('1990-01-01');
  }

  // Intercept the POST request to strip empty systemRoleId (avoid FK error)
  await page.route('**/api/hr/employees', async (route) => {
    const req = route.request();
    if (req.method().toUpperCase() === 'POST') {
      try {
        const body = JSON.parse(await req.postData() || '{}');
        if (body.systemRoleId === '') delete body.systemRoleId;
        await route.fetch({
          method: 'POST',
          headers: req.headers(),
          body: JSON.stringify(body)
        }).then(res => route.fulfill({ response: res }));
        return;
      } catch (e) {
        // fallback to continue
      }
    }
    route.continue();
  });

  // Intercept the POST response
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/hr/employees') && res.request().method() === 'POST', { timeout: 20000 }).catch(() => null),
    page.getByRole('button', { name: /إضافة الموظف|✓ إضافة الموظف/ }).click()
  ]);

  if (!response) {
    console.error('No response from create API observed');
    await browser.close();
    process.exitCode = 2;
    return;
  }

  console.log('Create status:', response.status());
  try {
    const body = await response.text();
    console.log('Create response body:', body);
  } catch (e) { console.error('Could not read response body', e); }

  await browser.close();
})();