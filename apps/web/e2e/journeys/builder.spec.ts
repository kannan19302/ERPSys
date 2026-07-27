import { expect } from "@playwright/test";
import { test, loginAsAdmin } from "../fixtures/auth.fixture";
import { BuilderPage } from "../pages/builder.page";

test.describe("Builder E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("create and verify a custom entity", async ({ page }) => {
    const builderPage = new BuilderPage(page);
    await builderPage.goto();

    const entityName = `ENT-${Date.now()}`;
    await builderPage.createEntity(entityName);
    await builderPage.verifyEntityExists(entityName);
  });
});
