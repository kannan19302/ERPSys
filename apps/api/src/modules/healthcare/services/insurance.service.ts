import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class HealthcareInsuranceService {
  async findAllPolicies(
    tenantId: string,
    filters?: { patientId?: string; status?: string },
  ) {
    return prisma.healthcareInsurancePolicy.findMany({
      where: {
        tenantId,
        patientId: filters?.patientId,
        status: filters?.status,
      },
      include: { patient: true, claims: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async findPolicyById(tenantId: string, id: string) {
    return prisma.healthcareInsurancePolicy.findFirst({
      where: { tenantId, id },
      include: { patient: true, claims: { include: { policy: true } } },
    });
  }
  async createPolicy(tenantId: string, data: any) {
    return prisma.healthcareInsurancePolicy.create({
      data: { ...data, tenantId },
      include: { patient: true },
    });
  }
  async updatePolicy(tenantId: string, id: string, data: any) {
    await prisma.healthcareInsurancePolicy.updateMany({
      where: { tenantId, id },
      data,
    });
    return this.findPolicyById(tenantId, id);
  }
  async findAllClaims(
    tenantId: string,
    filters?: { policyId?: string; status?: string },
  ) {
    return prisma.healthcareInsuranceClaim.findMany({
      where: { tenantId, policyId: filters?.policyId, status: filters?.status },
      include: { policy: { include: { patient: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
  async findClaimById(tenantId: string, id: string) {
    return prisma.healthcareInsuranceClaim.findFirst({
      where: { tenantId, id },
      include: { policy: { include: { patient: true } } },
    });
  }
  async createClaim(tenantId: string, data: any) {
    return prisma.healthcareInsuranceClaim.create({
      data: { ...data, tenantId },
      include: { policy: true },
    });
  }
  async updateClaimStatus(
    tenantId: string,
    id: string,
    status: string,
    data?: any,
  ) {
    await prisma.healthcareInsuranceClaim.updateMany({
      where: { tenantId, id },
      data: { status, ...data },
    });
    return this.findClaimById(tenantId, id);
  }
  async validateClaim(tenantId: string, id: string) {
    const claim = await prisma.healthcareInsuranceClaim.findFirst({
      where: { tenantId, id },
      include: { policy: true },
    });
    if (!claim) throw new Error("Claim not found");
    if (claim.policy.status !== "ACTIVE")
      throw new Error("Insurance policy is not active");
    if (claim.billedAmount.lessThanOrEqualTo(0))
      throw new Error("Invalid billed amount");
    return { valid: true, claim };
  }
  async getPatientPolicies(tenantId: string, patientId: string) {
    return prisma.healthcareInsurancePolicy.findMany({
      where: { tenantId, patientId, isActive: true },
      include: { claims: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
  }
}
