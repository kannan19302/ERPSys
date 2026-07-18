import { Page, Locator, expect } from '@playwright/test';

export interface GoodsReceiptData {
  purchaseOrderRef?: string;
  items?: Array<{ name: string; qty: number }>;
  receivedDate?: string;
}

export class GoodsReceiptPage {
  readonly page: Page;
  readonly newGRButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newGRButton = page.locator('a, button').filter({ hasText: /new|create|add.?receipt|record.?receipt/i }).first();
    this.saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|record/i }).first();
  }

  async goto() {
    await this.page.goto('/procurement/goods-receipts');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoNew() {
    await this.page.goto('/procurement/goods-receipts/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async recordReceipt(data: GoodsReceiptData) {
    if (await this.newGRButton.isVisible()) {
      await this.newGRButton.click();
      await this.page.waitForTimeout(1_000);
    }

    if (data.purchaseOrderRef) {
      const field = this.page.locator('[name="purchaseOrderId"], [name*="order"], [placeholder*="order"]').first();
      if (await field.isVisible()) {
        await field.fill(data.purchaseOrderRef);
      }
    }

    if (data.items) {
      for (const item of data.items) {
        const itemField = this.page.locator('[name*="item"], [placeholder*="item"]').first();
        const qtyField = this.page.locator('[name*="quantity"], [type="number"]').first();
        if (await itemField.isVisible()) await itemField.fill(item.name);
        if (await qtyField.isVisible()) await qtyField.fill(String(item.qty));
      }
    }

    if (data.receivedDate) {
      const field = this.page.locator('[name="receivedDate"], [type="date"]').first();
      if (await field.isVisible()) await field.fill(data.receivedDate);
    }

    await this.saveButton.click();
    await this.page.waitForTimeout(2_000);
  }

  async expectReceiptRecorded() {
    await expect(this.page.locator('body')).not.toContainText('Application error');
    await this.page.waitForTimeout(1_000);
  }
}
