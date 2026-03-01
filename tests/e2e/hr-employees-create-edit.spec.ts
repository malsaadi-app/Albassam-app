import { test, expect } from '@playwright/test'

async function login(page: any, username: string, password: string) {
  await page.goto('/auth/login')
  await page.getByRole('button', { name: 'العربية' }).click()
  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username)
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password)
  await page.getByRole('button', { name: /تسجيل الدخول|دخول/ }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}`
}

function controlByNearbyText(scope: any, labelText: RegExp) {
  // Within a scoped section, find the first form control that appears in a div containing the label text.
  // (UI inputs don't always have proper <label for=> associations.)
  return scope
    .locator('div')
    .filter({ hasText: labelText })
    .locator('input, select, textarea')
    .first()
}

test('HR employees: qa_hr can create employee in QA branch and then edit basic fields', async ({ page }) => {
  const username = process.env.E2E_HR_USERNAME || 'qa_hr'
  const password = process.env.E2E_HR_PASSWORD || 'qa12345'

  await login(page, username, password)

  const empNo = uniqueId('QA-EMP')
  const nationalId = String(9000000000 + (Date.now() % 1000000000)).slice(0, 10)
  const nameAr = `موظف اختبار ${empNo}`
  const phone = `05${String(Date.now() % 100000000).padStart(8, '0')}`

  await page.goto('/hr/employees/new')

  const basicSection = page.locator('h3', { hasText: '📋 البيانات الأساسية' }).locator('..')
  const contactSection = page.locator('h3', { hasText: '📞 معلومات الاتصال' }).locator('..')
  const jobSection = page.locator('h3', { hasText: '💼 البيانات الوظيفية' }).locator('..')

  // Fill required fields
  await controlByNearbyText(basicSection, /رقم الموظف/).fill(empNo)
  await controlByNearbyText(basicSection, /الاسم الكامل بالعربي/).fill(nameAr)
  await controlByNearbyText(basicSection, /رقم الهوية/).fill(nationalId)
  await controlByNearbyText(contactSection, /رقم الجوال/).fill(phone)

  // Select QA branch + stage (these are <select> elements with role=combobox)
  const branchSelect = jobSection
    .locator('div')
    .filter({ hasText: /الفرع\s*🏢/ })
    .locator('select')
    .first()

  // Select QA branch by partial text (label matching can be fragile)
  const qaBranchValue = await branchSelect.evaluate((sel: HTMLSelectElement) => {
    const opt = Array.from(sel.options).find((o) => (o.textContent || '').includes('بنين') && (o.textContent || '').includes('QA'))
    return opt?.value || ''
  })
  expect(qaBranchValue, 'QA branch option not found in branch select').toBeTruthy()
  await branchSelect.selectOption(qaBranchValue)

  const stageSelect = jobSection
    .locator('div')
    .filter({ hasText: /المرحلة\s*🎓/ })
    .locator('select')
    .first()

  await expect(stageSelect).toBeEnabled()
  // Wait for stages to load (expect more than the default 'بدون مرحلة')
  await expect
    .poll(async () => stageSelect.locator('option').count(), { timeout: 15000 })
    .toBeGreaterThan(1)
  // Select first real stage (index 1)
  await stageSelect.selectOption({ index: 1 })

  // Submit: wait for either dialog OR navigation to employee page
  const dialogPromise = page.waitForEvent('dialog').then(async (d) => {
    const msg = d.message()
    await d.accept()
    return msg
  }).catch(() => null)

  await page.getByRole('button', { name: /إضافة الموظف/ }).click()

  const navPromise = page.waitForURL(/\/hr\/employees\//, { timeout: 20000 }).then(() => 'NAV' as const).catch(() => null)
  const result = await Promise.race([
    dialogPromise.then(() => 'DIALOG' as const),
    navPromise,
    page.waitForTimeout(20000).then(() => 'TIMEOUT' as const),
  ])
  expect(result).not.toBe('TIMEOUT')

  // Ensure we are on employee page
  await expect(page).toHaveURL(/\/hr\/employees\//)
  await expect(page.locator('body')).toContainText(nameAr)
  await expect(page.locator('body')).toContainText(nationalId)

  // Edit (navigate to edit page)
  await page.goto(`${page.url()}/edit`)

  const newDept = 'QA Dept'
  const newPos = 'QA Position'
  await controlByNearbyText(page, /القسم/).fill(newDept)
  await controlByNearbyText(page, /المسمى الوظيفي/).fill(newPos)

  const saveDialogPromise = page.waitForEvent('dialog')
  await page.getByRole('button', { name: /حفظ|تحديث|Save|Update/ }).click()
  const saveDialog = await saveDialogPromise
  await saveDialog.accept()

  // Back to view page should reflect edits (best-effort)
  await page.goto(page.url().replace(/\/edit$/, ''))
  await expect(page.locator('body')).toContainText(newDept)
  await expect(page.locator('body')).toContainText(newPos)
})
