import { test, expect } from '@playwright/test'

test('login works and redirects to dashboard', async ({ page }) => {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD
  expect(username, 'E2E_USERNAME env var is required').toBeTruthy()
  expect(password, 'E2E_PASSWORD env var is required').toBeTruthy()

  await page.goto('/auth/login')

  // Ensure Arabic UI for stable placeholders
  await page.getByRole('button', { name: 'العربية' }).click()

  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username!)
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password!)

  await page.getByRole('button', { name: /دخول/ }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading')).toBeVisible()
})
