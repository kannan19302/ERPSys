import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class ReportingDataSourcesService {
  async getDataSources(tenantId: string) {
    return prisma.reportDataSource.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createDataSource(
    tenantId: string,
    dto: {
      name: string;
      type?: string;
      moduleName?: string;
      tableName?: string;
      connectionString?: string;
      credentials?: Record<string, unknown>;
      schema?: Record<string, unknown>;
    },
  ) {
    const exists = await prisma.reportDataSource.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });
    if (exists) throw new BadRequestException("Data source already exists");
    return prisma.reportDataSource.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type || "MODULE",
        moduleName: dto.moduleName,
        tableName: dto.tableName,
        connectionString: dto.connectionString,
        credentials: (dto.credentials ?? {}) as Prisma.InputJsonValue,
        schema: (dto.schema ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async updateDataSource(
    tenantId: string,
    id: string,
    dto: Partial<{
      name: string;
      type: string;
      moduleName: string;
      tableName: string;
      connectionString: string;
      credentials: Record<string, unknown>;
      schema: Record<string, unknown>;
      isActive: boolean;
    }>,
  ) {
    const ds = await prisma.reportDataSource.findFirst({
      where: { tenantId, id },
    });
    if (!ds) throw new NotFoundException("Data source not found");
    return prisma.reportDataSource.update({
      where: { id },
      data: {
        ...dto,
        credentials: dto.credentials as Prisma.InputJsonValue | undefined,
        schema: dto.schema as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async deleteDataSource(tenantId: string, id: string) {
    const ds = await prisma.reportDataSource.findFirst({
      where: { tenantId, id },
    });
    if (!ds) throw new NotFoundException("Data source not found");
    await prisma.reportDataSource.delete({ where: { id } });
    return { success: true };
  }
}
