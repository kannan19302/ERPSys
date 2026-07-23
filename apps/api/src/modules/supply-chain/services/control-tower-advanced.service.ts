import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ControlTowerAdvancedService {
  async getEvents(tenantId: string, params?: { status?: string; severity?: string; eventType?: string; page?: number; limit?: number }) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    if (params?.severity) where.severity = params.severity;
    if (params?.eventType) where.eventType = params.eventType;
    const data = await prisma.controlTowerEvent.findMany({ where, include: { actions: true }, orderBy: { createdAt: 'desc' }, skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0, take: params?.limit || 20 });
    const total = await prisma.controlTowerEvent.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async getEventById(tenantId: string, id: string) {
    const event = await prisma.controlTowerEvent.findFirst({ where: { id, tenantId }, include: { actions: true } });
    if (!event) throw new NotFoundException('Control tower event not found');
    return event;
  }

  async createEvent(tenantId: string, dto: any) {
    const eventNumber = `CTE-${Date.now()}`;
    return prisma.controlTowerEvent.create({ data: { tenantId, eventNumber, eventType: dto.eventType, severity: dto.severity || 'MEDIUM', title: dto.title, description: dto.description || null, category: dto.category || null, sourceModule: dto.sourceModule || null, sourceId: dto.sourceId || null, sourceType: dto.sourceType || null, assignedTo: dto.assignedTo || null, impactScore: dto.impactScore ? new Prisma.Decimal(dto.impactScore) : null } });
  }

  async updateEventStatus(tenantId: string, id: string, status: string, userId?: string) {
    const event = await prisma.controlTowerEvent.findFirst({ where: { id, tenantId } });
    if (!event) throw new NotFoundException('Event not found');
    const updateData: any = { status };
    if (status === 'RESOLVED' || status === 'CLOSED') { updateData.resolvedBy = userId; updateData.resolvedAt = new Date(); }
    return prisma.controlTowerEvent.update({ where: { id }, data: updateData });
  }

  async assignEvent(tenantId: string, id: string, assignedTo: string) {
    const event = await prisma.controlTowerEvent.findFirst({ where: { id, tenantId } });
    if (!event) throw new NotFoundException('Event not found');
    return prisma.controlTowerEvent.update({ where: { id }, data: { assignedTo } });
  }

  async executeAction(tenantId: string, eventId: string, actionType: string, description?: string, userId?: string) {
    const event = await prisma.controlTowerEvent.findFirst({ where: { id: eventId, tenantId } });
    if (!event) throw new NotFoundException('Event not found');
    return prisma.controlTowerAction.create({ data: { tenantId, eventId, actionType, description: description || null, executedBy: userId || null, executedAt: new Date(), status: 'COMPLETED', result: 'EXECUTED' } });
  }

  async getKpis(tenantId: string, params?: { category?: string; period?: string }) {
    const where: any = { tenantId, isActive: true };
    if (params?.category) where.category = params.category;
    if (params?.period) where.period = params.period;
    return prisma.controlTowerKpi.findMany({ where, orderBy: [{ category: 'asc' }, { kpiName: 'asc' }] });
  }

  async createKpi(tenantId: string, dto: any) {
    return prisma.controlTowerKpi.create({ data: { tenantId, ...dto } });
  }

  async updateKpiValue(tenantId: string, id: string, currentValue: number) {
    const kpi = await prisma.controlTowerKpi.findFirst({ where: { id, tenantId } });
    if (!kpi) throw new NotFoundException('KPI not found');
    return prisma.controlTowerKpi.update({ where: { id }, data: { currentValue: new Prisma.Decimal(currentValue) } });
  }

  async getAlertConfigs(tenantId: string) {
    return prisma.controlTowerAlertConfig.findMany({ where: { tenantId, isActive: true }, orderBy: { alertName: 'asc' } });
  }

  async createAlertConfig(tenantId: string, dto: any) {
    return prisma.controlTowerAlertConfig.create({ data: { tenantId, alertName: dto.alertName, description: dto.description || null, eventType: dto.eventType || null, kpiCode: dto.kpiCode || null, condition: dto.condition || Prisma.JsonNull, severity: dto.severity || 'MEDIUM', notificationChannels: dto.notificationChannels || Prisma.JsonNull, recipients: dto.recipients || Prisma.JsonNull, autoResolve: dto.autoResolve || false } });
  }

  async getControlTowerDashboard(tenantId: string) {
    const [openEvents, criticalEvents, kpis, alertConfigs] = await Promise.all([
      prisma.controlTowerEvent.count({ where: { tenantId, status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'] } } }),
      prisma.controlTowerEvent.count({ where: { tenantId, severity: 'CRITICAL', status: { not: 'CLOSED' } } }),
      prisma.controlTowerKpi.findMany({ where: { tenantId, isActive: true }, orderBy: { category: 'asc' } }),
      prisma.controlTowerAlertConfig.count({ where: { tenantId, isActive: true } }),
    ]);
    const eventsByType = await prisma.controlTowerEvent.groupBy({ by: ['eventType'], where: { tenantId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, _count: { id: true } });
    return { openEvents, criticalEvents, totalKpis: kpis.length, activeAlertConfigs: alertConfigs, eventsByType: eventsByType.map(e => ({ type: e.eventType, count: e._count.id })), kpis };
  }
}
