import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const db = prisma as any;

@Injectable()
export class CrmContractDeepService {
  private categories: any[] = [];
  private clauses: any[] = [];
  // In-memory, like the rest of this service: nothing survives a restart and
  // RLS does not protect it, so the tenant filter is the only isolation here.
  private contracts: any[] = [];
  private obligations: any[] = [];
  private reminders: any[] = [];

  async createCategory(tenantId = "tenant-1", dto: any = {}) {
    const cat = { id: `cat-${Date.now()}-${Math.random()}`, tenantId, ...dto };
    this.categories.push(cat);
    return cat;
  }

  async getContractTemplateCategories(tenantId = "tenant-1") {
    return this.categories.filter((c) => c.tenantId === tenantId);
  }

  async updateCategory(tenantId = "tenant-1", id = "", dto: any = {}) {
    const cat = this.categories.find(
      (c) => c.id === id && c.tenantId === tenantId,
    );
    if (!cat) throw new NotFoundException("Category not found");
    Object.assign(cat, dto);
    return cat;
  }

  async deleteCategory(tenantId = "tenant-1", id = "") {
    this.categories = this.categories.filter(
      (c) => !(c.id === id && c.tenantId === tenantId),
    );
    return { status: "deleted" };
  }

  async createClause(tenantId = "tenant-1", dto: any = {}) {
    const clause = {
      id: `cl-${Date.now()}-${Math.random()}`,
      tenantId,
      ...dto,
    };
    this.clauses.push(clause);
    return clause;
  }

  async getContractClauseLibrary(tenantId = "tenant-1", category?: string) {
    return this.clauses.filter(
      (c) => c.tenantId === tenantId && (!category || c.category === category),
    );
  }

  async getContractTemplates(tenantId = "tenant-1") {
    return [];
  }

  async getContractExpiryCalendar(tenantId = "tenant-1", range?: string) {
    return [];
  }

  async getContractDashboard(tenantId = "tenant-1") {
    return {
      total: 0,
      active: 0,
      expiringSoon: 0,
    };
  }

  async getContractValueAtRisk(tenantId = "tenant-1") {
    return {
      count: 0,
      totalAtRisk: 0,
    };
  }

  async getContracts(tenantId = "tenant-1") {
    return this.contracts.filter((c) => c.tenantId === tenantId);
  }

  async createContract(tenantId = "tenant-1", dto: any = {}) {
    const contract = {
      id: `cnt-${Date.now()}-${this.contracts.length}`,
      tenantId,
      ...dto,
    };
    this.contracts.push(contract);
    return contract;
  }

  async updateContract(tenantId = "tenant-1", id = "", dto: any = {}) {
    const contract = this.contracts.find(
      (c) => c.id === id && c.tenantId === tenantId,
    );
    if (!contract) throw new NotFoundException("Contract not found");
    Object.assign(contract, dto);
    return contract;
  }

  async deleteContract(tenantId = "tenant-1", id = "") {
    this.contracts = this.contracts.filter(
      (c) => !(c.id === id && c.tenantId === tenantId),
    );
    return { id, status: "deleted" };
  }

  /** Case-insensitive match on the fields a user would search by. */
  async searchContracts(tenantId = "tenant-1", query = "") {
    const q = query.trim().toLowerCase();
    const scoped = this.contracts.filter((c) => c.tenantId === tenantId);
    if (!q) return scoped;
    return scoped.filter((c) =>
      [c.name, c.title, c.counterparty, c.reference]
        .filter(Boolean)
        .some((field: string) => String(field).toLowerCase().includes(q)),
    );
  }

  /**
   * Obligations recorded against one contract. Returns an empty list for a
   * contract that has none rather than throwing — "no obligations" is a valid
   * answer, and the caller is asking about the contract, not asserting it exists.
   */
  async getContractObligations(tenantId = "tenant-1", contractId = "") {
    return this.obligations.filter(
      (o) => o.tenantId === tenantId && o.contractId === contractId,
    );
  }

  /**
   * Queue a renewal reminder. Unlike the read above this DOES require the
   * contract to exist: scheduling a reminder against nothing would silently
   * create a notification nobody can action.
   */
  async autoGenerateContractReminder(tenantId = "tenant-1", contractId = "") {
    const contract = this.contracts.find(
      (c) => c.id === contractId && c.tenantId === tenantId,
    );
    if (!contract) throw new NotFoundException("Contract not found");

    const reminder = {
      id: `rem-${Date.now()}-${this.reminders.length}`,
      tenantId,
      contractId,
      dueAt: contract.endDate ?? null,
      status: "PENDING",
      createdAt: new Date(),
    };
    this.reminders.push(reminder);
    return reminder;
  }

  async getObligations(tenantId = "tenant-1") {
    return [];
  }
}
