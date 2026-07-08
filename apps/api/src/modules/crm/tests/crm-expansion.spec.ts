import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@unerp/database', () => ({
  prisma: {
    opportunity: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    opportunityLineItem: {
      count: vi.fn(),
      create: vi.fn(),
    },
    activity: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    contact: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    salesTarget: {
      findMany: vi.fn(),
    },
    salesOrder: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    salesOrderItem: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    inventoryItem: {
      aggregate: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    priceBookEntry: {
      findFirst: vi.fn(),
    },
    quotation: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    case: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    caseComment: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    campaign: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    lead: {
      count: vi.fn(),
    },
    segment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    contract: {
      findMany: vi.fn(),
    },
    battlecard: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    salesReturn: {
      findMany: vi.fn(),
    },
    forecastSnapshot: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    quota: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    dealTag: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    dealTeamMember: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    accountPlan: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    contactRole: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    customerHealthLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';
import { CrmForecastingService } from '../crm-forecasting.service';
import { CrmAccountManagementService } from '../crm-account-management.service';
import { CrmCampaignManagementService } from '../crm-campaign-management.service';
import { SalesCpqService } from '../../sales/sales-cpq.service';
import { SalesFulfillmentService } from '../../sales/sales-fulfillment.service';
import { CrmSupportService } from '../crm-support.service';
import { CrmEnablementService } from '../crm-enablement.service';
import { CrmRevOpsService } from '../crm-revops.service';
import { CrmPartnersService } from '../crm-partners.service';
import { CrmAutomationService } from '../crm-automation.service';

const TENANT = 'tenant-1';

describe('CRM Expansion Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Forecasting
  describe('CrmForecastingService', () => {
    it('calculates deal score', async () => {
      const srv = new CrmForecastingService();
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'opp-1',
        amount: 25000,
        stage: 'PROPOSAL',
        activities: [],
        lineItems: [],
        expectedCloseDate: new Date(),
      });
      (prisma.opportunity.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({ _avg: { amount: 20000 } });

      const res = await srv.calculateDealScore(TENANT, 'opp-1');
      expect(res.score).toBeGreaterThan(0);
      expect(res.riskLevel).toBeDefined();
    });

    it('creates, freezes, and adjusts forecast snapshots', async () => {
      const srv = new CrmForecastingService();
      (prisma.forecastSnapshot.create as any).mockResolvedValue({ id: 'fs-1', status: 'DRAFT' });
      (prisma.forecastSnapshot.update as any).mockResolvedValue({ id: 'fs-1', status: 'FROZEN', forecastAmount: 50000 });

      const snap = await srv.createForecastSnapshot(TENANT, 'org-1', { name: 'Q1' });
      expect(snap.id).toBe('fs-1');

      const frozen = await srv.freezeForecastSnapshot(TENANT, 'fs-1');
      expect(frozen.status).toBe('FROZEN');

      const adjusted = await srv.adjustForecast(TENANT, 'fs-1', 50000);
      expect(adjusted.forecastAmount).toBe(50000);
    });

    it('manages deal tags and team members', async () => {
      const srv = new CrmForecastingService();
      (prisma.dealTag.create as any).mockResolvedValue({ opportunityId: 'opp-1', tag: 'Enterprise' });
      (prisma.dealTeamMember.create as any).mockResolvedValue({ opportunityId: 'opp-1', userId: 'user-1' });

      const tag = await srv.addDealTag(TENANT, 'opp-1', 'Enterprise');
      expect(tag.status).toBe('tagged');

      const team = await srv.addDealTeamMember(TENANT, 'opp-1', 'user-1', 'AE');
      expect(team.userId).toBe('user-1');
    });
  });

  // 2. Account Management
  describe('CrmAccountManagementService', () => {
    it('retrieves customer success health score', async () => {
      const srv = new CrmAccountManagementService();
      (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'cust-1',
        name: 'Acme Corp',
        riskRating: 'LOW',
        creditHold: false,
      });
      const res = await srv.getCustomerHealthScore(TENANT, 'cust-1');
      expect(res.healthScore).toBeGreaterThanOrEqual(50);
      expect(res.status).toBe('HEALTHY');
    });

    it('creates account plans and logs customer health', async () => {
      const srv = new CrmAccountManagementService();
      (prisma.accountPlan.create as any).mockResolvedValue({ id: 'ap-1', name: 'Expansion Plan' });
      (prisma.customerHealthLog.create as any).mockResolvedValue({ id: 'hl-1', score: 85 });

      const plan = await srv.createAccountPlan(TENANT, 'org-1', { customerId: 'cust-1', name: 'Expansion Plan' });
      expect(plan.id).toBe('ap-1');

      const health = await srv.logCustomerHealth(TENANT, 'cust-1', 85, 'GREEN');
      expect(health.score).toBe(85);
    });
  });

  // 3. Campaigns
  describe('CrmCampaignManagementService', () => {
    it('gets campaign funnel data', async () => {
      const srv = new CrmCampaignManagementService();
      (prisma.lead.count as ReturnType<typeof vi.fn>).mockResolvedValue(100);
      (prisma.opportunity.count as ReturnType<typeof vi.fn>).mockResolvedValue(20);
      (prisma.opportunity.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({ _sum: { amount: 50000 } });

      const res = await srv.getMarketingFunnel(TENANT);
      expect(res.length).toBe(6);
      expect(res[0]?.stage).toBe('Visitors');
    });
  });

  // 4. CPQ
  describe('SalesCpqService', () => {
    it('calculates dynamic pricing with volume discount', async () => {
      const srv = new SalesCpqService();
      (prisma.product.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'prod-1',
        name: 'Widget',
        sellPrice: 100,
      });

      const res = await srv.calculateDynamicPrice(TENANT, {
        productId: 'prod-1',
        quantity: 100,
      });
      expect(res.discountPct).toBe(15);
      expect(res.totalPrice).toBe(8500);
    });
  });

  // 5. Fulfillment
  describe('SalesFulfillmentService', () => {
    it('recalculates order SLA status', async () => {
      const srv = new SalesFulfillmentService();
      (prisma.salesOrder.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'so-1', orderNumber: 'SO-101', status: 'CONFIRMED', orderDate: new Date() },
      ]);
      const res = await srv.getOrderSlaStatus(TENANT);
      expect(res.length).toBe(1);
      expect(res[0]?.slaStatus).toBe('ON_TRACK');
    });
  });

  // 6. Support
  describe('CrmSupportService', () => {
    it('generates SLA calendar details', async () => {
      const srv = new CrmSupportService();
      const res = await srv.getSlaCalendar(TENANT);
      expect(res.workDays).toContain('Monday');
      expect(res.slaTiers.length).toBe(3);
    });
  });

  // 7. Enablement
  describe('CrmEnablementService', () => {
    it('lists objection list responses', async () => {
      const srv = new CrmEnablementService();
      const res = await srv.getObjections(TENANT);
      expect(res.length).toBeGreaterThan(0);
      expect(res[0]?.category).toBe('Pricing');
    });
  });

  // 8. RevOps
  describe('CrmRevOpsService', () => {
    it('calculates commissions for closed-won opportunities', async () => {
      const srv = new CrmRevOpsService();
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'opp-1', name: 'Big Deal', amount: 50000, assignedToId: 'user-1' },
      ]);
      (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'user-1', firstName: 'John', lastName: 'Doe' },
      ]);

      const res = await srv.getCommissions(TENANT);
      expect(res.length).toBe(1);
      expect(res[0]?.commissionAmount).toBe(5000);
      expect(res[0]?.repName).toBe('John Doe');
    });
  });

  // 9. Partners
  describe('CrmPartnersService', () => {
    it('lists partners', async () => {
      const srv = new CrmPartnersService();
      (prisma.customer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'part-1', name: 'Partner Inc', type: 'VENDOR', creditLimit: 25000 },
      ]);

      const res = await srv.getPartners(TENANT);
      expect(res.length).toBe(1);
      expect(res[0]?.tier).toBe('GOLD');
    });
  });

  // 10. Automation
  describe('CrmAutomationService', () => {
    it('lists active triggers', async () => {
      const srv = new CrmAutomationService();
      const res = await srv.getWorkflows(TENANT);
      expect(res.length).toBe(5);
      expect(res[0]?.active).toBe(true);
    });
  });
});
