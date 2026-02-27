import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/البسام/);
    await expect(page.getByRole('heading', { name: /تسجيل الدخول/ })).toBeVisible();
    await expect(page.getByLabel(/اسم المستخدم/)).toBeVisible();
    await expect(page.getByLabel(/كلمة المرور/)).toBeVisible();
    await expect(page.getByRole('button', { name: /دخول/ })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/اسم المستخدم/).fill('invalid');
    await page.getByLabel(/كلمة المرور/).fill('wrongpassword');
    await page.getByRole('button', { name: /دخول/ }).click();

    await expect(page.getByText(/اسم المستخدم أو كلمة المرور غير صحيحة/)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.getByLabel(/اسم المستخدم/).fill('mohammed');
    await page.getByLabel(/كلمة المرور/).fill('albassam2024');
    await page.getByRole('button', { name: /دخول/ }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/مرحباً/)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/اسم المستخدم/).fill('mohammed');
    await page.getByLabel(/كلمة المرور/).fill('albassam2024');
    await page.getByRole('button', { name: /دخول/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByRole('button', { name: /تسجيل الخروج/ }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\//);
    await expect(page.getByRole('heading', { name: /تسجيل الدخول/ })).toBeVisible();
  });

  test('should remember me functionality work', async ({ page }) => {
    await page.getByLabel(/اسم المستخدم/).fill('mohammed');
    await page.getByLabel(/كلمة المرور/).fill('albassam2024');
    await page.getByLabel(/تذكرني/).check();
    await page.getByRole('button', { name: /دخول/ }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    // Check if session persists after page reload
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\//);
  });

  test('should access protected route after authentication', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.getByLabel(/اسم المستخدم/).fill('mohammed');
    await page.getByLabel(/كلمة المرور/).fill('albassam2024');
    await page.getByRole('button', { name: /دخول/ }).click();

    // Navigate to protected route
    await page.goto('/hr/employees');
    await expect(page).toHaveURL(/\/hr\/employees/);
    await expect(page.getByRole('heading', { name: /الموظفون/ })).toBeVisible();
  });
});
