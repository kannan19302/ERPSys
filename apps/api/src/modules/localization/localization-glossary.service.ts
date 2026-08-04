import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class LocalizationGlossaryService {
  async getEntries(tenantId: string) {
    return prisma.localeGlossaryEntry.findMany({
      where: { tenantId, status: "ACTIVE" },
      orderBy: { term: "asc" },
    });
  }

  async createEntry(
    tenantId: string,
    dto: {
      term: string;
      contextId?: string;
      definition: string;
      translation?: string;
      usage?: string;
    },
  ) {
    const exists = await prisma.localeGlossaryEntry.findFirst({
      where: { tenantId, term: dto.term },
    });
    if (exists) throw new BadRequestException("Glossary term already exists");
    return prisma.localeGlossaryEntry.create({
      data: { tenantId, ...dto, status: "ACTIVE" },
    });
  }

  async updateEntry(
    tenantId: string,
    id: string,
    dto: Partial<{
      definition: string;
      translation: string;
      usage: string;
      status: string;
    }>,
  ) {
    const entry = await prisma.localeGlossaryEntry.findFirst({
      where: { tenantId, id },
    });
    if (!entry) throw new NotFoundException("Glossary entry not found");
    return prisma.localeGlossaryEntry.update({ where: { id }, data: dto });
  }

  async archiveEntry(tenantId: string, id: string) {
    const entry = await prisma.localeGlossaryEntry.findFirst({
      where: { tenantId, id },
    });
    if (!entry) throw new NotFoundException("Glossary entry not found");
    return prisma.localeGlossaryEntry.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }
}
