import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import {
  CreateCrmDocumentInput,
  CreateCustomFieldInput, UpdateCustomFieldInput, CreateRecordTypeInput, UpdateRecordTypeInput,
  CreateApprovalProcessInput, UpdateApprovalProcessInput,
  CreateQuotationTemplateInput, UpdateQuotationTemplateInput,
} from '@unerp/shared';
import * as crypto from 'crypto';
import { resolveOrgId } from './crm-shared';
import { CrmLeadsService } from './crm-leads.service';

/**
 * CRM configuration & governance: custom fields, record types, approval
 * processes, CPQ (quotation templates, versions, e-signature), document
 * attachments, and bulk import/export. Lead imports rescore the new lead.
 */
@Injectable()
export class CrmConfigService {
  constructor(
    @Inject(CrmLeadsService)
    private readonly leadsService: CrmLeadsService,
  ) {}

  // ── DOCUMENTS ─────────────────────────────────

  async getCrmDocuments(tenantId: string, entityType?: string, entityId?: string) {
    const where: Prisma.CrmDocumentWhereInput = { tenantId, deletedAt: null };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return prisma.crmDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createCrmDocument(tenantId: string, orgId: string, dto: CreateCrmDocumentInput, uploadedBy: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.crmDocument.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name, type: dto.type,
        fileUrl: dto.fileUrl, fileSize: dto.fileSize || null, mimeType: dto.mimeType || null,
        entityType: dto.entityType!, entityId: dto.entityId!, uploadedBy,
      },
    });
  }

  async deleteCrmDocument(tenantId: string, id: string) {
    const doc = await prisma.crmDocument.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('Document not found');
    return prisma.crmDocument.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── IMPORT / EXPORT ───────────────────────────

  async importContacts(tenantId: string, orgId: string, rows: Array<Record<string, string>>) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    let success = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const r = rows[i];
        if (!r) continue;
        if (!r.firstName || !r.lastName) { failed++; errors.push({ row: i + 1, error: 'Missing firstName or lastName' }); continue; }
        await prisma.contact.create({
          data: {
            tenantId, orgId: resolvedOrgId,
            firstName: r.firstName, lastName: r.lastName,
            email: r.email || null, phone: r.phone || null, mobile: r.mobile || null,
            title: r.title || null, department: r.department || null,
          },
        });
        success++;
      } catch {
        failed++;
        errors.push({ row: i + 1, error: 'Database error' });
      }
    }
    return { success, failed, errors };
  }

  async exportContacts(tenantId: string) {
    const contacts = await prisma.contact.findMany({
      where: { tenantId, deletedAt: null },
      select: { firstName: true, lastName: true, email: true, phone: true, mobile: true, title: true, department: true, isPrimary: true },
      orderBy: { firstName: 'asc' },
    });
    const headers = ['firstName', 'lastName', 'email', 'phone', 'mobile', 'title', 'department', 'isPrimary'];
    const csvRows = [headers.join(',')];
    for (const c of contacts) {
      csvRows.push(headers.map((h) => `"${String((c as Record<string, unknown>)[h] || '').replace(/"/g, '""')}"`).join(','));
    }
    return csvRows.join('\n');
  }

  async importLeads(tenantId: string, orgId: string, rows: Array<Record<string, string>>) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    let success = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const r = rows[i];
        if (!r) continue;
        if (!r.firstName || !r.lastName) { failed++; errors.push({ row: i + 1, error: 'Missing firstName or lastName' }); continue; }
        const lead = await prisma.lead.create({
          data: {
            tenantId, orgId: resolvedOrgId,
            firstName: r.firstName, lastName: r.lastName,
            email: r.email || null, phone: r.phone || null,
            company: r.company || null, industry: r.industry || null,
          },
        });
        await this.leadsService.recalculateLeadScore(tenantId, lead.id);
        success++;
      } catch {
        failed++;
        errors.push({ row: i + 1, error: 'Database error' });
      }
    }
    return { success, failed, errors };
  }

  async exportLeads(tenantId: string) {
    const leads = await prisma.lead.findMany({
      where: { tenantId, deletedAt: null },
      select: { firstName: true, lastName: true, email: true, phone: true, company: true, status: true, score: true, industry: true },
      orderBy: { createdAt: 'desc' },
    });
    const headers = ['firstName', 'lastName', 'email', 'phone', 'company', 'status', 'score', 'industry'];
    const csvRows = [headers.join(',')];
    for (const l of leads) {
      csvRows.push(headers.map((h) => `"${String((l as Record<string, unknown>)[h] || '').replace(/"/g, '""')}"`).join(','));
    }
    return csvRows.join('\n');
  }

  // ── CUSTOM FIELDS ─────────────────────────────

  async getCustomFields(tenantId: string, entity?: string) {
    return prisma.crmCustomField.findMany({
      where: { tenantId, ...(entity && { entity }), deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCustomField(tenantId: string, orgId: string, dto: CreateCustomFieldInput, createdBy: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.crmCustomField.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        entity: dto.entity, fieldName: dto.fieldName, label: dto.label,
        fieldType: dto.fieldType, options: dto.options as Prisma.InputJsonValue,
        isRequired: dto.isRequired || false, sortOrder: dto.sortOrder || 0,
        defaultValue: dto.defaultValue || null, createdBy,
      },
    });
  }

  async updateCustomField(tenantId: string, id: string, dto: UpdateCustomFieldInput) {
    const existing = await prisma.crmCustomField.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Custom field not found');
    return prisma.crmCustomField.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.fieldType !== undefined && { fieldType: dto.fieldType }),
        ...(dto.options !== undefined && { options: dto.options as Prisma.InputJsonValue }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.defaultValue !== undefined && { defaultValue: dto.defaultValue }),
      },
    });
  }

  async deleteCustomField(tenantId: string, id: string) {
    const existing = await prisma.crmCustomField.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Custom field not found');
    return prisma.crmCustomField.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getCustomFieldValues(tenantId: string, entityType: string, entityId: string) {
    return prisma.crmCustomFieldValue.findMany({
      where: { tenantId, entityType, entityId },
      include: { field: true },
    });
  }

  async upsertCustomFieldValues(tenantId: string, entityType: string, entityId: string, values: Array<{ fieldId: string; value: string | null }>) {
    const results = [];
    for (const v of values) {
      const result = await prisma.crmCustomFieldValue.upsert({
        where: { fieldId_entityId: { fieldId: v.fieldId, entityId } },
        create: { tenantId, fieldId: v.fieldId, entityType, entityId, value: v.value || '' },
        update: { value: v.value || '' },
      });
      results.push(result);
    }
    return results;
  }

  // ── RECORD TYPES ──────────────────────────────

  async getRecordTypes(tenantId: string, entity?: string) {
    return prisma.crmRecordType.findMany({
      where: { tenantId, ...(entity && { entity }), deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createRecordType(tenantId: string, orgId: string, dto: CreateRecordTypeInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    if (dto.isDefault) {
      await prisma.crmRecordType.updateMany({ where: { tenantId, entity: dto.entity }, data: { isDefault: false } });
    }
    return prisma.crmRecordType.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        entity: dto.entity, name: dto.name, description: dto.description || null,
        isDefault: dto.isDefault || false,
        fieldLayout: dto.fieldLayout as Prisma.InputJsonValue,
      },
    });
  }

  async updateRecordType(tenantId: string, id: string, dto: UpdateRecordTypeInput) {
    const existing = await prisma.crmRecordType.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Record type not found');
    if (dto.isDefault) {
      await prisma.crmRecordType.updateMany({ where: { tenantId, entity: existing.entity, id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.crmRecordType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.fieldLayout !== undefined && { fieldLayout: dto.fieldLayout as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteRecordType(tenantId: string, id: string) {
    const existing = await prisma.crmRecordType.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Record type not found');
    return prisma.crmRecordType.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── APPROVALS ─────────────────────────────────

  async getApprovalProcesses(tenantId: string) {
    return prisma.approvalProcess.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { requests: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApprovalProcess(tenantId: string, orgId: string, dto: CreateApprovalProcessInput, createdBy: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.approvalProcess.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, entity: dto.entity,
        triggerConditions: dto.triggerConditions as Prisma.InputJsonValue,
        steps: dto.steps as Prisma.InputJsonValue,
        createdBy,
      },
    });
  }

  async updateApprovalProcess(tenantId: string, id: string, dto: UpdateApprovalProcessInput) {
    const existing = await prisma.approvalProcess.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Approval process not found');
    return prisma.approvalProcess.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.entity !== undefined && { entity: dto.entity }),
        ...(dto.triggerConditions !== undefined && { triggerConditions: dto.triggerConditions as Prisma.InputJsonValue }),
        ...(dto.steps !== undefined && { steps: dto.steps as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteApprovalProcess(tenantId: string, id: string) {
    const existing = await prisma.approvalProcess.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Approval process not found');
    return prisma.approvalProcess.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async submitForApproval(tenantId: string, userId: string, entityType: string, entityId: string, processId?: string) {
    let process;
    if (processId) {
      process = await prisma.approvalProcess.findFirst({ where: { id: processId, tenantId, isActive: true, deletedAt: null } });
    } else {
      process = await prisma.approvalProcess.findFirst({ where: { tenantId, entity: entityType, isActive: true, deletedAt: null } });
    }
    if (!process) throw new NotFoundException('No matching approval process found');
    return prisma.approvalRequest.create({
      data: {
        tenantId, processId: process.id,
        entityType, entityId,
        submittedBy: userId, status: 'PENDING', currentStep: 0,
      },
    });
  }

  async getPendingApprovals(tenantId: string, _userId: string) {
    return prisma.approvalRequest.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { process: { select: { id: true, name: true, steps: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async approveRequest(tenantId: string, requestId: string, userId: string, comments?: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found or not pending');
    const process = await prisma.approvalProcess.findFirst({ where: { id: request.processId } });
    if (!process) throw new NotFoundException('Approval process not found');
    const steps = process.steps as Array<{ approvers: string[] }>;
    await prisma.approvalAction.create({
      data: { tenantId, requestId, step: request.currentStep, userId, action: 'APPROVED', comments: comments || null },
    });
    const nextStep = request.currentStep + 1;
    if (nextStep >= steps.length) {
      return prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', currentStep: nextStep, completedAt: new Date() },
      });
    }
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { currentStep: nextStep },
    });
  }

  async rejectRequest(tenantId: string, requestId: string, userId: string, comments: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found or not pending');
    await prisma.approvalAction.create({
      data: { tenantId, requestId, step: request.currentStep, userId, action: 'REJECTED', comments },
    });
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', completedAt: new Date() },
    });
  }

  async recallRequest(tenantId: string, requestId: string, userId: string) {
    const request = await prisma.approvalRequest.findFirst({ where: { id: requestId, tenantId, status: 'PENDING' } });
    if (!request) throw new NotFoundException('Approval request not found or not pending');
    if (request.submittedBy !== userId) throw new BadRequestException('Only the submitter can recall this request');
    return prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: 'RECALLED' },
    });
  }

  async getApprovalHistory(tenantId: string, entityType: string, entityId: string) {
    return prisma.approvalRequest.findMany({
      where: { tenantId, entityType, entityId },
      include: { actions: { orderBy: { actedAt: 'asc' } }, process: { select: { name: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // ── CPQ (CONFIGURE-PRICE-QUOTE) ───────────────

  async getQuotationTemplates(tenantId: string) {
    return prisma.quotationTemplate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQuotationTemplate(tenantId: string, orgId: string, dto: CreateQuotationTemplateInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    if (dto.isDefault) {
      await prisma.quotationTemplate.updateMany({ where: { tenantId }, data: { isDefault: false } });
    }
    return prisma.quotationTemplate.create({
      data: {
        tenantId, orgId: resolvedOrgId,
        name: dto.name, description: dto.description || null,
        headerHtml: dto.headerHtml || null, footerHtml: dto.footerHtml || null,
        termsTemplate: dto.termsTemplate || null,
        colorScheme: (dto.colorScheme || {}) as Prisma.InputJsonValue,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async updateQuotationTemplate(tenantId: string, id: string, dto: UpdateQuotationTemplateInput) {
    const existing = await prisma.quotationTemplate.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Quotation template not found');
    if (dto.isDefault) {
      await prisma.quotationTemplate.updateMany({ where: { tenantId, id: { not: id } }, data: { isDefault: false } });
    }
    return prisma.quotationTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.headerHtml !== undefined && { headerHtml: dto.headerHtml }),
        ...(dto.footerHtml !== undefined && { footerHtml: dto.footerHtml }),
        ...(dto.termsTemplate !== undefined && { termsTemplate: dto.termsTemplate }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.colorScheme !== undefined && { colorScheme: dto.colorScheme as Prisma.InputJsonValue }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async deleteQuotationTemplate(tenantId: string, id: string) {
    const existing = await prisma.quotationTemplate.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Quotation template not found');
    return prisma.quotationTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async createQuotationVersion(tenantId: string, quotationId: string, userId: string, note?: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId },
      include: { lineItems: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    const lastVersion = await prisma.quotationVersion.findFirst({
      where: { quotationId }, orderBy: { versionNumber: 'desc' },
    });
    const versionNumber = (lastVersion?.versionNumber || 0) + 1;
    return prisma.quotationVersion.create({
      data: {
        tenantId, quotationId, versionNumber,
        snapshot: { quotation, lineItems: quotation.lineItems } as unknown as Prisma.InputJsonValue,
        changedBy: userId, changeNote: note || null,
      },
    });
  }

  async getQuotationVersions(tenantId: string, quotationId: string) {
    return prisma.quotationVersion.findMany({
      where: { tenantId, quotationId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async cloneQuotation(tenantId: string, quotationId: string, userId: string) {
    const original = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId, deletedAt: null },
      include: { lineItems: true },
    });
    if (!original) throw new NotFoundException('Quotation not found');
    const clone = await prisma.quotation.create({
      data: {
        tenantId, orgId: original.orgId, customerId: original.customerId,
        quotationNumber: `${original.quotationNumber}-COPY-${Date.now()}`,
        status: 'DRAFT', validUntil: original.validUntil, currency: original.currency,
        notes: original.notes, termsConditions: original.termsConditions, createdBy: userId,
      },
    });
    for (const item of original.lineItems) {
      await prisma.quotationItem.create({
        data: {
          tenantId,
          quotationId: clone.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
          sortOrder: item.sortOrder
        },
      });
    }
    return clone;
  }

  async sendForSignature(tenantId: string, quotationId: string, signerName: string, signerEmail: string) {
    const quotation = await prisma.quotation.findFirst({ where: { id: quotationId, tenantId } });
    if (!quotation) throw new NotFoundException('Quotation not found');
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return prisma.quotationSignature.create({
      data: {
        tenantId, quotationId, signerName, signerEmail,
        token, expiresAt, status: 'PENDING',
      },
    });
  }

  async getQuotationBySignToken(token: string) {
    const signature = await prisma.quotationSignature.findFirst({
      where: { token },
      include: { quotation: { include: { lineItems: true, customer: { select: { id: true, name: true } } } } },
    });
    if (!signature) throw new NotFoundException('Invalid signature token');
    if (signature.expiresAt < new Date()) throw new BadRequestException('Signature link has expired');
    return signature;
  }

  async submitSignature(token: string, signatureData: string, ipAddress: string) {
    const signature = await prisma.quotationSignature.findFirst({ where: { token, status: 'PENDING' } });
    if (!signature) throw new NotFoundException('Invalid or already used signature token');
    if (signature.expiresAt < new Date()) throw new BadRequestException('Signature link has expired');
    await prisma.quotationSignature.update({
      where: { id: signature.id },
      data: { status: 'SIGNED', signedAt: new Date(), signatureData, ipAddress },
    });
    return prisma.quotation.update({
      where: { id: signature.quotationId },
      data: { status: 'ACCEPTED' },
    });
  }
}
