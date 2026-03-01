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

function controlByNearbyText(page: any, labelText: RegExp) {
  // Finds the first input/select/textarea in a container that contains the label text
  const container = page.locator('div', { hasText: labelText }).first()
  const control = container.locator('input, select, textarea').first()
  return control
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

  // Fill required fields
  await controlByNearbyText(page, /رقم الموظف/).fill(empNo)
  await controlByNearbyText(page, /الاسم الكامل بالعربي/).fill(nameAr)
  await controlByNearbyText(page, /رقم الهوية/).fill(nationalId)
  await controlByNearbyText(page, /رقم الجوال/).fill(phone)

  // Select QA branch + stage
  const branchSelect = controlByNearbyText(page, /الفرع/)
  await branchSelect.selectOption({ label: 'مدارس البسام الأهلية بنين — QA' })

  const stageSelect = controlByNearbyText(page, /المرحلة/)
  // Wait for stages to populate
  await expect(stageSelect).toBeEnabled()
  await stageSelect.selectOption({ label: 'ابتدائي' })

  // Submit and accept dialog
  const dialogPromise = page.waitForEvent('dialog')
  await page.getByRole('button', { name: /إضافة الموظف/ }).click()
  const dialog = await dialogPromise
  const msg = dialog.message()
  await dialog.accept()
  expect(msg).toMatch(/تم إضافة الموظف بنجاح|نجاح/i)

  // Redirects to employee page
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
