import { Test, TestingModule } from '@nestjs/testing';
import { CrmService } from '../crm.service';
import { CrmCustomersService } from '../crm-customers.service';
import { CrmContactsService } from '../crm-contacts.service';
import { CrmLeadsService } from '../crm-leads.service';
import { CrmDealsService } from '../crm-deals.service';
import { CrmActivitiesService } from '../crm-activities.service';
import { CrmMarketingService } from '../crm-marketing.service';
import { CrmSalesOpsService } from '../crm-salesops.service';
import { CrmConfigService } from '../crm-config.service';
import { CrmCollaborationService } from '../crm-collaboration.service';
import { CrmDashboardsService } from '../crm-dashboards.service';
import { CrmCasesService } from '../crm-cases.service';
import { CrmLeadScoringService } from '../crm-lead-scoring.service';
import { CrmDuplicatesService } from '../crm-duplicates.service';
import { CrmPipelineStagesService } from '../crm-pipeline-stages.service';
import { CrmSegmentsService } from '../crm-segments.service';
import { CrmSlaService } from '../crm-sla.service';
import { CrmIntelligenceService } from '../crm-intelligence.service';
import { CrmIntegrationsService } from '../crm-integrations.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

// Hoist mock object to resolve Vitest order-of-initialization hoisting
const mockPrisma = vi.hoisted(() => ({
  customer: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  salesOrder: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
  invoice: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
  case: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  vendor: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  purchaseOrder: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
    count: vi.fn(),
  },
  debitNote: {
    findMany: vi.fn(),
  },
  purchaseReturn: {
    findMany: vi.fn(),
  },
  blanketPurchaseAgreement: {
    findMany: vi.fn(),
  },
  contact: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  leadSource: {
    findMany: vi.fn(),
  },
  lead: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    groupBy: vi.fn(),
    count: vi.fn(),
  },
  leadScoringRule: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  campaign: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  salesPipeline: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  opportunity: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  activity: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  emailTemplate: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  organization: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
}));

vi.mock('@unerp/database', () => ({
  prisma: mockPrisma,
}));

describe('CrmService', () => {
  let service: CrmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService, CrmCustomersService, CrmContactsService, CrmLeadsService,
        CrmDealsService, CrmActivitiesService, CrmMarketingService, CrmSalesOpsService,
        CrmConfigService, CrmCollaborationService, CrmDashboardsService, CrmCasesService,
        CrmLeadScoringService, CrmDuplicatesService, CrmPipelineStagesService,
        CrmSegmentsService, CrmSlaService, CrmIntelligenceService, CrmIntegrationsService,
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
    vi.clearAllMocks();

    // Default org mock
    mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1', tenantId: 'tenant-1', name: 'Test Org' });
    mockPrisma.leadScoringRule.findMany.mockResolvedValue([]);
  });

  const tenantId = 'tenant-1';
  const orgId = 'org-1';

  // ═══════════════════════════════════════
  // CUSTOMER TESTS
  // ═══════════════════════════════════════

  describe('Customers', () => {
    it('getCustomers should return customers list', async () => {
      const mockCustomers = [
        { id: 'c1', name: 'Test Corp', tenantId, deletedAt: null, _count: { invoices: 0, quotations: 0, salesOrders: 0 } },
      ];
      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.getCustomers(tenantId);
      expect(result).toEqual(mockCustomers);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId, deletedAt: null },
        include: { _count: { select: { invoices: true, quotations: true, salesOrders: true } } },
        orderBy: { name: 'asc' },
      });
    });

    it('getCustomers should return paginated list when query params are provided', async () => {
      const mockCustomers = [
        { id: 'c1', name: 'Test Corp', tenantId, deletedAt: null, _count: { invoices: 0, quotations: 0, salesOrders: 0 } },
      ];
      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers);
      mockPrisma.customer.count.mockResolvedValue(1);

      const result = await service.getCustomers(tenantId, {
        page: 2,
        limit: 5,
        search: 'test',
        type: 'COMPANY',
        status: 'ACTIVE',
        sortBy: 'creditLimit',
        sortOrder: 'desc',
      });

      expect(result).toEqual({
        data: mockCustomers,
        totalCount: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      });

      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          deletedAt: null,
          type: 'COMPANY',
          status: 'ACTIVE',
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
            { phone: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 5,
        take: 5,
        orderBy: {
          creditLimit: 'desc',
        },
        include: { _count: { select: { invoices: true, quotations: true, salesOrders: true } } },
      });
    });

    it('getCustomerSummary should return metrics and lists', async () => {
      const mockCustomer = { id: 'c1', name: 'Test Corp', tenantId, deletedAt: null, creditLimit: 10000 };
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);

      mockPrisma.salesOrder.findMany.mockResolvedValue([
        { id: 'so1', orderNumber: 'SO-001', totalAmount: 5000, status: 'CONFIRMED', orderDate: new Date() },
      ]);
      mockPrisma.salesOrder.aggregate.mockResolvedValue({ _sum: { totalAmount: 5000 } });

      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'inv1', invoiceNumber: 'INV-001', totalAmount: 3000, status: 'UNPAID', issueDate: new Date(), dueDate: new Date() },
      ]);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { totalAmount: 3000, paidAmount: 1000 } });

      mockPrisma.case.findMany.mockResolvedValue([
        { id: 'case1', caseNumber: 'CASE-001', subject: 'Billing question', status: 'OPEN', priority: 'HIGH', createdAt: new Date() },
      ]);
      mockPrisma.case.groupBy.mockResolvedValue([
        { status: 'OPEN', _count: { id: 1 } },
      ]);

      const result = await service.getCustomerSummary(tenantId, 'c1');

      expect(result).toBeDefined();
      expect(result.customer).toEqual(mockCustomer);
      expect(result.metrics).toEqual({
        ltv: 5000,
        unpaidBalance: 2000,
        creditLimit: 10000,
        availableCredit: 8000,
        isCreditLimitExceeded: false,
        openCases: 1,
        resolvedCases: 0,
      });
      expect(result.recentSalesOrders).toHaveLength(1);
      expect(result.recentInvoices).toHaveLength(1);
      expect(result.recentCases).toHaveLength(1);
    });

    it('getCustomerById should return single customer', async () => {
      const mockCustomer = { id: 'c1', name: 'Test Corp', tenantId, deletedAt: null };
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.getCustomerById(tenantId, 'c1');
      expect(result).toEqual(mockCustomer);
    });

    it('getCustomerById should throw NotFoundException', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.getCustomerById(tenantId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('createCustomer should create a new customer', async () => {
      const dto = { name: 'New Corp', type: 'COMPANY' as const, email: 'test@test.com', paymentTerms: 30 };
      const created = { id: 'c-new', ...dto, tenantId, orgId };
      mockPrisma.customer.create.mockResolvedValue(created);

      const result = await service.createCustomer(tenantId, orgId, dto);
      expect(result).toEqual(created);
    });

    it('updateCustomer should update existing customer', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1', tenantId });
      mockPrisma.customer.update.mockResolvedValue({ id: 'c1', name: 'Updated Corp' });

      const result = await service.updateCustomer(tenantId, 'c1', { name: 'Updated Corp' });
      expect(result).toEqual({ id: 'c1', name: 'Updated Corp' });
    });

    it('deleteCustomer should soft delete', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1', tenantId });
      mockPrisma.customer.update.mockResolvedValue({ id: 'c1', deletedAt: new Date() });

      const result = await service.deleteCustomer(tenantId, 'c1');
      expect(result.deletedAt).toBeDefined();
    });

    // ── Customer Mechanical Features ──

    it('updateCustomerStatus should update status with valid value', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1', tenantId, deletedAt: null });
      mockPrisma.customer.update.mockResolvedValue({ id: 'c1', status: 'INACTIVE' });

      const result = await service.updateCustomerStatus(tenantId, 'c1', 'INACTIVE');
      expect(result.status).toBe('INACTIVE');
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: 'INACTIVE' },
      });
    });

    it('updateCustomerStatus should throw on invalid status', async () => {
      await expect(service.updateCustomerStatus(tenantId, 'c1', 'INVALID')).rejects.toThrow(BadRequestException);
    });

    it('updateCustomerStatus should throw if customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      await expect(service.updateCustomerStatus(tenantId, 'c1', 'ACTIVE')).rejects.toThrow(NotFoundException);
    });

    it('getCustomerNotes should return filtered activities with [CUSTOMER:id] prefix', async () => {
      const mockNotes = [
        { id: 'n1', type: 'NOTE', subject: '[CUSTOMER:c1] First note', description: 'Full text', createdAt: new Date() },
        { id: 'n2', type: 'CALL', subject: '[CUSTOMER:c1] Called client', description: 'Discussion', createdAt: new Date() },
      ];
      mockPrisma.activity.findMany.mockResolvedValue(mockNotes);

      const result = await service.getCustomerNotes(tenantId, 'c1');
      expect(result).toHaveLength(2);
      expect(result[0].subject).toBe('First note'); // Prefix stripped
      expect(result[1].subject).toBe('Called client');
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          type: { in: ['NOTE', 'CALL', 'EMAIL', 'MEETING'] },
          subject: { startsWith: '[CUSTOMER:c1]' },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, subject: true, description: true, createdAt: true },
      });
    });

    it('addCustomerNote should create activity with [CUSTOMER:id] prefix', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1', tenantId, deletedAt: null });
      const createdNote = {
        id: 'n-new',
        tenantId,
        orgId,
        type: 'NOTE',
        subject: '[CUSTOMER:c1] Test note for customer',
        description: 'Full test note content',
        customerId: 'c1',
      };
      mockPrisma.activity.create.mockResolvedValue(createdNote);

      const dto = { content: 'Test note for customer', type: 'NOTE' as const };
      const result = await service.addCustomerNote(tenantId, orgId, 'c1', dto);

      expect(result.subject).toContain('[CUSTOMER:c1]');
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          orgId,
          type: 'NOTE',
          subject: '[CUSTOMER:c1] Test note for customer',
          description: 'Test note for customer',
          customerId: 'c1',
        },
      });
    });

    it('addCustomerNote should throw if customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      const dto = { content: 'Test note', type: 'NOTE' as const };

      await expect(service.addCustomerNote(tenantId, orgId, 'nonexistent', dto)).rejects.toThrow(NotFoundException);
    });

    it('bulkUpdateCustomerStatus should update multiple customers', async () => {
      mockPrisma.customer.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkUpdateCustomerStatus(tenantId, ['c1', 'c2'], 'ON_HOLD');

      expect(result.updated).toBe(2);
      expect(result.status).toBe('ON_HOLD');
      expect(mockPrisma.customer.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['c1', 'c2'] }, tenantId, deletedAt: null },
        data: { status: 'ON_HOLD' },
      });
    });

    it('bulkUpdateCustomerStatus should throw on invalid status', async () => {
      await expect(service.bulkUpdateCustomerStatus(tenantId, ['c1'], 'INVALID')).rejects.toThrow(BadRequestException);
    });

    it('exportCustomers should return CSV-ready data', async () => {
      const mockExportData = [
        {
          id: 'c1',
          name: 'Test Corp',
          email: 'test@corp.com',
          phone: '+1-555-0001',
          taxId: 'TAX123',
          type: 'COMPANY',
          status: 'ACTIVE',
          creditLimit: 10000,
          paymentTerms: 30,
          notes: 'VIP customer',
          billingAddress: { city: 'NYC' },
          shippingAddress: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrisma.customer.findMany.mockResolvedValue(mockExportData);

      const result = await service.exportCustomers(tenantId, { status: 'ACTIVE', search: 'Test' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Corp');
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          deletedAt: null,
          status: 'ACTIVE',
          OR: [
            { name: { contains: 'Test', mode: 'insensitive' } },
            { email: { contains: 'Test', mode: 'insensitive' } },
          ],
        },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          taxId: true,
          type: true,
          status: true,
          creditLimit: true,
          paymentTerms: true,
          notes: true,
          billingAddress: true,
          shippingAddress: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });
  });

  // ═══════════════════════════════════════
  // CONTACT TESTS
  // ═══════════════════════════════════════

  describe('Contacts', () => {
    it('getContacts should return contacts list', async () => {
      const mockContacts = [{ id: 'ct1', firstName: 'John', lastName: 'Doe', tenantId, deletedAt: null }];
      mockPrisma.contact.findMany.mockResolvedValue(mockContacts);

      const result = await service.getContacts(tenantId);
      expect(result.data).toEqual(mockContacts);
    });

    it('createContact should create with valid data', async () => {
      const dto = { firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com', customerId: 'c1' };
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'c1', tenantId });
      mockPrisma.contact.create.mockResolvedValue({ id: 'ct-new', ...dto, tenantId, orgId });

      const result = await service.createContact(tenantId, orgId, dto);
      expect(result).toBeDefined();
    });

    it('createContact should throw if customer not found', async () => {
      const dto = { firstName: 'Jane', lastName: 'Doe', customerId: 'nonexistent' };
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.createContact(tenantId, orgId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════
  // LEAD TESTS
  // ═══════════════════════════════════════

  describe('Leads', () => {
    it('getLeads should return leads with status filter', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([{ id: 'l1', firstName: 'Tony', lastName: 'Stark', status: 'NEW', tenantId, deletedAt: null }]);
      const result = await service.getLeads(tenantId, { status: 'NEW' });
      expect(result.data).toHaveLength(1);
      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId, deletedAt: null, status: 'NEW' } })
      );
    });

    it('getLeadById should return lead with relations', async () => {
      const mockLead = { id: 'l1', firstName: 'Tony', lastName: 'Stark', tenantId, deletedAt: null, source: null, activities: [], opportunities: [] };
      mockPrisma.lead.findFirst.mockResolvedValue(mockLead);
      const result = await service.getLeadById(tenantId, 'l1');
      expect(result).toEqual(mockLead);
    });

    it('createLead should create a new lead', async () => {
      const dto = { firstName: 'Bruce', lastName: 'Wayne', company: 'Wayne Enterprises', email: 'bruce@wayne.com' };
      mockPrisma.lead.create.mockResolvedValue({ id: 'l-new', ...dto, tenantId, orgId, status: 'NEW', score: 0 });
      const result = await service.createLead(tenantId, orgId, dto);
      expect(result).toBeDefined();
      expect(mockPrisma.lead.create).toHaveBeenCalled();
    });

    it('updateLeadStatus should update lead status', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ id: 'l1', tenantId, status: 'NEW' });
      mockPrisma.lead.update.mockResolvedValue({ id: 'l1', status: 'QUALIFIED' });
      const result = await service.updateLeadStatus(tenantId, 'l1', 'QUALIFIED');
      expect(result.status).toBe('QUALIFIED');
    });

    it('convertLead should create customer + opportunity in transaction', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({
        id: 'l1', tenantId, status: 'NEW', firstName: 'Tony', lastName: 'Stark', company: 'Stark Industries', email: 'tony@stark.com', phone: '+1-555'
      });
      mockPrisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          customer: { create: vi.fn().mockResolvedValue({ id: 'c-new', name: 'Stark Industries' }) },
          contact: { create: vi.fn().mockResolvedValue({ id: 'ct-new', firstName: 'Tony', lastName: 'Stark' }) },
          opportunity: { create: vi.fn().mockResolvedValue({ id: 'o-new', name: 'Test Opp' }) },
          lead: { update: vi.fn().mockResolvedValue({ id: 'l1', status: 'CONVERTED' }) },
        };
        return cb(tx);
      });
      const result = await service.convertLead(tenantId, orgId, 'l1');
      expect(result).toHaveProperty('customer');
      expect(result).toHaveProperty('opportunity');
    });

    it('convertLead should throw if already converted', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ id: 'l1', tenantId, status: 'CONVERTED' });
      await expect(service.convertLead(tenantId, orgId, 'l1')).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════
  // PIPELINE TESTS
  // ═══════════════════════════════════════

  describe('Pipelines', () => {
    it('getPipelines should return list', async () => {
      mockPrisma.salesPipeline.findMany.mockResolvedValue([{ id: 'p1', name: 'Default', tenantId }]);
      const result = await service.getPipelines(tenantId);
      expect(result).toHaveLength(1);
    });

    it('createPipeline should unset default when isDefault=true', async () => {
      const dto = { name: 'New Pipeline', stages: [{ label: 'Stage 1', probability: 10, order: 0 }], isDefault: true };
      mockPrisma.salesPipeline.create.mockResolvedValue({ id: 'p-new', ...dto, tenantId });
      await service.createPipeline(tenantId, dto);
      expect(mockPrisma.salesPipeline.updateMany).toHaveBeenCalledWith({ where: { tenantId }, data: { isDefault: false } });
    });
  });

  // ═══════════════════════════════════════
  // OPPORTUNITY TESTS
  // ═══════════════════════════════════════

  describe('Opportunities', () => {
    it('getOpportunities should filter by pipeline', async () => {
      mockPrisma.opportunity.findMany.mockResolvedValue([{ id: 'o1', name: 'Test Deal', tenantId, deletedAt: null }]);
      const result = await service.getOpportunities(tenantId, { pipelineId: 'p1' });
      expect(result).toBeDefined();
      expect(mockPrisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId, deletedAt: null, pipelineId: 'p1' } })
      );
    });

    it('updateOpportunityStage should update stage and optional fields', async () => {
      mockPrisma.opportunity.findFirst.mockResolvedValue({ id: 'o1', tenantId, stage: 'PROSPECTING' });
      mockPrisma.opportunity.update.mockResolvedValue({ id: 'o1', stage: 'CLOSED_WON', probability: 100 });
      const result = await service.updateOpportunityStage(tenantId, 'o1', 'CLOSED_WON', 100);
      expect(result.stage).toBe('CLOSED_WON');
    });
  });

  // ═══════════════════════════════════════
  // ACTIVITY TESTS
  // ═══════════════════════════════════════

  describe('Activities', () => {
    it('getActivities should filter by leadId', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([{ id: 'a1', type: 'CALL', subject: 'Test Call', tenantId }]);
      const result = await service.getActivities(tenantId, 'l1');
      expect(result).toBeDefined();
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId, leadId: 'l1' } })
      );
    });

    it('completeActivity should set completedAt', async () => {
      mockPrisma.activity.findFirst.mockResolvedValue({ id: 'a1', tenantId });
      mockPrisma.activity.update.mockResolvedValue({ id: 'a1', completedAt: new Date() });
      const result = await service.completeActivity(tenantId, 'a1');
      expect(result.completedAt).toBeDefined();
    });
  });

  // ═══════════════════════════════════════
  // EMAIL TEMPLATE TESTS
  // ═══════════════════════════════════════

  describe('Email Templates', () => {
    it('CRUD operations should work', async () => {
      mockPrisma.emailTemplate.findMany.mockResolvedValue([{ id: 't1', name: 'Welcome', tenantId }]);
      const list = await service.getEmailTemplates(tenantId);
      expect(list).toHaveLength(1);

      const dto = { name: 'New Template', subject: 'Hello {{name}}', body: 'Dear {{name}},' };
      mockPrisma.emailTemplate.create.mockResolvedValue({ id: 't-new', ...dto, tenantId });
      const created = await service.createEmailTemplate(tenantId, dto);
      expect(created).toBeDefined();

      mockPrisma.emailTemplate.findFirst.mockResolvedValue({ id: 't1', tenantId });
      mockPrisma.emailTemplate.delete.mockResolvedValue({ id: 't1' });
      await service.deleteEmailTemplate(tenantId, 't1');
      expect(mockPrisma.emailTemplate.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });
  });

  // ═══════════════════════════════════════
  // ANALYTICS TESTS
  // ═══════════════════════════════════════

  describe('Analytics', () => {
    it('getPipelineFunnel should group by stage', async () => {
      mockPrisma.opportunity.findMany.mockResolvedValue([
        { stage: 'PROSPECTING', amount: 10000 },
        { stage: 'PROSPECTING', amount: 20000 },
        { stage: 'NEGOTIATION', amount: 50000 },
      ]);
      const result = await service.getPipelineFunnel(tenantId);
      expect(result['PROSPECTING'].count).toBe(2);
      expect(result['PROSPECTING'].totalAmount).toBe(30000);
      expect(result['NEGOTIATION'].count).toBe(1);
    });

    it('getWinRate should calculate percentage', async () => {
      mockPrisma.opportunity.count
        .mockResolvedValueOnce(5)  // won
        .mockResolvedValueOnce(3); // lost
      const result = await service.getWinRate(tenantId);
      expect(result.won).toBe(5);
      expect(result.lost).toBe(3);
      expect(result.winRate).toBe(63);
    });

    it('getLeadSourceBreakdown should group leads by source', async () => {
      mockPrisma.lead.groupBy.mockResolvedValue([
        { sourceId: 's1', _count: { id: 2 } },
        { sourceId: 's2', _count: { id: 1 } },
        { sourceId: null, _count: { id: 1 } },
      ]);
      mockPrisma.leadSource.findMany.mockResolvedValue([
        { id: 's1', name: 'Website' },
        { id: 's2', name: 'Referral' },
      ]);
      const result = await service.getLeadSourceBreakdown(tenantId);
      expect(result).toContainEqual({ source: 'Website', count: 2 });
      expect(result).toContainEqual({ source: 'Referral', count: 1 });
      expect(result).toContainEqual({ source: 'Unknown', count: 1 });
    });
  });

  // ═══════════════════════════════════════
  // CAMPAIGNS & SCORING TESTS
  // ═══════════════════════════════════════

  describe('Campaigns & Scoring', () => {
    it('should create and list campaigns', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([
        {
          id: 'c1',
          name: 'Summer Campaign',
          status: 'ACTIVE',
          type: 'EMAIL',
          budget: new Prisma.Decimal(1000),
          actualCost: new Prisma.Decimal(800),
          notes: 'Test notes',
          leads: [
            { id: 'l1', status: 'CONVERTED', opportunities: [{ id: 'o1', stage: 'CLOSED_WON', amount: 5000 }] }
          ],
          createdAt: new Date(),
        }
      ]);
      const list = await service.getCampaigns(tenantId);
      expect(list).toHaveLength(1);
      expect(list[0].conversionRate).toBe(100);

      const dto = { name: 'Autumn Campaign', status: 'PLANNED', type: 'SEARCH', budget: 500, actualCost: 0 };
      mockPrisma.campaign.findFirst.mockResolvedValue(null);
      mockPrisma.campaign.create.mockResolvedValue({ id: 'c-new', ...dto, tenantId, orgId });
      const created = await service.createCampaign(tenantId, orgId, dto as any, 'user1');
      expect(created).toBeDefined();
    });

    it('should recalculate lead score on activities and profile fields', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({
        id: 'l1',
        tenantId,
        email: 'test@lead.com',
        phone: '12345',
        company: 'Lead Co',
        website: 'lead.com',
        industry: 'Tech',
        annualRevenue: new Prisma.Decimal(200000),
        employeeCount: 50,
        activities: [
          { id: 'a1', completedAt: new Date() },
          { id: 'a2', completedAt: null },
        ]
      });
      mockPrisma.lead.update.mockResolvedValue({ id: 'l1' });

      await service.recalculateLeadScore(tenantId, 'l1');
      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: { score: 110 }
      });
    });
  });

  // ═══════════════════════════════════════
  // VENDOR TESTS
  // ═══════════════════════════════════════

  describe('Vendors', () => {
    it('should create and list vendors', async () => {
      mockPrisma.vendor.findMany.mockResolvedValue([{ id: 'v1', name: 'Test Vendor', tenantId, deletedAt: null }]);
      const list = await service.getVendors(tenantId);
      expect(list.data).toHaveLength(1);

      const dto = { name: 'New Vendor', email: 'vendor@test.com', paymentTerms: 30 };
      mockPrisma.vendor.create.mockResolvedValue({ id: 'v-new', ...dto, tenantId, orgId });
      const created = await service.createVendor(tenantId, orgId, dto);
      expect(created).toBeDefined();
    });

    it('should get vendor by id', async () => {
      const mockVendor = { id: 'v1', name: 'Vendor 1', tenantId, deletedAt: null };
      mockPrisma.vendor.findFirst.mockResolvedValue(mockVendor);
      const result = await service.getVendorById(tenantId, 'v1');
      expect(result).toBeDefined();
      expect(result.id).toBe('v1');
    });

    it('should get vendor summary', async () => {
      const mockVendor = { id: 'v1', name: 'Vendor 1', tenantId, deletedAt: null };
      mockPrisma.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrisma.purchaseOrder.findMany.mockResolvedValue([]);
      mockPrisma.purchaseOrder.aggregate.mockResolvedValue({ _sum: { totalAmount: null }, _count: { id: 0 } });
      mockPrisma.purchaseOrder.count.mockResolvedValue(0);
      mockPrisma.debitNote.findMany.mockResolvedValue([]);
      mockPrisma.purchaseReturn.findMany.mockResolvedValue([]);
      mockPrisma.blanketPurchaseAgreement.findMany.mockResolvedValue([]);
      mockPrisma.activity.findMany.mockResolvedValue([]);

      const result = await service.getVendorSummary(tenantId, 'v1');
      expect(result).toBeDefined();
      expect(result.vendor).toEqual(mockVendor);
      expect(result.metrics.totalSpend).toBe(0);
    });

    it('should update vendor details', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ id: 'v1', tenantId });
      mockPrisma.vendor.update.mockResolvedValue({ id: 'v1', name: 'Updated Vendor' });
      const result = await service.updateVendor(tenantId, 'v1', { name: 'Updated Vendor' });
      expect(result.name).toBe('Updated Vendor');
    });

    it('should soft delete vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ id: 'v1', tenantId });
      mockPrisma.vendor.update.mockResolvedValue({ id: 'v1', deletedAt: new Date() });
      const result = await service.deleteVendor(tenantId, 'v1');
      expect(result.deletedAt).toBeDefined();
    });

    it('should update vendor status', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ id: 'v1', tenantId });
      mockPrisma.vendor.update.mockResolvedValue({ id: 'v1', status: 'PREFERRED' });
      const result = await service.updateVendorStatus(tenantId, 'v1', 'PREFERRED');
      expect(result.status).toBe('PREFERRED');
    });

    it('should get and add vendor notes', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ id: 'v1', tenantId });
      mockPrisma.activity.findMany.mockResolvedValue([
        { id: 'a1', type: 'NOTE', subject: '[VENDOR:v1] Log entry', description: 'Log entry', createdAt: new Date() }
      ]);
      mockPrisma.activity.create.mockResolvedValue({ id: 'a2' });

      const notes = await service.getVendorNotes(tenantId, 'v1');
      expect(notes).toHaveLength(1);
      expect(notes[0].subject).toBe('Log entry');

      const createdNote = await service.addVendorNote(tenantId, orgId, 'v1', { content: 'Log entry', type: 'NOTE' });
      expect(createdNote).toBeDefined();
    });

    it('should bulk update vendor statuses', async () => {
      mockPrisma.vendor.updateMany.mockResolvedValue({ count: 2 });
      const result = await service.bulkUpdateVendorStatus(tenantId, ['v1', 'v2'], 'PREFERRED');
      expect(result.updated).toBe(2);
      expect(result.status).toBe('PREFERRED');
    });

    it('should export vendors', async () => {
      mockPrisma.vendor.findMany.mockResolvedValue([{ id: 'v1', name: 'Vendor 1' }]);
      const list = await service.exportVendors(tenantId);
      expect(list).toHaveLength(1);
    });
  });
});