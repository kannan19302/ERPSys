import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { BudgetControlService } from "./budget-control.service";

@Injectable()
export class GlAccountingService {
  private readonly logger = new Logger(GlAccountingService.name);
  constructor(private readonly budgetControlService?: BudgetControlService) {}

  // ── CHART OF ACCOUNTS ──────────────────────────────────

  async getAccounts(tenantId: string) {
    return prisma.account.findMany({
      where: { tenantId },
      orderBy: { code: "asc" },
    });
  }

  async getAccountById(tenantId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
    });
    if (!account) throw new NotFoundException("Account not found");
    return account;
  }

  /**
   * Computes real balances for a set of GL accounts by summing posted
   * journal-line debits/credits, tenant-scoped. GL postings are the source
   * of truth — never rely on a manually-editable cached balance field for
   * anything customer-facing (e.g. cash/bank KPIs).
   */
  async getAccountBalances(
    tenantId: string,
    accountIds: string[],
  ): Promise<Map<string, number>> {
    const balances = new Map<string, number>();
    const uniqueIds = [...new Set(accountIds.filter(Boolean))];
    if (uniqueIds.length === 0) return balances;

    const [entries, accounts] = await Promise.all([
      prisma.journalEntry.groupBy({
        by: ["accountId"],
        where: {
          tenantId,
          accountId: { in: uniqueIds },
          journal: { status: "POSTED" },
        },
        _sum: { debit: true, credit: true },
      }),
      prisma.account.findMany({
        where: { id: { in: uniqueIds }, tenantId },
        select: { id: true, type: true },
      }),
    ]);
    const typeMap = new Map(accounts.map((a) => [a.id, a.type]));

    for (const id of uniqueIds) balances.set(id, 0);
    for (const e of entries) {
      const debit = Number(e._sum.debit || 0);
      const credit = Number(e._sum.credit || 0);
      const type = typeMap.get(e.accountId) ?? "ASSET";
      const balance = ["ASSET", "EXPENSE"].includes(type)
        ? debit - credit
        : credit - debit;
      balances.set(e.accountId, balance);
    }
    return balances;
  }

  async getAccountBalance(
    tenantId: string,
    accountId: string,
  ): Promise<number> {
    const balances = await this.getAccountBalances(tenantId, [accountId]);
    return balances.get(accountId) ?? 0;
  }

  async createAccount(
    tenantId: string,
    orgId: string,
    dto: { code: string; name: string; type: string; parentId?: string },
  ) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    const existing = await prisma.account.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing)
      throw new BadRequestException(`Account code ${dto.code} already exists.`);
    return prisma.account.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId || null,
      },
    });
  }

  async updateAccount(
    tenantId: string,
    accountId: string,
    dto: {
      name?: string;
      type?: string;
      parentId?: string | null;
      isActive?: boolean;
    },
  ) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
    });
    if (!account) throw new NotFoundException("Account not found");

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return prisma.account.update({ where: { id: accountId }, data });
  }

  async deleteAccount(tenantId: string, accountId: string) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
    });
    if (!account) throw new NotFoundException("Account not found");

    // Check for journal entries linked to this account
    const entryCount = await prisma.journalEntry.count({
      where: { accountId, tenantId },
    });
    if (entryCount > 0) {
      throw new BadRequestException(
        `Cannot delete account ${account.code} — it has ${entryCount} journal entries. Deactivate it instead.`,
      );
    }

    // Check for child accounts
    const childCount = await prisma.account.count({
      where: { parentId: accountId, tenantId },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete account ${account.code} — it has ${childCount} child accounts.`,
      );
    }

    await prisma.account.delete({ where: { id: accountId } });
    return { success: true };
  }

  // ── GL LEDGER VIEWER ──────────────────────────────────

  async getAccountLedger(
    tenantId: string,
    orgId: string,
    accountId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
    });
    if (!account) throw new NotFoundException("Account not found");

    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const entries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        accountId,
        journal: {
          orgId: resolvedOrgId,
          status: "POSTED",
          ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
      },
      include: {
        journal: {
          select: {
            id: true,
            entryNumber: true,
            date: true,
            notes: true,
            status: true,
          },
        },
      },
      orderBy: { journal: { date: "desc" } },
      take: 500,
    });

    let runningBalance = 0;
    const ledgerEntries = entries.reverse().map((entry) => {
      const debit = Number(entry.debit);
      const credit = Number(entry.credit);
      const delta = ["ASSET", "EXPENSE"].includes(account.type)
        ? debit - credit
        : credit - debit;
      runningBalance += delta;
      return {
        journalId: entry.journal.id,
        entryNumber: entry.journal.entryNumber,
        date: entry.journal.date,
        description: entry.description,
        debit,
        credit,
        balance: Number(runningBalance.toFixed(2)),
        notes: entry.journal.notes,
      };
    });

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
      },
      entries: ledgerEntries.reverse(),
      totalDebits: entries.reduce((s, e) => s + Number(e.debit), 0),
      totalCredits: entries.reduce((s, e) => s + Number(e.credit), 0),
      closingBalance: runningBalance,
      entryCount: entries.length,
    };
  }

  // ── COST CENTERS ──────────────────────────────────

  async getCostCenters(tenantId: string) {
    return prisma.costCenter.findMany({
      where: { tenantId },
      orderBy: { code: "asc" },
    });
  }

  async createCostCenter(
    tenantId: string,
    orgId: string,
    dto: { code: string; name: string; parentId?: string },
  ) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    const existing = await prisma.costCenter.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing)
      throw new BadRequestException(
        `Cost Center code ${dto.code} already exists.`,
      );
    return prisma.costCenter.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        code: dto.code,
        name: dto.name,
        parentId: dto.parentId || null,
      },
    });
  }

  async updateCostCenter(
    tenantId: string,
    costCenterId: string,
    dto: { name?: string; parentId?: string | null },
  ) {
    const cc = await prisma.costCenter.findFirst({
      where: { id: costCenterId, tenantId },
    });
    if (!cc) throw new NotFoundException("Cost Center not found");
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    return prisma.costCenter.update({ where: { id: costCenterId }, data });
  }

  async deleteCostCenter(tenantId: string, costCenterId: string) {
    const cc = await prisma.costCenter.findFirst({
      where: { id: costCenterId, tenantId },
    });
    if (!cc) throw new NotFoundException("Cost Center not found");
    await prisma.costCenter.delete({ where: { id: costCenterId } });
    return { success: true };
  }

  // ── JOURNAL ENTRIES ──────────────────────────────────

  async getJournals(tenantId: string, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    return prisma.journal.findMany({
      where,
      include: { entries: { include: { account: true } } },
      orderBy: { date: "desc" },
    });
  }

  async getJournalById(tenantId: string, journalId: string) {
    const journal = await prisma.journal.findFirst({
      where: { id: journalId, tenantId },
      include: {
        entries: {
          include: {
            account: {
              select: { id: true, code: true, name: true, type: true },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });
    if (!journal) throw new NotFoundException("Journal entry not found");
    return journal;
  }

  async createJournal(
    tenantId: string,
    orgId: string,
    dto: {
      entryNumber: string;
      notes?: string;
      entries: Array<{
        accountId: string;
        debit: number;
        credit: number;
        description?: string;
        departmentId?: string;
        costCenterId?: string;
        projectId?: string;
      }>;
    },
  ) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    const debits = dto.entries.reduce((sum, e) => sum + e.debit, 0);
    const credits = dto.entries.reduce((sum, e) => sum + e.credit, 0);
    if (Math.abs(debits - credits) > 0.01) {
      throw new BadRequestException(
        "Journal entries do not balance. Total debits must equal total credits.",
      );
    }

    return prisma.$transaction(async (tx) => {
      const journal = await tx.journal.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          entryNumber: dto.entryNumber,
          notes: dto.notes || null,
          status: "DRAFT",
        },
      });

      for (const entry of dto.entries) {
        await tx.journalEntry.create({
          data: {
            tenantId,
            journalId: journal.id,
            accountId: entry.accountId,
            debit: new Prisma.Decimal(entry.debit),
            credit: new Prisma.Decimal(entry.credit),
            description: entry.description || null,
            departmentId: entry.departmentId || null,
            costCenterId: entry.costCenterId || null,
            projectId: entry.projectId || null,
          },
        });
      }

      await this.logAudit(
        tx,
        tenantId,
        "Journal",
        journal.id,
        "CREATE",
        { entries: dto.entries.length },
        "system",
      );
      return tx.journal.findUnique({
        where: { id: journal.id },
        include: { entries: true },
      });
    });
  }

  async submitJournal(tenantId: string, journalId: string) {
    const journal = await prisma.journal.findFirst({
      where: { id: journalId, tenantId },
      include: { entries: true },
    });
    if (!journal) throw new NotFoundException("Journal entry not found");
    if (journal.status !== "DRAFT") {
      throw new BadRequestException(
        "Only DRAFT journals can be submitted for approval.",
      );
    }

    // Budget checking
    if (this.budgetControlService) {
      const config = await this.budgetControlService.getControlConfig(tenantId);
      if (config.checkJournals) {
        for (const entry of journal.entries) {
          const account = await prisma.account.findUnique({
            where: { id: entry.accountId },
          });
          if (
            account &&
            account.type === "EXPENSE" &&
            Number(entry.debit) > 0
          ) {
            await this.budgetControlService.checkBudgetLimit(
              tenantId,
              journal.orgId,
              entry.accountId,
              Number(entry.debit),
              journal.date,
              { costCenterId: entry.costCenterId, projectId: entry.projectId },
            );
          }
        }
      }
    }

    return prisma.journal.update({
      where: { id: journalId },
      data: { status: "SUBMITTED" },
    });
  }

  async approveJournal(
    tenantId: string,
    journalId: string,
    approvedBy: string,
  ) {
    const journal = await prisma.journal.findFirst({
      where: { id: journalId, tenantId },
    });
    if (!journal) throw new NotFoundException("Journal entry not found");
    if (journal.status !== "SUBMITTED" && journal.status !== "DRAFT") {
      throw new BadRequestException(
        "Only DRAFT or SUBMITTED journals can be approved.",
      );
    }
    const updated = await prisma.journal.update({
      where: { id: journalId },
      data: { status: "APPROVED" },
    });
    await this.logAudit(
      prisma,
      tenantId,
      "Journal",
      journalId,
      "APPROVE",
      { approvedBy },
      approvedBy,
    );
    return updated;
  }

  async postJournal(tenantId: string, journalId: string) {
    const journal = await prisma.journal.findFirst({
      where: { id: journalId, tenantId },
      include: { entries: true },
    });
    if (!journal) throw new NotFoundException("Journal entry not found");
    if (journal.status !== "APPROVED" && journal.status !== "DRAFT") {
      throw new BadRequestException(
        "Only APPROVED or DRAFT journals can be posted.",
      );
    }

    // Budget checking
    if (this.budgetControlService) {
      const config = await this.budgetControlService.getControlConfig(tenantId);
      if (config.checkJournals) {
        for (const entry of journal.entries) {
          const account = await prisma.account.findUnique({
            where: { id: entry.accountId },
          });
          if (
            account &&
            account.type === "EXPENSE" &&
            Number(entry.debit) > 0
          ) {
            await this.budgetControlService.checkBudgetLimit(
              tenantId,
              journal.orgId,
              entry.accountId,
              Number(entry.debit),
              journal.date,
              { costCenterId: entry.costCenterId, projectId: entry.projectId },
            );
          }
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      // Update account balances
      for (const entry of journal.entries) {
        const account = await tx.account.findUnique({
          where: { id: entry.accountId },
        });
        if (!account)
          throw new NotFoundException(`Account ${entry.accountId} not found.`);
        let balanceDelta = Number(entry.debit) - Number(entry.credit);
        if (["LIABILITY", "EQUITY", "REVENUE"].includes(account.type)) {
          balanceDelta = Number(entry.credit) - Number(entry.debit);
        }
        await tx.account.update({
          where: { id: entry.accountId },
          data: { balance: { increment: balanceDelta } },
        });
      }

      const updated = await tx.journal.update({
        where: { id: journalId },
        data: { status: "POSTED" },
      });
      await this.applyAccountingBookRules(tx, tenantId, journalId);
      await this.logAudit(
        tx,
        tenantId,
        "Journal",
        journalId,
        "POST",
        { status: "POSTED" },
        "system",
      );
      return updated;
    });
  }

  async rejectJournal(
    tenantId: string,
    journalId: string,
    reason: string,
    rejectedBy: string,
  ) {
    const journal = await prisma.journal.findFirst({
      where: { id: journalId, tenantId },
    });
    if (!journal) throw new NotFoundException("Journal entry not found");
    if (journal.status !== "SUBMITTED") {
      throw new BadRequestException("Only SUBMITTED journals can be rejected.");
    }
    const updated = await prisma.journal.update({
      where: { id: journalId },
      data: {
        status: "DRAFT",
        notes:
          `${journal.notes || ""}\n[REJECTED by ${rejectedBy}]: ${reason}`.trim(),
      },
    });
    await this.logAudit(
      prisma,
      tenantId,
      "Journal",
      journalId,
      "REJECT",
      { reason, rejectedBy },
      rejectedBy,
    );
    return updated;
  }

  async reverseJournal(
    tenantId: string,
    journalId: string,
    reversalDate?: string,
  ) {
    const journal = await prisma.journal.findFirst({
      where: { id: journalId, tenantId },
      include: { entries: true },
    });
    if (!journal) throw new NotFoundException("Journal entry not found");
    if (journal.status !== "POSTED") {
      throw new BadRequestException("Only POSTED journals can be reversed.");
    }

    const date = reversalDate ? new Date(reversalDate) : new Date();
    const reversalEntries = journal.entries.map((entry) => ({
      accountId: entry.accountId,
      debit: Number(entry.credit), // swap debit/credit
      credit: Number(entry.debit),
      description:
        `Reversal of ${journal.entryNumber}: ${entry.description || ""}`.trim(),
      departmentId: entry.departmentId,
      costCenterId: entry.costCenterId,
      projectId: entry.projectId,
    }));

    return prisma.$transaction(async (tx) => {
      // Create the reversing journal
      const reversal = await tx.journal.create({
        data: {
          tenantId,
          orgId: journal.orgId,
          entryNumber: `REV-${journal.entryNumber}`,
          date,
          notes: `Reversal of journal ${journal.entryNumber}`,
          status: "POSTED",
        },
      });

      for (const entry of reversalEntries) {
        await tx.journalEntry.create({
          data: {
            tenantId,
            journalId: reversal.id,
            accountId: entry.accountId,
            debit: new Prisma.Decimal(entry.debit),
            credit: new Prisma.Decimal(entry.credit),
            description: entry.description,
            departmentId: entry.departmentId,
            costCenterId: entry.costCenterId,
            projectId: entry.projectId,
          },
        });

        // Reverse the account balance impact
        const account = await tx.account.findUnique({
          where: { id: entry.accountId },
        });
        if (account) {
          let balanceDelta = entry.debit - entry.credit;
          if (["LIABILITY", "EQUITY", "REVENUE"].includes(account.type)) {
            balanceDelta = entry.credit - entry.debit;
          }
          await tx.account.update({
            where: { id: entry.accountId },
            data: { balance: { increment: balanceDelta } },
          });
        }
      }

      // Mark original as reversed
      await tx.journal.update({
        where: { id: journalId },
        data: {
          status: "REVERSED",
          notes:
            `${journal.notes || ""}\n[REVERSED by ${reversal.entryNumber}]`.trim(),
        },
      });

      await this.logAudit(
        tx,
        tenantId,
        "Journal",
        journalId,
        "REVERSE",
        { reversalJournalId: reversal.id },
        "system",
      );
      return tx.journal.findFirst({
        where: { id: reversal.id },
        include: { entries: true },
      });
    });
  }

  // ── HELPERS ──────────────────────────────────

  async resolveOrgId(tenantId: string, orgId: string): Promise<string> {
    if (orgId && orgId !== "org-system-default") return orgId;
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    if (!org) throw new BadRequestException("No Organization found.");
    return org.id;
  }

  async logAudit(
    txOrPrisma: unknown,
    tenantId: string,
    entityType: string,
    entityId: string,
    action: string,
    changes: Record<string, unknown>,
    userId: string,
  ) {
    try {
      await (
        txOrPrisma as {
          financeAuditLog: { create: (args: unknown) => Promise<unknown> };
        }
      ).financeAuditLog.create({
        data: { tenantId, entityType, entityId, action, changes, userId },
      });
    } catch {
      /* silent — audit log should not break business operations */
    }
  }

  // ── MULTI-BOOK ACCOUNTING ──────────────────────────────────────

  async getAccountingBooks(tenantId: string) {
    return prisma.accountingBook.findMany({
      where: { tenantId },
      include: { organization: { select: { id: true, name: true } } },
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
    });
  }

  async createAccountingBook(
    tenantId: string,
    orgId: string,
    dto: {
      name: string;
      standard: string;
      isPrimary?: boolean;
    },
  ) {
    const org = await prisma.organization.findFirst({
      where: { id: orgId, tenantId },
    });
    if (!org) throw new NotFoundException("Organization not found");

    const valid = ["LOCAL_GAAP", "IFRS", "TAX", "MANAGEMENT"];
    const standard = (dto.standard || "LOCAL_GAAP").toUpperCase();
    if (!valid.includes(standard))
      throw new BadRequestException(
        `Standard must be one of: ${valid.join(", ")}`,
      );

    // If setting as primary, demote existing primary
    if (dto.isPrimary) {
      await prisma.accountingBook.updateMany({
        where: { tenantId, orgId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return prisma.accountingBook.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        standard,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async postJournalToBook(
    tenantId: string,
    orgId: string,
    bookId: string,
    dto: {
      entryNumber: string;
      date: string;
      entries: Array<{
        accountId: string;
        debit: number;
        credit: number;
        description?: string;
      }>;
      notes?: string;
    },
  ) {
    const book = await prisma.accountingBook.findFirst({
      where: { id: bookId, tenantId, isActive: true },
    });
    if (!book) throw new NotFoundException("Accounting book not found");

    const totalDebit = dto.entries.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = dto.entries.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        "Journal is not balanced (debits ≠ credits)",
      );
    }

    return prisma.$transaction(async (tx) => {
      const journal = await tx.journal.create({
        data: {
          tenantId,
          orgId,
          bookId,
          entryNumber: dto.entryNumber,
          date: new Date(dto.date),
          status: "DRAFT",
          notes: dto.notes,
        },
      });

      await tx.journalEntry.createMany({
        data: dto.entries.map((l) => ({
          tenantId,
          journalId: journal.id,
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          description: l.description || "",
        })),
      });

      return tx.journal.findFirst({
        where: { id: journal.id },
        include: { entries: true },
      });
    });
  }

  async getBookTrialBalance(tenantId: string, bookId: string, asOf?: string) {
    const book = await prisma.accountingBook.findFirst({
      where: { id: bookId, tenantId },
    });
    if (!book) throw new NotFoundException("Accounting book not found");

    const dateFilter = asOf ? { lte: new Date(asOf) } : undefined;

    const journals = await prisma.journal.findMany({
      where: {
        tenantId,
        bookId,
        status: "POSTED",
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: {
        entries: {
          include: {
            account: {
              select: { id: true, code: true, name: true, type: true },
            },
          },
        },
      },
    });

    const balances: Record<
      string,
      {
        accountId: string;
        code: string;
        name: string;
        type: string;
        debit: number;
        credit: number;
        balance: number;
      }
    > = {};

    for (const j of journals) {
      for (const e of j.entries) {
        const key = e.accountId;
        if (!balances[key]) {
          balances[key] = {
            accountId: e.accountId,
            code: e.account.code,
            name: e.account.name,
            type: e.account.type,
            debit: 0,
            credit: 0,
            balance: 0,
          };
        }
        balances[key].debit += Number(e.debit);
        balances[key].credit += Number(e.credit);
        balances[key].balance = balances[key].debit - balances[key].credit;
      }
    }

    const rows = Object.values(balances).sort((a, b) =>
      a.code.localeCompare(b.code),
    );
    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return {
      book: { id: book.id, name: book.name, standard: book.standard },
      asOf: asOf || "current",
      rows,
      totalDebit,
      totalCredit,
    };
  }

  async crossBookVarianceReport(
    tenantId: string,
    bookId1: string,
    bookId2: string,
    asOf?: string,
  ) {
    const [tb1, tb2] = await Promise.all([
      this.getBookTrialBalance(tenantId, bookId1, asOf),
      this.getBookTrialBalance(tenantId, bookId2, asOf),
    ]);

    const map1 = Object.fromEntries(tb1.rows.map((r) => [r.accountId, r]));
    const map2 = Object.fromEntries(tb2.rows.map((r) => [r.accountId, r]));
    const allIds = new Set([...Object.keys(map1), ...Object.keys(map2)]);

    const variances = Array.from(allIds)
      .map((id) => {
        const r1 = map1[id];
        const r2 = map2[id];
        const code = r1?.code ?? r2?.code ?? "";
        const name = r1?.name ?? r2?.name ?? "";
        return {
          accountId: id,
          code,
          name,
          book1Balance: r1?.balance ?? 0,
          book2Balance: r2?.balance ?? 0,
          variance: (r2?.balance ?? 0) - (r1?.balance ?? 0),
        };
      })
      .filter((v) => Math.abs(v.variance) > 0.01)
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

    return {
      book1: { id: bookId1, name: tb1.book.name, standard: tb1.book.standard },
      book2: { id: bookId2, name: tb2.book.name, standard: tb2.book.standard },
      asOf: asOf || "current",
      variances,
      totalVariance: variances.reduce((s, v) => s + Math.abs(v.variance), 0),
    };
  }

  // ── RECURRING JOURNALS ──────────────────────────────────────

  async getRecurringSchedules(tenantId: string) {
    return prisma.recurringJournal.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createRecurringSchedule(
    tenantId: string,
    orgId: string,
    dto: { entryTemplate: any; frequency: string; nextRunDate: string },
  ) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.recurringJournal.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        entryTemplate: dto.entryTemplate,
        frequency: dto.frequency,
        nextRunDate: new Date(dto.nextRunDate),
        status: "ACTIVE",
      },
    });
  }

  async generateRecurringInvoices(tenantId: string) {
    const recurringJournals = await prisma.recurringJournal.findMany({
      where: { tenantId, status: "ACTIVE", nextRunDate: { lte: new Date() } },
    });
    const results: Array<{ id: string; status: string }> = [];
    for (const rj of recurringJournals) {
      try {
        const template = rj.entryTemplate as {
          customerId?: string;
          lineItems?: Array<{
            description: string;
            quantity: number;
            unitPrice: number;
            taxRate: number;
          }>;
          notes?: string;
        };
        if (template?.customerId && template?.lineItems) {
          const invoiceNumber = `RECUR-${rj.id.slice(0, 6)}-${Date.now()}`;
          const invoice = await prisma.invoice.create({
            data: {
              tenantId,
              orgId: rj.orgId,
              customerId: template.customerId,
              invoiceNumber,
              dueDate: new Date(Date.now() + 30 * 86400000),
              status: "DRAFT",
              createdBy: "system",
              subtotal: 0,
              taxAmount: 0,
              totalAmount: 0,
              paidAmount: 0,
              currency: "USD",
              exchangeRate: 1,
              notes:
                template.notes ||
                `Auto-generated from recurring journal ${rj.id}`,
            },
          });
          results.push({ id: invoice.id, status: "CREATED" });
        }
        const nextRun = new Date(rj.nextRunDate);
        if (rj.frequency === "MONTHLY")
          nextRun.setMonth(nextRun.getMonth() + 1);
        else if (rj.frequency === "WEEKLY")
          nextRun.setDate(nextRun.getDate() + 7);
        else if (rj.frequency === "DAILY")
          nextRun.setDate(nextRun.getDate() + 1);
        await prisma.recurringJournal.update({
          where: { id: rj.id },
          data: { nextRunDate: nextRun, lastRunDate: new Date() },
        });
      } catch (err) {
        results.push({
          id: rj.id,
          status: `ERROR: ${err instanceof Error ? err.message : "Unknown"}`,
        });
      }
    }
    return { processed: recurringJournals.length, results };
  }

  // ── MAPPED JOURNAL POSTING & MAPPING RULES ───────────────────────

  async applyAccountingBookRules(tx: any, tenantId: string, journalId: string) {
    const journal = await tx.journal.findFirst({
      where: { id: journalId, tenantId },
      include: { entries: true },
    });
    if (!journal) return;

    // Determine the source book ID
    let sourceBookId = journal.bookId;
    if (!sourceBookId) {
      const primaryBook = await tx.accountingBook.findFirst({
        where: { tenantId, orgId: journal.orgId, isPrimary: true },
      });
      if (!primaryBook) return;
      sourceBookId = primaryBook.id;
    }

    // Fetch active mapping rules for this source book
    const rules = await tx.accountingBookRule.findMany({
      where: { tenantId, sourceBookId, isActive: true },
    });
    if (rules.length === 0) return;

    // Group rules by destinationBookId
    const rulesByDest: Record<string, typeof rules> = {};
    for (const rule of rules) {
      if (!rulesByDest[rule.destinationBookId]) {
        rulesByDest[rule.destinationBookId] = [];
      }
      rulesByDest[rule.destinationBookId].push(rule);
    }

    // For each destination book, translate and post
    for (const [destBookId, destRules] of Object.entries(rulesByDest)) {
      const mappedEntries: any[] = [];

      for (const entry of journal.entries) {
        // Find matching rule for this account
        const matchingRule =
          destRules.find((r: any) => r.sourceAccountId === entry.accountId) ||
          destRules.find((r: any) => !r.sourceAccountId); // fallback rule with no specific account mapping

        if (!matchingRule) {
          // If no matching rule exists, default to posting directly to the same account
          mappedEntries.push({
            tenantId,
            accountId: entry.accountId,
            debit: entry.debit,
            credit: entry.credit,
            description: entry.description || "",
          });
          continue;
        }

        if (matchingRule.ruleType === "EXCLUDE_ACCOUNT") {
          // Skip this entry
          continue;
        }

        let targetAccountId = entry.accountId;
        if (
          matchingRule.ruleType === "MAP_ACCOUNT" &&
          matchingRule.destinationAccountId
        ) {
          targetAccountId = matchingRule.destinationAccountId;
        }

        let multiplier = Number(matchingRule.multiplier) || 1.0;
        let debit = Number(entry.debit) * multiplier;
        let credit = Number(entry.credit) * multiplier;

        mappedEntries.push({
          tenantId,
          accountId: targetAccountId,
          debit: new Prisma.Decimal(debit),
          credit: new Prisma.Decimal(credit),
          description:
            `${entry.description || ""} (Auto-mapped via Rule ${matchingRule.id})`.trim(),
        });
      }

      if (mappedEntries.length === 0) continue;

      // Verify mapped journal is balanced
      const totalDebit = mappedEntries.reduce((s, e) => s + Number(e.debit), 0);
      const totalCredit = mappedEntries.reduce(
        (s, e) => s + Number(e.credit),
        0,
      );
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        this.logger.warn(
          `Parallel journal for book ${destBookId} is unbalanced: ${totalDebit} vs ${totalCredit}. Skipping.`,
        );
        continue;
      }

      // Create the mapped journal
      const mappedJournal = await tx.journal.create({
        data: {
          tenantId,
          orgId: journal.orgId,
          bookId: destBookId,
          sourceJournalId: journal.id,
          entryNumber: `${journal.entryNumber}-M-${destBookId.slice(-4)}`,
          date: journal.date,
          status: "POSTED", // Auto-post the mapped entries
          notes: `Auto-posted from Journal ${journal.entryNumber} via Mapping Rules.`,
          entries: {
            create: mappedEntries,
          },
        },
      });

      await this.logAudit(
        tx,
        tenantId,
        "Journal",
        mappedJournal.id,
        "AUTO_POST",
        { sourceJournalId: journal.id },
        "system",
      );
    }
  }

  async getAccountingBookRules(tenantId: string) {
    return prisma.accountingBookRule.findMany({
      where: { tenantId },
      include: {
        sourceBook: { select: { id: true, name: true, standard: true } },
        destinationBook: { select: { id: true, name: true, standard: true } },
        sourceAccount: { select: { id: true, name: true, code: true } },
        destinationAccount: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAccountingBookRule(
    tenantId: string,
    orgId: string,
    dto: {
      sourceBookId: string;
      destinationBookId: string;
      sourceAccountId?: string | null;
      destinationAccountId?: string | null;
      ruleType: string;
      multiplier?: number | null;
    },
  ) {
    const resolvedOrgId = await this.resolveOrgId(tenantId, orgId);
    return prisma.accountingBookRule.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        sourceBookId: dto.sourceBookId,
        destinationBookId: dto.destinationBookId,
        sourceAccountId: dto.sourceAccountId || null,
        destinationAccountId: dto.destinationAccountId || null,
        ruleType: dto.ruleType,
        multiplier:
          dto.multiplier !== null && dto.multiplier !== undefined
            ? dto.multiplier
            : 1.0,
        isActive: true,
      },
    });
  }

  async deleteAccountingBookRule(tenantId: string, id: string) {
    const rule = await prisma.accountingBookRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Accounting book rule not found");

    return prisma.accountingBookRule.delete({
      where: { id },
    });
  }

  // ── AUDIT LOGS ──────────────────────────────────────

  async getFinanceAuditLogs(
    tenantId: string,
    entityType?: string,
    entityId?: string,
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return prisma.financeAuditLog.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
