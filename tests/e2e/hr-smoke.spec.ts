import { test, expect } from '@playwright/test'

async function login(page: any, username: string, password: string) {
  await page.goto('/auth/login')
  await page.getByRole('button', { name: 'العربية' }).click()
  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username)
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password)
  await page.getByRole('button', { name: /تسجيل الدخول|دخول/ }).click()
}

test('HR smoke: qa_hr can open HR employees and HR requests pages', async ({ page }) => {
  const username = process.env.E2E_HR_USERNAME || 'qa_hr'
  const password = process.env.E2E_HR_PASSWORD || 'qa12345'

  await login(page, username, password)

  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/hr/employees')
  await expect(page).toHaveURL(/\/hr\/employees/)
  // At least page loads with some header/content
  await expect(page.locator('body')).toContainText(/الموظفين|Employees/)

  await page.goto('/hr/requests')
  await expect(page).toHaveURL(/\/hr\/requests/)
  await expect(page.locator('body')).toContainText(/الطلبات|Requests/)
})
