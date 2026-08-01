import { describe, it, expect, beforeEach, vi as jest } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { prisma } from "@unerp/database";
import { SavedViewsDeepService } from "../saved-views-deep.service";

describe("SavedViewsDeepService", () => {
  let service: SavedViewsDeepService;

  beforeEach(() => {
    service = new SavedViewsDeepService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getLayouts", () => {
    it("should return layouts for a view", async () => {
      const mockFind = jest
        .spyOn(prisma.savedViewLayout, "findMany")
        .mockResolvedValue([
          {
            id: "1",
            tenantId: "t1",
            userId: "u1",
            viewId: "v1",
            layoutType: "table",
            columns: [],
            groupBy: null,
            sortBy: [],
            pageSize: 25,
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      const result = await service.getLayouts("t1", "u1", "v1");
      expect(result).toHaveLength(1);
    });
  });

  describe("addFilter", () => {
    it("should create a filter", async () => {
      jest.spyOn(prisma.savedViewFilter, "count").mockResolvedValue(0);
      const mockCreate = jest
        .spyOn(prisma.savedViewFilter, "create")
        .mockResolvedValue({
          id: "1",
          tenantId: "t1",
          userId: "u1",
          viewId: "v1",
          field: "status",
          operator: "eq",
          value: "ACTIVE",
          logic: "AND",
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      const result = await service.addFilter("t1", "u1", {
        viewId: "v1",
        field: "status",
        operator: "eq",
        value: "ACTIVE",
      });
      expect(result.field).toBe("status");
    });
  });

  describe("upsertColumnConfig", () => {
    it("should upsert column config", async () => {
      const mockUpsert = jest
        .spyOn(prisma.savedViewColumnConfig, "upsert")
        .mockResolvedValue({
          id: "1",
          tenantId: "t1",
          userId: "u1",
          viewId: "v1",
          field: "name",
          label: "Name",
          width: null,
          sortable: true,
          visible: true,
          position: 0,
          format: null,
          alignment: "left",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      const result = await service.upsertColumnConfig("t1", "u1", {
        viewId: "v1",
        field: "name",
        label: "Name",
      });
      expect(result.field).toBe("name");
    });
  });

  describe("shareView", () => {
    it("should share a view", async () => {
      const mockUpsert = jest
        .spyOn(prisma.savedViewSharing, "upsert")
        .mockResolvedValue({
          id: "1",
          tenantId: "t1",
          viewId: "v1",
          sharedWithUserId: "u2",
          sharedByUserId: "u1",
          permission: "view",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      const result = await service.shareView("t1", "u1", {
        viewId: "v1",
        sharedWithUserId: "u2",
      });
      expect(result.permission).toBe("view");
    });
  });

  describe("cloneView", () => {
    it("should clone a view with layouts and filters", async () => {
      jest.spyOn(prisma.savedView, "findUnique").mockResolvedValue({
        id: "v1",
        tenantId: "t1",
        userId: "u1",
        resourceName: "customer",
        name: "Original",
        state: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const mockCreate = jest
        .spyOn(prisma.savedView, "create")
        .mockResolvedValue({
          id: "v2",
          tenantId: "t1",
          userId: "u1",
          resourceName: "customer",
          name: "Cloned",
          state: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      jest.spyOn(prisma.savedViewLayout, "findMany").mockResolvedValue([]);
      jest.spyOn(prisma.savedViewFilter, "findMany").mockResolvedValue([]);

      const result = await service.cloneView("t1", "u1", "v1", "Cloned");
      expect(result.name).toBe("Cloned");
    });
  });
});
