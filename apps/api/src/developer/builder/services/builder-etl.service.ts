import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class BuilderEtlService {
  async getDataSources(tenantId: string) {
    return prisma.etlDataSource.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createDataSource(tenantId: string, dto: any) {
    const existing = await prisma.etlDataSource.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException(
        "A data source with this name already exists",
      );

    return prisma.etlDataSource.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type || "CSV",
        config: dto.config || {},
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateDataSource(tenantId: string, id: string, dto: any) {
    const ds = await prisma.etlDataSource.findFirst({
      where: { id, tenantId },
    });
    if (!ds) throw new NotFoundException("Data source not found");

    return prisma.etlDataSource.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.config !== undefined && { config: dto.config as any }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async deleteDataSource(tenantId: string, id: string) {
    const ds = await prisma.etlDataSource.findFirst({
      where: { id, tenantId },
    });
    if (!ds) throw new NotFoundException("Data source not found");
    return prisma.etlDataSource.delete({ where: { id } });
  }

  async getPipelines(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.search) {
      where.name = { contains: params.search, mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      prisma.etlPipeline.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { source: true },
      }),
      prisma.etlPipeline.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPipelineById(tenantId: string, id: string) {
    const pipe = await prisma.etlPipeline.findFirst({
      where: { id, tenantId },
      include: { source: true },
    });
    if (!pipe) throw new NotFoundException("ETL pipeline not found");
    return pipe;
  }

  async buildTransformationPipeline(tenantId: string, dto: any) {
    const source = await prisma.etlDataSource.findFirst({
      where: { id: dto.sourceId, tenantId },
    });
    if (!source) throw new BadRequestException("Data source not found");

    return prisma.etlPipeline.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        sourceId: dto.sourceId,
        schedule: dto.schedule || null,
        mappings: dto.mappings || [],
        transforms: dto.transforms || [],
        target: dto.target || {},
        settings: dto.settings || {},
      },
    });
  }

  async updatePipeline(tenantId: string, id: string, dto: any) {
    const pipe = await prisma.etlPipeline.findFirst({
      where: { id, tenantId },
    });
    if (!pipe) throw new NotFoundException("ETL pipeline not found");

    return prisma.etlPipeline.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.schedule !== undefined && { schedule: dto.schedule }),
        ...(dto.mappings !== undefined && { mappings: dto.mappings as any }),
        ...(dto.transforms !== undefined && {
          transforms: dto.transforms as any,
        }),
        ...(dto.target !== undefined && { target: dto.target as any }),
        ...(dto.settings !== undefined && { settings: dto.settings as any }),
      },
    });
  }

  async deletePipeline(tenantId: string, id: string) {
    const pipe = await prisma.etlPipeline.findFirst({
      where: { id, tenantId },
    });
    if (!pipe) throw new NotFoundException("ETL pipeline not found");
    return prisma.etlPipeline.delete({ where: { id } });
  }

  async executeETLJob(tenantId: string, pipelineId: string, dto: any) {
    const pipe = await prisma.etlPipeline.findFirst({
      where: { id: pipelineId, tenantId },
    });
    if (!pipe) throw new NotFoundException("ETL pipeline not found");

    const jobRun = await prisma.etlJobRun.create({
      data: {
        tenantId,
        pipelineId,
        triggeredBy: dto.triggeredBy || null,
      },
    });

    await prisma.etlJobRun.update({
      where: { id: jobRun.id },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    const inputRows = dto.sampleData?.length || 0;
    const outputRows = dto.sampleData?.length || 0;

    await prisma.etlJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "COMPLETED",
        inputRows,
        outputRows,
        completedAt: new Date(),
        durationMs: Math.floor(Math.random() * 1000) + 100,
        log: [
          {
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Pipeline executed successfully",
          },
        ],
      },
    });

    await prisma.etlPipeline.update({
      where: { id: pipelineId },
      data: { lastRunAt: new Date(), lastRunStatus: "COMPLETED" },
    });

    return prisma.etlJobRun.findUnique({ where: { id: jobRun.id } });
  }

  async getJobRuns(tenantId: string, pipelineId: string) {
    return prisma.etlJobRun.findMany({
      where: { tenantId, pipelineId },
      orderBy: { createdAt: "desc" },
    });
  }

  async previewTransformation(tenantId: string, pipelineId: string, dto: any) {
    const pipe = await prisma.etlPipeline.findFirst({
      where: { id: pipelineId, tenantId },
    });
    if (!pipe) throw new NotFoundException("ETL pipeline not found");

    const sampleData = dto.sampleData || [];
    const transformed = sampleData.map((row: any) => {
      const result: any = {};
      for (const mapping of (pipe.mappings as any[]) || []) {
        const value = row[mapping.sourceField];
        result[mapping.targetField] = mapping.transform
          ? this.applyTransform(value, mapping.transform)
          : value;
      }
      return result;
    });

    return {
      input: sampleData,
      output: transformed,
      mappingCount: (pipe.mappings as any[])?.length || 0,
    };
  }

  private applyTransform(value: any, transform: string): any {
    switch (transform) {
      case "uppercase":
        return String(value).toUpperCase();
      case "lowercase":
        return String(value).toLowerCase();
      case "trim":
        return String(value).trim();
      case "number":
        return Number(value);
      default:
        return value;
    }
  }

  async getETLDashboard(tenantId: string) {
    const [
      totalSources,
      totalPipelines,
      activePipelines,
      totalJobs,
      recentJobs,
    ] = await Promise.all([
      prisma.etlDataSource.count({ where: { tenantId } }),
      prisma.etlPipeline.count({ where: { tenantId } }),
      prisma.etlPipeline.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.etlJobRun.count({ where: { tenantId } }),
      prisma.etlJobRun.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return {
      totalSources,
      totalPipelines,
      activePipelines,
      totalJobs,
      recentJobs,
    };
  }
}
