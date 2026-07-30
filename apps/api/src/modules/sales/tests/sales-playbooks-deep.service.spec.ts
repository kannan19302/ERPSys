// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    salesPlaybookDeep: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    salesPlaybookStepDeep: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SalesPlaybooksDeepService } from "../sales-playbooks-deep.service";

describe("SalesPlaybooksDeepService", () => {
  let service: SalesPlaybooksDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesPlaybooksDeepService],
    }).compile();

    service = module.get<SalesPlaybooksDeepService>(SalesPlaybooksDeepService);
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPlaybooks", () => {
    it("should return active playbooks for a stage", async () => {
      const mockPlaybooks = [
        { id: "pb-1", title: "Discovery Playbook", stage: "QUALIFICATION" },
      ];
      (prisma.salesPlaybookDeep.findMany as any).mockResolvedValue(
        mockPlaybooks,
      );

      const result = await service.getPlaybooks("tenant-1", "QUALIFICATION");
      expect(result).toEqual(mockPlaybooks);
      expect(prisma.salesPlaybookDeep.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: "tenant-1",
            isActive: true,
            stage: "QUALIFICATION",
          },
        }),
      );
    });
  });

  describe("createPlaybook", () => {
    it("should create a playbook with steps", async () => {
      const dto = {
        title: "Enterprise Closing",
        stage: "CLOSING",
        steps: [{ title: "Legal Review", instruction: "Send MSA" }],
      };
      const mockCreated = { id: "pb-1", ...dto };
      (prisma.salesPlaybookDeep.create as any).mockResolvedValue(mockCreated);

      const result = await service.createPlaybook("tenant-1", dto);
      expect(result).toEqual(mockCreated);
      expect(prisma.salesPlaybookDeep.create).toHaveBeenCalled();
    });
  });
});
