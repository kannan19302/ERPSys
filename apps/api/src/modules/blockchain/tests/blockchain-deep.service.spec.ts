import { describe, it, expect, vi, beforeEach } from "vitest";
import { BlockchainDeepService } from "../blockchain-deep.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    blockchainTransactionExplorer: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    blockchainSmartContract: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    blockchainAuditTrail: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    blockchainNetworkHealth: { findMany: vi.fn(), upsert: vi.fn() },
  },
  runWithTenantSession: vi.fn((_ctx, cb) => cb()),
}));

const mockDate = new Date("2026-07-27");
vi.setSystemTime(mockDate);

describe("BlockchainDeepService", () => {
  let service: BlockchainDeepService;

  beforeEach(() => {
    service = new BlockchainDeepService();
    vi.clearAllMocks();
  });

  describe("transaction explorer", () => {
    it("should list transactions with pagination", async () => {
      const { prisma } = require("@unerp/database");
      prisma.blockchainTransactionExplorer.findMany.mockResolvedValue([]);
      prisma.blockchainTransactionExplorer.count.mockResolvedValue(0);
      const result = await service.listTransactions("t-1", {
        page: 1,
        limit: 20,
      });
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    it("should search transactions by hash", async () => {
      const { prisma } = require("@unerp/database");
      prisma.blockchainTransactionExplorer.findMany.mockResolvedValue([]);
      prisma.blockchainTransactionExplorer.count.mockResolvedValue(0);
      await service.listTransactions("t-1", { search: "0xabc", page: 1 });
      expect(
        prisma.blockchainTransactionExplorer.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe("smart contracts", () => {
    it("should list contracts", async () => {
      const { prisma } = require("@unerp/database");
      prisma.blockchainSmartContract.findMany.mockResolvedValue([]);
      const result = await service.listContracts("t-1");
      expect(result).toEqual([]);
    });

    it("should create a contract", async () => {
      const { prisma } = require("@unerp/database");
      prisma.blockchainSmartContract.create.mockResolvedValue({
        id: "1",
        name: "MyContract",
      });
      const result = await service.createContract("t-1", {
        name: "MyContract",
        address: "0x123",
      });
      expect(result.name).toBe("MyContract");
    });
  });

  describe("audit trail", () => {
    it("should list audit trail entries", async () => {
      const { prisma } = require("@unerp/database");
      prisma.blockchainAuditTrail.findMany.mockResolvedValue([]);
      prisma.blockchainAuditTrail.count.mockResolvedValue(0);
      const result = await service.listAuditTrails("t-1", {
        page: 1,
        limit: 50,
      });
      expect(result.total).toBe(0);
    });
  });

  describe("network health", () => {
    it("should get network health", async () => {
      const { prisma } = require("@unerp/database");
      prisma.blockchainNetworkHealth.findMany.mockResolvedValue([]);
      const result = await service.getNetworkHealth();
      expect(result).toEqual([]);
    });
  });
});
