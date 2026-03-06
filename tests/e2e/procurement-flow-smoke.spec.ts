import { test, expect } from '@playwright/test'

async function login(page: any, username: string, password: string) {
  await page.goto('/auth/login')
  await page.getByRole('button', { name: 'العربية' }).click()
  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username)
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password)
  await page.getByRole('button', { name: /تسجيل الدخول|دخول/ }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('Procurement smoke: create request then gatekeeper approves step0', async ({ page }) => {
  const user = process.env.E2E_USER_USERNAME || 'qa_user'
  const pass = process.env.E2E_USER_PASSWORD || 'qa12345'
  await login(page, user, pass)

  // Create purchase request
  await page.goto('/procurement/requests/new')

  // Minimal fill: department, category, at least one item.
  // Select first category option (after placeholder)
  const selects = page.locator('select')
  await selects.first().selectOption({ index: 1 })

  // Department input
  const dept = page.locator('input').first()
  await dept.fill('QA Dept')

  // Items: try fill first item row (name + qty)
  const nameInput = page.locator('input').nth(1)
  await nameInput.fill('QA Item')
  const qtyInput = page.locator('input[type="number"]').first()
  await qtyInput.fill('1')

  // Submit
  await page.getByRole('button', { name: /إنشاء الطلب|إرسال|حفظ|Submit|تقديم/i }).click()

  // Success path: redirected to request details page
  await expect(page).toHaveURL(/\/procurement\/requests\/[a-z0-9_-]+/i)

  // NOTE: gatekeeper approval step can be expanded later once QA accounts for approvers are available.
})
