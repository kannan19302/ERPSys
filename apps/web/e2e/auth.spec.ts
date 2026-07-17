import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByPlaceholder('name@company.com')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[type="email"]', 'invalid@test.com');
    await page.fill('[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should show error (either from API or connection failure)
    await expect(page.locator('[role="alert"], .ui-card-body')).toBeVisible({ timeout: 10000 });
  });

  test('SSO config endpoint returns discovery info', async ({ request }) => {
    const response = await request.get('/api/v1/auth/sso/config/acme');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('configured');
  });
});
