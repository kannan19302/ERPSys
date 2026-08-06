import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class HrOperationsService {
  // ══════════════════════════════════════════════════════════════
  // TICKET CATEGORIES
  // ══════════════════════════════════════════════════════════════

  async getTicketCategories(tenantId: string) {
    return (prisma as any).hrTicketCategory
      ? (prisma as any).hrTicketCategory.findMany({
          where: { tenantId },
          orderBy: { name: "asc" },
        })
      : [];
  }

  async getTicketCategoryById(tenantId: string, id: string) {
    const item = (prisma as any).hrTicketCategory
      ? await (prisma as any).hrTicketCategory.findFirst({
          where: { id, tenantId },
        })
      : null;
    if (!item) throw new NotFoundException("Ticket category not found");
    return item;
  }

  async createTicketCategory(tenantId: string, dto: any) {
    return (prisma as any).hrTicketCategory.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        slaHours: dto.slaHours || null,
      },
    });
  }

  async updateTicketCategory(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).hrTicketCategory.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Ticket category not found");
    return (prisma as any).hrTicketCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        slaHours: dto.slaHours,
        isActive: dto.isActive,
      },
    });
  }

  async deleteTicketCategory(tenantId: string, id: string) {
    const item = await (prisma as any).hrTicketCategory.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Ticket category not found");
    await (prisma as any).hrTicketCategory.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // HR TICKETS
  // ══════════════════════════════════════════════════════════════

  async getHrTickets(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      categoryId?: string;
      assignedTo?: string;
    } = {},
  ) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.assignedTo) where.assignedTo = params.assignedTo;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      (prisma as any).hrTicket
        ? (prisma as any).hrTicket.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              category: { select: { id: true, name: true } },
              assignments: { take: 1, orderBy: { assignedAt: "desc" } },
            },
          })
        : Promise.resolve([]),
      (prisma as any).hrTicket
        ? (prisma as any).hrTicket.count({ where })
        : Promise.resolve(0),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getHrTicketById(tenantId: string, id: string) {
    const item = (prisma as any).hrTicket
      ? await (prisma as any).hrTicket.findFirst({
          where: { id, tenantId },
          include: {
            category: true,
            assignments: { orderBy: { assignedAt: "desc" } },
          },
        })
      : null;
    if (!item) throw new NotFoundException("HR ticket not found");
    return item;
  }

  async createHrTicket(tenantId: string, dto: any) {
    if (dto.categoryId && (prisma as any).hrTicketCategory) {
      const cat = await (prisma as any).hrTicketCategory.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!cat) throw new NotFoundException("Ticket category not found");
    }
    return (prisma as any).hrTicket.create({
      data: {
        tenantId,
        categoryId: dto.categoryId || null,
        employeeId: dto.employeeId,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority || "MEDIUM",
        source: dto.source || "PORTAL",
      },
    });
  }

  async updateHrTicket(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).hrTicket.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("HR ticket not found");
    return (prisma as any).hrTicket.update({
      where: { id },
      data: {
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        categoryId: dto.categoryId,
        assignedTo: dto.assignedTo,
      },
    });
  }

  async assignHrTicket(
    tenantId: string,
    id: string,
    dto: { assigneeId: string; note?: string },
  ) {
    const ticket = await (prisma as any).hrTicket.findFirst({
      where: { id, tenantId },
    });
    if (!ticket) throw new NotFoundException("HR ticket not found");
    await (prisma as any).hrTicketAssignment.create({
      data: {
        tenantId,
        ticketId: id,
        assigneeId: dto.assigneeId,
        assignedBy: dto.assigneeId,
        note: dto.note || null,
      },
    });
    return (prisma as any).hrTicket.update({
      where: { id },
      data: {
        assignedTo: dto.assigneeId,
        status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
      },
    });
  }

  async resolveHrTicket(
    tenantId: string,
    id: string,
    dto: { resolution: string; satisfactionScore?: number },
  ) {
    const item = await (prisma as any).hrTicket.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("HR ticket not found");
    if (item.status === "RESOLVED" || item.status === "CLOSED")
      throw new BadRequestException("Ticket is already resolved or closed");
    return (prisma as any).hrTicket.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution: dto.resolution,
        resolvedAt: new Date(),
        satisfactionScore: dto.satisfactionScore || null,
      },
    });
  }

  async deleteHrTicket(tenantId: string, id: string) {
    const item = await (prisma as any).hrTicket.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("HR ticket not found");
    await (prisma as any).hrTicket.delete({ where: { id } });
    return { success: true };
  }

  async getTicketDashboard(tenantId: string) {
    const [byStatus, byPriority, byCategory, total] = await Promise.all([
      (prisma as any).hrTicket
        ? (prisma as any).hrTicket.groupBy({
            by: ["status"],
            where: { tenantId },
            _count: true,
          })
        : Promise.resolve([]),
      (prisma as any).hrTicket
        ? (prisma as any).hrTicket.groupBy({
            by: ["priority"],
            where: { tenantId },
            _count: true,
          })
        : Promise.resolve([]),
      (prisma as any).hrTicket
        ? (prisma as any).hrTicket.groupBy({
            by: ["categoryId"],
            where: { tenantId, categoryId: { not: null } },
            _count: true,
          })
        : Promise.resolve([]),
      (prisma as any).hrTicket
        ? (prisma as any).hrTicket.count({ where: { tenantId } })
        : Promise.resolve(0),
    ]);
    const categories = (prisma as any).hrTicketCategory
      ? await (prisma as any).hrTicketCategory.findMany({
          where: {
            tenantId,
            id: {
              in: byCategory
                .map((c: any) => c.categoryId)
                .filter(Boolean) as string[],
            },
          },
          select: { id: true, name: true },
        })
      : [];
    const catMap = new Map(categories.map((c: any) => [c.id, c.name]));
    return {
      total,
      byStatus: byStatus.map((s: any) => ({
        status: s.status,
        count: s._count,
      })),
      byPriority: byPriority.map((p: any) => ({
        priority: p.priority,
        count: p._count,
      })),
      byCategory: byCategory.map((c: any) => ({
        categoryId: c.categoryId,
        categoryName: catMap.get(c.categoryId!) || "Unknown",
        count: c._count,
      })),
    };
  }

  // ══════════════════════════════════════════════════════════════
  // GRIEVANCES
  // ══════════════════════════════════════════════════════════════

  async getGrievances(tenantId: string, employeeId?: string, status?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    return (prisma as any).employeeGrievance
      ? (prisma as any).employeeGrievance.findMany({
          where,
          orderBy: { createdAt: "desc" },
        })
      : [];
  }

  async getGrievanceById(tenantId: string, id: string) {
    const item = (prisma as any).employeeGrievance
      ? await (prisma as any).employeeGrievance.findFirst({
          where: { id, tenantId },
        })
      : null;
    if (!item) throw new NotFoundException("Grievance not found");
    return item;
  }

  async createGrievance(tenantId: string, dto: any) {
    return (prisma as any).employeeGrievance.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        grievanceType: dto.grievanceType,
        subject: dto.subject,
        description: dto.description,
        severity: dto.severity || "MEDIUM",
      },
    });
  }

  async updateGrievance(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).employeeGrievance.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Grievance not found");
    return (prisma as any).employeeGrievance.update({
      where: { id },
      data: {
        subject: dto.subject,
        description: dto.description,
        severity: dto.severity,
        status: dto.status,
        assignedTo: dto.assignedTo,
        grievanceType: dto.grievanceType,
      },
    });
  }

  async resolveGrievance(
    tenantId: string,
    id: string,
    dto: { resolution: string },
  ) {
    const item = await (prisma as any).employeeGrievance.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Grievance not found");
    if (item.status === "RESOLVED" || item.status === "CLOSED")
      throw new BadRequestException("Grievance is already resolved");
    return (prisma as any).employeeGrievance.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution: dto.resolution,
        resolvedAt: new Date(),
      },
    });
  }

  async deleteGrievance(tenantId: string, id: string) {
    const item = await (prisma as any).employeeGrievance.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Grievance not found");
    await (prisma as any).employeeGrievance.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // DISPUTE RESOLUTIONS
  // ══════════════════════════════════════════════════════════════

  async getDisputeResolutions(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return (prisma as any).disputeResolution
      ? (prisma as any).disputeResolution.findMany({
          where,
          orderBy: { createdAt: "desc" },
        })
      : [];
  }

  async getDisputeResolutionById(tenantId: string, id: string) {
    const item = (prisma as any).disputeResolution
      ? await (prisma as any).disputeResolution.findFirst({
          where: { id, tenantId },
        })
      : null;
    if (!item) throw new NotFoundException("Dispute resolution not found");
    return item;
  }

  async createDisputeResolution(tenantId: string, dto: any) {
    return (prisma as any).disputeResolution.create({
      data: {
        tenantId,
        disputeType: dto.disputeType,
        subject: dto.subject,
        description: dto.description,
        initiatingParty: dto.initiatingParty,
        respondentId: dto.respondentId || null,
        mediatorId: dto.mediatorId || null,
      },
    });
  }

  async updateDisputeResolution(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).disputeResolution.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Dispute resolution not found");
    return (prisma as any).disputeResolution.update({
      where: { id },
      data: {
        disputeType: dto.disputeType,
        subject: dto.subject,
        description: dto.description,
        initiatingParty: dto.initiatingParty,
        respondentId: dto.respondentId,
        mediatorId: dto.mediatorId,
        status: dto.status,
      },
    });
  }

  async resolveDispute(
    tenantId: string,
    id: string,
    dto: { resolution: string },
  ) {
    const item = await (prisma as any).disputeResolution.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Dispute resolution not found");
    if (item.status === "RESOLVED" || item.status === "CLOSED")
      throw new BadRequestException("Dispute is already resolved");
    return (prisma as any).disputeResolution.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution: dto.resolution,
        resolvedAt: new Date(),
      },
    });
  }

  async deleteDisputeResolution(tenantId: string, id: string) {
    const item = await (prisma as any).disputeResolution.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Dispute resolution not found");
    await (prisma as any).disputeResolution.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // BACKGROUND CHECKS
  // ══════════════════════════════════════════════════════════════

  async getBackgroundChecks(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return (prisma as any).backgroundCheckRequest
      ? (prisma as any).backgroundCheckRequest.findMany({
          where,
          orderBy: { requestedAt: "desc" },
        })
      : [];
  }

  async getBackgroundCheckById(tenantId: string, id: string) {
    const item = (prisma as any).backgroundCheckRequest
      ? await (prisma as any).backgroundCheckRequest.findFirst({
          where: { id, tenantId },
        })
      : null;
    if (!item) throw new NotFoundException("Background check not found");
    return item;
  }

  async createBackgroundCheck(tenantId: string, dto: any, requestedBy: string) {
    return (prisma as any).backgroundCheckRequest.create({
      data: {
        tenantId,
        candidateId: dto.candidateId || null,
        employeeId: dto.employeeId || null,
        checkType: dto.checkType,
        vendorName: dto.vendorName || null,
        requestedBy,
        notes: dto.notes || null,
      },
    });
  }

  async updateBackgroundCheck(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).backgroundCheckRequest.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Background check not found");
    return (prisma as any).backgroundCheckRequest.update({
      where: { id },
      data: {
        vendorName: dto.vendorName,
        notes: dto.notes,
        status: dto.status,
        checkType: dto.checkType,
      },
    });
  }

  async completeBackgroundCheck(
    tenantId: string,
    id: string,
    dto: { result: string; isClear: boolean; documentUrl?: string },
  ) {
    const item = await (prisma as any).backgroundCheckRequest.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Background check not found");
    if (item.status === "COMPLETED")
      throw new BadRequestException("Background check is already completed");
    return (prisma as any).backgroundCheckRequest.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        result: dto.result,
        isClear: dto.isClear,
        documentUrl: dto.documentUrl || null,
      },
    });
  }

  async deleteBackgroundCheck(tenantId: string, id: string) {
    const item = await (prisma as any).backgroundCheckRequest.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Background check not found");
    await (prisma as any).backgroundCheckRequest.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // VISA RECORDS
  // ══════════════════════════════════════════════════════════════

  async getVisaRecords(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return (prisma as any).visaRecord.findMany({
      where,
      orderBy: { expiryDate: "asc" },
    });
  }

  async getVisaRecordById(tenantId: string, id: string) {
    const item = await (prisma as any).visaRecord.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Visa record not found");
    return item;
  }

  async createVisaRecord(tenantId: string, dto: any) {
    return (prisma as any).visaRecord.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        visaType: dto.visaType,
        visaNumber: dto.visaNumber,
        issuingCountry: dto.issuingCountry,
        issuedDate: new Date(dto.issuedDate),
        expiryDate: new Date(dto.expiryDate),
        isSponsored: dto.isSponsored || false,
        notes: dto.notes || null,
      },
    });
  }

  async updateVisaRecord(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).visaRecord.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Visa record not found");
    return (prisma as any).visaRecord.update({
      where: { id },
      data: {
        visaType: dto.visaType,
        visaNumber: dto.visaNumber,
        issuingCountry: dto.issuingCountry,
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        status: dto.status,
        isSponsored: dto.isSponsored,
        notes: dto.notes,
      },
    });
  }

  async getExpiringVisas(tenantId: string, days: number = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return (prisma as any).visaRecord.findMany({
      where: { tenantId, status: "ACTIVE", expiryDate: { lte: cutoff } },
      orderBy: { expiryDate: "asc" },
    });
  }

  async deleteVisaRecord(tenantId: string, id: string) {
    const item = await (prisma as any).visaRecord.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Visa record not found");
    await (prisma as any).visaRecord.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // IMMIGRATION DOCUMENTS
  // ══════════════════════════════════════════════════════════════

  async getImmigrationDocuments(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return (prisma as any).immigrationDocument.findMany({
      where,
      orderBy: { issuedDate: "desc" },
    });
  }

  async getImmigrationDocumentById(tenantId: string, id: string) {
    const item = await (prisma as any).immigrationDocument.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Immigration document not found");
    return item;
  }

  async createImmigrationDocument(tenantId: string, dto: any) {
    return (prisma as any).immigrationDocument.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        issuingAuthority: dto.issuingAuthority,
        issuedDate: new Date(dto.issuedDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        isPermanent: dto.isPermanent || false,
        notes: dto.notes || null,
      },
    });
  }

  async updateImmigrationDocument(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).immigrationDocument.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Immigration document not found");
    return (prisma as any).immigrationDocument.update({
      where: { id },
      data: {
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        issuingAuthority: dto.issuingAuthority,
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        isPermanent: dto.isPermanent,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async getExpiringImmigrationDocuments(tenantId: string, days: number = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return (prisma as any).immigrationDocument.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        isPermanent: false,
        expiryDate: { lte: cutoff, not: null },
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  async deleteImmigrationDocument(tenantId: string, id: string) {
    const item = await (prisma as any).immigrationDocument.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Immigration document not found");
    await (prisma as any).immigrationDocument.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // WELLNESS PROGRAMS
  // ══════════════════════════════════════════════════════════════

  async getWellnessPrograms(
    tenantId: string,
    programType?: string,
    isActive?: boolean,
  ) {
    const where: any = { tenantId };
    if (programType) where.programType = programType;
    if (isActive !== undefined) where.isActive = isActive;
    return (prisma as any).employeeWellnessProgram.findMany({
      where,
      orderBy: { startDate: "desc" },
    });
  }

  async getWellnessProgramById(tenantId: string, id: string) {
    const item = await (prisma as any).employeeWellnessProgram.findFirst({
      where: { id, tenantId },
      include: { activities: { take: 10, orderBy: { activityDate: "desc" } } },
    });
    if (!item) throw new NotFoundException("Wellness program not found");
    return item;
  }

  async createWellnessProgram(tenantId: string, dto: any) {
    return (prisma as any).employeeWellnessProgram.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        programType: dto.programType,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async updateWellnessProgram(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).employeeWellnessProgram.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Wellness program not found");
    return (prisma as any).employeeWellnessProgram.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        programType: dto.programType,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive,
      },
    });
  }

  async deleteWellnessProgram(tenantId: string, id: string) {
    const item = await (prisma as any).employeeWellnessProgram.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Wellness program not found");
    await (prisma as any).employeeWellnessProgram.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // WELLNESS ACTIVITIES
  // ══════════════════════════════════════════════════════════════

  async getWellnessActivities(
    tenantId: string,
    programId?: string,
    employeeId?: string,
  ) {
    const where: any = { tenantId };
    if (programId) where.programId = programId;
    if (employeeId) where.employeeId = employeeId;
    return (prisma as any).wellnessActivity.findMany({
      where,
      orderBy: { activityDate: "desc" },
      include: { program: { select: { id: true, name: true } } },
    });
  }

  async getWellnessActivityById(tenantId: string, id: string) {
    const item = await (prisma as any).wellnessActivity.findFirst({
      where: { id, tenantId },
      include: { program: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException("Wellness activity not found");
    return item;
  }

  async logWellnessActivity(tenantId: string, dto: any) {
    const program = await (prisma as any).employeeWellnessProgram.findFirst({
      where: { id: dto.programId, tenantId },
    });
    if (!program) throw new NotFoundException("Wellness program not found");
    return (prisma as any).wellnessActivity.create({
      data: {
        tenantId,
        programId: dto.programId,
        employeeId: dto.employeeId,
        activityType: dto.activityType,
        activityDate: new Date(dto.activityDate),
        durationMin: dto.durationMin || null,
        metricValue: dto.metricValue || null,
        notes: dto.notes || null,
      },
    });
  }

  async updateWellnessActivity(tenantId: string, id: string, dto: any) {
    const item = await (prisma as any).wellnessActivity.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Wellness activity not found");
    return (prisma as any).wellnessActivity.update({
      where: { id },
      data: {
        activityType: dto.activityType,
        activityDate: dto.activityDate ? new Date(dto.activityDate) : undefined,
        durationMin: dto.durationMin,
        metricValue: dto.metricValue,
        notes: dto.notes,
      },
    });
  }

  async deleteWellnessActivity(tenantId: string, id: string) {
    const item = await (prisma as any).wellnessActivity.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Wellness activity not found");
    await (prisma as any).wellnessActivity.delete({ where: { id } });
    return { success: true };
  }

  // ══════════════════════════════════════════════════════════════
  // OPERATIONS ANALYTICS
  // ══════════════════════════════════════════════════════════════

  async getOperationsAnalytics(tenantId: string) {
    const p = prisma as any;
    const [
      openTickets,
      resolvedTickets,
      totalTickets,
      openGrievances,
      resolvedGrievances,
      pendingBackgroundChecks,
      totalBackgroundChecks,
      activeVisas,
      expiringVisas,
    ] = await Promise.all([
      p.hrTicket
        ? p.hrTicket.count({ where: { tenantId, status: "OPEN" } })
        : Promise.resolve(0),
      p.hrTicket
        ? p.hrTicket.count({ where: { tenantId, status: "RESOLVED" } })
        : Promise.resolve(0),
      p.hrTicket
        ? p.hrTicket.count({ where: { tenantId } })
        : Promise.resolve(0),
      p.employeeGrievance
        ? p.employeeGrievance.count({ where: { tenantId, status: "OPEN" } })
        : Promise.resolve(0),
      p.employeeGrievance
        ? p.employeeGrievance.count({ where: { tenantId, status: "RESOLVED" } })
        : Promise.resolve(0),
      p.backgroundCheckRequest
        ? p.backgroundCheckRequest.count({
            where: { tenantId, status: "PENDING" },
          })
        : Promise.resolve(0),
      p.backgroundCheckRequest
        ? p.backgroundCheckRequest.count({ where: { tenantId } })
        : Promise.resolve(0),
      p.visaRecord
        ? p.visaRecord.count({ where: { tenantId, status: "ACTIVE" } })
        : Promise.resolve(0),
      p.visaRecord
        ? p.visaRecord.count({
            where: {
              tenantId,
              status: "ACTIVE",
              expiryDate: {
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            },
          })
        : Promise.resolve(0),
    ]);

    const avgResolutionMinutes =
      resolvedTickets > 0
        ? await this.calculateAvgTicketResolutionMinutes(tenantId)
        : 0;

    const grievancesByStatus = (prisma as any).employeeGrievance
      ? await (prisma as any).employeeGrievance.groupBy({
          by: ["status"],
          where: { tenantId },
          _count: true,
        })
      : [];

    return {
      openTickets,
      resolvedTickets,
      avgResolutionMinutes,
      totalTickets,
      grievancesStatus: grievancesByStatus.map((g: any) => ({
        status: g.status,
        count: g._count,
      })),
      openGrievances,
      resolvedGrievances,
      pendingBackgroundChecks,
      totalBackgroundChecks,
      backgroundCheckCompletionRate:
        totalBackgroundChecks > 0
          ? Math.round(
              ((totalBackgroundChecks - pendingBackgroundChecks) /
                totalBackgroundChecks) *
                100,
            )
          : 0,
      activeVisas,
      expiringVisasWithin30Days: expiringVisas,
    };
  }

  private async calculateAvgTicketResolutionMinutes(
    tenantId: string,
  ): Promise<number> {
    const resolved = (prisma as any).hrTicket
      ? await (prisma as any).hrTicket.findMany({
          where: { tenantId, status: "RESOLVED", resolvedAt: { not: null } },
          select: { createdAt: true, resolvedAt: true },
          take: 1000,
        })
      : [];
    if (resolved.length === 0) return 0;
    const totalMinutes = resolved.reduce((sum: number, t: any) => {
      const diff = t.resolvedAt!.getTime() - t.createdAt.getTime();
      return sum + diff / (1000 * 60);
    }, 0);
    return Math.round(totalMinutes / resolved.length);
  }
}
