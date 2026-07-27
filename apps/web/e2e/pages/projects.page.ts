import { Page, Locator, expect } from "@playwright/test";

export class ProjectsPage {
  readonly page: Page;
  readonly newProjectButton: Locator;
  readonly projectNameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newProjectButton = page.locator(
      'button:has-text("New Project"), [aria-label="Create Project"]',
    );
    this.projectNameInput = page.locator(
      'input[name="projectName"], [aria-label="Project Name"]',
    );
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto("/projects");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async createProject(projectName: string) {
    await this.newProjectButton.click();
    await this.projectNameInput.fill(projectName);
    await this.submitButton.click();
    await expect(this.page.getByText(projectName).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  async verifyProjectExists(projectName: string) {
    await expect(this.page.getByText(projectName).first()).toBeVisible();
  }
}
