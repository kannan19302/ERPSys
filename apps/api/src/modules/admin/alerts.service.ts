import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class AlertsService {
  async getAlerts(tenantId: string, unreadOnly = false) {
    return prisma.adminAlert.findMany({
      where: {
        tenantId,
        isDismissed: false,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(tenantId: string, id: string) {
    return prisma.adminAlert.update({
      where: { id, tenantId },
      data: { isRead: true },
    });
  }

  async dismissAlert(tenantId: string, id: string) {
    return prisma.adminAlert.update({
      where: { id, tenantId },
      data: { isDismissed: true },
    });
  }

  async markAllRead(tenantId: string) {
    return prisma.adminAlert.updateMany({
      where: { tenantId, isRead: false, isDismissed: false },
      data: { isRead: true },
    });
  }

  async getThresholds(tenantId: string) {
    return prisma.alertThreshold.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertThreshold(
    tenantId: string,
    data: {
      metric: string;
      operator: string;
      value: number;
      severity?: string;
      isActive?: boolean;
      notifyEmail?: boolean;
      cooldownMin?: number;
    },
  ) {
    return prisma.alertThreshold.upsert({
      where: {
        tenantId_metric: { tenantId, metric: data.metric },
      },
      create: {
        tenantId,
        metric: data.metric,
        operator: data.operator,
        value: data.value,
        severity: data.severity ?? 'WARNING',
        isActive: data.isActive ?? true,
        notifyEmail: data.notifyEmail ?? true,
        cooldownMin: data.cooldownMin ?? 60,
      },
      update: {
        operator: data.operator,
        value: data.value,
        ...(data.severity !== undefined && { severity: data.severity }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.notifyEmail !== undefined && { notifyEmail: data.notifyEmail }),
        ...(data.cooldownMin !== undefined && { cooldownMin: data.cooldownMin }),
      },
    });
  }

  async deleteThreshold(tenantId: string, id: string) {
    return prisma.alertThreshold.delete({
      where: { id, tenantId },
    });
  }

  async createAlert(
    tenantId: string,
    data: {
      type: string;
      severity?: string;
      title: string;
      message: string;
      metadata?: any;
    },
  ) {
    return prisma.adminAlert.create({
      data: {
        tenantId,
        type: data.type,
        severity: data.severity ?? 'WARNING',
        title: data.title,
        message: data.message,
        metadata: data.metadata ?? {},
      },
    });
  }
}
