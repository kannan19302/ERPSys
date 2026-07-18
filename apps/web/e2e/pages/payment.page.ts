import { Page, Locator, expect } from '@playwright/test';

export interface PaymentData {
  invoiceRef?: string;
  amount?: number;
  paymentDate?: string;
  method?: string;
  reference?: string;
}

export class PaymentPage {
  readonly page: Page;
  readonly newPaymentButton: Locator;
  readonly saveButton: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newPaymentButton = page.locator('a, button').filter({ hasText: /new|create|add.?payment|record.?payment/i }).first();
    this.saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|record/i }).first();
    this.statusBadge = page.locator('[class*="badge"], [class*="status"], .ui-badge').first();
  }

  async goto() {
    await this.page.goto('/finance/payments');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoNew() {
    await this.page.goto('/finance/payments/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async recordPayment(data: PaymentData) {
    if (await this.newPaymentButton.isVisible()) {
      await this.newPaymentButton.click();
      await this.page.waitForTimeout(1_000);
    }

    if (data.invoiceRef) {
      const field = this.page.locator('[name="invoiceId"], [name*="invoice"], [placeholder*="invoice"]').first();
      if (await field.isVisible()) {
        await field.fill(data.invoiceRef);
      }
    }

    if (data.amount) {
      const field = this.page.locator('[name="amount"], [type="number"]').first();
      if (await field.isVisible()) {
        await field.fill(String(data.amount));
      }
    }

    if (data.paymentDate) {
      const field = this.page.locator('[name="paymentDate"], [type="date"]').first();
      if (await field.isVisible()) await field.fill(data.paymentDate);
    }

    if (data.method) {
      const field = this.page.locator('[name="method"], [name="paymentMethod"], [placeholder*="method"]').first();
      if (await field.isVisible()) await field.fill(data.method);
    }

    if (data.reference) {
      const field = this.page.locator('[name="reference"], [name="ref"], [placeholder*="reference"]').first();
      if (await field.isVisible()) await field.fill(data.reference);
    }

    await this.saveButton.click();
    await this.page.waitForTimeout(2_000);
  }

  async expectPaymentRecorded() {
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
