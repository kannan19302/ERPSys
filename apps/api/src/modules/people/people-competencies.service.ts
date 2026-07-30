// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class PeopleCompetenciesService {
  async getCompetencies(tenantId: string, query: any = {}) {
    const where: any = { tenantId, isActive: true };
    if (query.category) where.category = query.category;
    if (query.search) {
      where.name = { contains: query.search, mode: "insensitive" };
    }
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.peopleCompetency.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.peopleCompetency.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCompetencyById(tenantId: string, id: string) {
    const item = await prisma.peopleCompetency.findFirst({
      where: { tenantId, id },
    });
    if (!item) throw new NotFoundException("Competency definition not found");
    return item;
  }

  async createCompetency(tenantId: string, data: any) {
    return prisma.peopleCompetency.create({
      data: {
        ...data,
        tenantId,
        proficiencyLevels: data.proficiencyLevels || [],
      },
    });
  }

  async updateCompetency(tenantId: string, id: string, data: any) {
    const existing = await prisma.peopleCompetency.findFirst({
      where: { tenantId, id },
    });
    if (!existing)
      throw new NotFoundException("Competency definition not found");
    return prisma.peopleCompetency.update({
      where: { id },
      data,
    });
  }

  async deleteCompetency(tenantId: string, id: string) {
    const existing = await prisma.peopleCompetency.findFirst({
      where: { tenantId, id },
    });
    if (!existing)
      throw new NotFoundException("Competency definition not found");
    return prisma.peopleCompetency.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
