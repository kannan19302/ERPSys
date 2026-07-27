import { describe, it, expect, beforeEach, vi as jest } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@unerp/database";
import { SearchService } from "../search.service";

describe("SearchService", () => {
  let service: SearchService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    eventEmitter = { emit: jest.fn() } as any;
    service = new SearchService(eventEmitter);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("indexContent", () => {
    it("should upsert search index entry", async () => {
      const mockUpsert = jest
        .spyOn(prisma.searchIndex, "upsert")
        .mockResolvedValue({
          id: "1",
          tenantId: "t1",
          entityType: "customer",
          entityId: "c1",
          title: "Test Customer",
          content: "test content",
          keywords: [],
          module: "crm",
          metadata: {},
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await service.indexContent("t1", "customer", "c1", {
        title: "Test Customer",
        content: "test content",
        module: "crm",
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId_entityType_entityId: {
              tenantId: "t1",
              entityType: "customer",
              entityId: "c1",
            },
          },
          create: expect.objectContaining({ title: "Test Customer" }),
        }),
      );
      expect(result.title).toBe("Test Customer");
    });
  });

  describe("saveSearch", () => {
    it("should save a search query", async () => {
      const mockUpsert = jest
        .spyOn(prisma.savedSearch, "upsert")
        .mockResolvedValue({
          id: "1",
          tenantId: "t1",
          userId: "u1",
          name: "My Search",
          query: "test query",
          filters: {},
          scope: "ALL",
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await service.saveSearch("t1", "u1", {
        name: "My Search",
        query: "test query",
      });

      expect(mockUpsert).toHaveBeenCalled();
      expect(result.name).toBe("My Search");
    });
  });

  describe("getSavedSearches", () => {
    it("should return saved searches for user", async () => {
      const mockFind = jest
        .spyOn(prisma.savedSearch, "findMany")
        .mockResolvedValue([
          {
            id: "1",
            tenantId: "t1",
            userId: "u1",
            name: "S1",
            query: "q1",
            filters: {},
            scope: "ALL",
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);

      const result = await service.getSavedSearches("t1", "u1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("S1");
    });
  });

  describe("logSearchQuery", () => {
    it("should create a search query log", async () => {
      const mockCreate = jest
        .spyOn(prisma.searchQueryLog, "create")
        .mockResolvedValue({
          id: "1",
          tenantId: "t1",
          userId: "u1",
          query: "test",
          filters: {},
          resultCount: 5,
          executionMs: 10,
          entityTypes: [],
          createdAt: new Date(),
        });

      const result = await service.logSearchQuery("t1", "u1", {
        query: "test",
        resultCount: 5,
        executionMs: 10,
      });
      expect(mockCreate).toHaveBeenCalled();
      expect(result.query).toBe("test");
    });
  });

  describe("fulltextSearch", () => {
    it("should search indexed content", async () => {
      const mockFind = jest
        .spyOn(prisma.searchIndex, "findMany")
        .mockResolvedValue([
          {
            id: "1",
            tenantId: "t1",
            entityType: "customer",
            entityId: "c1",
            title: "Acme Corp",
            content: "Acme Corp content",
            keywords: [],
            module: "crm",
            metadata: {},
            status: "ACTIVE",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      jest.spyOn(prisma.searchIndex, "count").mockResolvedValue(1);

      const result = await service.fulltextSearch("t1", "Acme");
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
