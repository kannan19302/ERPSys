import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import {
  CreateQAInspectionTemplateInput,
  UpdateQAInspectionTemplateInput,
  CreateQAInspectionInput,
  SubmitQAInspectionInput,
} from '@unerp/shared';
import {
  buildPaginationValues,
  paginatedResult,
  resolveOrgId,
  PaginationParams,
} from '../../common/utils/pagination.util';

@Injectable()
export class InventoryQaService {

  async getQAInspections(tenantId: string, params: PaginationParams & { status?: string } = {}) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.search) {
      where.inspectionNumber = { contains: params.search, mode: 'insensitive' };
    }

    const { skip, take } = buildPaginationValues(params);

    const [inspections, total] = await Promise.all([
      prisma.qualityInspection.findMany({
        where,
        include: { product: true, checkpoints: true },
        skip,
        take,
        orderBy: { inspectionDate: 'desc' },
      }),
      prisma.qualityInspection.count({ where }),
    ]);

    return paginatedResult(inspections, total, params);
  }

  async getQAInspectionById(tenantId: string, id: string) {
    const qa = await prisma.qualityInspection.findFirst({
      where: { id, tenantId },
      include: { product: true, checkpoints: true },
    });
    if (!qa) throw new NotFoundException('QA inspection not found');
    return qa;
  }

  async createQAInspection(tenantId: string, orgId: string, userId: string, dto: CreateQAInspectionInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.qualityInspection.count({ where: { tenantId } });
    const inspectionNumber = `QA-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const cps = dto.checkpoints.map((cp) => ({
      tenantId,
      parameter: cp.parameter,
      criteria: cp.criteria,
      sortOrder: cp.sortOrder,
    }));

    return prisma.qualityInspection.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        inspectionNumber,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        inspectedQty: new Prisma.Decimal(dto.inspectedQty),
        inspectedBy: dto.inspectedBy || userId,
        remarks: dto.remarks,
        createdBy: userId,
        status: 'PENDING',
        checkpoints: {
          create: cps,
        },
      },
      include: { checkpoints: true },
    });
  }

  async submitQAInspection(tenantId: string, id: string, _userId: string, dto: SubmitQAInspectionInput) {
    const qa = await prisma.qualityInspection.findFirst({
      where: { id, tenantId, status: 'PENDING' },
      include: { checkpoints: true },
    });
    if (!qa) throw new NotFoundException('Pending QA inspection not found');

    await prisma.$transaction(async (tx) => {
      // Update checkpoints
      for (const cp of dto.checkpoints) {
        await tx.qAInspectionCheckpoint.update({
          where: { id: cp.id },
          data: {
            result: cp.result,
            observedValue: cp.observedValue,
            remarks: cp.remarks,
          },
        });
      }

      // Update parent inspection status
      await tx.qualityInspection.update({
        where: { id: qa.id },
        data: {
          status: dto.status,
          disposition: dto.disposition,
          acceptedQty: new Prisma.Decimal(dto.acceptedQty),
          rejectedQty: new Prisma.Decimal(dto.rejectedQty),
          remarks: dto.remarks,
          inspectedDate: new Date(),
        },
      });
    });

    return this.getQAInspectionById(tenantId, id);
  }

  async routeQAInspectionDisposition(tenantId: string, id: string, userId: string) {
    const qa = await prisma.qualityInspection.findFirst({ where: { id, tenantId } });
    if (!qa) throw new NotFoundException('QA inspection not found');
    if (!qa.disposition) throw new BadRequestException('Inspection has no disposition to route yet');

    if (qa.disposition === 'QUARANTINE' && qa.referenceType === 'STOCK_ENTRY') {
      const batch = await prisma.batch.findFirst({ where: { tenantId, originStockEntryId: qa.referenceId } });
      if (batch && batch.status !== 'QUARANTINE') {
        await prisma.$transaction(async (tx) => {
          await tx.batch.update({ where: { id: batch.id }, data: { status: 'QUARANTINE' } });
          await tx.batchQuarantineLog.create({
            data: {
              tenantId,
              batchId: batch.id,
              action: 'QUARANTINED',
              reason: `QA inspection ${qa.inspectionNumber} disposition: QUARANTINE`,
              performedBy: userId,
            },
          });
        });
        return { routed: true, action: 'BATCH_QUARANTINED', batchId: batch.id };
      }
    }

    return { routed: false, action: 'NONE', reason: 'No matching batch/action for this disposition' };
  }

  async getQAInspectionTemplates(tenantId: string, params: PaginationParams & { productId?: string } = {}) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    const { skip, take } = buildPaginationValues(params);
    const [templates, total] = await Promise.all([
      prisma.qAInspectionTemplate.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.qAInspectionTemplate.count({ where }),
    ]);
    return paginatedResult(templates, total, params);
  }

  async createQAInspectionTemplate(tenantId: string, dto: CreateQAInspectionTemplateInput) {
    return prisma.qAInspectionTemplate.create({
      data: { tenantId, name: dto.name, productId: dto.productId, checklist: dto.checklist, isActive: dto.isActive },
    });
  }

  async updateQAInspectionTemplate(tenantId: string, id: string, dto: UpdateQAInspectionTemplateInput) {
    const template = await prisma.qAInspectionTemplate.findFirst({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('QA inspection template not found');
    return prisma.qAInspectionTemplate.update({
      where: { id },
      data: { name: dto.name, productId: dto.productId, checklist: dto.checklist, isActive: dto.isActive },
    });
  }

  async deleteQAInspectionTemplate(tenantId: string, id: string) {
    const template = await prisma.qAInspectionTemplate.findFirst({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('QA inspection template not found');
    await prisma.qAInspectionTemplate.delete({ where: { id } });
    return { success: true };
  }

  async createQAInspectionFromTemplate(tenantId: string, orgId: string, userId: string, templateId: string, dto: CreateQAInspectionInput) {
    const template = await prisma.qAInspectionTemplate.findFirst({ where: { id: templateId, tenantId } });
    if (!template) throw new NotFoundException('QA inspection template not found');

    const checkpoints = (template.checklist as Array<{ parameter: string; criteria: string }>) ?? [];
    return this.createQAInspection(tenantId, orgId, userId, { ...dto, checkpoints } as any);
  }
}
