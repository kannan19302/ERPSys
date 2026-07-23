import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import type { WorkCenterCapacityDto, ManufacturingRouteDto, QualityCheckTemplateDto, QualityCheckDto, ScrapRecordDto, TimeEntryDto } from './dto/manufacturing-expansion.dto';

@Injectable()
export class ManufacturingExpansionService {
  // ── Work Center Capacity ──
  async getWorkCenterCapacities(tenantId: string, workstationId: string) {
    return prisma.workCenterCapacity.findMany({
      where: { tenantId, workstationId },
      orderBy: { date: 'desc' },
    });
  }

  async updateWorkCenterCapacity(tenantId: string, id: string, dto: { utilizedHours?: number; availableHours?: number; overtimeHours?: number; notes?: string }) {
    const existing = await prisma.workCenterCapacity.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Work center capacity record not found');
    return prisma.workCenterCapacity.update({
      where: { id },
      data: {
        utilizedHours: dto.utilizedHours !== undefined ? new Prisma.Decimal(dto.utilizedHours) : undefined,
        availableHours: dto.availableHours !== undefined ? new Prisma.Decimal(dto.availableHours) : undefined,
        overtimeHours: dto.overtimeHours !== undefined ? new Prisma.Decimal(dto.overtimeHours) : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
    });
  }

  async setWorkCenterCapacity(tenantId: string, dto: WorkCenterCapacityDto) {
    const workstation = await prisma.workstation.findFirst({ where: { id: dto.workstationId, tenantId } });
    if (!workstation) throw new NotFoundException('Workstation not found');
    return prisma.workCenterCapacity.create({
      data: {
        tenantId,
        workstationId: dto.workstationId,
        date: new Date(dto.date),
        availableHours: new Prisma.Decimal(dto.availableHours),
        overtimeHours: new Prisma.Decimal(dto.overtimeHours),
        notes: dto.notes || null,
      },
    });
  }

  // ── Manufacturing Routes ──
  async getRoutes(tenantId: string) {
    return prisma.manufacturingRoute.findMany({
      where: { tenantId },
      include: { operations: { orderBy: { sequence: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async getRouteById(tenantId: string, id: string) {
    const route = await prisma.manufacturingRoute.findFirst({
      where: { id, tenantId },
      include: { operations: { orderBy: { sequence: 'asc' } } },
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async createRoute(tenantId: string, dto: ManufacturingRouteDto) {
    const existing = await prisma.manufacturingRoute.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException(`Route code ${dto.code} already exists.`);
    return prisma.$transaction(async (tx) => {
      const route = await tx.manufacturingRoute.create({
        data: {
          tenantId,
          name: dto.name,
          code: dto.code,
          description: dto.description || null,
          totalLeadTimeMin: dto.operations.reduce((sum, op) => sum + op.durationMinutes + op.setupMinutes, 0),
        },
      });
      for (const op of dto.operations) {
        await tx.manufacturingRouteOperation.create({
          data: {
            tenantId,
            routeId: route.id,
            sequence: op.sequence,
            name: op.name,
            workstationCode: op.workstationCode || null,
            durationMinutes: op.durationMinutes,
            setupMinutes: op.setupMinutes,
            description: op.description || null,
          },
        });
      }
      return tx.manufacturingRoute.findUnique({
        where: { id: route.id },
        include: { operations: { orderBy: { sequence: 'asc' } } },
      });
    });
  }

  async updateRoute(tenantId: string, id: string, dto: { name?: string; description?: string; isActive?: boolean }) {
    const existing = await prisma.manufacturingRoute.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Route not found');
    return prisma.manufacturingRoute.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });
  }

  async deleteRoute(tenantId: string, id: string) {
    const existing = await prisma.manufacturingRoute.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Route not found');
    return prisma.manufacturingRoute.delete({ where: { id } });
  }

  // ── Quality Check Templates ──
  async getQualityCheckTemplates(tenantId: string) {
    return prisma.manufacturingQualityCheckTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createQualityCheckTemplate(tenantId: string, dto: QualityCheckTemplateDto) {
    const existing = await prisma.manufacturingQualityCheckTemplate.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException(`Template code ${dto.code} already exists.`);
    return prisma.manufacturingQualityCheckTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        category: dto.category,
        checks: dto.checks as never,
      },
    });
  }

  // ── Quality Checks ──
  async getQualityChecks(tenantId: string, workOrderId?: string) {
    const where: any = { tenantId };
    if (workOrderId) where.workOrderId = workOrderId;
    return prisma.manufacturingQualityCheck.findMany({
      where,
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async performQualityCheck(tenantId: string, dto: QualityCheckDto) {
    const template = await prisma.manufacturingQualityCheckTemplate.findFirst({ where: { id: dto.templateId, tenantId } });
    if (!template) throw new NotFoundException('Quality check template not found');
    return prisma.manufacturingQualityCheck.create({
      data: {
        tenantId,
        templateId: dto.templateId,
        workOrderId: dto.workOrderId || null,
        productId: dto.productId,
        inspectorId: dto.inspectorId || null,
        status: dto.status,
        checkedQty: new Prisma.Decimal(dto.checkedQty),
        passedQty: new Prisma.Decimal(dto.passedQty),
        failedQty: new Prisma.Decimal(dto.failedQty),
        resultJson: dto.resultJson || undefined,
        notes: dto.notes || null,
        checkedAt: new Date(),
      },
    });
  }

  // ── Scrap Records ──
  async getScrapRecords(tenantId: string, workOrderId?: string) {
    const where: any = { tenantId };
    if (workOrderId) where.workOrderId = workOrderId;
    return prisma.manufacturingScrapRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createScrapRecord(tenantId: string, dto: ScrapRecordDto) {
    const wo = await prisma.workOrder.findFirst({ where: { id: dto.workOrderId, tenantId } });
    if (!wo) throw new NotFoundException('Work order not found');
    return prisma.manufacturingScrapRecord.create({
      data: {
        tenantId,
        workOrderId: dto.workOrderId,
        productId: dto.productId,
        scrappedQty: new Prisma.Decimal(dto.scrappedQty),
        reason: dto.reason,
        reasonDetail: dto.reasonDetail || null,
        costImpact: dto.costImpact !== undefined ? new Prisma.Decimal(dto.costImpact) : null,
        reportedById: null,
      },
    });
  }

  // ── Time Entries ──
  async getTimeEntries(tenantId: string, workOrderId?: string, employeeId?: string) {
    const where: any = { tenantId };
    if (workOrderId) where.workOrderId = workOrderId;
    if (employeeId) where.employeeId = employeeId;
    return prisma.manufacturingTimeEntry.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });
  }

  async createTimeEntry(tenantId: string, dto: TimeEntryDto) {
    const wo = await prisma.workOrder.findFirst({ where: { id: dto.workOrderId, tenantId } });
    if (!wo) throw new NotFoundException('Work order not found');
    const start = new Date(dto.startTime);
    const end = dto.endTime ? new Date(dto.endTime) : null;
    const durationMin = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;
    return prisma.manufacturingTimeEntry.create({
      data: {
        tenantId,
        workOrderId: dto.workOrderId,
        operationId: dto.operationId || null,
        employeeId: dto.employeeId,
        startTime: start,
        endTime: end,
        durationMin,
        activityType: dto.activityType,
        notes: dto.notes || null,
      },
    });
  }
}
