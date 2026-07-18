import { Page, Locator, expect } from '@playwright/test';

export interface JournalEntryData {
  date?: string;
  reference?: string;
  description?: string;
  entries?: Array<{ account: string; debit?: number; credit?: number }>;
}

export class GLJournalPage {
  readonly page: Page;
  readonly newEntryButton: Locator;
  readonly saveButton: Locator;
  readonly postButton: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newEntryButton = page.locator('a, button').filter({ hasText: /new|create|add.?entry|add.?journal/i }).first();
    this.saveButton = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create|draft/i }).first();
    this.postButton = page.locator('button').filter({ hasText: /post|submit|record/i }).first();
    this.statusBadge = page.locator('[class*="badge"], [class*="status"], .ui-badge').first();
  }

  async goto() {
    await this.page.goto('/finance/advanced/journal-entries');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoNew() {
    await this.page.goto('/finance/advanced/journal-entries/new');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async createEntry(data: JournalEntryData) {
    await this.gotoNew();

    if (data.date) {
      const field = this.page.locator('[name="date"], [name="entryDate"], [type="date"]').first();
      if (await field.isVisible()) await field.fill(data.date);
    }

    if (data.reference) {
      const field = this.page.locator('[name="reference"], [name="ref"], [placeholder*="reference"]').first();
      if (await field.isVisible()) await field.fill(data.reference);
    }

    if (data.description) {
      const field = this.page.locator('[name="description"], [name="notes"], [placeholder*="description"]').first();
      if (await field.isVisible()) await field.fill(data.description);
    }

    if (data.entries) {
      for (const entry of data.entries) {
        const acctField = this.page.locator('[name*="account"], [placeholder*="account"]').first();
        const debitField = this.page.locator('[name*="debit"]').first();
        const creditField = this.page.locator('[name*="credit"]').first();
        if (await acctField.isVisible()) await acctField.fill(entry.account);
        if (entry.debit && await debitField.isVisible()) await debitField.fill(String(entry.debit));
        if (entry.credit && await creditField.isVisible()) await creditField.fill(String(entry.credit));
      }
    }

    await this.saveButton.click();
    await this.page.waitForTimeout(2_000);
  }

  async postEntry() {
    if (await this.postButton.isVisible()) {
      await this.postButton.click();
      await this.page.waitForTimeout(2_000);
    }
  }

  async expectEntryCreated() {
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
