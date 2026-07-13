import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class LotExpiryService {
  // ── Lot Records ───────────────────────────────────────────────────────────

  async registerLot(tenantId: string, userId: string, dto: {
    lotNumber: string; productId: string; warehouseId: string;
    expiryDate: Date; qty: number; manufactureDate?: Date;
    supplierId?: string; receiptRef?: string; notes?: string;
  }) {
    if (dto.qty <= 0) throw new BadRequestException('qty must be positive');
    const expiryDate = new Date(dto.expiryDate);
    if (expiryDate <= new Date()) throw new BadRequestException('expiryDate must be in the future');
    return prisma.lotExpiryRecord.create({
      data: {
        tenantId, lotNumber: dto.lotNumber, productId: dto.productId,
        warehouseId: dto.warehouseId, expiryDate,
        manufactureDate: dto.manufactureDate, qty: dto.qty, remainingQty: dto.qty,
        supplierId: dto.supplierId, receiptRef: dto.receiptRef,
        notes: dto.notes, createdById: userId,
      },
    });
  }

  async listLots(tenantId: string, params: {
    productId?: string; status?: string; expiringBeforeDays?: number;
    skip?: number; take?: number;
  }) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.status) where.status = params.status;
    if (params.expiringBeforeDays != null) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + params.expiringBeforeDays);
      where.expiryDate = { lte: cutoff };
    }
    const [items, total] = await Promise.all([
      prisma.lotExpiryRecord.findMany({ where, skip: params.skip ?? 0, take: params.take ?? 20, orderBy: { expiryDate: 'asc' } }),
      prisma.lotExpiryRecord.count({ where }),
    ]);
    return { items, total };
  }

  async getLot(tenantId: string, id: string) {
    const lot = await prisma.lotExpiryRecord.findFirst({ where: { tenantId, id } });
    if (!lot) throw new NotFoundException('Lot not found');
    return lot;
  }

  async quarantineLot(tenantId: string, id: string, reason: string) {
    const lot = await prisma.lotExpiryRecord.findFirst({ where: { tenantId, id } });
    if (!lot) throw new NotFoundException('Lot not found');
    if (lot.status !== 'ACTIVE') throw new BadRequestException('Only ACTIVE lots can be quarantined');
    return prisma.lotExpiryRecord.update({ where: { id }, data: { status: 'QUARANTINE', notes: reason } });
  }

  async releaseLot(tenantId: string, id: string) {
    const lot = await prisma.lotExpiryRecord.findFirst({ where: { tenantId, id } });
    if (!lot) throw new NotFoundException('Lot not found');
    if (lot.status !== 'QUARANTINE') throw new BadRequestException('Only QUARANTINE lots can be released');
    return prisma.lotExpiryRecord.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  // ── FEFO Picking ──────────────────────────────────────────────────────────

  async getFEFOPick(tenantId: string, productId: string, warehouseId: string, qtyNeeded: number) {
    if (qtyNeeded <= 0) throw new BadRequestException('qtyNeeded must be positive');
    const lots = await prisma.lotExpiryRecord.findMany({
      where: { tenantId, productId, warehouseId, status: 'ACTIVE' },
      orderBy: { expiryDate: 'asc' }, // Earliest expiry first = FEFO
    });
    let remaining = qtyNeeded;
    const picks: { lotId: string; lotNumber: string; expiryDate: Date; qty: number }[] = [];
    for (const lot of lots) {
      if (remaining <= 0) break;
      const available = Number(lot.remainingQty);
      const take = Math.min(available, remaining);
      picks.push({ lotId: lot.id, lotNumber: lot.lotNumber, expiryDate: lot.expiryDate, qty: take });
      remaining -= take;
    }
    if (remaining > 0) throw new BadRequestException(`Insufficient FEFO stock — short by ${remaining}`);
    return { picks, totalQty: qtyNeeded };
  }

  async consumeFromLot(tenantId: string, id: string, qty: number) {
    const lot = await prisma.lotExpiryRecord.findFirst({ where: { tenantId, id } });
    if (!lot) throw new NotFoundException('Lot not found');
    if (lot.status !== 'ACTIVE') throw new BadRequestException('Can only consume from ACTIVE lots');
    const remaining = Number(lot.remainingQty) - qty;
    if (remaining < 0) throw new BadRequestException('Insufficient quantity in lot');
    const newStatus = remaining === 0 ? 'DISPOSED' : 'ACTIVE';
    return prisma.lotExpiryRecord.update({ where: { id }, data: { remainingQty: remaining, status: newStatus } });
  }

  // ── Expiry Alerts ─────────────────────────────────────────────────────────

  async scanExpiryAlerts(tenantId: string, params?: { warnDays?: number; criticalDays?: number }) {
    const warnDays = params?.warnDays ?? 30;
    const criticalDays = params?.criticalDays ?? 7;
    const now = new Date();

    const lots = await prisma.lotExpiryRecord.findMany({
      where: {
        tenantId, status: 'ACTIVE',
        expiryDate: { lte: new Date(now.getTime() + warnDays * 86400000) },
      },
    });

    let created = 0;
    for (const lot of lots) {
      const daysToExpiry = Math.floor((lot.expiryDate.getTime() - now.getTime()) / 86400000);
      const alertLevel = daysToExpiry <= criticalDays ? 'CRITICAL' : daysToExpiry <= 0 ? 'CRITICAL' : 'WARNING';
      await prisma.lotExpiryAlert.create({
        data: { tenantId, lotId: lot.id, alertLevel: alertLevel as any, daysToExpiry },
      });
      if (daysToExpiry <= 0) {
        await prisma.lotExpiryRecord.update({ where: { id: lot.id }, data: { status: 'EXPIRED' } });
      }
      created++;
    }
    return { scanned: lots.length, alertsCreated: created };
  }

  async listAlerts(tenantId: string, dismissed = false) {
    return prisma.lotExpiryAlert.findMany({
      where: { tenantId, dismissed },
      orderBy: { alertedAt: 'desc' },
      take: 100,
    });
  }

  async dismissAlert(tenantId: string, id: string) {
    const alert = await prisma.lotExpiryAlert.findFirst({ where: { tenantId, id } });
    if (!alert) throw new NotFoundException('Alert not found');
    return prisma.lotExpiryAlert.update({ where: { id }, data: { dismissed: true } });
  }

  // ── Disposal ──────────────────────────────────────────────────────────────

  async disposeLot(tenantId: string, userId: string, dto: {
    lotId: string; disposalMethod: string; qtyDisposed: number; reason: string; notes?: string;
  }) {
    const lot = await prisma.lotExpiryRecord.findFirst({ where: { tenantId, id: dto.lotId } });
    if (!lot) throw new NotFoundException('Lot not found');
    if (!['ACTIVE', 'QUARANTINE', 'EXPIRED'].includes(lot.status)) {
      throw new BadRequestException('Cannot dispose a lot in current status');
    }
    if (dto.qtyDisposed <= 0) throw new BadRequestException('qtyDisposed must be positive');
    if (dto.qtyDisposed > Number(lot.remainingQty)) throw new BadRequestException('qtyDisposed exceeds remaining qty');

    const count = await prisma.lotDisposalRecord.count({ where: { tenantId } });
    const disposalNumber = `LDR-${String(count + 1).padStart(6, '0')}`;
    const record = await prisma.lotDisposalRecord.create({
      data: {
        tenantId, disposalNumber, lotId: dto.lotId,
        disposalMethod: dto.disposalMethod as any, qtyDisposed: dto.qtyDisposed,
        disposedById: userId, reason: dto.reason, notes: dto.notes,
      },
    });
    const newRemaining = Number(lot.remainingQty) - dto.qtyDisposed;
    const newStatus = newRemaining === 0 ? 'DISPOSED' : lot.status;
    await prisma.lotExpiryRecord.update({ where: { id: dto.lotId }, data: { remainingQty: newRemaining, status: newStatus } });
    return record;
  }

  async listDisposals(tenantId: string, lotId?: string) {
    const where: any = { tenantId };
    if (lotId) where.lotId = lotId;
    return prisma.lotDisposalRecord.findMany({ where, orderBy: { disposedAt: 'desc' }, take: 50 });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400000);
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const [total, active, quarantine, expired, disposed, expiring7, expiring30, openAlerts] = await Promise.all([
      prisma.lotExpiryRecord.count({ where: { tenantId } }),
      prisma.lotExpiryRecord.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.lotExpiryRecord.count({ where: { tenantId, status: 'QUARANTINE' } }),
      prisma.lotExpiryRecord.count({ where: { tenantId, status: 'EXPIRED' } }),
      prisma.lotExpiryRecord.count({ where: { tenantId, status: 'DISPOSED' } }),
      prisma.lotExpiryRecord.count({ where: { tenantId, status: 'ACTIVE', expiryDate: { lte: in7 } } }),
      prisma.lotExpiryRecord.count({ where: { tenantId, status: 'ACTIVE', expiryDate: { lte: in30 } } }),
      prisma.lotExpiryAlert.count({ where: { tenantId, dismissed: false } }),
    ]);
    return { total, active, quarantine, expired, disposed, expiring7, expiring30, openAlerts };
  }
}
