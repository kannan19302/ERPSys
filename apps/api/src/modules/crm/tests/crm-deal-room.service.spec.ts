import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmDealRoomService } from '../crm-deal-room.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    opportunity: { findFirst: vi.fn() },
    dealRoom: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    dealRoomMilestone: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn(), aggregate: vi.fn() },
    dealRoomStakeholder: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    dealRoomDocument: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const ORG = 'org-1';

describe('CrmDealRoomService', () => {
  let service: CrmDealRoomService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmDealRoomService();
  });

  it('creates a deal room for an opportunity with a generated buyer token', async () => {
    (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'opp1' });
    (prisma.dealRoom.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.dealRoom.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'room1', ...data }));

    const result = await service.createDealRoom(TENANT, ORG, { opportunityId: 'opp1', name: 'Acme Deal Room' });
    expect(result.name).toBe('Acme Deal Room');
    expect(typeof result.buyerAccessToken).toBe('string');
    expect(result.buyerAccessToken.length).toBeGreaterThan(20);
  });

  it('rejects creating a second deal room for the same opportunity', async () => {
    (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'opp1' });
    (prisma.dealRoom.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing' });

    await expect(service.createDealRoom(TENANT, ORG, { opportunityId: 'opp1', name: 'Dup' })).rejects.toThrow('already exists');
  });

  it('404s creating a deal room for a nonexistent opportunity', async () => {
    (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.createDealRoom(TENANT, ORG, { opportunityId: 'nope', name: 'X' })).rejects.toThrow('Opportunity not found');
  });

  it('adds a milestone with an auto-incremented sort order', async () => {
    (prisma.dealRoom.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'room1', tenantId: TENANT });
    (prisma.dealRoomMilestone.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({ _max: { sortOrder: 2 } });
    (prisma.dealRoomMilestone.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'm1', ...data }));

    const result = await service.addMilestone(TENANT, 'room1', { title: 'Legal review', ownerType: 'BUYER' });
    expect(result.sortOrder).toBe(3);
    expect(result.ownerType).toBe('BUYER');
  });

  it('marks a milestone DONE and stamps completedAt when status set to DONE', async () => {
    (prisma.dealRoomMilestone.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'm1', tenantId: TENANT, completedAt: null });
    (prisma.dealRoomMilestone.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'm1', ...data }));

    const result = await service.updateMilestone(TENANT, 'm1', { status: 'DONE' });
    expect(result.status).toBe('DONE');
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  it('buyer cannot complete a SELLER-owned milestone', async () => {
    (prisma.dealRoom.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'room1', buyerAccessToken: 'tok', status: 'ACTIVE' });
    (prisma.dealRoomMilestone.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'm1', dealRoomId: 'room1', ownerType: 'SELLER' });

    await expect(service.buyerCompleteMilestone('tok', 'm1')).rejects.toThrow('Only buyer- or mutual-owned');
  });

  it('buyer completes a BUYER-owned milestone via token', async () => {
    (prisma.dealRoom.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'room1', buyerAccessToken: 'tok', status: 'ACTIVE' });
    (prisma.dealRoomMilestone.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'm1', dealRoomId: 'room1', ownerType: 'BUYER' });
    (prisma.dealRoomMilestone.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'm1', ...data }));

    const result = await service.buyerCompleteMilestone('tok', 'm1');
    expect(result.status).toBe('DONE');
  });

  it('rejects a buyer-token lookup for an expired/unknown token', async () => {
    (prisma.dealRoom.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.getByBuyerToken('bad-token')).rejects.toThrow('not found or link has expired');
  });

  it('tracks buyer document views', async () => {
    (prisma.dealRoom.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'room1', buyerAccessToken: 'tok', status: 'ACTIVE' });
    (prisma.dealRoomDocument.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'doc1', dealRoomId: 'room1' });
    (prisma.dealRoomDocument.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'doc1', ...data }));

    const result = await service.buyerViewDocument('tok', 'doc1');
    expect(result.viewedByBuyerAt).toBeInstanceOf(Date);
  });

  it('adds a stakeholder to the map', async () => {
    (prisma.dealRoom.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'room1', tenantId: TENANT });
    (prisma.dealRoomStakeholder.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 's1', ...data }));

    const result = await service.addStakeholder(TENANT, 'room1', { name: 'Jane Buyer', role: 'ECONOMIC_BUYER', side: 'BUYER' });
    expect(result.role).toBe('ECONOMIC_BUYER');
  });
});
