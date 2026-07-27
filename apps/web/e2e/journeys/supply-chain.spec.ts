import { expect } from "@playwright/test";
import { test, loginAsAdmin } from "../fixtures/auth.fixture";
import { SupplyChainPage } from "../pages/supply-chain.page";

test.describe("Supply Chain E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("create and verify a shipment", async ({ page }) => {
    const supplyChainPage = new SupplyChainPage(page);
    await supplyChainPage.goto();

    const shipmentId = `SC-${Date.now()}`;
    await supplyChainPage.createShipment(shipmentId);
    await supplyChainPage.verifyShipmentExists(shipmentId);
  });
});
