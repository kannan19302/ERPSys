import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class DataQualityService {

  /* ── Scan for Duplicates ───────────────────── */

  async scanForDuplicates(tenantId: string, entityType: string) {
    let setsCreated = 0;

    if (entityType === 'Customer') {
      setsCreated = await this.scanCustomerDuplicates(tenantId);
    } else if (entityType === 'Product') {
      setsCreated = await this.scanProductDuplicates(tenantId);
    } else if (entityType === 'Vendor') {
      setsCreated = await this.scanVendorDuplicates(tenantId);
    } else {
      throw new Error(`Unsupported entity type for duplicate scan: ${entityType}`);
    }

    return { entityType, setsCreated };
  }

  private async scanCustomerDuplicates(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, phone: true },
    });

    let setsCreated = 0;

    // Group by email
    const emailGroups = new Map<string, string[]>();
    for (const c of customers) {
      if (c.email) {
        const key = c.email.toLowerCase();
        if (!emailGroups.has(key)) emailGroups.set(key, []);
        emailGroups.get(key)!.push(c.id);
      }
    }

    for (const [, ids] of emailGroups) {
      if (ids.length < 2) continue;
      await prisma.duplicateSet.create({
        data: {
          tenantId,
          entityType: 'Customer',
          recordIds: ids,
          matchScore: 1.0,
          matchFields: ['email'],
          status: 'PENDING',
        },
      });
      setsCreated++;
    }

    // Group by phone
    const phoneGroups = new Map<string, string[]>();
    for (const c of customers) {
      if (c.phone) {
        const key = c.phone.replace(/\D/g, '');
        if (!phoneGroups.has(key)) phoneGroups.set(key, []);
        phoneGroups.get(key)!.push(c.id);
      }
    }

    for (const [, ids] of phoneGroups) {
      if (ids.length < 2) continue;
      await prisma.duplicateSet.create({
        data: {
          tenantId,
          entityType: 'Customer',
          recordIds: ids,
          matchScore: 0.9,
          matchFields: ['phone'],
          status: 'PENDING',
        },
      });
      setsCreated++;
    }

    return setsCreated;
  }

  private async scanProductDuplicates(tenantId: string) {
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: { id: true, name: true, sku: true },
    });

    let setsCreated = 0;

    // Group by name
    const nameGroups = new Map<string, string[]>();
    for (const p of products) {
      if (p.name) {
        const key = p.name.toLowerCase().trim();
        if (!nameGroups.has(key)) nameGroups.set(key, []);
        nameGroups.get(key)!.push(p.id);
      }
    }

    for (const [, ids] of nameGroups) {
      if (ids.length < 2) continue;
      await prisma.duplicateSet.create({
        data: {
          tenantId,
          entityType: 'Product',
          recordIds: ids,
          matchScore: 1.0,
          matchFields: ['name'],
          status: 'PENDING',
        },
      });
      setsCreated++;
    }

    // Group by SKU
    const skuGroups = new Map<string, string[]>();
    for (const p of products) {
      if (p.sku) {
        const key = p.sku.toLowerCase().trim();
        if (!skuGroups.has(key)) skuGroups.set(key, []);
        skuGroups.get(key)!.push(p.id);
      }
    }

    for (const [, ids] of skuGroups) {
      if (ids.length < 2) continue;
      await prisma.duplicateSet.create({
        data: {
          tenantId,
          entityType: 'Product',
          recordIds: ids,
          matchScore: 1.0,
          matchFields: ['sku'],
          status: 'PENDING',
        },
      });
      setsCreated++;
    }

    return setsCreated;
  }

  private async scanVendorDuplicates(tenantId: string) {
    const vendors = await prisma.vendor.findMany({
      where: { tenantId },
      select: { id: true, name: true, taxId: true },
    });

    let setsCreated = 0;

    // Group by name
    const nameGroups = new Map<string, string[]>();
    for (const v of vendors) {
      if (v.name) {
        const key = v.name.toLowerCase().trim();
        if (!nameGroups.has(key)) nameGroups.set(key, []);
        nameGroups.get(key)!.push(v.id);
      }
    }

    for (const [, ids] of nameGroups) {
      if (ids.length < 2) continue;
      await prisma.duplicateSet.create({
        data: {
          tenantId,
          entityType: 'Vendor',
          recordIds: ids,
          matchScore: 1.0,
          matchFields: ['name'],
          status: 'PENDING',
        },
      });
      setsCreated++;
    }

    // Group by taxId
    const taxIdGroups = new Map<string, string[]>();
    for (const v of vendors) {
      if (v.taxId) {
        const key = v.taxId.trim();
        if (!taxIdGroups.has(key)) taxIdGroups.set(key, []);
        taxIdGroups.get(key)!.push(v.id);
      }
    }

    for (const [, ids] of taxIdGroups) {
      if (ids.length < 2) continue;
      await prisma.duplicateSet.create({
        data: {
          tenantId,
          entityType: 'Vendor',
          recordIds: ids,
          matchScore: 1.0,
          matchFields: ['taxId'],
          status: 'PENDING',
        },
      });
      setsCreated++;
    }

    return setsCreated;
  }

  /* ── Get Duplicate Sets ────────────────────── */

  async getDuplicateSets(tenantId: string, entityType?: string, status = 'PENDING') {
    const where: Record<string, any> = { tenantId, status };
    if (entityType) where.entityType = entityType;

    return prisma.duplicateSet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ── Merge Records ─────────────────────────── */

  async mergeRecords(tenantId: string, setId: string, masterId: string) {
    const set = await prisma.duplicateSet.findFirst({
      where: { id: setId, tenantId },
    });
    if (!set) throw new Error('Duplicate set not found');

    return prisma.duplicateSet.update({
      where: { id: setId },
      data: {
        status: 'MERGED',
        mergedIntoId: masterId,
        resolvedAt: new Date(),
      },
    });
  }

  /* ── Dismiss Set ───────────────────────────── */

  async dismissSet(tenantId: string, setId: string, userId: string) {
    const set = await prisma.duplicateSet.findFirst({
      where: { id: setId, tenantId },
    });
    if (!set) throw new Error('Duplicate set not found');

    return prisma.duplicateSet.update({
      where: { id: setId },
      data: {
        status: 'DISMISSED',
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });
  }
}
