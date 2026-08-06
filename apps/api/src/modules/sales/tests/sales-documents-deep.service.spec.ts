import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    salesDocumentTemplate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    salesDocumentGeneration: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { SalesDocumentsDeepService } from "../sales-documents-deep.service";

describe("SalesDocumentsDeepService", () => {
  let service: SalesDocumentsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesDocumentsDeepService],
    }).compile();

    service = module.get<SalesDocumentsDeepService>(SalesDocumentsDeepService);
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getTemplates", () => {
    it("should return templates for category", async () => {
      const mockTemplates = [
        { id: "tmpl-1", name: "Standard MSA", category: "MSA" },
      ];
      (prisma.salesDocumentTemplate.findMany as any).mockResolvedValue(
        mockTemplates,
      );

      const result = await service.getTemplates("tenant-1", "MSA");
      expect(result).toEqual(mockTemplates);
      expect(prisma.salesDocumentTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1", isActive: true, category: "MSA" },
        }),
      );
    });
  });

  describe("generateDocument", () => {
    it("should generate a document from a template", async () => {
      const mockTmpl = { id: "tmpl-1", name: "Standard Proposal" };
      (prisma.salesDocumentTemplate.findFirst as any).mockResolvedValue(
        mockTmpl,
      );

      const mockGen = {
        id: "gen-1",
        title: "Standard Proposal - 2026-07-26",
        status: "DRAFT",
      };
      (prisma.salesDocumentGeneration.create as any).mockResolvedValue(mockGen);

      const result = await service.generateDocument("tenant-1", {
        templateId: "tmpl-1",
        customerId: "c1",
      });
      expect(result).toEqual(mockGen);
      expect(prisma.salesDocumentGeneration.create).toHaveBeenCalled();
    });
  });
});
