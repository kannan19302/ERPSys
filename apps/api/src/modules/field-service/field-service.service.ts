import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class FieldServiceService {
  // ── Service Tickets ──
  async getTickets(tenantId: string) {
    return prisma.fieldServiceTicket.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }
  async getTicketById(tenantId: string, id: string) {
    return prisma.fieldServiceTicket.findFirst({ where: { tenantId, id }, include: { dispatches: true } });
  }
  async createTicket(tenantId: string, data: any) {
    return prisma.fieldServiceTicket.create({ data: { ...data, tenantId } });
  }

  // ── Dispatches ──
  async getDispatches(tenantId: string) {
    return prisma.fieldServiceDispatch.findMany({
      where: { tenantId },
      include: { ticket: true },
      orderBy: { scheduledTime: "desc" },
    });
  }
  async createDispatch(tenantId: string, data: any) {
    return prisma.fieldServiceDispatch.create({ data: { ...data, tenantId }, include: { ticket: true } });
  }

  // ── Technicians ──
  async getTechnicians(tenantId: string) {
    return prisma.fieldServiceTechnician.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
  }

  // ── Preventive Maintenance ──
  async getPreventiveMaintenances(tenantId: string) {
    return prisma.fieldServicePreventiveMaintenance.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
  }
  async createPreventiveMaintenance(tenantId: string, data: any) {
    return prisma.fieldServicePreventiveMaintenance.create({ data: { ...data, tenantId } });
  }

  // ── Checklists ──
  async getChecklists(tenantId: string) {
    return prisma.fieldServiceChecklist.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
  }
  async createChecklist(tenantId: string, data: any) {
    return prisma.fieldServiceChecklist.create({ data: { ...data, tenantId } });
  }
}
