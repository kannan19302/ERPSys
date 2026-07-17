import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class PackagingGs1Service {
  // ── Packaging Specs ───────────────────────────────────────────

  async listSpecsByProduct(tenantId: string, productId: string) {
    return prisma.packagingSpec.findMany({
      where: { tenantId, productId },
      include: {
        barcodes: { where: { active: true } },
        labelAssignments: { include: { template: true } },
      },
      orderBy: { level: 'asc' },
    });
  }

  async getSpec(tenantId: string, id: string) {
    const spec = await prisma.packagingSpec.findFirst({
      where: { tenantId, id },
      include: {
        barcodes: true,
        labelAssignments: { include: { template: true } },
      },
    });
    if (!spec) throw new NotFoundException(`PackagingSpec ${id} not found`);
    return spec;
  }

  async upsertSpec(tenantId: string, data: {
    productId: string;
    level: string;
    unitsPerLevel: number;
    lengthMm?: number;
    widthMm?: number;
    heightMm?: number;
    grossWeightKg?: number;
    netWeightKg?: number;
    stackable?: boolean;
    maxStackLayers?: number;
    description?: string;
    effectiveFrom?: string;
  }) {
    const d = (v: number | undefined) => v !== undefined ? new Prisma.Decimal(v) : undefined;
    return prisma.packagingSpec.upsert({
      where: { tenantId_productId_level: { tenantId, productId: data.productId, level: data.level as any } },
      create: {
        tenantId, productId: data.productId, level: data.level as any,
        unitsPerLevel: data.unitsPerLevel,
        lengthMm: d(data.lengthMm), widthMm: d(data.widthMm), heightMm: d(data.heightMm),
        grossWeightKg: d(data.grossWeightKg), netWeightKg: d(data.netWeightKg),
        stackable: data.stackable ?? true,
        maxStackLayers: data.maxStackLayers,
        description: data.description,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
      },
      update: {
        unitsPerLevel: data.unitsPerLevel,
        lengthMm: d(data.lengthMm), widthMm: d(data.widthMm), heightMm: d(data.heightMm),
        grossWeightKg: d(data.grossWeightKg), netWeightKg: d(data.netWeightKg),
        stackable: data.stackable ?? true,
        maxStackLayers: data.maxStackLayers,
        description: data.description,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      },
    });
  }

  async deactivateSpec(tenantId: string, id: string) {
    await this.getSpec(tenantId, id);
    return prisma.packagingSpec.update({ where: { id }, data: { active: false } });
  }

  async getPackagingHierarchy(tenantId: string, productId: string) {
    const specs = await prisma.packagingSpec.findMany({
      where: { tenantId, productId, active: true },
      include: { barcodes: { where: { isPrimary: true, active: true } } },
      orderBy: { unitsPerLevel: 'asc' },
    });
    return {
      productId,
      levels: specs.map((s, i) => ({
        level: s.level,
        unitsPerLevel: s.unitsPerLevel,
        cumulativeUnits: specs.slice(0, i + 1).reduce((acc, x) => acc * x.unitsPerLevel, 1),
        primaryBarcode: s.barcodes[0]?.barcodeValue ?? null,
        dimensions: s.lengthMm && s.widthMm ? `${s.lengthMm}×${s.widthMm}×${s.heightMm} mm` : null,
      })),
    };
  }

  // ── Item Barcodes ─────────────────────────────────────────────

  async listBarcodes(tenantId: string, packagingSpecId?: string) {
    return prisma.itemBarcode.findMany({
      where: { tenantId, ...(packagingSpecId ? { packagingSpecId } : {}), active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addBarcode(tenantId: string, data: {
    packagingSpecId: string;
    symbology: string;
    barcodeValue: string;
    gtin14?: string;
    gs1CompanyPrefix?: string;
    isPrimary?: boolean;
  }) {
    const existing = await prisma.itemBarcode.findFirst({ where: { tenantId, barcodeValue: data.barcodeValue } });
    if (existing) throw new ConflictException(`Barcode ${data.barcodeValue} already exists`);

    if (data.isPrimary) {
      await prisma.itemBarcode.updateMany({
        where: { tenantId, packagingSpecId: data.packagingSpecId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return prisma.itemBarcode.create({
      data: {
        tenantId,
        packagingSpecId: data.packagingSpecId,
        symbology: data.symbology as any,
        barcodeValue: data.barcodeValue,
        gtin14: data.gtin14,
        gs1CompanyPrefix: data.gs1CompanyPrefix,
        isPrimary: data.isPrimary ?? false,
      },
    });
  }

  async lookupBarcode(tenantId: string, barcodeValue: string) {
    const barcode = await prisma.itemBarcode.findFirst({
      where: { tenantId, barcodeValue, active: true },
      include: { packagingSpec: true },
    });
    if (!barcode) throw new NotFoundException(`Barcode ${barcodeValue} not found`);
    return barcode;
  }

  async deactivateBarcode(tenantId: string, id: string) {
    const b = await prisma.itemBarcode.findFirst({ where: { tenantId, id } });
    if (!b) throw new NotFoundException(`Barcode ${id} not found`);
    return prisma.itemBarcode.update({ where: { id }, data: { active: false } });
  }

  // ── GS1 Application Identifiers ──────────────────────────────

  async listGs1Ais(tenantId: string) {
    return prisma.gs1ApplicationIdentifier.findMany({ where: { tenantId }, orderBy: { ai: 'asc' } });
  }

  async upsertGs1Ai(tenantId: string, data: {
    ai: string; title: string; dataFormat: string;
    fnc1Required?: boolean; maxLength?: number; description?: string;
  }) {
    return prisma.gs1ApplicationIdentifier.upsert({
      where: { tenantId_ai: { tenantId, ai: data.ai } },
      create: { tenantId, ...data, fnc1Required: data.fnc1Required ?? false },
      update: { title: data.title, dataFormat: data.dataFormat, fnc1Required: data.fnc1Required ?? false, maxLength: data.maxLength, description: data.description },
    });
  }

  async seedStandardGs1Ais(tenantId: string) {
    const standard = [
      { ai: '00', title: 'SSCC', dataFormat: 'n2+n18', fnc1Required: false, maxLength: 20 },
      { ai: '01', title: 'GTIN', dataFormat: 'n2+n14', fnc1Required: false, maxLength: 16 },
      { ai: '10', title: 'Batch/Lot Number', dataFormat: 'n2+an..20', fnc1Required: true, maxLength: 22 },
      { ai: '11', title: 'Production Date', dataFormat: 'n2+n6', fnc1Required: false, maxLength: 8 },
      { ai: '17', title: 'Expiry Date', dataFormat: 'n2+n6', fnc1Required: false, maxLength: 8 },
      { ai: '21', title: 'Serial Number', dataFormat: 'n2+an..20', fnc1Required: true, maxLength: 22 },
      { ai: '310x', title: 'Net Weight (kg)', dataFormat: 'n4+n6', fnc1Required: false, maxLength: 10 },
      { ai: '37', title: 'Count of Trade Items', dataFormat: 'n2+n..8', fnc1Required: true, maxLength: 10 },
    ];
    const ops = standard.map(ai =>
      prisma.gs1ApplicationIdentifier.upsert({
        where: { tenantId_ai: { tenantId, ai: ai.ai } },
        create: { tenantId, ...ai },
        update: { title: ai.title, dataFormat: ai.dataFormat },
      })
    );
    await Promise.all(ops);
    return { seeded: standard.length };
  }

  // ── Label Templates ───────────────────────────────────────────

  async listLabelTemplates(tenantId: string, templateType?: string) {
    return prisma.labelTemplate.findMany({
      where: { tenantId, active: true, ...(templateType ? { templateType: templateType as any } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async createLabelTemplate(tenantId: string, data: {
    name: string; templateType: string; widthMm: number; heightMm: number; content: string;
  }) {
    return prisma.labelTemplate.create({
      data: {
        tenantId,
        name: data.name,
        templateType: data.templateType as any,
        widthMm: new Prisma.Decimal(data.widthMm),
        heightMm: new Prisma.Decimal(data.heightMm),
        content: data.content,
      },
    });
  }

  async updateLabelTemplate(tenantId: string, id: string, data: Partial<{ content: string; widthMm: number; heightMm: number }>) {
    const tpl = await prisma.labelTemplate.findFirst({ where: { tenantId, id } });
    if (!tpl) throw new NotFoundException(`LabelTemplate ${id} not found`);
    return prisma.labelTemplate.update({
      where: { id },
      data: {
        ...(data.content ? { content: data.content } : {}),
        ...(data.widthMm ? { widthMm: new Prisma.Decimal(data.widthMm) } : {}),
        ...(data.heightMm ? { heightMm: new Prisma.Decimal(data.heightMm) } : {}),
      },
    });
  }

  async assignLabelToSpec(tenantId: string, data: {
    packagingSpecId: string; templateId: string; customerId?: string; isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await prisma.labelAssignment.updateMany({
        where: { tenantId, packagingSpecId: data.packagingSpecId, customerId: data.customerId ?? null, isDefault: true },
        data: { isDefault: false },
      });
    }
    return prisma.labelAssignment.create({
      data: {
        tenantId,
        packagingSpecId: data.packagingSpecId,
        templateId: data.templateId,
        customerId: data.customerId,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async getLabelForSpec(tenantId: string, packagingSpecId: string, customerId?: string) {
    const assignment = await prisma.labelAssignment.findFirst({
      where: {
        tenantId, packagingSpecId,
        ...(customerId ? { customerId } : { isDefault: true }),
      },
      include: { template: true },
    });
    if (!assignment) throw new NotFoundException(`No label assignment found for spec ${packagingSpecId}`);
    return assignment.template;
  }

  // ── SSCC Management ───────────────────────────────────────────

  async allocateSscc(tenantId: string, gs1CompanyPrefix: string, extensionDigit?: number) {
    const ext = extensionDigit ?? 0;
    const existing = await prisma.ssccRecord.count({ where: { tenantId, gs1CompanyPrefix } });
    const serialRef = String(existing + 1).padStart(9, '0');
    const rawSscc = `${ext}${gs1CompanyPrefix}${serialRef}`;
    const checkDigit = this.calculateCheckDigit(rawSscc);
    const sscc = `${rawSscc}${checkDigit}`;

    return prisma.ssccRecord.create({
      data: {
        tenantId, sscc, gs1CompanyPrefix,
        extensionDigit: ext,
        serialRef,
      },
    });
  }

  async markSsccUsed(tenantId: string, sscc: string, shipmentRef: string) {
    const record = await prisma.ssccRecord.findFirst({ where: { tenantId, sscc } });
    if (!record) throw new NotFoundException(`SSCC ${sscc} not found`);
    return prisma.ssccRecord.update({
      where: { id: record.id },
      data: { usedAt: new Date(), shipmentRef },
    });
  }

  async listSsccRecords(tenantId: string, onlyUnused = false) {
    return prisma.ssccRecord.findMany({
      where: { tenantId, ...(onlyUnused ? { usedAt: null } : {}) },
      orderBy: { allocatedAt: 'desc' },
      take: 100,
    });
  }

  // ── Dashboard ─────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [specs, barcodes, templates, ssccTotal, ssccUsed, gs1Ais] = await Promise.all([
      prisma.packagingSpec.count({ where: { tenantId, active: true } }),
      prisma.itemBarcode.count({ where: { tenantId, active: true } }),
      prisma.labelTemplate.count({ where: { tenantId, active: true } }),
      prisma.ssccRecord.count({ where: { tenantId } }),
      prisma.ssccRecord.count({ where: { tenantId, usedAt: { not: null } } }),
      prisma.gs1ApplicationIdentifier.count({ where: { tenantId } }),
    ]);
    return {
      activePackagingSpecs: specs,
      activeBarcodes: barcodes,
      labelTemplates: templates,
      sscc: { total: ssccTotal, used: ssccUsed, available: ssccTotal - ssccUsed },
      gs1Ais,
    };
  }

  // ── Private helpers ───────────────────────────────────────────

  private calculateCheckDigit(digits: string): number {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      const d = parseInt(digits[digits.length - 1 - i] ?? '0', 10);
      sum += i % 2 === 0 ? d * 3 : d;
    }
    return (10 - (sum % 10)) % 10;
  }
}
