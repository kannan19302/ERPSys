import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmTerritoryRulesService } from '../crm-territory-rules.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    salesTerritory: { findFirst: vi.fn() },
    territoryAssignmentRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    territoryAssignmentLog: { create: vi.fn(), findMany: vi.fn() },
    territoryRoundRobinState: { findUnique: vi.fn(), upsert: vi.fn() },
    salesTeamMember: { findMany: vi.fn() },
    lead: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmTerritoryRulesService', () => {
  let service: CrmTerritoryRulesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmTerritoryRulesService();
  });

  it('creates a rule after verifying the territory exists', async () => {
    (prisma.salesTerritory.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't1' });
    (prisma.territoryAssignmentRule.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'r1', ...data }));

    const rule = await service.createRule(TENANT, 'org1', {
      territoryId: 't1', name: 'West Coast', ruleType: 'GEOGRAPHY', priority: 5, conditions: { countries: ['US'] }, isActive: true,
    }, 'user-1');

    expect(rule.name).toBe('West Coast');
    expect(prisma.territoryAssignmentRule.create).toHaveBeenCalled();
  });

  it('throws when creating a rule for a missing territory', async () => {
    (prisma.salesTerritory.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.createRule(TENANT, 'org1', {
      territoryId: 'missing', name: 'X', ruleType: 'GEOGRAPHY', priority: 0, conditions: {}, isActive: true,
    }, 'user-1')).rejects.toThrow('Territory not found');
  });

  it('assigns a lead to the highest-priority matching GEOGRAPHY rule and logs it', async () => {
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'lead-1', industry: 'SOFTWARE', employeeCount: 50, annualRevenue: null, country: 'US', region: 'CA', assignedToId: null,
    });
    (prisma.territoryAssignmentRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'r1', ruleType: 'GEOGRAPHY', territoryId: 't1', name: 'West', conditions: { countries: ['US'] }, priority: 10 },
    ]);
    (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.territoryAssignmentLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.assignLead(TENANT, 'lead-1');
    expect(result.matched).toBe(true);
    expect(result.territoryId).toBe('t1');
    expect(prisma.lead.update).toHaveBeenCalledWith({ where: { id: 'lead-1' }, data: { assignedToId: null } });
    expect(prisma.territoryAssignmentLog.create).toHaveBeenCalled();
  });

  it('leaves a lead unassigned and logs "no rule matched" when nothing matches', async () => {
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'lead-2', industry: 'RETAIL', employeeCount: 5, annualRevenue: null, country: 'FR', region: null, assignedToId: null,
    });
    (prisma.territoryAssignmentRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'r1', ruleType: 'GEOGRAPHY', territoryId: 't1', name: 'West', conditions: { countries: ['US'] }, priority: 10 },
    ]);
    (prisma.territoryAssignmentLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.assignLead(TENANT, 'lead-2');
    expect(result.matched).toBe(false);
    expect(prisma.territoryAssignmentLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reason: 'No territory rule matched' }) }),
    );
  });

  it('round-robins across territory members using the persisted cursor', async () => {
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'lead-3', industry: null, employeeCount: null, annualRevenue: null, country: null, region: null, assignedToId: null,
    });
    (prisma.territoryAssignmentRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'r-rr', ruleType: 'ROUND_ROBIN', territoryId: 't1', name: 'RR', conditions: {}, priority: 1 },
    ]);
    (prisma.salesTeamMember.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { userId: 'u1', createdAt: new Date() },
      { userId: 'u2', createdAt: new Date() },
    ]);
    (prisma.territoryRoundRobinState.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ lastMemberIndex: 0 });
    (prisma.territoryRoundRobinState.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.territoryAssignmentLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.assignLead(TENANT, 'lead-3');
    expect(result.assignedToId).toBe('u2');
  });

  it('matches COMPANY_SIZE rules on employee-count range', async () => {
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'lead-4', industry: null, employeeCount: 250, annualRevenue: null, country: null, region: null, assignedToId: null,
    });
    (prisma.territoryAssignmentRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'r-size', ruleType: 'COMPANY_SIZE', territoryId: 't-ent', name: 'Enterprise', conditions: { minEmployees: 200 }, priority: 5 },
    ]);
    (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.territoryAssignmentLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.assignLead(TENANT, 'lead-4');
    expect(result.matched).toBe(true);
    expect(result.territoryId).toBe('t-ent');
  });
});
