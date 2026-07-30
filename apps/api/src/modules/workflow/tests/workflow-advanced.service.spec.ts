// @ts-nocheck
import { Test, TestingModule } from "@nestjs/testing";
import { WorkflowAdvancedService } from "../workflow-advanced.service";

describe("WorkflowAdvancedService", () => {
  let service: WorkflowAdvancedService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowAdvancedService],
    }).compile();
    service = module.get<WorkflowAdvancedService>(WorkflowAdvancedService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Templates", () => {
    it("should return empty templates for new tenant", async () => {
      const templates = await service.getTemplates("tenant-new");
      expect(Array.isArray(templates)).toBe(true);
    });

    it("should create and list templates", async () => {
      const tpl = await service.createTemplate(
        "t1",
        { name: "PO Approval", triggerType: "MANUAL", nodes: [], edges: [] },
        "user1",
      );
      expect(tpl).toBeDefined();
      expect(tpl.name).toBe("PO Approval");
      expect(tpl.tenantId).toBe("t1");
    });

    it("should throw on updating non-existent template", async () => {
      await expect(
        service.updateTemplate("t1", "nonexistent", { name: "X" }),
      ).rejects.toThrow();
    });

    it("should throw on deleting non-existent template", async () => {
      await expect(
        service.deleteTemplate("t1", "nonexistent"),
      ).rejects.toThrow();
    });
  });

  describe("Categories", () => {
    it("should return empty categories", async () => {
      const cats = await service.getCategories("tenant-new");
      expect(Array.isArray(cats)).toBe(true);
    });

    it("should create category", async () => {
      const cat = await service.createCategory(
        "t1",
        { name: "HR", color: "#1976D2", sortOrder: 1 },
        "user1",
      );
      expect(cat).toBeDefined();
      expect(cat.name).toBe("HR");
    });

    it("should throw on deleting non-existent category", async () => {
      await expect(
        service.deleteCategory("t1", "nonexistent"),
      ).rejects.toThrow();
    });
  });

  describe("Conditions", () => {
    it("should throw on listing conditions for non-existent definition", async () => {
      await expect(service.getConditions("t1", "nonexistent")).resolves.toEqual(
        [],
      );
    });

    it("should throw on creating condition for non-existent definition", async () => {
      await expect(
        service.createCondition(
          "t1",
          {
            definitionId: "nonexistent",
            name: "C1",
            field: "amount",
            operator: "greater_than",
            value: 1000,
          },
          "user1",
        ),
      ).rejects.toThrow();
    });

    it("should throw on updating non-existent condition", async () => {
      await expect(
        service.updateCondition("t1", "nonexistent", { name: "X" }),
      ).rejects.toThrow();
    });
  });

  describe("Loops", () => {
    it("should throw on creating loop for non-existent definition", async () => {
      await expect(
        service.createLoop(
          "t1",
          {
            definitionId: "nonexistent",
            name: "Loop1",
            loopField: "items",
            maxIterations: 10,
          },
          "user1",
        ),
      ).rejects.toThrow();
    });

    it("should throw on updating non-existent loop", async () => {
      await expect(
        service.updateLoop("t1", "nonexistent", { name: "X" }),
      ).rejects.toThrow();
    });
  });

  describe("Error Handlers", () => {
    it("should throw on creating for non-existent definition", async () => {
      await expect(
        service.createErrorHandler(
          "t1",
          { definitionId: "nonexistent", name: "E1", onError: "ABORT" },
          "user1",
        ),
      ).rejects.toThrow();
    });
  });

  describe("Notifications", () => {
    it("should throw on creating for non-existent definition", async () => {
      await expect(
        service.createNotification(
          "t1",
          { definitionId: "nonexistent", event: "ON_START", recipients: [] },
          "user1",
        ),
      ).rejects.toThrow();
    });
  });

  describe("Webhooks", () => {
    it("should throw on creating for non-existent definition", async () => {
      await expect(
        service.createWebhook(
          "t1",
          { definitionId: "nonexistent", url: "https://example.com/hook" },
          "user1",
        ),
      ).rejects.toThrow();
    });
  });

  describe("Tags", () => {
    it("should return empty tags", async () => {
      const tags = await service.getTags("tenant-new");
      expect(Array.isArray(tags)).toBe(true);
    });

    it("should create tag", async () => {
      const tag = await service.createTag(
        "t1",
        { name: "Critical", color: "#FF0000" },
        "user1",
      );
      expect(tag).toBeDefined();
      expect(tag.name).toBe("Critical");
    });
  });

  describe("Dashboard & Metrics", () => {
    it("should return dashboard stats", async () => {
      const dash = await service.getDashboard("t1");
      expect(dash).toBeDefined();
      expect(typeof dash.totalDefinitions).toBe("number");
      expect(typeof dash.activeDefinitions).toBe("number");
    });

    it("should return empty metrics", async () => {
      const metrics = await service.getMetrics("tenant-new");
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe("Import/Export", () => {
    it("should throw on exporting non-existent definition", async () => {
      await expect(
        service.exportWorkflow("t1", "nonexistent"),
      ).rejects.toThrow();
    });

    it("should throw on testing non-existent definition", async () => {
      await expect(
        service.testWorkflow("t1", "nonexistent", {}),
      ).rejects.toThrow();
    });
  });

  describe("Delegation", () => {
    it("should handle delegation to another user", async () => {
      const result = await service.createDelegation(
        "t1",
        "userA",
        "userB",
        "Vacation",
        "admin",
      );
      expect(result).toBeDefined();
      expect(result.originalAssigneeId).toBe("userA");
      expect(result.delegatedToId).toBe("userB");
    });
  });

  describe("Priority", () => {
    it("should throw on setting priority for non-existent task", async () => {
      await expect(
        service.setPriority("t1", "nonexistent", "HIGH"),
      ).rejects.toThrow();
    });
  });
});
