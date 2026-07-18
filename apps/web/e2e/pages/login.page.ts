import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[type="email"]');
    this.passwordInput = page.locator('[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
  }

  async expectLoginError() {
    await expect(this.page.locator('[role="alert"], .ui-card-body:has-text("error"), .text-red-500')).toBeVisible({ timeout: 10_000 });
  }

  async expectLoginPageVisible() {
    await expect(this.page.getByText(/welcome.?back|sign.?in|log.?in/i).first()).toBeVisible({ timeout: 10_000 });
  }
}
