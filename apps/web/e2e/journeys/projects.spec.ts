import { expect } from "@playwright/test";
import { test, loginAsAdmin } from "../fixtures/auth.fixture";
import { ProjectsPage } from "../pages/projects.page";

test.describe("Projects E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("create and verify a project", async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();

    const projectName = `PRJ-${Date.now()}`;
    await projectsPage.createProject(projectName);
    await projectsPage.verifyProjectExists(projectName);
  });
});
