import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class HazmatService {

  // ── Classifications ──────────────────────────────────────────────────────

  async listClassifications(tenantId: string, productId?: string, regulation?: string) {
    return prisma.hazmatClassification.findMany({
      where: { tenantId, ...(productId && { productId }), ...(regulation && { regulation: regulation as never }) },
      include: { sdsRecords: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClassification(tenantId: string, id: string) {
    const c = await prisma.hazmatClassification.findFirst({
      where: { tenantId, id },
      include: { sdsRecords: true, manifests: true },
    });
    if (!c) throw new NotFoundException('Classification not found');
    return c;
  }

  async createClassification(tenantId: string, createdBy: string, dto: {
    productId: string; unNumber: string; properShippingName: string;
    hazardClass: string; subsidiaryHazards?: string[]; packingGroup?: string;
    regulation: string; flashPoint?: number; boilingPoint?: number;
    maxQtyPerPackage?: number; transportIndex?: number;
    isExempted?: boolean; exemptionRef?: string; notes?: string;
  }) {
    const existing = await prisma.hazmatClassification.findFirst({
      where: { tenantId, productId: dto.productId, regulation: dto.regulation as never },
    });
    if (existing) throw new BadRequestException('Classification for this product+regulation already exists');

    return prisma.hazmatClassification.create({
      data: {
        tenantId,
        productId: dto.productId,
        unNumber: dto.unNumber,
        properShippingName: dto.properShippingName,
        hazardClass: dto.hazardClass as never,
        subsidiaryHazards: dto.subsidiaryHazards ?? [],
        packingGroup: dto.packingGroup as never ?? null,
        regulation: dto.regulation as never,
        flashPoint: dto.flashPoint ?? null,
        boilingPoint: dto.boilingPoint ?? null,
        maxQtyPerPackage: dto.maxQtyPerPackage ?? null,
        transportIndex: dto.transportIndex ?? null,
        isExempted: dto.isExempted ?? false,
        exemptionRef: dto.exemptionRef ?? null,
        notes: dto.notes ?? null,
        createdBy,
      },
      include: { sdsRecords: true },
    });
  }

  async updateClassification(tenantId: string, id: string, dto: Partial<{
    properShippingName: string; hazardClass: string; subsidiaryHazards: string[];
    packingGroup: string; flashPoint: number; boilingPoint: number;
    maxQtyPerPackage: number; isExempted: boolean; exemptionRef: string; notes: string;
  }>) {
    await this.getClassification(tenantId, id);
    return prisma.hazmatClassification.update({
      where: { id },
      data: {
        ...(dto.properShippingName !== undefined && { properShippingName: dto.properShippingName }),
        ...(dto.hazardClass !== undefined && { hazardClass: dto.hazardClass as never }),
        ...(dto.subsidiaryHazards !== undefined && { subsidiaryHazards: dto.subsidiaryHazards }),
        ...(dto.packingGroup !== undefined && { packingGroup: dto.packingGroup as never }),
        ...(dto.flashPoint !== undefined && { flashPoint: dto.flashPoint }),
        ...(dto.boilingPoint !== undefined && { boilingPoint: dto.boilingPoint }),
        ...(dto.maxQtyPerPackage !== undefined && { maxQtyPerPackage: dto.maxQtyPerPackage }),
        ...(dto.isExempted !== undefined && { isExempted: dto.isExempted }),
        ...(dto.exemptionRef !== undefined && { exemptionRef: dto.exemptionRef }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async deleteClassification(tenantId: string, id: string) {
    await this.getClassification(tenantId, id);
    const manifestCount = await prisma.hazmatManifestLine.count({ where: { tenantId, classificationId: id } });
    if (manifestCount > 0) throw new BadRequestException('Cannot delete classification referenced by manifests');
    await prisma.hazmatClassification.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Safety Data Sheets ───────────────────────────────────────────────────

  async listSds(tenantId: string, productId?: string, status?: string) {
    return prisma.safetyDataSheet.findMany({
      where: { tenantId, ...(productId && { productId }), ...(status && { status: status as never }) },
      include: { classification: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSds(tenantId: string, id: string) {
    const s = await prisma.safetyDataSheet.findFirst({
      where: { tenantId, id },
      include: { classification: true },
    });
    if (!s) throw new NotFoundException('SDS not found');
    return s;
  }

  async createSds(tenantId: string, dto: {
    classificationId: string; productId: string; revision: string;
    issueDate: string; expiryDate?: string; supplier: string; language?: string;
    storageConditions?: string; firstAidMeasures?: string; spillProcedures?: string;
    disposalMethods?: string; documentUrl?: string;
  }) {
    const count = await prisma.safetyDataSheet.count({ where: { tenantId } });
    const sdsNumber = `SDS-${String(count + 1).padStart(5, '0')}`;

    await prisma.hazmatClassification.findFirst({ where: { tenantId, id: dto.classificationId } })
      .then(c => { if (!c) throw new NotFoundException('Classification not found'); });

    return prisma.safetyDataSheet.create({
      data: {
        tenantId,
        classificationId: dto.classificationId,
        productId: dto.productId,
        sdsNumber,
        revision: dto.revision,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        supplier: dto.supplier,
        language: dto.language ?? 'EN',
        storageConditions: dto.storageConditions ?? null,
        firstAidMeasures: dto.firstAidMeasures ?? null,
        spillProcedures: dto.spillProcedures ?? null,
        disposalMethods: dto.disposalMethods ?? null,
        documentUrl: dto.documentUrl ?? null,
      },
    });
  }

  async acknowledgeSds(tenantId: string, id: string, acknowledgedBy: string) {
    const s = await this.getSds(tenantId, id);
    if (s.acknowledgedBy) throw new BadRequestException('SDS already acknowledged');
    return prisma.safetyDataSheet.update({
      where: { id },
      data: { acknowledgedBy, acknowledgedAt: new Date() },
    });
  }

  async supersedeSds(tenantId: string, oldId: string, newId: string) {
    await this.getSds(tenantId, oldId);
    await this.getSds(tenantId, newId);
    return prisma.safetyDataSheet.update({
      where: { id: oldId },
      data: { status: 'SUPERSEDED', supersededById: newId },
    });
  }

  async expireSds(tenantId: string, id: string) {
    await this.getSds(tenantId, id);
    return prisma.safetyDataSheet.update({ where: { id }, data: { status: 'EXPIRED' } });
  }

  async getExpiringSds(tenantId: string, daysAhead = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    return prisma.safetyDataSheet.findMany({
      where: { tenantId, status: 'CURRENT', expiryDate: { lte: cutoff } },
      include: { classification: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ── Storage Compatibility Rules ──────────────────────────────────────────

  async listStorageRules(tenantId: string) {
    return prisma.hazmatStorageRule.findMany({ where: { tenantId } });
  }

  async upsertStorageRule(tenantId: string, dto: {
    hazardClassA: string; hazardClassB: string;
    result: string; condition?: string; notes?: string;
  }) {
    return prisma.hazmatStorageRule.upsert({
      where: { tenantId_hazardClassA_hazardClassB: { tenantId, hazardClassA: dto.hazardClassA as never, hazardClassB: dto.hazardClassB as never } },
      update: { result: dto.result as never, condition: dto.condition ?? null, notes: dto.notes ?? null },
      create: {
        tenantId, hazardClassA: dto.hazardClassA as never, hazardClassB: dto.hazardClassB as never,
        result: dto.result as never, condition: dto.condition ?? null, notes: dto.notes ?? null,
      },
    });
  }

  async checkCompatibility(tenantId: string, hazardClassA: string, hazardClassB: string) {
    const rule = await prisma.hazmatStorageRule.findFirst({
      where: {
        tenantId,
        OR: [
          { hazardClassA: hazardClassA as never, hazardClassB: hazardClassB as never },
          { hazardClassA: hazardClassB as never, hazardClassB: hazardClassA as never },
        ],
      },
    });
    return rule ?? { result: 'COMPATIBLE', condition: null, notes: 'No rule defined — assumed compatible' };
  }

  async checkWarehouseCompatibility(tenantId: string, warehouseId: string, newHazardClass: string) {
    const classifications = await prisma.hazmatClassification.findMany({ where: { tenantId } });
    const results = await Promise.all(
      classifications.map(async (c) => {
        const compat = await this.checkCompatibility(tenantId, newHazardClass, c.hazardClass);
        return { productId: c.productId, existingClass: c.hazardClass, ...compat };
      }),
    );
    return { warehouseId, newHazardClass, compatibilityResults: results };
  }

  // ── Hazmat Manifests ─────────────────────────────────────────────────────

  async listManifests(tenantId: string, status?: string) {
    return prisma.hazmatManifest.findMany({
      where: { tenantId, ...(status && { status: status as never }) },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getManifest(tenantId: string, id: string) {
    const m = await prisma.hazmatManifest.findFirst({
      where: { tenantId, id },
      include: { lines: { include: { classification: true } } },
    });
    if (!m) throw new NotFoundException('Manifest not found');
    return m;
  }

  async createManifest(tenantId: string, createdBy: string, dto: {
    regulation: string; shipmentRef?: string; carrierId?: string; carrierName?: string;
    originAddress: string; destAddress: string; emergencyContact?: string;
    specialInstructions?: string; weightUnit?: string;
  }) {
    const count = await prisma.hazmatManifest.count({ where: { tenantId } });
    const manifestNumber = `HMF-${String(count + 1).padStart(6, '0')}`;
    return prisma.hazmatManifest.create({
      data: {
        tenantId,
        manifestNumber,
        regulation: dto.regulation as never,
        shipmentRef: dto.shipmentRef ?? null,
        carrierId: dto.carrierId ?? null,
        carrierName: dto.carrierName ?? null,
        originAddress: dto.originAddress,
        destAddress: dto.destAddress,
        emergencyContact: dto.emergencyContact ?? null,
        specialInstructions: dto.specialInstructions ?? null,
        weightUnit: dto.weightUnit ?? 'KG',
        createdBy,
      },
      include: { lines: true },
    });
  }

  async addManifestLine(tenantId: string, manifestId: string, dto: {
    classificationId: string; productId: string; quantity: number; uom?: string;
    grossWeight?: number; netWeight?: number; numberOfPackages?: number;
    packagingType?: string; labelRequired?: boolean; notes?: string;
  }) {
    const manifest = await this.getManifest(tenantId, manifestId);
    if (!['DRAFT'].includes(manifest.status)) throw new BadRequestException('Can only add lines to DRAFT manifests');

    const line = await prisma.hazmatManifestLine.create({
      data: {
        tenantId,
        manifestId,
        classificationId: dto.classificationId,
        productId: dto.productId,
        quantity: dto.quantity,
        uom: dto.uom ?? 'KG',
        grossWeight: dto.grossWeight ?? null,
        netWeight: dto.netWeight ?? null,
        numberOfPackages: dto.numberOfPackages ?? 1,
        packagingType: dto.packagingType ?? null,
        labelRequired: dto.labelRequired ?? true,
        notes: dto.notes ?? null,
      },
    });

    const allLines = await prisma.hazmatManifestLine.findMany({ where: { manifestId } });
    const totalGrossWeight = allLines.reduce((sum, l) => sum + Number(l.grossWeight ?? 0), 0);
    await prisma.hazmatManifest.update({ where: { id: manifestId }, data: { totalGrossWeight } });

    return line;
  }

  async removeManifestLine(tenantId: string, manifestId: string, lineId: string) {
    const manifest = await this.getManifest(tenantId, manifestId);
    if (manifest.status !== 'DRAFT') throw new BadRequestException('Can only remove lines from DRAFT manifests');
    await prisma.hazmatManifestLine.delete({ where: { id: lineId } });
    return { deleted: true };
  }

  async submitManifest(tenantId: string, id: string) {
    const m = await this.getManifest(tenantId, id);
    if (m.status !== 'DRAFT') throw new BadRequestException('Only DRAFT manifests can be submitted');
    if (m.lines.length === 0) throw new BadRequestException('Cannot submit manifest with no lines');
    return prisma.hazmatManifest.update({ where: { id }, data: { status: 'SUBMITTED' } });
  }

  async acknowledgeManifest(tenantId: string, id: string) {
    const m = await this.getManifest(tenantId, id);
    if (m.status !== 'SUBMITTED') throw new BadRequestException('Only SUBMITTED manifests can be acknowledged');
    return prisma.hazmatManifest.update({ where: { id }, data: { status: 'ACKNOWLEDGED' } });
  }

  async markInTransit(tenantId: string, id: string, shippedAt?: string) {
    const m = await this.getManifest(tenantId, id);
    if (m.status !== 'ACKNOWLEDGED') throw new BadRequestException('Manifest must be ACKNOWLEDGED before transit');
    return prisma.hazmatManifest.update({
      where: { id },
      data: { status: 'IN_TRANSIT', shippedAt: shippedAt ? new Date(shippedAt) : new Date() },
    });
  }

  async deliverManifest(tenantId: string, id: string, deliveredAt?: string) {
    const m = await this.getManifest(tenantId, id);
    if (m.status !== 'IN_TRANSIT') throw new BadRequestException('Manifest must be IN_TRANSIT to be delivered');
    return prisma.hazmatManifest.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date() },
    });
  }

  async cancelManifest(tenantId: string, id: string) {
    const m = await this.getManifest(tenantId, id);
    if (['DELIVERED', 'CANCELLED'].includes(m.status)) throw new BadRequestException('Cannot cancel a DELIVERED or already CANCELLED manifest');
    return prisma.hazmatManifest.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ── Incidents ────────────────────────────────────────────────────────────

  async listIncidents(tenantId: string, productId?: string, open?: boolean) {
    return prisma.hazmatIncident.findMany({
      where: {
        tenantId,
        ...(productId && { productId }),
        ...(open === true && { closedAt: null }),
        ...(open === false && { closedAt: { not: null } }),
      },
      orderBy: { incidentDate: 'desc' },
    });
  }

  async getIncident(tenantId: string, id: string) {
    const inc = await prisma.hazmatIncident.findFirst({ where: { tenantId, id } });
    if (!inc) throw new NotFoundException('Incident not found');
    return inc;
  }

  async createIncident(tenantId: string, reportedBy: string, dto: {
    productId: string; warehouseId?: string; incidentDate: string;
    severity: string; description: string; immediateAction?: string;
  }) {
    const count = await prisma.hazmatIncident.count({ where: { tenantId } });
    const incidentNumber = `HMI-${String(count + 1).padStart(5, '0')}`;
    return prisma.hazmatIncident.create({
      data: {
        tenantId,
        incidentNumber,
        productId: dto.productId,
        warehouseId: dto.warehouseId ?? null,
        incidentDate: new Date(dto.incidentDate),
        severity: dto.severity,
        description: dto.description,
        immediateAction: dto.immediateAction ?? null,
        reportedBy,
      },
    });
  }

  async updateIncident(tenantId: string, id: string, dto: Partial<{
    rootCause: string; correctiveAction: string; reportedToAuthority: boolean; authorityRef: string;
  }>) {
    await this.getIncident(tenantId, id);
    return prisma.hazmatIncident.update({ where: { id }, data: { ...dto } });
  }

  async closeIncident(tenantId: string, id: string, closedBy: string) {
    const inc = await this.getIncident(tenantId, id);
    if (inc.closedAt) throw new BadRequestException('Incident already closed');
    return prisma.hazmatIncident.update({ where: { id }, data: { closedAt: new Date(), closedBy } });
  }

  // ── Reports & Dashboard ──────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [
      totalClassifications, totalSds, currentSds, expiredSds,
      totalManifests, draftManifests, inTransitManifests,
      totalIncidents, openIncidents,
    ] = await Promise.all([
      prisma.hazmatClassification.count({ where: { tenantId } }),
      prisma.safetyDataSheet.count({ where: { tenantId } }),
      prisma.safetyDataSheet.count({ where: { tenantId, status: 'CURRENT' } }),
      prisma.safetyDataSheet.count({ where: { tenantId, status: 'EXPIRED' } }),
      prisma.hazmatManifest.count({ where: { tenantId } }),
      prisma.hazmatManifest.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.hazmatManifest.count({ where: { tenantId, status: 'IN_TRANSIT' } }),
      prisma.hazmatIncident.count({ where: { tenantId } }),
      prisma.hazmatIncident.count({ where: { tenantId, closedAt: null } }),
    ]);

    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() + 30);
    const expiringSoon = await prisma.safetyDataSheet.count({
      where: { tenantId, status: 'CURRENT', expiryDate: { lte: cutoff30 } },
    });

    return {
      classifications: { total: totalClassifications },
      sds: { total: totalSds, current: currentSds, expired: expiredSds, expiringSoon },
      manifests: { total: totalManifests, draft: draftManifests, inTransit: inTransitManifests },
      incidents: { total: totalIncidents, open: openIncidents },
    };
  }

  async getComplianceReport(tenantId: string) {
    const classifications = await prisma.hazmatClassification.findMany({
      where: { tenantId },
      include: { sdsRecords: true },
    });

    return classifications.map((c) => {
      const currentSds = c.sdsRecords.filter((s) => s.status === 'CURRENT');
      const expiredSds = c.sdsRecords.filter((s) => s.status === 'EXPIRED');
      const unacknowledged = currentSds.filter((s) => !s.acknowledgedBy);
      return {
        productId: c.productId,
        unNumber: c.unNumber,
        hazardClass: c.hazardClass,
        regulation: c.regulation,
        sdsCount: c.sdsRecords.length,
        currentSds: currentSds.length,
        expiredSds: expiredSds.length,
        unacknowledgedSds: unacknowledged.length,
        compliant: currentSds.length > 0 && unacknowledged.length === 0,
      };
    });
  }

  async getHazardClassSummary(tenantId: string) {
    const classifications = await prisma.hazmatClassification.findMany({ where: { tenantId } });
    const byClass: Record<string, number> = {};
    for (const c of classifications) {
      byClass[c.hazardClass] = (byClass[c.hazardClass] ?? 0) + 1;
    }
    return Object.entries(byClass).map(([hazardClass, count]) => ({ hazardClass, count }));
  }

  async getUnNumberSearch(tenantId: string, unNumber: string) {
    return prisma.hazmatClassification.findMany({
      where: { tenantId, unNumber: { contains: unNumber, mode: 'insensitive' } },
      include: { sdsRecords: { where: { status: 'CURRENT' } } },
    });
  }
}
