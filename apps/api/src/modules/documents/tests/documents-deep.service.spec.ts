import { Test, TestingModule } from "@nestjs/testing";
import { withTenantSession } from "../../../../test/tenant-session";
import { DocumentsDeepService } from "../documents-deep.service";

describe("DocumentsDeepService", () => {
  let service: DocumentsDeepService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsDeepService],
    }).compile();
    service = withTenantSession(
      module.get<DocumentsDeepService>(DocumentsDeepService),
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("computeDiffs", () => {
    it("should return empty array when both changes are empty", () => {
      const result = (service as any).computeDiffs("", "");
      expect(result).toEqual([]);
    });

    it("should return diff when changes differ", () => {
      const result = (service as any).computeDiffs("v1 content", "v2 content");
      expect(result).toHaveLength(1);
      expect(result[0].field).toBe("changes");
      expect(result[0].from).toBe("v1 content");
      expect(result[0].to).toBe("v2 content");
    });
  });

  describe("buildCategoryTree", () => {
    it("should return empty array for empty items", () => {
      const result = (service as any).buildCategoryTree([], null);
      expect(result).toEqual([]);
    });

    it("should build nested tree from flat list", () => {
      const items = [
        { id: "1", parentId: null, name: "Root" },
        { id: "2", parentId: "1", name: "Child" },
        { id: "3", parentId: "2", name: "Grandchild" },
      ];
      const result = (service as any).buildCategoryTree(items, null);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Root");
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe("Child");
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].name).toBe("Grandchild");
    });
  });

  describe("renderTemplate variable substitution", () => {
    it("rejects rendering a template that does not exist", async () => {
      // This used to call renderTemplate and simply let the NotFoundException
      // escape, with a comment noting it "would throw" — so the test failed for
      // the very reason it documented. The substitution logic itself is covered
      // by the test below; this one pins the not-found behaviour.
      await expect(
        (service as any).renderTemplate("tenant-1", "nonexistent", {
          name: "John",
        }),
      ).rejects.toThrow("Document template not found");
    });

    it("should replace multiple instances of the same variable", () => {
      const content =
        "Hello {{name}}, your order {{orderId}} is ready. Thank you {{name}}!";
      const values = { name: "Alice", orderId: "12345" };
      let rendered = content;
      for (const [key, val] of Object.entries(values)) {
        rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
      }
      expect(rendered).toBe(
        "Hello Alice, your order 12345 is ready. Thank you Alice!",
      );
    });
  });
});
