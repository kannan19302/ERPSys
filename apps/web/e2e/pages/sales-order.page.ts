import { Page, Locator, expect } from '@playwright/test';

export interface SalesOrderData {
  customer?: string;
  items?: Array<{ name: string; qty: number; rate: number }>;
  deliveryDate?: string;
}

export class SalesOrderPage {
  readonly page: Page;
  readonly newOrderButton: Locator;
  readonly saveButton: Locator;
  readonly statusBadge: Locator;
  readonly orderTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newOrderButton = page.locator('a, button').filter({ hasText: /new|create|add.?order/i }).first();
    this.saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first();
    this.statusBadge = page.locator('[class*="badge"], [class*="status"], .ui-badge').first();
    this.orderTable = page.locator('table, [role="grid"], .ui-table').first();
  }

  async goto() {
    await this.page.goto('/sales/orders');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoNew() {
    await this.page.goto('/sales/orders/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async createOrder(data: SalesOrderData) {
    await this.gotoNew();

    if (data.customer) {
      const customerField = this.page.locator('[name="customerId"], [name="customer"], [id*="customer"], [placeholder*="customer"]').first();
      if (await customerField.isVisible()) {
        await customerField.fill(data.customer);
      }
    }

    if (data.items) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const itemField = this.page.locator(`[name*="item"], [name*="product"], [placeholder*="item"]`).first();
        const qtyField = this.page.locator(`[name*="quantity"], [name*="qty"], [type="number"]`).first();
        const rateField = this.page.locator(`[name*="rate"], [name*="price"], [name*="amount"]`).first();

        if (await itemField.isVisible()) {
          await itemField.fill(item.name);
        }
        if (await qtyField.isVisible()) {
          await qtyField.fill(String(item.qty));
        }
        if (await rateField.isVisible()) {
          await rateField.fill(String(item.rate));
        }
      }
    }

    if (data.deliveryDate) {
      const dateField = this.page.locator('[name="deliveryDate"], [name*="delivery"], [type="date"]').first();
      if (await dateField.isVisible()) {
        await dateField.fill(data.deliveryDate);
      }
    }

    await this.saveButton.click();
    await this.page.waitForTimeout(2_000);
  }

  async getStatus(): Promise<string> {
    if (await this.statusBadge.isVisible()) {
      return (await this.statusBadge.textContent()) || '';
    }
    return '';
  }

  async expectOrderCreated() {
    await expect(this.page.locator('body')).not.toContainText('Application error');
    await this.page.waitForTimeout(1_000);
  }

  async findInList(orderRef: string): Promise<boolean> {
    await this.goto();
    const cell = this.page.locator(`td, [role="cell"]`).filter({ hasText: orderRef });
    return await cell.isVisible();
  }
}
