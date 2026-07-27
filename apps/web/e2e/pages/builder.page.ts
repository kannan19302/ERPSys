import { Page, Locator, expect } from "@playwright/test";

export class BuilderPage {
  readonly page: Page;
  readonly newEntityButton: Locator;
  readonly entityNameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newEntityButton = page.locator(
      'button:has-text("New Entity"), [aria-label="Create Entity"]',
    );
    this.entityNameInput = page.locator(
      'input[name="entityName"], [aria-label="Entity Name"]',
    );
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto("/builder");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async createEntity(entityName: string) {
    await this.newEntityButton.click();
    await this.entityNameInput.fill(entityName);
    await this.submitButton.click();
    await expect(this.page.getByText(entityName).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  async verifyEntityExists(entityName: string) {
    await expect(this.page.getByText(entityName).first()).toBeVisible();
  }
}
