import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class PeopleOperationsService {
  private readonly prisma = prisma;
  // ── ONBOARDING TASKS ──
  async getOnboardingTasks(
    tenantId: string,
    query: { employeeId?: string; status?: string },
  ) {
    const where: any = { tenantId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;

    return this.prisma.peopleOnboardingTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createOnboardingTask(tenantId: string, data: any) {
    return this.prisma.peopleOnboardingTask.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: "PENDING",
      },
    });
  }

  // ── TIME OFF REQUESTS ──
  async getTimeOffRequests(
    tenantId: string,
    query: { employeeId?: string; status?: string },
  ) {
    const where: any = { tenantId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;

    return this.prisma.peopleTimeOffRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createTimeOffRequest(tenantId: string, data: any) {
    return this.prisma.peopleTimeOffRequest.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        leaveType: data.leaveType || "VACATION",
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        days: data.days || 1,
        reason: data.reason,
        status: "PENDING",
      },
    });
  }

  // ── PEER RECOGNITION ──
  async getPeerRecognitions(tenantId: string, query: { receiverId?: string }) {
    const where: any = { tenantId };
    if (query.receiverId) where.receiverId = query.receiverId;

    return this.prisma.peoplePeerRecognition.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createPeerRecognition(tenantId: string, data: any) {
    return this.prisma.peoplePeerRecognition.create({
      data: {
        tenantId,
        giverId: data.giverId,
        receiverId: data.receiverId,
        badge: data.badge || "TEAMWORK",
        message: data.message,
        points: data.points || 10,
      },
    });
  }
}
