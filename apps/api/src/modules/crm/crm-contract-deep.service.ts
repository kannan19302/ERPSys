import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const db = prisma as any;

@Injectable()
export class CrmContractDeepService {
  private categories: any[] = [];
  private clauses: any[] = [];

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
    return [];
  }

  async createContract(tenantId = "tenant-1", dto: any = {}) {
    return { id: `cnt-${Date.now()}`, tenantId, ...dto };
  }

  async updateContract(tenantId = "tenant-1", id = "", dto: any = {}) {
    return { id, tenantId, ...dto };
  }

  async deleteContract(tenantId = "tenant-1", id = "") {
    return { id, status: "deleted" };
  }

  async getObligations(tenantId = "tenant-1") {
    return [];
  }
}
