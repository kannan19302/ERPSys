import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

export interface JournalLineDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateRecurringTemplateDto {
  name: string;
  description?: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUALLY";
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  autoPost?: boolean;
  lines: JournalLineDto[];
}

@Injectable()
export class RecurringJournalSchedulerService {
  /**
   * List all recurring journal templates for a tenant.
   */
  async listTemplates(tenantId: string) {
    const records = await prisma.recurringJournal.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) => {
      let lines: JournalLineDto[] = [];
      let templateName = `Recurring Journal ${r.id.slice(0, 8)}`;
      try {
        const parsed =
          typeof r.entryTemplate === "string"
            ? JSON.parse(r.entryTemplate)
            : r.entryTemplate;
        if (parsed) {
          lines = parsed.lines || [];
          if (parsed.name) templateName = parsed.name;
        }
      } catch {
        lines = [];
      }

      const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

      return {
        id: r.id,
        tenantId: r.tenantId,
        orgId: r.orgId,
        name: templateName,
        frequency: r.frequency,
        status: r.status,
        nextRunDate: r.nextRunDate
          ? r.nextRunDate.toISOString().split("T")[0]
          : null,
        lastRunDate: r.lastRunDate
          ? r.lastRunDate.toISOString().split("T")[0]
          : null,
        linesCount: lines.length,
        totalAmount: totalDebit || totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        entryTemplate: lines,
        createdAt: r.createdAt.toISOString(),
      };
    });
  }

  /**
   * Create a new recurring journal entry template.
   */
  async createTemplate(
    tenantId: string,
    orgId: string,
    dto: CreateRecurringTemplateDto,
  ) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException(
        "At least one journal entry line is required",
      );
    }

    const totalDebit = dto.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Journal template lines must balance: Debits ($${totalDebit}) != Credits ($${totalCredit})`,
      );
    }

    const startDate = new Date(dto.startDate || Date.now());
    const nextRunDate = this.calculateNextRunDate(startDate, dto.frequency);

    const templateData = {
      name: dto.name,
      description: dto.description || "",
      frequency: dto.frequency,
      lines: dto.lines,
      autoPost: dto.autoPost ?? true,
      maxOccurrences: dto.maxOccurrences,
      occurrencesRun: 0,
    };

    const created = await prisma.recurringJournal.create({
      data: {
        tenantId,
        orgId,
        frequency: dto.frequency,
        entryTemplate: JSON.stringify(templateData),
        nextRunDate,
        status: "ACTIVE",
      },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      name: dto.name,
      frequency: created.frequency,
      status: created.status,
      nextRunDate: nextRunDate.toISOString().split("T")[0],
      isBalanced: true,
      lines: dto.lines,
      totalAmount: totalDebit,
    };
  }

  /**
   * Update an existing recurring template.
   */
  async updateTemplate(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      frequency?: string;
      status?: string;
      lines?: JournalLineDto[];
    },
  ) {
    const existing = await prisma.recurringJournal.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Recurring journal template not found");
    }

    let existingData: any = {};
    try {
      existingData =
        typeof existing.entryTemplate === "string"
          ? JSON.parse(existing.entryTemplate)
          : existing.entryTemplate;
    } catch {
      existingData = {};
    }

    if (dto.lines) {
      const totalDebit = dto.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = dto.lines.reduce(
        (sum, l) => sum + (l.credit || 0),
        0,
      );
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new BadRequestException(
          `Journal lines must balance: Debits ($${totalDebit}) != Credits ($${totalCredit})`,
        );
      }
      existingData.lines = dto.lines;
    }

    if (dto.name) existingData.name = dto.name;

    const updated = await prisma.recurringJournal.update({
      where: { id },
      data: {
        ...(dto.frequency && { frequency: dto.frequency }),
        ...(dto.status && { status: dto.status }),
        entryTemplate: JSON.stringify(existingData),
      },
    });

    return updated;
  }

  /**
   * Immediately execute / post a recurring journal entry template.
   */
  async postTemplateNow(tenantId: string, id: string) {
    const rj = await prisma.recurringJournal.findFirst({
      where: { id, tenantId },
    });

    if (!rj) {
      throw new NotFoundException("Recurring journal template not found");
    }

    let templateData: any = {};
    try {
      templateData =
        typeof rj.entryTemplate === "string"
          ? JSON.parse(rj.entryTemplate)
          : rj.entryTemplate;
    } catch {
      templateData = {};
    }

    const lines: JournalLineDto[] = templateData.lines || [];
    const totalAmount = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const entryNumber = `JE-REC-${Date.now().toString().slice(-6)}`;
    const templateName =
      templateData.name || `Recurring Journal ${rj.id.slice(0, 8)}`;

    // Create posted journal header and lines in DB
    const journalHeader = await prisma.journal.create({
      data: {
        tenantId,
        orgId: rj.orgId,
        entryNumber,
        date: new Date(),
        status: "POSTED",
        notes: `Auto-posted from template: ${templateName}`,
        entries: {
          create: lines.map((l) => ({
            tenantId,
            accountId: l.accountId || "acc-gen-001",
            description: l.description || templateName,
            debit: l.debit || 0,
            credit: l.credit || 0,
          })),
        },
      },
      include: { entries: true },
    });

    // Update next run date and last run date
    const nextRun = this.calculateNextRunDate(new Date(), rj.frequency);
    await prisma.recurringJournal.update({
      where: { id: rj.id },
      data: {
        nextRunDate: nextRun,
        lastRunDate: new Date(),
      },
    });

    return {
      success: true,
      journalId: journalHeader.id,
      entryNumber: journalHeader.entryNumber,
      postedAmount: totalAmount,
      postedAt: journalHeader.date.toISOString(),
      nextRunDate: nextRun.toISOString().split("T")[0],
    };
  }

  /**
   * Process all due recurring journal templates for a tenant.
   */
  async processDueRecurringJournals(tenantId: string) {
    const dueJournals = await prisma.recurringJournal.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        nextRunDate: { lte: new Date() },
      },
    });

    const results = [];
    for (const rj of dueJournals) {
      try {
        const posted = await this.postTemplateNow(tenantId, rj.id);
        results.push({
          id: rj.id,
          success: true,
          entryNumber: posted.entryNumber,
        });
      } catch (err: any) {
        results.push({ id: rj.id, success: false, error: err.message });
      }
    }

    return {
      processedCount: dueJournals.length,
      successCount: results.filter((r) => r.success).length,
      results,
    };
  }

  private calculateNextRunDate(fromDate: Date, frequency: string): Date {
    const next = new Date(fromDate.getTime());
    switch (frequency) {
      case "DAILY":
        next.setDate(next.getDate() + 1);
        break;
      case "WEEKLY":
        next.setDate(next.getDate() + 7);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + 1);
        break;
      case "QUARTERLY":
        next.setMonth(next.getMonth() + 3);
        break;
      case "ANNUALLY":
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
    }
    return next;
  }
}
