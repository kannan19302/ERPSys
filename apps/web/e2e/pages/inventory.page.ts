import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly productTable: Locator;
  readonly stockLevelCell: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('[type="search"], [placeholder*="search"], [placeholder*="find"]').first();
    this.productTable = page.locator('table, [role="grid"], .ui-table').first();
    this.stockLevelCell = page.locator('[class*="stock"], [class*="quantity"], td:nth-child(3)').first();
  }

  async goto() {
    await this.page.goto('/inventory/products');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async searchProduct(name: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(name);
      await this.page.waitForTimeout(1_000);
    }
  }

  async getStockLevel(productName?: string): Promise<string> {
    if (productName) {
      await this.searchProduct(productName);
    }
    if (await this.stockLevelCell.isVisible()) {
      return (await this.stockLevelCell.textContent()) || '0';
    }
    return '0';
  }

  async expectProductVisible(productName: string) {
    await expect(this.page.locator(`td, [role="cell"]`).filter({ hasText: productName }).first()).toBeVisible({ timeout: 10_000 });
  }

  async expectNoErrors() {
    await expect(this.page.locator('body')).not.toContainText('Application error');
  }
}
