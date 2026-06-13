import { Test, TestingModule } from '@nestjs/testing';
import { CrmService } from '../crm.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock prisma
const mockPrisma = {
  customer: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  vendor: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  contact: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  leadSource: {
    findMany: jest.fn(),
  },
  lead: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  salesPipeline: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  opportunity: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  activity: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  emailTemplate: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  organization: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

jest.mock('@unerp/database', () => ({
  prisma: mockPrisma,
}));

describe('CrmService', () => {
  let service: CrmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmService],
    }).compile();

    service = module.get<CrmService>(CrmService);
    jest.clearAllMocks();

    // Default org mock
    mockPrisma.organization.findFirst.mockResolvedValue({ id: 'org-1', tenantId: 'tenant-1', name: 'Test Org' });
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
  });

  // ═══════════════════════════════════════
  // CONTACT TESTS
  // ═══════════════════════════════════════

  describe('Contacts', () => {
    it('getContacts should return contacts list', async () => {
      const mockContacts = [{ id: 'ct1', firstName: 'John', lastName: 'Doe', tenantId, deletedAt: null }];
      mockPrisma.contact.findMany.mockResolvedValue(mockContacts);

      const result = await service.getContacts(tenantId);
      expect(result).toEqual(mockContacts);
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
      const result = await service.getLeads(tenantId, 'NEW');
      expect(result).toHaveLength(1);
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
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          customer: { create: jest.fn().mockResolvedValue({ id: 'c-new', name: 'Stark Industries' }) },
          opportunity: { create: jest.fn().mockResolvedValue({ id: 'o-new', name: 'Test Opp' }) },
          lead: { update: jest.fn().mockResolvedValue({ id: 'l1', status: 'CONVERTED' }) },
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
      const result = await service.getOpportunities(tenantId, 'p1');
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
      mockPrisma.lead.findMany.mockResolvedValue([
        { source: { name: 'Website' } },
        { source: { name: 'Website' } },
        { source: { name: 'Referral' } },
        { source: null },
      ]);
      const result = await service.getLeadSourceBreakdown(tenantId);
      expect(result['Website']).toBe(2);
      expect(result['Referral']).toBe(1);
      expect(result['UNKNOWN']).toBe(1);
    });
  });

  // ═══════════════════════════════════════
  // VENDOR TESTS
  // ═══════════════════════════════════════

  describe('Vendors', () => {
    it('should create and list vendors', async () => {
      mockPrisma.vendor.findMany.mockResolvedValue([{ id: 'v1', name: 'Test Vendor', tenantId, deletedAt: null }]);
      const list = await service.getVendors(tenantId);
      expect(list).toHaveLength(1);

      const dto = { name: 'New Vendor', email: 'vendor@test.com', paymentTerms: 30 };
      mockPrisma.vendor.create.mockResolvedValue({ id: 'v-new', ...dto, tenantId, orgId });
      const created = await service.createVendor(tenantId, orgId, dto);
      expect(created).toBeDefined();
    });
  });
});