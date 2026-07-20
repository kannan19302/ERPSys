import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class DataExportService {
  private readonly supportedFormats = [
    { id: "csv", name: "CSV", extension: ".csv", mimeType: "text/csv" },
    { id: "json", name: "JSON", extension: ".json", mimeType: "application/json" },
    { id: "xlsx", name: "Excel", extension: ".xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { id: "pdf", name: "PDF", extension: ".pdf", mimeType: "application/pdf" },
  ];

  async requestExport(tenantId: string, _userId: string, dto: {
    module: string;
    format?: string;
    filters?: Record<string, unknown>;
    fields?: string[];
    includeRelations?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const format = dto.format ?? "csv";
    const valid = this.supportedFormats.find((f) => f.id === format);
    if (!valid) throw new BadRequestException(`Unsupported format: ${format}`);

    const scope = {
      module: dto.module,
      filters: dto.filters ?? {},
      fields: dto.fields ?? [],
      includeRelations: dto.includeRelations ?? false,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
    };

    return prisma.dataExportJob.create({
      data: {
        tenantId,
        type: "EXPORT",
        format: format.toUpperCase(),
        scope: scope as any,
        status: "PENDING",
      },
    });
  }

  async listExportJobs(tenantId: string) {
    return prisma.dataExportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getExportJob(tenantId: string, id: string) {
    const job = await prisma.dataExportJob.findFirst({ where: { id, tenantId } });
    if (!job) throw new NotFoundException("Export job not found");
    return job;
  }

  async downloadExport(tenantId: string, id: string) {
    const job = await prisma.dataExportJob.findFirst({ where: { id, tenantId } });
    if (!job) throw new NotFoundException("Export job not found");
    if (job.status !== "COMPLETE") throw new BadRequestException("Export is not ready yet");
    if (!job.fileUrl) throw new NotFoundException("Export file not found");

    return {
      fileUrl: job.fileUrl,
      format: job.format,
      filename: `export-${job.id.substring(0, 8)}.${job.format.toLowerCase()}`,
      fileSize: job.fileSize,
      recordCount: job.recordCount,
    };
  }

  async cancelExport(tenantId: string, id: string) {
    const job = await prisma.dataExportJob.findFirst({ where: { id, tenantId } });
    if (!job) throw new NotFoundException("Export job not found");
    if (job.status !== "PENDING" && job.status !== "PROCESSING") {
      throw new BadRequestException("Only pending or processing exports can be cancelled");
    }

    return prisma.dataExportJob.update({
      where: { id },
      data: { status: "FAILED", errorMessage: "Cancelled by user" },
    });
  }

  async getExportFormats() {
    return this.supportedFormats;
  }

  async cleanupOldExports(retentionDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await prisma.dataExportJob.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ["COMPLETE", "FAILED"] },
      },
    });

    return { deletedCount: result.count, retentionDays, cutoff };
  }
}
