import { expect } from "@playwright/test";
import { test, loginAsAdmin } from "../fixtures/auth.fixture";
import { ManufacturingPage } from "../pages/manufacturing.page";

test.describe("Manufacturing E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("create and verify a production order", async ({ page }) => {
    const mfgPage = new ManufacturingPage(page);
    await mfgPage.goto();

    const orderId = `MFG-${Date.now()}`;
    await mfgPage.createProductionOrder(orderId);
    await mfgPage.verifyOrderExists(orderId);
  });
});
