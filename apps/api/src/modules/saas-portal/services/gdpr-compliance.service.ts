import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import * as fs from 'fs';
import * as path from 'path';

interface PiiModelEntry {
  treatment: 'erase' | 'anonymize' | 'retain-legal-hold';
  rationale: string;
  reviewed: string;
}

interface PiiRegistry {
  comment: string;
  models: Record<string, PiiModelEntry>;
}

export interface ErasureResult {
  entityType: string;
  treatment: string;
  count: number;
}

/**
 * GDPR + platform-compliance home for the SaaS Portal. Consolidates
 * `/admin/gdpr` (retention policies, erasure requests, right-of-access
 * export) and `/saas/compliance` (report/certification/DPA status) into one
 * saas-portal surface. Independent implementation against the same
 * `DataRetentionPolicy`/`DataErasureRequest`/`AuditLog` Prisma models — see
 * `org-hierarchy.service.ts` for why this isn't a cross-module delegate.
 */
@Injectable()
export class SaasPortalGdprComplianceService {
  private readonly logger = new Logger(SaasPortalGdprComplianceService.name);
  private piiRegistry: PiiRegistry | null = null;

  private readonly prismaModelMap: Record<string, string> = {
    User: 'user',
    Organization: 'organization',
    Employee: 'employee',
    Customer: 'customer',
    Vendor: 'vendor',
    Contact: 'contact',
    Lead: 'lead',
    POSLoyaltyMember: 'poSLoyaltyMember',
    Applicant: 'applicant',
    CustomerPortalUser: 'customerPortalUser',
    VendorPortalUser: 'vendorPortalUser',
  };

  private readonly piiAnonymizeFields: Record<string, string[]> = {
    User: ['email', 'firstName', 'lastName', 'avatar'],
    Organization: ['name', 'legalName', 'email', 'phone'],
    Customer: ['name', 'email', 'phone'],
    Vendor: ['name', 'email', 'phone'],
  };

  private readonly aliasMap: Record<string, string> = {
    customers: 'Customer',
    vendors: 'Vendor',
    contacts: 'Contact',
    leads: 'Lead',
    employees: 'Employee',
    users: 'User',
    organizations: 'Organization',
    posloyaltymembers: 'POSLoyaltyMember',
    applicants: 'Applicant',
    customerportalusers: 'CustomerPortalUser',
    vendorportalusers: 'VendorPortalUser',
  };

  /* ── PII Registry Loader ──────────────────────────────── */

  loadPiiRegistry(): PiiRegistry {
    if (this.piiRegistry) return this.piiRegistry;
    const registryPath = process.env.PII_REGISTRY_PATH || path.resolve(process.cwd(), 'scripts', 'pii-registry.json');
    const raw = fs.readFileSync(registryPath, 'utf-8');
    this.piiRegistry = JSON.parse(raw) as PiiRegistry;
    return this.piiRegistry;
  }

  private resolveModelName(entityType: string): string | null {
    const lower = entityType.toLowerCase();
    if (this.aliasMap[lower]) return this.aliasMap[lower];
    if (this.prismaModelMap[entityType]) return entityType;
    return null;
  }

  private async eraseRecords(modelName: string, tenantId: string, email: string): Promise<number> {
    const prismaKey = this.prismaModelMap[modelName];
    if (!prismaKey) return 0;
    const model = (prisma as unknown as Record<string, unknown>)[prismaKey] as {
      deleteMany?: (args: { where: { tenantId: string; email: string } }) => Promise<{ count: number }>;
    };
    if (!model?.deleteMany) return 0;
    const { count } = await model.deleteMany({ where: { tenantId, email } });
    return count;
  }

  private async anonymizeRecords(modelName: string, tenantId: string, email: string): Promise<number> {
    const prismaKey = this.prismaModelMap[modelName];
    if (!prismaKey) return 0;
    const model = (prisma as unknown as Record<string, unknown>)[prismaKey] as {
      findMany?: (args: { where: { tenantId: string; email: string }; select: { id: true } }) => Promise<{ id: string }[]>;
      update?: (args: { where: { id: string }; data: Record<string, string> }) => Promise<unknown>;
    };
    if (!model?.findMany) return 0;

    const records = await model.findMany({ where: { tenantId, email }, select: { id: true } });
    if (records.length === 0) return 0;

    const fields = this.piiAnonymizeFields[modelName] || [];
    if (fields.length === 0) return 0;

    for (const record of records) {
      const updateData: Record<string, string> = {};
      for (const field of fields) {
        updateData[field] = field === 'email' ? `[redacted-${record.id}]@erased.local` : '[redacted]';
      }
      await model.update!({ where: { id: record.id }, data: updateData });
    }
    return records.length;
  }

  /* ── Retention Policies ─────────────────────────────── */

  async getRetentionPolicies(tenantId: string) {
    return prisma.dataRetentionPolicy.findMany({ where: { tenantId }, orderBy: { entityType: 'asc' } });
  }

  async upsertRetentionPolicy(
    tenantId: string,
    data: { entityType: string; retentionDays: number; action: string; isActive: boolean },
  ) {
    return prisma.dataRetentionPolicy.upsert({
      where: { tenantId_entityType: { tenantId, entityType: data.entityType } },
      update: { retentionDays: data.retentionDays, action: data.action, isActive: data.isActive },
      create: { tenantId, entityType: data.entityType, retentionDays: data.retentionDays, action: data.action, isActive: data.isActive },
    });
  }

  /* ── Erasure Requests ───────────────────────────────── */

  async getErasureRequests(tenantId: string) {
    return prisma.dataErasureRequest.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createErasureRequest(tenantId: string, requestedBy: string, data: { subjectEmail: string; subjectName?: string; entityTypes: string[] }) {
    return prisma.dataErasureRequest.create({
      data: { tenantId, requestedBy, subjectEmail: data.subjectEmail, subjectName: data.subjectName, entityTypes: data.entityTypes, status: 'PENDING' },
    });
  }

  async executeErasure(tenantId: string, requestId: string) {
    const request = await prisma.dataErasureRequest.findFirst({ where: { id: requestId, tenantId } });
    if (!request) throw new NotFoundException('Erasure request not found');
    if (request.status === 'COMPLETED') throw new BadRequestException('Already executed');

    const entityTypes = (request.entityTypes as string[]) || [];
    const email = request.subjectEmail;
    const registry = this.loadPiiRegistry();
    const results: ErasureResult[] = [];

    for (const et of entityTypes) {
      const modelName = this.resolveModelName(et);
      if (!modelName) {
        this.logger.warn(`Unrecognized entity type "${et}"; skipping`);
        continue;
      }
      const entry = registry.models[modelName];
      if (!entry) {
        this.logger.warn(`No PII registry entry for model "${modelName}"; skipping`);
        continue;
      }
      switch (entry.treatment) {
        case 'erase': {
          const count = await this.eraseRecords(modelName, tenantId, email);
          results.push({ entityType: modelName, treatment: 'erased', count });
          break;
        }
        case 'anonymize': {
          const count = await this.anonymizeRecords(modelName, tenantId, email);
          results.push({ entityType: modelName, treatment: 'anonymized', count });
          break;
        }
        case 'retain-legal-hold': {
          this.logger.log(`SKIP "${modelName}": retain-legal-hold (${entry.rationale})`);
          results.push({ entityType: modelName, treatment: 'retained-legal-hold', count: 0 });
          break;
        }
      }
    }

    await prisma.dataErasureRequest.update({ where: { id: requestId }, data: { status: 'COMPLETED', erasedAt: new Date() } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: request.requestedBy,
        action: 'GDPR_ERASURE',
        entityType: 'GDPR',
        entityId: requestId,
        changes: { email, results, executedAt: new Date().toISOString() } as never,
      },
    });

    return { results };
  }

  /* ── Data Export (Right of Access) ──────────────────── */

  async exportSubjectData(tenantId: string, email: string) {
    const [customers, contacts, leads, employees, vendors] = await Promise.all([
      prisma.customer.findMany({ where: { tenantId, email } }),
      prisma.contact.findMany({ where: { tenantId, email } }),
      prisma.lead.findMany({ where: { tenantId, email } }),
      prisma.employee.findMany({ where: { tenantId, email } }),
      prisma.vendor.findMany({ where: { tenantId, email } }),
    ]);
    return { customers, contacts, leads, employees, vendors };
  }

  /* ── Platform Compliance (reports / certifications / DPA / audit trail) ── */
  /* Mirrors the stateless/stubbed shape of the legacy saas/compliance.controller.ts
     reports & certifications — no dedicated Prisma models exist for these yet.
     Real audit-trail data is backed by AuditLog (via this service's own methods). */

  listComplianceReports() {
    return [
      { id: '1', type: 'soc2', status: 'compliant', generatedAt: '2024-01-15', expiresAt: '2025-01-15' },
      { id: '2', type: 'gdpr', status: 'compliant', generatedAt: '2024-02-01', expiresAt: '2025-02-01' },
    ];
  }

  generateComplianceReport(type: string) {
    return { success: true, type, status: 'generating', estimatedCompletion: new Date(Date.now() + 60000) };
  }

  getComplianceReport(id: string) {
    return { id, type: 'soc2', status: 'compliant', findings: [], generatedAt: '2024-01-15' };
  }

  listCertifications() {
    return [
      { standard: 'SOC 2 Type II', status: 'certified', certifiedAt: '2024-01-01', expiresAt: '2025-01-01' },
      { standard: 'GDPR', status: 'compliant', certifiedAt: '2024-02-01', expiresAt: null },
      { standard: 'HIPAA', status: 'in_progress', certifiedAt: null, expiresAt: null },
    ];
  }

  requestCertification(standard: string) {
    return { success: true, standard, status: 'requested', requestedAt: new Date() };
  }

  getDataProcessingAgreement() {
    return { signed: false, version: '2.1', content: 'Data Processing Agreement content...', signedAt: null, signedBy: null };
  }

  signDataProcessingAgreement(acceptedBy: string) {
    return { success: true, signedAt: new Date(), signedBy: acceptedBy };
  }

  getHipaaStatus() {
    return { compliant: true, lastAssessment: '2024-03-01', nextAssessment: '2024-09-01', controls: 120, passed: 118 };
  }

  async getGdprStatus(tenantId: string) {
    const [dataExports, erasureRequests] = await Promise.all([
      prisma.dataErasureRequest.count({ where: { tenantId } }).catch(() => 0),
      prisma.dataErasureRequest.count({ where: { tenantId, status: 'PENDING' } }).catch(() => 0),
    ]);
    return { compliant: true, dpaSigned: false, dataExports, erasureRequests, dataProcessor: 'AWS (Frankfurt)' };
  }

  listComplianceStandards() {
    return [
      { id: 'soc2', name: 'SOC 2 Type II', status: 'certified' },
      { id: 'hipaa', name: 'HIPAA', status: 'in_progress' },
      { id: 'gdpr', name: 'GDPR', status: 'compliant' },
      { id: 'iso27001', name: 'ISO 27001', status: 'not_started' },
      { id: 'pci', name: 'PCI DSS', status: 'not_applicable' },
    ];
  }

  runComplianceScan() {
    return { success: true, status: 'scanning', findings: [], startedAt: new Date() };
  }
}
