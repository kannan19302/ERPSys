import { expect } from "@playwright/test";
import { test, loginAsAdmin } from "../fixtures/auth.fixture";
import { CommunicationPage } from "../pages/communication.page";

test.describe("Communication E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("create and verify a communication channel", async ({ page }) => {
    const commPage = new CommunicationPage(page);
    await commPage.goto();

    const channelName = `CH-${Date.now()}`;
    await commPage.createChannel(channelName);
    await commPage.verifyChannelExists(channelName);
  });
});
