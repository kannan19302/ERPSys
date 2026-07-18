import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly sidebarNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('h1, h2, .ui-card-header').first();
    this.sidebarNav = page.locator('nav, [role="navigation"], .ui-sidebar');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await this.page.waitForTimeout(2_000);
  }

  async navigateToModule(modulePath: string) {
    await this.page.goto(modulePath);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1_500);
  }

  async expectNoErrorBoundaries() {
    const body = await this.page.locator('body').innerText();
    const errorMarkers = [
      'Application error',
      'Internal Server Error',
      'Something went wrong',
      'This page could not be found',
    ];
    for (const marker of errorMarkers) {
      expect(body).not.toContain(marker);
    }
  }
}
