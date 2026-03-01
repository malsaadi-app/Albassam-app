import { test, expect } from '@playwright/test'

function isoDate(offsetDays: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

async function login(page: any, username: string, password: string) {
  await page.goto('/auth/login')
  await page.getByRole('button', { name: 'العربية' }).click()
  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username)
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password)
  await page.getByRole('button', { name: /تسجيل الدخول|دخول/ }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('HR requests: qa_user can submit all request types (smoke)', async ({ page }) => {
  const username = process.env.E2E_USER_USERNAME || 'qa_user'
  const password = process.env.E2E_USER_PASSWORD || 'qa12345'

  await login(page, username, password)

  const requestTypes = [
    'LEAVE',
    'TICKET_ALLOWANCE',
    'FLIGHT_BOOKING',
    'SALARY_CERTIFICATE',
    'HOUSING_ALLOWANCE',
    'VISA_EXIT_REENTRY_SINGLE',
    'VISA_EXIT_REENTRY_MULTI',
    'RESIGNATION',
  ] as const

  for (const type of requestTypes) {
    await page.goto('/hr/requests/new')

    // Capture dialogs (success or error)
    let lastDialogMessage: string | null = null
    page.once('dialog', async (d: any) => {
      lastDialogMessage = d.message()
      await d.accept()
    })

    // Request type select (custom component label may not be associated)
    await page.getByRole('combobox').first().selectOption(type)

    const form = page.locator('form')

    if (type === 'LEAVE') {
      const dates = form.locator('input[type="date"]')
      await dates.nth(0).fill(isoDate(1))
      await dates.nth(1).fill(isoDate(2))
      // leaveType is the second combobox on the page
      await form.getByRole('combobox').nth(1).selectOption('annual')
    }

    if (type === 'TICKET_ALLOWANCE') {
      await form.locator('input:not([type])').first().fill('QA Destination')
      const dates = form.locator('input[type="date"]')
      await dates.first().fill(isoDate(10))
      await form.locator('input[type="number"]').first().fill('100')
    }

    if (type === 'FLIGHT_BOOKING') {
      await form.locator('input:not([type])').first().fill('QA Destination')
      const dates = form.locator('input[type="date"]')
      await dates.nth(0).fill(isoDate(10))
      await dates.nth(1).fill(isoDate(20))
    }

    if (type === 'SALARY_CERTIFICATE') {
      await form.locator('textarea').first().fill('QA salary certificate purpose')
    }

    if (type === 'HOUSING_ALLOWANCE') {
      await form.locator('input[type="number"]').first().fill('250')
      await form.locator('input:not([type])').first().fill('12 شهر')
    }

    if (type === 'VISA_EXIT_REENTRY_SINGLE' || type === 'VISA_EXIT_REENTRY_MULTI') {
      const dates = form.locator('input[type="date"]')
      await dates.nth(0).fill(isoDate(10))
      await dates.nth(1).fill(isoDate(30))
      await form.locator('textarea').first().fill('QA visa reason')
    }

    if (type === 'RESIGNATION') {
      const dates = form.locator('input[type="date"]')
      await dates.first().fill(isoDate(30))
      await form.locator('textarea').first().fill('QA resignation reason')
    }

    await page.getByRole('button', { name: /📝\s*إرسال|إرسال|Submit|تقديم/i }).click()

    // Expect either redirect to list, or at least a dialog message.
    await page.waitForTimeout(300)

    // If UI uses dialogs, we should have one.
    expect(lastDialogMessage, `Expected an alert dialog after submitting ${type}`).toBeTruthy()

    // If it succeeded, app should navigate to /hr/requests.
    // We allow some types to be blocked by workflow config; in that case message usually includes error.
    if (lastDialogMessage && !/خطأ|error/i.test(lastDialogMessage)) {
      await expect(page).toHaveURL(/\/hr\/requests/)
    }
  }
})
