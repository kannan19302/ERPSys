import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmDataManagementService } from "../crm-data-management.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    dataImportLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    dataQualityScore: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    bulkOperationJob: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    changeHistory: {
      findMany: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    contact: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    opportunity: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    case: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    product: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const TENANT = "tenant-1";
const USER = "user-1";

describe("CrmDataManagementService", () => {
  let service: CrmDataManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmDataManagementService();
  });

  describe("importData", () => {
    it("creates an import log with PENDING status", async () => {
      (prisma.dataImportLog.create as any).mockResolvedValue({
        id: "import-1",
        status: "PENDING",
      });
      (prisma.dataImportLog.findUnique as any).mockResolvedValue({
        id: "import-1",
        status: "PENDING",
      });
      const result = await service.importData(TENANT, USER, {
        importType: "CUSTOMER",
        fileName: "customers.csv",
        fileFormat: "CSV",
        totalRows: 0,
      });
      expect(prisma.dataImportLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT,
            importType: "CUSTOMER",
          }),
        }),
      );
      expect(result.status).toBe("PENDING");
    });

    it("processes CSV data when fileData is provided", async () => {
      (prisma.dataImportLog.create as any).mockResolvedValue({
        id: "import-1",
      });
      (prisma.dataImportLog.update as any).mockResolvedValue({});
      (prisma.customer.create as any).mockResolvedValue({});
      (prisma.dataImportLog.findUnique as any).mockResolvedValue({
        id: "import-1",
        status: "COMPLETED",
        successRows: 2,
      });
      const csv = "name,email\ntest1@test.com\ntest2@test.com";
      const result = await service.importData(
        TENANT,
        USER,
        {
          importType: "CUSTOMER",
          fileName: "customers.csv",
          fileFormat: "CSV",
          totalRows: 2,
        },
        csv,
      );
      expect(result.successRows).toBe(2);
    });
  });

  describe("getImportLogs", () => {
    it("returns paginated import logs", async () => {
      (prisma.dataImportLog.findMany as any).mockResolvedValue([
        { id: "import-1" },
      ]);
      (prisma.dataImportLog.count as any).mockResolvedValue(1);
      const result = await service.getImportLogs(TENANT, 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });
  });

  describe("getImportLogById", () => {
    it("throws NotFoundException when not found", async () => {
      (prisma.dataImportLog.findFirst as any).mockResolvedValue(null);
      await expect(service.getImportLogById(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("cancelImport", () => {
    it("throws BadRequestException for completed import", async () => {
      (prisma.dataImportLog.findFirst as any).mockResolvedValue({
        id: "import-1",
        status: "COMPLETED",
      });
      await expect(service.cancelImport(TENANT, "import-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("cancels a pending import", async () => {
      (prisma.dataImportLog.findFirst as any).mockResolvedValue({
        id: "import-1",
        status: "PENDING",
      });
      (prisma.dataImportLog.update as any).mockResolvedValue({
        id: "import-1",
        status: "FAILED",
      });
      const result = await service.cancelImport(TENANT, "import-1");
      expect(result.status).toBe("FAILED");
    });
  });

  describe("getDataQualityScore", () => {
    it("throws NotFoundException when score not found", async () => {
      (prisma.dataQualityScore.findFirst as any).mockResolvedValue(null);
      await expect(
        service.getDataQualityScore(TENANT, "CUSTOMER", "cust-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("returns existing score", async () => {
      (prisma.dataQualityScore.findFirst as any).mockResolvedValue({
        id: "score-1",
        overallScore: 85,
        entityType: "CUSTOMER",
      });
      const score = await service.getDataQualityScore(
        TENANT,
        "CUSTOMER",
        "cust-1",
      );
      expect(score.overallScore).toBe(85);
    });
  });

  describe("scoreDataQuality", () => {
    it("computes and upserts score", async () => {
      (prisma.dataQualityScore.findFirst as any).mockResolvedValue(null);
      (prisma.customer.findUnique as any).mockResolvedValue({
        id: "cust-1",
        name: "Acme",
        email: "acme@test.com",
        status: "ACTIVE",
      });
      (prisma.dataQualityScore.upsert as any).mockImplementation(({ create }) =>
        Promise.resolve(create),
      );
      const result = await service.scoreDataQuality(
        TENANT,
        "CUSTOMER",
        "cust-1",
      );
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.completeness).toBeGreaterThan(0);
    });
  });

  describe("getDataQualityDashboard", () => {
    it("returns aggregated quality stats", async () => {
      (prisma.dataQualityScore.findMany as any).mockResolvedValue([
        { overallScore: 90, completeness: 90, accuracy: 90, consistency: 90 },
        { overallScore: 70, completeness: 70, accuracy: 70, consistency: 70 },
      ]);
      const dash = await service.getDataQualityDashboard(TENANT);
      expect(dash.totalScored).toBe(2);
      expect(dash.avgOverall).toBe(80);
      expect(dash.lowQualityCount).toBe(0);
    });
  });

  describe("bulk operations", () => {
    it("creates a bulk operation", async () => {
      (prisma.bulkOperationJob.create as any).mockResolvedValue({
        id: "bulk-1",
        status: "PENDING",
      });
      const result = await service.createBulkOperation(TENANT, USER, {
        operationType: "UPDATE_STATUS",
        entityType: "LEAD",
        targetIds: ["lead-1", "lead-2"],
      });
      expect(result.status).toBe("PENDING");
    });

    it("executes a pending bulk operation", async () => {
      (prisma.bulkOperationJob.findFirst as any).mockResolvedValue({
        id: "bulk-1",
        status: "PENDING",
        tenantId: TENANT,
        operationType: "UPDATE_STATUS",
        entityType: "LEAD",
        targetIds: ["lead-1", "lead-2"],
        parameters: { newStatus: "CONTACTED" },
      });
      (prisma.bulkOperationJob.update as any).mockResolvedValue({});
      (prisma.lead.update as any).mockResolvedValue({});
      await service.executeBulkOperation(TENANT, "bulk-1");
      expect(prisma.bulkOperationJob.update).toHaveBeenCalled();
    });

    it("throws for non-PENDING operations", async () => {
      (prisma.bulkOperationJob.findFirst as any).mockResolvedValue({
        id: "bulk-1",
        status: "COMPLETED",
        tenantId: TENANT,
      });
      await expect(
        service.executeBulkOperation(TENANT, "bulk-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("cancels a pending operation", async () => {
      (prisma.bulkOperationJob.findFirst as any).mockResolvedValue({
        id: "bulk-1",
        status: "PENDING",
        tenantId: TENANT,
      });
      (prisma.bulkOperationJob.update as any).mockResolvedValue({
        id: "bulk-1",
        status: "CANCELLED",
      });
      const result = await service.cancelBulkOperation(TENANT, "bulk-1");
      expect(result.status).toBe("CANCELLED");
    });

    it("returns paginated bulk operations", async () => {
      (prisma.bulkOperationJob.findMany as any).mockResolvedValue([
        { id: "bulk-1" },
      ]);
      (prisma.bulkOperationJob.count as any).mockResolvedValue(1);
      const result = await service.getBulkOperations(TENANT);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("entity duplicates", () => {
    it("finds duplicates by field value", async () => {
      (prisma.lead.findMany as any).mockResolvedValue([
        { id: "lead-1", email: "dup@test.com" },
        { id: "lead-2", email: "dup@test.com" },
      ]);
      const dupes = await service.getEntityDuplicates(
        TENANT,
        "LEAD",
        "email",
        "dup@test.com",
      );
      expect(dupes).toHaveLength(2);
    });
  });

  describe("mergeEntities", () => {
    it("merges ids into master", async () => {
      (prisma.customer.findUnique as any)
        .mockResolvedValueOnce({
          id: "master-1",
          name: "Master",
          email: "m@t.com",
        })
        .mockResolvedValueOnce({ id: "dup-1", name: "", phone: "123" });
      (prisma.customer.update as any).mockResolvedValue({});
      const result = await service.mergeEntities("CUSTOMER", "master-1", [
        "dup-1",
      ]);
      expect(result).toBeDefined();
    });
  });

  describe("exportData", () => {
    it("exports as CSV", async () => {
      (prisma.lead.findMany as any).mockResolvedValue([
        {
          id: "lead-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@test.com",
        },
      ]);
      const result = await service.exportData(TENANT, {
        entityType: "LEAD",
        format: "CSV",
      });
      expect(result.format).toBe("csv");
      expect(result.data).toContain("firstName");
    });

    it("exports as JSON", async () => {
      (prisma.lead.findMany as any).mockResolvedValue([
        { id: "lead-1", firstName: "John" },
      ]);
      const result = await service.exportData(TENANT, {
        entityType: "LEAD",
        format: "JSON",
      });
      expect(result.format).toBe("json");
    });
  });

  describe("getFieldHistory", () => {
    it("returns change history for entity", async () => {
      (prisma.changeHistory.findMany as any).mockResolvedValue([
        {
          id: "ch-1",
          action: "UPDATE",
          fieldChanges: [
            { field: "status", oldValue: "NEW", newValue: "CONTACTED" },
          ],
        },
      ]);
      const history = await service.getFieldHistory("LEAD", "lead-1");
      expect(history).toHaveLength(1);
      expect(history[0].action).toBe("UPDATE");
    });
  });

  describe("getDataCompleteness", () => {
    it("returns completeness stats per field", async () => {
      (prisma.customer.findMany as any).mockResolvedValue([
        {
          id: "cust-1",
          name: "Acme",
          email: "a@a.com",
          phone: "",
          status: "ACTIVE",
          type: null,
          industry: "Tech",
          website: null,
          taxId: null,
        },
      ]);
      const result = await service.getDataCompleteness(TENANT, "CUSTOMER");
      expect(result.totalRecords).toBe(1);
      expect(result.avgCompleteness).toBeGreaterThan(0);
      expect(result.fields).toBeDefined();
      expect(result.fields.name.filled).toBe(1);
      expect(result.fields.phone.filled).toBe(0);
    });
  });
});
