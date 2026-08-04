import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SaasOnboardingFlowDeepService {
  async getOnboardingChecklist(tenantId: string) {
    return {
      tenantId,
      overallProgressPct: 75,
      steps: [
        {
          id: "step-1",
          title: "Configure Tenant Profile & Branding",
          isCompleted: true,
          category: "SETUP",
        },
        {
          id: "step-2",
          title: "Set Up Custom Domain & SSL Certificate",
          isCompleted: true,
          category: "SECURITY",
        },
        {
          id: "step-3",
          title: "Connect Payment Gateway & Billing Plan",
          isCompleted: true,
          category: "BILLING",
        },
        {
          id: "step-4",
          title: "Invite Team Members & Assign RBAC Roles",
          isCompleted: false,
          category: "TEAM",
        },
        {
          id: "step-5",
          title: "Import Initial Customer / Product CSV",
          isCompleted: false,
          category: "DATA",
        },
      ],
    };
  }

  async completeStep(tenantId: string, stepId: string) {
    return {
      tenantId,
      stepId,
      isCompleted: true,
      completedAt: new Date().toISOString(),
    };
  }
}
