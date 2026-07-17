import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContainerPalletService } from '../container-pallet.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    palletType: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    containerType: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    loadPlan: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), groupBy: vi.fn() },
    loadPlanPallet: { create: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    loadPlanItem: { create: vi.fn() },
    packingPlan: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), groupBy: vi.fn() },
    loadCarton: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    loadCartonItem: { create: vi.fn() },
  },
}));

vi.mock('@prisma/client', () => ({
  Prisma: { Decimal: class Decimal { constructor(v: unknown) { return v; } } },
}));

const T = 'tenant-1';

describe('ContainerPalletService', () => {
  let svc: ContainerPalletService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new ContainerPalletService();
  });

  // ── Pallet Types ──────────────────────────────────────────────

  it('listPalletTypes returns all types for tenant', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.palletType.findMany).mockResolvedValue([{ id: 'pt1' }] as any);
    const result = await svc.listPalletTypes(T);
    expect(result).toHaveLength(1);
    expect(prisma.palletType.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: T } }));
  });

  it('createPalletType persists and returns record', async () => {
    const { prisma } = await import('@unerp/database');
    const created = { id: 'pt1', tenantId: T, code: 'EUR', name: 'Euro Pallet' };
    vi.mocked(prisma.palletType.create).mockResolvedValue(created as any);
    const result = await svc.createPalletType(T, { code: 'EUR', name: 'Euro Pallet', category: 'EURO' });
    expect(result.id).toBe('pt1');
  });

  it('updatePalletType throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.palletType.findFirst).mockResolvedValue(null);
    await expect(svc.updatePalletType(T, 'bad', {})).rejects.toThrow(NotFoundException);
  });

  it('deletePalletType removes record', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.palletType.findFirst).mockResolvedValue({ id: 'pt1' } as any);
    vi.mocked(prisma.palletType.delete).mockResolvedValue({} as any);
    const result = await svc.deletePalletType(T, 'pt1');
    expect(result).toEqual({ deleted: true });
  });

  // ── Container Types ───────────────────────────────────────────

  it('listContainerTypes returns all types for tenant', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.containerType.findMany).mockResolvedValue([{ id: 'ct1' }] as any);
    const result = await svc.listContainerTypes(T);
    expect(result).toHaveLength(1);
  });

  it('createContainerType persists and returns record', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.containerType.create).mockResolvedValue({ id: 'ct1' } as any);
    const result = await svc.createContainerType(T, { code: '20GP', name: '20ft Dry Van', category: 'DRY_VAN' });
    expect(result.id).toBe('ct1');
  });

  it('deleteContainerType throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.containerType.findFirst).mockResolvedValue(null);
    await expect(svc.deleteContainerType(T, 'bad')).rejects.toThrow(NotFoundException);
  });

  // ── Load Plans ────────────────────────────────────────────────

  it('listLoadPlans returns plans for tenant with optional status filter', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadPlan.findMany).mockResolvedValue([{ id: 'lp1', status: 'DRAFT' }] as any);
    const result = await svc.listLoadPlans(T, 'DRAFT');
    expect(result).toHaveLength(1);
    expect(prisma.loadPlan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: T, status: 'DRAFT' } })
    );
  });

  it('getLoadPlan throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadPlan.findFirst).mockResolvedValue(null);
    await expect(svc.getLoadPlan(T, 'bad')).rejects.toThrow(NotFoundException);
  });

  it('createLoadPlan creates plan in DRAFT status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadPlan.create).mockResolvedValue({ id: 'lp1', status: 'DRAFT' } as any);
    const result = await svc.createLoadPlan(T, 'user1', {
      planNumber: 'LP-001', containerTypeId: 'ct1', originWarehouseId: 'wh1',
    });
    expect(result.status).toBe('DRAFT');
  });

  it('transitionLoadPlan DRAFT→OPTIMIZING succeeds', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadPlan.findFirst).mockResolvedValue({ id: 'lp1', status: 'DRAFT' } as any);
    vi.mocked(prisma.loadPlan.update).mockResolvedValue({ id: 'lp1', status: 'OPTIMIZING' } as any);
    const result = await svc.transitionLoadPlan(T, 'lp1', 'optimize', 'user1');
    expect(result.status).toBe('OPTIMIZING');
  });

  it('transitionLoadPlan throws BadRequestException for invalid transition', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadPlan.findFirst).mockResolvedValue({ id: 'lp1', status: 'SHIPPED' } as any);
    await expect(svc.transitionLoadPlan(T, 'lp1', 'cancel', 'user1')).rejects.toThrow(BadRequestException);
  });

  it('transitionLoadPlan throws BadRequestException for unknown action', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadPlan.findFirst).mockResolvedValue({ id: 'lp1', status: 'DRAFT' } as any);
    await expect(svc.transitionLoadPlan(T, 'lp1', 'explode', 'user1')).rejects.toThrow(BadRequestException);
  });

  it('addPalletToLoadPlan creates pallet and recalculates stats', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadPlan.findFirst).mockResolvedValue({ id: 'lp1', status: 'DRAFT' } as any);
    vi.mocked(prisma.loadPlanPallet.create).mockResolvedValue({ id: 'pal1' } as any);
    vi.mocked(prisma.loadPlanPallet.findMany).mockResolvedValue([{ grossWeightKg: 500 }] as any);
    vi.mocked(prisma.loadPlan.update).mockResolvedValue({} as any);
    const result = await svc.addPalletToLoadPlan(T, 'lp1', { palletTypeId: 'pt1', grossWeightKg: 500 });
    expect(result.id).toBe('pal1');
  });

  it('removePalletFromLoadPlan deletes pallet', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadPlan.findFirst).mockResolvedValue({ id: 'lp1' } as any);
    vi.mocked(prisma.loadPlanPallet.deleteMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(prisma.loadPlanPallet.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.loadPlan.update).mockResolvedValue({} as any);
    const result = await svc.removePalletFromLoadPlan(T, 'lp1', 'pal1');
    expect(result).toEqual({ removed: true });
  });

  // ── Packing Plans ─────────────────────────────────────────────

  it('createPackingPlan creates plan in DRAFT status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packingPlan.create).mockResolvedValue({ id: 'pp1', status: 'DRAFT' } as any);
    const result = await svc.createPackingPlan(T, 'user1', {
      planNumber: 'PP-001', warehouseId: 'wh1',
    });
    expect(result.status).toBe('DRAFT');
  });

  it('transitionPackingPlan DRAFT→CONFIRMED succeeds', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packingPlan.findFirst).mockResolvedValue({ id: 'pp1', status: 'DRAFT' } as any);
    vi.mocked(prisma.packingPlan.update).mockResolvedValue({ id: 'pp1', status: 'CONFIRMED' } as any);
    const result = await svc.transitionPackingPlan(T, 'pp1', 'confirm');
    expect(result.status).toBe('CONFIRMED');
  });

  it('transitionPackingPlan throws BadRequestException for invalid status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packingPlan.findFirst).mockResolvedValue({ id: 'pp1', status: 'COMPLETED' } as any);
    await expect(svc.transitionPackingPlan(T, 'pp1', 'confirm')).rejects.toThrow(BadRequestException);
  });

  it('addCartonToPackingPlan creates carton', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packingPlan.findFirst).mockResolvedValue({ id: 'pp1', status: 'PACKING' } as any);
    vi.mocked(prisma.loadCarton.create).mockResolvedValue({ id: 'c1', cartonNumber: 'CTN-001' } as any);
    vi.mocked(prisma.loadCarton.findMany).mockResolvedValue([{ grossWeightKg: 10 }] as any);
    vi.mocked(prisma.packingPlan.update).mockResolvedValue({} as any);
    const result = await svc.addCartonToPackingPlan(T, 'pp1', { cartonNumber: 'CTN-001' });
    expect(result.id).toBe('c1');
  });

  it('sealCarton marks carton as sealed', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadCarton.findFirst).mockResolvedValue({ id: 'c1', sealed: false } as any);
    vi.mocked(prisma.loadCarton.update).mockResolvedValue({ id: 'c1', sealed: true } as any);
    const result = await svc.sealCarton(T, 'pp1', 'c1');
    expect(result.sealed).toBe(true);
  });

  it('addItemToCarton throws BadRequestException if carton is sealed', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadCarton.findFirst).mockResolvedValue({ id: 'c1', sealed: true } as any);
    await expect(svc.addItemToCarton(T, 'pp1', 'c1', { productId: 'p1', quantity: 5, uom: 'EA' })).rejects.toThrow(BadRequestException);
  });

  it('addItemToCarton throws NotFoundException if carton not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.loadCarton.findFirst).mockResolvedValue(null);
    await expect(svc.addItemToCarton(T, 'pp1', 'bad', { productId: 'p1', quantity: 5, uom: 'EA' })).rejects.toThrow(NotFoundException);
  });

  // ── Dashboard ─────────────────────────────────────────────────

  it('getDashboard returns aggregated counts', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.palletType.count).mockResolvedValue(5);
    vi.mocked(prisma.containerType.count).mockResolvedValue(3);
    vi.mocked(prisma.loadPlan.groupBy).mockResolvedValue([
      { status: 'DRAFT', _count: 4 } as any,
      { status: 'SHIPPED', _count: 10 } as any,
    ]);
    vi.mocked(prisma.packingPlan.groupBy).mockResolvedValue([
      { status: 'COMPLETED', _count: 8 } as any,
    ]);
    const result = await svc.getDashboard(T);
    expect(result.palletTypes).toBe(5);
    expect(result.containerTypes).toBe(3);
    expect(result.loadPlans.draft).toBe(4);
    expect(result.loadPlans.shipped).toBe(10);
    expect(result.packingPlans.completed).toBe(8);
  });
});
