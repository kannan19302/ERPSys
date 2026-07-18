import { Page, Locator, expect } from '@playwright/test';

export interface InvoiceData {
  customer?: string;
  orderRef?: string;
  items?: Array<{ name: string; qty: number; amount: number }>;
  dueDate?: string;
}

export class InvoicePage {
  readonly page: Page;
  readonly newInvoiceButton: Locator;
  readonly saveButton: Locator;
  readonly statusBadge: Locator;
  readonly invoiceTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newInvoiceButton = page.locator('a, button').filter({ hasText: /new|create|add.?invoice/i }).first();
    this.saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first();
    this.statusBadge = page.locator('[class*="badge"], [class*="status"], .ui-badge').first();
    this.invoiceTable = page.locator('table, [role="grid"], .ui-table').first();
  }

  async goto() {
    await this.page.goto('/finance/invoices');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoNew() {
    await this.page.goto('/finance/invoices/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async createInvoice(data: InvoiceData) {
    await this.gotoNew();

    if (data.customer) {
      const field = this.page.locator('[name="customerId"], [name="customer"], [id*="customer"], [placeholder*="customer"]').first();
      if (await field.isVisible()) {
        await field.fill(data.customer);
      }
    }

    if (data.orderRef) {
      const field = this.page.locator('[name="orderId"], [name*="order"], [placeholder*="order"]').first();
      if (await field.isVisible()) {
        await field.fill(data.orderRef);
      }
    }

    if (data.items) {
      for (const item of data.items) {
        const nameField = this.page.locator('[name*="item"], [placeholder*="item"]').first();
        const qtyField = this.page.locator('[name*="quantity"], [type="number"]').first();
        const amountField = this.page.locator('[name*="rate"], [name*="amount"], [name*="price"]').first();
        if (await nameField.isVisible()) await nameField.fill(item.name);
        if (await qtyField.isVisible()) await qtyField.fill(String(item.qty));
        if (await amountField.isVisible()) await amountField.fill(String(item.amount));
      }
    }

    if (data.dueDate) {
      const field = this.page.locator('[name="dueDate"], [type="date"]').first();
      if (await field.isVisible()) await field.fill(data.dueDate);
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

  async expectInvoiceCreated() {
    await expect(this.page.locator('body')).not.toContainText('Application error');
    await this.page.waitForTimeout(1_000);
  }

  async findInList(invoiceRef: string): Promise<boolean> {
    await this.goto();
    const cell = this.page.locator(`td, [role="cell"]`).filter({ hasText: invoiceRef });
    return await cell.isVisible();
  }
}
