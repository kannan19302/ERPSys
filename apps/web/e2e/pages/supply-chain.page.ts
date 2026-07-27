import { Page, Locator, expect } from "@playwright/test";

export class SupplyChainPage {
  readonly page: Page;
  readonly newShipmentButton: Locator;
  readonly shipmentIdInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newShipmentButton = page.locator(
      'button:has-text("New Shipment"), [aria-label="Create Shipment"]',
    );
    this.shipmentIdInput = page.locator(
      'input[name="shipmentId"], [aria-label="Shipment ID"]',
    );
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto("/supply-chain");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async createShipment(shipmentId: string) {
    await this.newShipmentButton.click();
    await this.shipmentIdInput.fill(shipmentId);
    await this.submitButton.click();
    await expect(this.page.getByText(shipmentId).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  async verifyShipmentExists(shipmentId: string) {
    await expect(this.page.getByText(shipmentId).first()).toBeVisible();
  }
}
