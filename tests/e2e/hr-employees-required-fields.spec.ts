import { test } from '@playwright/test'

async function login(page: any, username: string, password: string) {
  await page.goto('/auth/login')
  await page.getByRole('button', { name: 'العربية' }).click()
  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username)
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password)
  await page.getByRole('button', { name: /تسجيل الدخول|دخول/ }).click()
}

test('Discover required fields on HR -> New Employee form', async ({ page }) => {
  const username = process.env.E2E_HR_USERNAME || 'qa_hr'
  const password = process.env.E2E_HR_PASSWORD || 'qa12345'

  await login(page, username, password)

  await page.goto('/hr/employees/new')

  const required = page.locator('form [required]')
  const count = await required.count()

  const items: any[] = []
  for (let i = 0; i < count; i++) {
    const el = required.nth(i)
    const info = await el.evaluate((node: any) => {
      const tag = node.tagName?.toLowerCase?.() || ''
      const type = node.getAttribute?.('type') || ''
      const name = node.getAttribute?.('name') || ''
      const id = node.getAttribute?.('id') || ''
      const placeholder = node.getAttribute?.('placeholder') || ''
      const ariaLabel = node.getAttribute?.('aria-label') || ''
      const role = node.getAttribute?.('role') || ''
      const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim() : ''

      // Try to find nearby label text in the component structure
      let nearby = ''
      const container = node.closest('div')
      if (container) {
        const text = container.textContent || ''
        nearby = text.replace(/\s+/g, ' ').trim().slice(0, 120)
      }

      return { tag, type, name, id, placeholder, ariaLabel, role, label, nearby }
    })

    items.push(info)
  }

  console.log(JSON.stringify({ requiredCount: count, items }, null, 2))
})
