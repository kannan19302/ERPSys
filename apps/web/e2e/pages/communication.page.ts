import { Page, Locator, expect } from "@playwright/test";

export class CommunicationPage {
  readonly page: Page;
  readonly newChannelButton: Locator;
  readonly channelNameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newChannelButton = page.locator(
      'button:has-text("New Channel"), [aria-label="Create Channel"]',
    );
    this.channelNameInput = page.locator(
      'input[name="channelName"], [aria-label="Channel Name"]',
    );
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto("/communication");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async createChannel(channelName: string) {
    await this.newChannelButton.click();
    await this.channelNameInput.fill(channelName);
    await this.submitButton.click();
    await expect(this.page.getByText(channelName).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  async verifyChannelExists(channelName: string) {
    await expect(this.page.getByText(channelName).first()).toBeVisible();
  }
}
