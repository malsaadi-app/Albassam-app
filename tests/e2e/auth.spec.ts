import { test, expect } from '@playwright/test'

test('login works and redirects to dashboard', async ({ page }) => {
  const username = process.env.E2E_USERNAME || process.env.E2E_HR_USERNAME || 'qa_hr'
  const password = process.env.E2E_PASSWORD || process.env.E2E_HR_PASSWORD || 'qa12345'

  await page.goto('/auth/login')

  // Ensure Arabic UI for stable placeholders
  await page.getByRole('button', { name: 'العربية' }).click()

  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username)
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password)

  await page.getByRole('button', { name: /تسجيل الدخول|دخول/ }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading')).toBeVisible()
})
