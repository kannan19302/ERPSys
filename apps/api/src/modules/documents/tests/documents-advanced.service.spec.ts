import { Test, TestingModule } from "@nestjs/testing";
import { withTenantSession } from "../../../../test/tenant-session";
import { DocumentsAdvancedService } from "../documents-advanced.service";

describe("DocumentsAdvancedService", () => {
  let service: DocumentsAdvancedService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsAdvancedService],
    }).compile();
    service = withTenantSession(
      module.get<DocumentsAdvancedService>(DocumentsAdvancedService),
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Tags", () => {
    it("should return empty tags list for new tenant", async () => {
      const tags = await service.getTags("tenant-new-documents");
      expect(Array.isArray(tags)).toBe(true);
    });

    it("should create and return a tag", async () => {
      const tag = await service.createTag(
        "t1",
        { name: "Urgent", color: "#FF0000" },
        "user1",
      );
      expect(tag).toBeDefined();
      expect(tag.name).toBe("Urgent");
      expect(tag.tenantId).toBe("t1");
    });

    it("should throw on getting non-existent annotation", async () => {
      await expect(
        service.updateAnnotation("t1", "nonexistent", {}),
      ).rejects.toThrow();
    });

    it("should throw on deleting non-existent tag", async () => {
      await expect(service.deleteTag("t1", "nonexistent")).rejects.toThrow();
    });
  });

  describe("Smart Collections", () => {
    it("should create and list smart collections", async () => {
      const col = await service.createSmartCollection(
        "t1",
        { name: "Recent PDFs", query: { type: "pdf" } },
        "user1",
      );
      expect(col).toBeDefined();
      expect(col.name).toBe("Recent PDFs");
      const list = await service.getSmartCollections("t1");
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it("should throw on updating non-existent collection", async () => {
      await expect(
        service.updateSmartCollection("t1", "nonexistent", { name: "New" }),
      ).rejects.toThrow();
    });

    it("should throw on deleting non-existent collection", async () => {
      await expect(
        service.deleteSmartCollection("t1", "nonexistent"),
      ).rejects.toThrow();
    });
  });

  describe("Annotations", () => {
    it("should throw on listing annotations for non-existent document", async () => {
      await expect(
        service.getAnnotations("t1", "nonexistent"),
      ).rejects.toThrow();
    });

    it("should throw on deleting non-existent annotation", async () => {
      await expect(
        service.deleteAnnotation("t1", "nonexistent"),
      ).rejects.toThrow();
    });
  });

  describe("Comments", () => {
    it("should throw on listing comments for non-existent doc", async () => {
      await expect(service.getComments("t1", "nonexistent")).rejects.toThrow();
    });

    it("should throw on updating non-existent comment", async () => {
      await expect(
        service.updateComment("t1", "nonexistent", {}, "user1"),
      ).rejects.toThrow();
    });
  });

  describe("Favorites", () => {
    it("should return empty favorites for new user", async () => {
      const favs = await service.getFavorites("t1", "user-new");
      expect(Array.isArray(favs)).toBe(true);
    });
  });

  describe("Analytics", () => {
    it("should return analytics for tenant", async () => {
      const analytics = await service.getAnalytics("t1");
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalDocuments).toBe("number");
    });
  });

  describe("Tenant Isolation", () => {
    it("should not find annotations from other tenant", async () => {
      await expect(
        service.getAnnotations("tenant-other", "doc-other"),
      ).rejects.toThrow();
    });
  });
});
