import { Page, Locator, expect } from "@playwright/test";

export class ManufacturingPage {
  readonly page: Page;
  readonly newOrderButton: Locator;
  readonly orderIdInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newOrderButton = page.locator(
      'button:has-text("New Order"), [aria-label="Create Order"]',
    );
    this.orderIdInput = page.locator(
      'input[name="orderId"], [aria-label="Order ID"]',
    );
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto("/manufacturing");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async createProductionOrder(orderId: string) {
    await this.newOrderButton.click();
    await this.orderIdInput.fill(orderId);
    await this.submitButton.click();
    await expect(this.page.getByText(orderId).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  async verifyOrderExists(orderId: string) {
    await expect(this.page.getByText(orderId).first()).toBeVisible();
  }
}
