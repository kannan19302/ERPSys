import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class CommunicationVoipService {
  async getCalls(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      assignedTo?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.assignedTo) where.assignedTo = params.assignedTo;
    const [data, total] = await Promise.all([
      prisma.voipCall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: "desc" },
      }),
      prisma.voipCall.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getCall(tenantId: string, id: string) {
    const call = await prisma.voipCall.findFirst({
      where: { id, tenantId },
      include: { analytics: true },
    });
    if (!call) throw new NotFoundException("Call not found");
    return call;
  }

  async initiateCall(
    tenantId: string,
    userId: string,
    dto: {
      callerNumber: string;
      calleeNumber: string;
      direction?: string;
      callerName?: string;
    },
  ) {
    return prisma.voipCall.create({
      data: {
        tenantId,
        callerId: userId,
        callerName: dto.callerName || "Unknown",
        callerNumber: dto.callerNumber,
        calleeNumber: dto.calleeNumber,
        direction: dto.direction || "OUTBOUND",
        status: "RINGING",
      },
    });
  }

  async updateCallStatus(
    tenantId: string,
    id: string,
    dto: { status: string; durationSecs?: number; recordingUrl?: string },
  ) {
    const existing = await prisma.voipCall.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Call not found");
    const data: any = { status: dto.status };
    if (dto.durationSecs !== undefined) data.durationSecs = dto.durationSecs;
    if (dto.recordingUrl !== undefined) data.recordingUrl = dto.recordingUrl;
    if (
      dto.status === "COMPLETED" ||
      dto.status === "MISSED" ||
      dto.status === "FAILED"
    )
      data.endedAt = new Date();
    if (dto.status === "IN_PROGRESS") data.startedAt = new Date();
    return prisma.voipCall.update({ where: { id }, data });
  }

  async routeIncomingCall(
    tenantId: string,
    dto: { callerNumber: string; calleeNumber: string; callerName?: string },
  ) {
    const menus = await prisma.ivrMenu.findMany({
      where: { tenantId, isActive: true },
      include: { options: true },
    });
    const call = await prisma.voipCall.create({
      data: {
        tenantId,
        callerId: "system",
        callerName: dto.callerName || "Unknown",
        callerNumber: dto.callerNumber,
        calleeNumber: dto.calleeNumber,
        direction: "INBOUND",
        status: "RINGING",
      },
    });
    return { call, ivrMenus: menus };
  }

  async getVoicemail(
    tenantId: string,
    params: { page?: number; limit?: number; isRead?: boolean },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.isRead !== undefined) where.isRead = params.isRead;
    const [data, total] = await Promise.all([
      prisma.voicemail.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.voicemail.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async markVoicemailRead(tenantId: string, id: string) {
    const existing = await prisma.voicemail.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Voicemail not found");
    return prisma.voicemail.update({ where: { id }, data: { isRead: true } });
  }

  async getIvrMenus(tenantId: string) {
    return prisma.ivrMenu.findMany({
      where: { tenantId },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async createIvrMenu(
    tenantId: string,
    dto: { name: string; greeting: string; timeoutSecs?: number },
  ) {
    return prisma.ivrMenu.create({
      data: {
        tenantId,
        name: dto.name,
        greeting: dto.greeting,
        timeoutSecs: dto.timeoutSecs || 10,
      },
    });
  }

  async createIvrOption(
    tenantId: string,
    menuId: string,
    dto: {
      digit: string;
      action: string;
      actionValue?: string;
      label: string;
      sortOrder?: number;
    },
  ) {
    return prisma.ivrOption.create({
      data: { tenantId, menuId, ...dto, sortOrder: dto.sortOrder || 0 },
    });
  }

  async getCallAnalytics(tenantId: string) {
    const [
      totalCalls,
      answeredCalls,
      missedCalls,
      avgDuration,
      totalDuration,
      callsByDirection,
    ] = await Promise.all([
      prisma.voipCall.count({ where: { tenantId } }),
      prisma.voipCall.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.voipCall.count({ where: { tenantId, status: "MISSED" } }),
      prisma.voipCall.aggregate({
        where: { tenantId, status: "COMPLETED" },
        _avg: { durationSecs: true },
      }),
      prisma.voipCall.aggregate({
        where: { tenantId, status: "COMPLETED" },
        _sum: { durationSecs: true },
      }),
      prisma.voipCall.groupBy({
        by: ["direction"],
        where: { tenantId },
        _count: true,
      }),
    ]);
    return {
      totalCalls,
      answeredCalls,
      missedCalls,
      avgDuration: avgDuration._avg.durationSecs || 0,
      totalDuration: totalDuration._sum.durationSecs || 0,
      callsByDirection,
    };
  }

  async getVoipDashboard(tenantId: string) {
    const [activeCalls, totalCallsToday, unreadVoicemails, ivrMenuCount] =
      await Promise.all([
        prisma.voipCall.count({ where: { tenantId, status: "IN_PROGRESS" } }),
        prisma.voipCall.count({
          where: {
            tenantId,
            startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.voicemail.count({ where: { tenantId, isRead: false } }),
        prisma.ivrMenu.count({ where: { tenantId, isActive: true } }),
      ]);
    return { activeCalls, totalCallsToday, unreadVoicemails, ivrMenuCount };
  }
}
