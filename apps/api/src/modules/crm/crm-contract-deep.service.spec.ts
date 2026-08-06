import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { withTenantSession } from "../../../test/tenant-session";
import { CrmContractDeepService } from "./crm-contract-deep.service";

describe("CrmContractDeepService", () => {
  let svc: CrmContractDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmContractDeepService],
    }).compile();
    svc = withTenantSession(
      module.get<CrmContractDeepService>(CrmContractDeepService),
    );
  });

  it("should be defined", () => {
    expect(svc).toBeDefined();
  });

  describe("Template Categories", () => {
    it("should create a category", async () => {
      const cat = await svc.createCategory("tenant-1", {
        name: "Sales Contracts",
        description: "Standard sales templates",
        sortOrder: 1,
      });
      expect(cat.name).toBe("Sales Contracts");
    });

    it("should list categories", async () => {
      await svc.createCategory("tenant-1", { name: "Sales", sortOrder: 1 });
      await svc.createCategory("tenant-1", { name: "Service", sortOrder: 2 });
      const cats = await svc.getContractTemplateCategories("tenant-1");
      expect(cats.length).toBe(2);
    });

    it("should update a category", async () => {
      const cat = await svc.createCategory("tenant-1", {
        name: "Old",
        sortOrder: 1,
      });
      const updated = await svc.updateCategory("tenant-1", cat.id, {
        name: "New",
      });
      expect(updated.name).toBe("New");
    });

    it("should delete a category", async () => {
      const cat = await svc.createCategory("tenant-1", {
        name: "Delete me",
        sortOrder: 1,
      });
      await svc.deleteCategory("tenant-1", cat.id);
      const cats = await svc.getContractTemplateCategories("tenant-1");
      expect(cats.length).toBe(0);
    });
  });

  describe("Clause Library", () => {
    it("should create a clause", async () => {
      const clause = await svc.createClause("tenant-1", {
        title: "Confidentiality",
        content: "Both parties agree...",
        category: "CONFIDENTIALITY",
      });
      expect(clause.title).toBe("Confidentiality");
    });

    it("should list clauses", async () => {
      await svc.createClause("tenant-1", {
        title: "Clause 1",
        content: "Content 1",
        category: "GENERAL",
      });
      await svc.createClause("tenant-1", {
        title: "Clause 2",
        content: "Content 2",
        category: "PAYMENT",
      });
      const clauses = await svc.getContractClauseLibrary("tenant-1");
      expect(clauses.length).toBe(2);
    });

    it("should filter clauses by category", async () => {
      await svc.createClause("tenant-1", {
        title: "General",
        content: "Gen",
        category: "GENERAL",
      });
      await svc.createClause("tenant-1", {
        title: "Payment",
        content: "Pay",
        category: "PAYMENT",
      });
      const filtered = await svc.getContractClauseLibrary(
        "tenant-1",
        "GENERAL",
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe("General");
    });
  });

  describe("Contract Templates", () => {
    it("should list templates", async () => {
      const templates = await svc.getContractTemplates("tenant-1");
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe("Expiry Calendar", () => {
    it("should return expiry calendar", async () => {
      const calendar = await svc.getContractExpiryCalendar("tenant-1");
      expect(Array.isArray(calendar)).toBe(true);
    });

    it("should filter by range", async () => {
      const calendar30 = await svc.getContractExpiryCalendar("tenant-1", "30d");
      expect(Array.isArray(calendar30)).toBe(true);
    });
  });

  describe("Dashboard", () => {
    it("should return dashboard stats", async () => {
      const dash = await svc.getContractDashboard("tenant-1");
      expect(dash).toBeDefined();
      expect(typeof dash.total).toBe("number");
      expect(typeof dash.active).toBe("number");
      expect(typeof dash.expiringSoon).toBe("number");
    });
  });

  describe("Value at Risk", () => {
    it("should return value at risk", async () => {
      const risk = await svc.getContractValueAtRisk("tenant-1");
      expect(risk).toBeDefined();
      expect(typeof risk.count).toBe("number");
      expect(typeof risk.totalAtRisk).toBe("number");
    });
  });

  describe("Search", () => {
    it("should search contracts", async () => {
      const results = await svc.searchContracts("tenant-1", "test");
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("Obligations", () => {
    it("should return obligations for a contract", async () => {
      const obligations = await svc.getContractObligations(
        "tenant-1",
        "nonexistent",
      );
      expect(Array.isArray(obligations)).toBe(true);
    });
  });

  describe("Reminder", () => {
    it("should generate reminder for a contract", async () => {
      await expect(
        svc.autoGenerateContractReminder("tenant-1", "nonexistent"),
      ).rejects.toThrow();
    });
  });
});
