import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProjectsResourceSkillsService {
  async getSkillCatalog(tenantId: string) {
    return prisma.skillCatalog.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createSkill(
    tenantId: string,
    dto: { name: string; category?: string; description?: string },
  ) {
    const existing = await prisma.skillCatalog.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException(`Skill "${dto.name}" already exists.`);
    return prisma.skillCatalog.create({
      data: {
        tenantId,
        name: dto.name,
        category: dto.category || null,
        description: dto.description || null,
      },
    });
  }

  async addEmployeeSkill(
    tenantId: string,
    dto: {
      employeeId: string;
      skillName: string;
      proficiency?: number;
      category?: string;
    },
  ) {
    return prisma.employeeSkill.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        skillName: dto.skillName,
        proficiency: dto.proficiency ?? 3,
        category: dto.category || "TECHNICAL",
      },
    });
  }

  async getEmployeeSkills(tenantId: string, employeeId: string) {
    return prisma.employeeSkill.findMany({
      where: { tenantId, employeeId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findResourcesBySkill(
    tenantId: string,
    skillName: string,
    minProficiency?: number,
  ) {
    const where: any = { tenantId, skillName };
    if (minProficiency) {
      where.proficiency = { gte: minProficiency };
    }
    return prisma.employeeSkill.findMany({
      where,
      orderBy: { proficiency: "desc" },
    });
  }

  async trackCertification(
    tenantId: string,
    dto: {
      employeeId: string;
      name: string;
      issuingBody: string;
      credentialId?: string;
      issueDate: string;
      expiryDate?: string;
      documentUrl?: string;
      notes?: string;
    },
  ) {
    return prisma.certification.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        name: dto.name,
        issuingBody: dto.issuingBody,
        credentialId: dto.credentialId || null,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        documentUrl: dto.documentUrl || null,
      },
    });
  }

  async getCertifications(tenantId: string, employeeId?: string) {
    const where: any = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    return prisma.certification.findMany({
      where,
      orderBy: { issueDate: "desc" },
    });
  }

  async getResourceMatchingDashboard(tenantId: string, projectId?: string) {
    const skills = await prisma.skillCatalog.findMany({
      where: { tenantId, isActive: true },
    });
    const employeeSkills = await prisma.employeeSkill.findMany({
      where: { tenantId },
    });
    const certCount = await prisma.certification.count({ where: { tenantId } });
    const skillCoverage: Record<string, number> = {};
    for (const es of employeeSkills) {
      skillCoverage[es.skillName] = (skillCoverage[es.skillName] || 0) + 1;
    }
    return {
      totalSkills: skills.length,
      totalSkillAssignments: employeeSkills.length,
      uniqueEmployeesWithSkills: new Set(
        employeeSkills.map((e) => e.employeeId),
      ).size,
      activeCertifications: certCount,
      skills,
      skillCoverage,
    };
  }
}
