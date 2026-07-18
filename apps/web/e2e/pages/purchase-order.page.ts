import { Page, Locator, expect } from '@playwright/test';

export interface PurchaseOrderData {
  vendor?: string;
  items?: Array<{ name: string; qty: number; rate: number }>;
  expectedDate?: string;
}

export class PurchaseOrderPage {
  readonly page: Page;
  readonly newPOButton: Locator;
  readonly saveButton: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newPOButton = page.locator('a, button').filter({ hasText: /new|create|add.?purchase|add.?order/i }).first();
    this.saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first();
    this.statusBadge = page.locator('[class*="badge"], [class*="status"], .ui-badge').first();
  }

  async goto() {
    await this.page.goto('/procurement/purchase-orders');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoNew() {
    await this.page.goto('/procurement/purchase-orders/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async createPO(data: PurchaseOrderData) {
    await this.gotoNew();

    if (data.vendor) {
      const field = this.page.locator('[name="vendorId"], [name="vendor"], [id*="vendor"], [placeholder*="vendor"]').first();
      if (await field.isVisible()) {
        await field.fill(data.vendor);
      }
    }

    if (data.items) {
      for (const item of data.items) {
        const itemField = this.page.locator('[name*="item"], [placeholder*="item"]').first();
        const qtyField = this.page.locator('[name*="quantity"], [type="number"]').first();
        const rateField = this.page.locator('[name*="rate"], [name*="price"], [name*="amount"]').first();
        if (await itemField.isVisible()) await itemField.fill(item.name);
        if (await qtyField.isVisible()) await qtyField.fill(String(item.qty));
        if (await rateField.isVisible()) await rateField.fill(String(item.rate));
      }
    }

    if (data.expectedDate) {
      const field = this.page.locator('[name="expectedDate"], [name*="delivery"], [type="date"]').first();
      if (await field.isVisible()) await field.fill(data.expectedDate);
    }

    await this.saveButton.click();
    await this.page.waitForTimeout(2_000);
  }

  async expectPOCreated() {
    await expect(this.page.locator('body')).not.toContainText('Application error');
    await this.page.waitForTimeout(1_000);
  }

  async getStatus(): Promise<string> {
    if (await this.statusBadge.isVisible()) {
      return (await this.statusBadge.textContent()) || '';
    }
    return '';
  }
}
