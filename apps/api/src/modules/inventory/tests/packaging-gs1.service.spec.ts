import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PackagingGs1Service } from '../packaging-gs1.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    packagingSpec: { findMany: vi.fn(), findFirst: vi.fn(), upsert: vi.fn(), update: vi.fn(), count: vi.fn() },
    itemBarcode: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn() },
    gs1ApplicationIdentifier: { findMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    labelTemplate: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    labelAssignment: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    ssccRecord: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@prisma/client', () => ({
  Prisma: { Decimal: class Decimal { constructor(v: unknown) { return v; } } },
}));

const T = 'tenant-1';

describe('PackagingGs1Service', () => {
  let svc: PackagingGs1Service;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new PackagingGs1Service();
  });

  // ── Packaging Specs ───────────────────────────────────────────

  it('listSpecsByProduct returns specs with barcodes', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packagingSpec.findMany).mockResolvedValue([{ id: 's1', level: 'EACH' }] as any);
    const result = await svc.listSpecsByProduct(T, 'prod1');
    expect(result).toHaveLength(1);
  });

  it('getSpec throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packagingSpec.findFirst).mockResolvedValue(null);
    await expect(svc.getSpec(T, 'bad')).rejects.toThrow(NotFoundException);
  });

  it('upsertSpec creates or updates packaging spec', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packagingSpec.upsert).mockResolvedValue({ id: 's1', level: 'EACH', unitsPerLevel: 1 } as any);
    const result = await svc.upsertSpec(T, { productId: 'p1', level: 'EACH', unitsPerLevel: 1 });
    expect(result.level).toBe('EACH');
  });

  it('getPackagingHierarchy calculates cumulative units correctly', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packagingSpec.findMany).mockResolvedValue([
      { level: 'EACH', unitsPerLevel: 1, barcodes: [] },
      { level: 'INNER', unitsPerLevel: 6, barcodes: [] },
      { level: 'CASE', unitsPerLevel: 4, barcodes: [] },
    ] as any);
    const result = await svc.getPackagingHierarchy(T, 'p1');
    expect(result.levels[2].cumulativeUnits).toBe(24); // 1 × 6 × 4
  });

  it('deactivateSpec marks spec inactive', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packagingSpec.findFirst).mockResolvedValue({ id: 's1', barcodes: [], labelAssignments: [] } as any);
    vi.mocked(prisma.packagingSpec.update).mockResolvedValue({ id: 's1', active: false } as any);
    const result = await svc.deactivateSpec(T, 's1');
    expect((result as any).active).toBe(false);
  });

  // ── Barcodes ──────────────────────────────────────────────────

  it('addBarcode throws ConflictException for duplicate value', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.itemBarcode.findFirst).mockResolvedValue({ id: 'b1' } as any);
    await expect(svc.addBarcode(T, {
      packagingSpecId: 's1', symbology: 'EAN13', barcodeValue: '1234567890123',
    })).rejects.toThrow(ConflictException);
  });

  it('addBarcode clears previous primary when isPrimary=true', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.itemBarcode.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.itemBarcode.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(prisma.itemBarcode.create).mockResolvedValue({ id: 'b2', isPrimary: true } as any);
    const result = await svc.addBarcode(T, {
      packagingSpecId: 's1', symbology: 'EAN13', barcodeValue: '9876543210987', isPrimary: true,
    });
    expect(result.isPrimary).toBe(true);
    expect(prisma.itemBarcode.updateMany).toHaveBeenCalled();
  });

  it('lookupBarcode returns barcode with spec', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.itemBarcode.findFirst).mockResolvedValue({ id: 'b1', barcodeValue: '12345', packagingSpec: { id: 's1' } } as any);
    const result = await svc.lookupBarcode(T, '12345');
    expect(result.id).toBe('b1');
  });

  it('lookupBarcode throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.itemBarcode.findFirst).mockResolvedValue(null);
    await expect(svc.lookupBarcode(T, 'unknown')).rejects.toThrow(NotFoundException);
  });

  // ── GS1 Application Identifiers ──────────────────────────────

  it('seedStandardGs1Ais inserts 8 standard AIs', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.gs1ApplicationIdentifier.upsert).mockResolvedValue({} as any);
    const result = await svc.seedStandardGs1Ais(T);
    expect(result.seeded).toBe(8);
    expect(prisma.gs1ApplicationIdentifier.upsert).toHaveBeenCalledTimes(8);
  });

  it('upsertGs1Ai creates new AI', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.gs1ApplicationIdentifier.upsert).mockResolvedValue({ id: 'ai1', ai: '01' } as any);
    const result = await svc.upsertGs1Ai(T, { ai: '01', title: 'GTIN', dataFormat: 'n14' });
    expect((result as any).ai).toBe('01');
  });

  // ── Label Templates ───────────────────────────────────────────

  it('createLabelTemplate persists template', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.labelTemplate.create).mockResolvedValue({ id: 'tpl1', name: 'Carton Label' } as any);
    const result = await svc.createLabelTemplate(T, {
      name: 'Carton Label', templateType: 'CASE', widthMm: 100, heightMm: 50, content: '<label>',
    });
    expect((result as any).id).toBe('tpl1');
  });

  it('assignLabelToSpec clears previous default before creating new one', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.labelAssignment.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(prisma.labelAssignment.create).mockResolvedValue({ id: 'la1', isDefault: true } as any);
    const result = await svc.assignLabelToSpec(T, { packagingSpecId: 's1', templateId: 'tpl1', isDefault: true });
    expect((result as any).id).toBe('la1');
    expect(prisma.labelAssignment.updateMany).toHaveBeenCalled();
  });

  it('getLabelForSpec throws NotFoundException when no assignment', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.labelAssignment.findFirst).mockResolvedValue(null);
    await expect(svc.getLabelForSpec(T, 's1')).rejects.toThrow(NotFoundException);
  });

  // ── SSCC ──────────────────────────────────────────────────────

  it('allocateSscc generates unique SSCC with check digit', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.ssccRecord.count).mockResolvedValue(0);
    vi.mocked(prisma.ssccRecord.create).mockImplementation(async ({ data }: any) => ({ id: 'sscc1', sscc: data.sscc }));
    const result = await svc.allocateSscc(T, '0614141');
    expect(typeof (result as any).sscc).toBe('string');
    expect((result as any).sscc.length).toBe(18); // 1+7+9+1 = 18 digits
  });

  it('markSsccUsed throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.ssccRecord.findFirst).mockResolvedValue(null);
    await expect(svc.markSsccUsed(T, 'unknown', 'SHIP-001')).rejects.toThrow(NotFoundException);
  });

  it('getDashboard returns packaging and GS1 aggregates', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.packagingSpec.count).mockResolvedValue(20);
    vi.mocked(prisma.itemBarcode.count).mockResolvedValue(45);
    vi.mocked(prisma.labelTemplate.count).mockResolvedValue(8);
    vi.mocked(prisma.ssccRecord.count).mockResolvedValueOnce(100).mockResolvedValueOnce(60);
    vi.mocked(prisma.gs1ApplicationIdentifier.count).mockResolvedValue(8);
    const result = await svc.getDashboard(T);
    expect(result.activePackagingSpecs).toBe(20);
    expect(result.sscc.available).toBe(40);
  });
});
