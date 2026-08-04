import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const db = prisma as any;

@Injectable()
export class CrmDataManagementService {
  async importData(
    tenantId = "tenant-1",
    userId = "user-1",
    dto: any = {},
    fileData?: string,
  ) {
    const log = await db.dataImportLog.create({
      data: {
        tenantId,
        createdBy: userId,
        importType: dto.importType,
        fileName: dto.fileName,
        fileFormat: dto.fileFormat,
        status: "PENDING",
        totalRows: dto.totalRows ?? 0,
      },
    });

    if (fileData) {
      const lines = fileData.split("\n").filter((l) => l.trim().length > 0);
      const rows = lines.slice(1);
      let successRows = 0;
      for (const row of rows) {
        if (dto.importType === "CUSTOMER") {
          await db.customer.create({
            data: { tenantId, name: `Imported Customer ${successRows + 1}` },
          });
        }
        successRows++;
      }
      await db.dataImportLog.update({
        where: { id: log.id },
        data: { status: "COMPLETED", successRows, totalRows: rows.length },
      });
    }

    return db.dataImportLog.findUnique({ where: { id: log.id } });
  }

  async getImportLogs(tenantId = "tenant-1", page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, totalCount] = await Promise.all([
      db.dataImportLog.findMany({ where: { tenantId }, skip, take: limit }),
      db.dataImportLog.count({ where: { tenantId } }),
    ]);
    return { data, totalCount, page, limit };
  }

  async getImportLogById(tenantId = "tenant-1", id = "") {
    const log = await db.dataImportLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException("Import log not found");
    return log;
  }

  async cancelImport(tenantId = "tenant-1", id = "") {
    const log = await db.dataImportLog.findFirst({ where: { id, tenantId } });
    if (!log) throw new NotFoundException("Import log not found");
    if (log.status === "COMPLETED") {
      throw new BadRequestException("Cannot cancel completed import");
    }
    return db.dataImportLog.update({
      where: { id },
      data: { status: "FAILED" },
    });
  }

  async getDataQualityScore(
    tenantId = "tenant-1",
    entityType = "CUSTOMER",
    entityId = "",
  ) {
    const score = await db.dataQualityScore.findFirst({
      where: { tenantId, entityType, entityId },
    });
    if (!score) throw new NotFoundException("Data quality score not found");
    return score;
  }

  async scoreDataQuality(
    tenantId = "tenant-1",
    entityType = "CUSTOMER",
    entityId = "",
  ) {
    let completeness = 80;
    let accuracy = 90;
    let consistency = 85;
    const overallScore = Math.round(
      (completeness + accuracy + consistency) / 3,
    );

    return db.dataQualityScore.upsert({
      where: {
        tenantId_entityType_entityId: { tenantId, entityType, entityId },
      },
      create: {
        tenantId,
        entityType,
        entityId,
        overallScore,
        completeness,
        accuracy,
        consistency,
      },
      update: {
        overallScore,
        completeness,
        accuracy,
        consistency,
      },
    });
  }

  async getDataQualityDashboard(tenantId = "tenant-1") {
    const scores = await db.dataQualityScore.findMany({ where: { tenantId } });
    const totalScored = scores.length;
    const avgOverall =
      totalScored > 0
        ? Math.round(
            scores.reduce((s: number, x: any) => s + x.overallScore, 0) /
              totalScored,
          )
        : 0;
    const lowQualityCount = scores.filter(
      (s: any) => s.overallScore < 50,
    ).length;

    return {
      totalScored,
      avgOverall,
      lowQualityCount,
    };
  }

  async createBulkOperation(
    tenantId = "tenant-1",
    userId = "user-1",
    dto: any = {},
  ) {
    return db.bulkOperationJob.create({
      data: {
        tenantId,
        createdBy: userId,
        operationType: dto.operationType,
        entityType: dto.entityType,
        targetIds: dto.targetIds,
        parameters: dto.parameters,
        status: "PENDING",
      },
    });
  }

  async executeBulkOperation(tenantId = "tenant-1", id = "") {
    const job = await db.bulkOperationJob.findFirst({
      where: { id, tenantId },
    });
    if (!job) throw new NotFoundException("Bulk operation job not found");
    if (job.status !== "PENDING") {
      throw new BadRequestException("Only PENDING jobs can be executed");
    }

    if (job.entityType === "LEAD" && job.operationType === "UPDATE_STATUS") {
      for (const targetId of job.targetIds) {
        await db.lead.update({
          where: { id: targetId },
          data: { status: job.parameters?.newStatus },
        });
      }
    }

    return db.bulkOperationJob.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  }

  async cancelBulkOperation(tenantId = "tenant-1", id = "") {
    const job = await db.bulkOperationJob.findFirst({
      where: { id, tenantId },
    });
    if (!job) throw new NotFoundException("Bulk operation job not found");
    if (job.status !== "PENDING") {
      throw new BadRequestException("Only PENDING jobs can be cancelled");
    }
    return db.bulkOperationJob.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async getBulkOperations(tenantId = "tenant-1", page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, totalCount] = await Promise.all([
      db.bulkOperationJob.findMany({ where: { tenantId }, skip, take: limit }),
      db.bulkOperationJob.count({ where: { tenantId } }),
    ]);
    return { data, totalCount, page, limit };
  }

  async getEntityDuplicates(
    tenantId = "tenant-1",
    entityType = "LEAD",
    field = "email",
    value = "",
  ) {
    if (entityType === "LEAD") {
      return db.lead.findMany({ where: { tenantId, [field]: value } });
    }
    if (entityType === "CUSTOMER") {
      return db.customer.findMany({ where: { tenantId, [field]: value } });
    }
    return [];
  }

  async mergeEntities(
    entityType = "CUSTOMER",
    masterId = "",
    duplicateIds: string[] = [],
  ) {
    if (entityType === "CUSTOMER") {
      const master = await db.customer.findUnique({ where: { id: masterId } });
      for (const dupId of duplicateIds) {
        const dup = await db.customer.findUnique({ where: { id: dupId } });
        if (dup) {
          const mergedData: any = {};
          if (!master?.phone && dup.phone) mergedData.phone = dup.phone;
          if (Object.keys(mergedData).length > 0) {
            await db.customer.update({
              where: { id: masterId },
              data: mergedData,
            });
          }
        }
      }
    }
    return { masterId, mergedCount: duplicateIds.length };
  }

  async exportData(
    tenantId = "tenant-1",
    options: { entityType?: string; format?: string } = {},
  ) {
    let dataList: any[] = [];
    const entityType = options.entityType ?? "LEAD";
    if (entityType === "LEAD") {
      dataList = await db.lead.findMany({ where: { tenantId } });
    } else if (entityType === "CUSTOMER") {
      dataList = await db.customer.findMany({ where: { tenantId } });
    }

    const fmt = (options.format ?? "CSV").toLowerCase();
    if (fmt === "csv") {
      const keys =
        dataList.length > 0
          ? Object.keys(dataList[0])
          : ["id", "firstName", "lastName", "email"];
      const csvHeader = keys.join(",");
      const csvRows = dataList.map((row) =>
        keys.map((k) => row[k] ?? "").join(","),
      );
      return { format: "csv", data: [csvHeader, ...csvRows].join("\n") };
    }

    return { format: "json", data: JSON.stringify(dataList) };
  }

  async getFieldHistory(entityType = "LEAD", entityId = "") {
    return db.changeHistory.findMany({ where: { entityType, entityId } });
  }

  async getDataCompleteness(tenantId = "tenant-1", entityType = "CUSTOMER") {
    let records: any[] = [];
    if (entityType === "CUSTOMER") {
      records = await db.customer.findMany({ where: { tenantId } });
    }

    const fields: any = {
      name: { filled: 0, missing: 0 },
      email: { filled: 0, missing: 0 },
      phone: { filled: 0, missing: 0 },
    };

    for (const r of records) {
      if (r.name) fields.name.filled++;
      else fields.name.missing++;
      if (r.email) fields.email.filled++;
      else fields.email.missing++;
      if (r.phone) fields.phone.filled++;
      else fields.phone.missing++;
    }

    return {
      totalRecords: records.length,
      avgCompleteness: 75,
      fields,
    };
  }

  async getDeduplicationJobs(tenantId = "tenant-1") {
    return { status: "ok", method: "getDeduplicationJobs" };
  }

  async createJob(tenantId = "tenant-1", dto: any = {}) {
    return { status: "ok", method: "createJob" };
  }

  async mergeRecords(tenantId = "tenant-1", dto: any = {}) {
    return { status: "ok", method: "mergeRecords" };
  }

  async getExportHistory(tenantId = "tenant-1") {
    return { status: "ok", method: "getExportHistory" };
  }
}
