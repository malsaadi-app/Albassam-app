import { test, expect } from '@playwright/test'

async function login(page: any, username: string, password: string) {
  await page.goto('/auth/login')

  // Best-effort: switch to Arabic for stable placeholders
  const arBtn = page.getByRole('button', { name: 'العربية' })
  if (await arBtn.count().catch(() => 0)) {
    await arBtn.first().click().catch(() => {})
  }

  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username)
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password)
  await page.getByRole('button', { name: /تسجيل الدخول|دخول/ }).click()

  const ok = await page
    .waitForURL(/\/dashboard/, { timeout: 15000 })
    .then(() => true)
    .catch(() => false)

  if (!ok) {
    const errText = await page.locator('body').innerText().catch(() => '')
    throw new Error(`Login failed for ${username}. Still on ${page.url()}. Page text: ${errText.slice(0, 300)}`)
  }
}

async function logout(page: any) {
  // best-effort: hit logout endpoint then go to login
  await page.goto('/api/auth/logout')
  await page.goto('/auth/login')
}

test('Procurement UI E2E: requester -> asma -> mq -> abdullahsh -> requester confirm receipt', async ({ page, request }) => {
  // 1) Requester creates PR
  await login(page, 'qa_requester_girls', 'qa12345')
  await page.goto('/procurement/requests/new')

  await page.getByLabel('القسم الطالب').fill('QA Dept')
  await page.getByLabel('الفئة').selectOption('STATIONERY')
  await page.getByLabel('الأولوية').selectOption('NORMAL')

  // first item row
  await page.getByPlaceholder('اسم الصنف').fill('QA Item')
  await page.getByLabel('الكمية').fill('1')

  // Submit
  await page.getByRole('button', { name: /إرسال الطلب|إرسال|Submit/ }).click()

  await expect(page).toHaveURL(/\/procurement\/requests\/[a-z0-9]+/i)
  const prUrl = page.url()
  const prId = prUrl.split('/').pop()!

  // 2) Asma gatekeeper approves (via UI approve)
  await logout(page)
  await login(page, 'asma', 'Test1234')
  await page.goto(`/procurement/requests/${prId}`)

  await page.getByRole('button', { name: /^✓ موافقة$/ }).click()
  await page.getByRole('button', { name: /تأكيد الموافقة/ }).click()
  // Status should remain pending review (gatekeeper pre-approval)
  await expect(page.locator('body')).toContainText('معلق')

  // 3) mq approves (moves to next step -> REVIEWED)
  await logout(page)
  await login(page, 'mq', 'Test1234')
  await page.goto(`/procurement/requests/${prId}`)

  await page.getByRole('button', { name: /^✓ موافقة$/ }).click()
  await page.getByRole('button', { name: /تأكيد الموافقة/ }).click()
  await expect(page.locator('body')).toContainText('تمت المراجعة')

  // 4) abdullahsh approves (last step -> IN_PROGRESS)
  await logout(page)
  await login(page, 'abdullahsh', 'Test1234')
  await page.goto(`/procurement/requests/${prId}`)

  await page.getByRole('button', { name: /^✓ موافقة$/ }).click()
  await page.getByRole('button', { name: /تأكيد الموافقة/ }).click()
  await expect(page.locator('body')).toContainText('قيد التنفيذ')

  // 5) requester confirms receipt (API call) -> COMPLETED
  // Use API login to get cookie, then call confirm-receipt
  const loginRes = await request.post('/api/auth/login', {
    data: { username: 'qa_requester_girls', password: 'qa12345' },
  })
  expect([200, 302]).toContain(loginRes.status())

  const confirmRes = await request.post(`/api/procurement/requests/${prId}/confirm-receipt`)
  expect(confirmRes.status()).toBe(200)

  // Back in UI: requester sees completed
  await logout(page)
  await login(page, 'qa_requester_girls', 'qa12345')
  await page.goto(`/procurement/requests/${prId}`)
  await expect(page.locator('body')).toContainText('مكتمل')
})
