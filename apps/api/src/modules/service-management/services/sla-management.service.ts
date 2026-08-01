import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@unerp/database";

@Injectable()
export class SlaManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createSlaPolicy(
    tenantId: string,
    data: { name: string; description?: string; targets: any },
  ) {
    return this.prisma.serviceTicketSLAPolicy.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        targets: data.targets,
      },
    });
  }

  async getPolicies(tenantId: string) {
    return this.prisma.serviceTicketSLAPolicy.findMany({
      where: { tenantId },
    });
  }

  async checkBreaches(tenantId: string) {
    // This could be run on a cron schedule to evaluate active tickets against their SLA policies
    // For now, it's a stub to demonstrate the design
    return [];
  }
}
