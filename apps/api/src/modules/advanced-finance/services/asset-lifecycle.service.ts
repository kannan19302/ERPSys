import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssetLifecycleService {
  private async getAsset(tenantId: string, assetId: string) {
    const a = await prisma.fixedAsset.findFirst({ where: { id: assetId, tenantId } });
    if (!a) throw new NotFoundException('Asset not found');
    return a;
  }

  async createAssetRevaluation(tenantId: string, dto: {
    assetId: string; revaluationDate: string; revaluedValue: number; notes?: string;
  }) {
    const asset = await this.getAsset(tenantId, dto.assetId);
    const before = Number(asset.currentValue);
    const gainLoss = dto.revaluedValue - before;

    const rev = await prisma.assetRevaluation.create({
      data: {
        tenantId,
        assetId: dto.assetId,
        revaluationDate: new Date(dto.revaluationDate),
        carryingValueBefore: before,
        revaluedValue: dto.revaluedValue,
        gainLoss,
        notes: dto.notes,
      },
    });

    // Update asset current value
    await prisma.fixedAsset.update({
      where: { id: dto.assetId },
      data: { currentValue: new Prisma.Decimal(dto.revaluedValue) },
    });

    return rev;
  }

  async listAssetRevaluations(tenantId: string, assetId: string) {
    return prisma.assetRevaluation.findMany({
      where: { tenantId, assetId },
      orderBy: { revaluationDate: 'desc' },
    });
  }

  async postAssetRevaluationGL(tenantId: string, revalId: string) {
    const rev = await prisma.assetRevaluation.findFirst({ where: { id: revalId, tenantId } });
    if (!rev) throw new NotFoundException('Revaluation record not found');
    if (rev.glJournalId) throw new BadRequestException('Revaluation already posted to GL');

    const asset = await this.getAsset(tenantId, rev.assetId);
    const gainLoss = Number(rev.gainLoss);

    const journal = await prisma.journal.create({
      data: {
        tenantId,
        orgId: asset.orgId,
        entryNumber: `JRN-REV-${Date.now()}`,
        date: new Date(rev.revaluationDate),
        status: 'POSTED',
        notes: `GL Adjustment for asset revaluation: ${asset.name} (${asset.assetCode})`,
      },
    });

    // Upward revaluation (Gain) vs Downward (Loss)
    if (gainLoss > 0) {
      // Debit Asset account, Credit Revaluation Reserve account
      await prisma.journalEntry.createMany({
        data: [
          {
            tenantId,
            journalId: journal.id,
            accountId: asset.accountId,
            debit: new Prisma.Decimal(gainLoss),
            credit: new Prisma.Decimal(0),
            description: `Revaluation gain upward adjustment for asset ${asset.assetCode}`,
          },
          {
            tenantId,
            journalId: journal.id,
            accountId: 'acc-reval-reserve-default',
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(gainLoss),
            description: `Credit revaluation reserve for asset ${asset.assetCode}`,
          },
        ],
      });
    } else {
      // Debit Impairment Expense account, Credit Asset account
      await prisma.journalEntry.createMany({
        data: [
          {
            tenantId,
            journalId: journal.id,
            accountId: 'acc-impairment-expense-default',
            debit: new Prisma.Decimal(Math.abs(gainLoss)),
            credit: new Prisma.Decimal(0),
            description: `Revaluation downward loss write-off for asset ${asset.assetCode}`,
          },
          {
            tenantId,
            journalId: journal.id,
            accountId: asset.accountId,
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(Math.abs(gainLoss)),
            description: `Credit asset account write-down for asset ${asset.assetCode}`,
          },
        ],
      });
    }

    await prisma.assetRevaluation.update({
      where: { id: revalId },
      data: { glJournalId: journal.id },
    });

    return { journalId: journal.id, gainLoss };
  }

  async createAssetDisposal(tenantId: string, dto: {
    assetId: string; disposalDate: string; disposalType: string; salePrice?: number; notes?: string;
  }) {
    const asset = await this.getAsset(tenantId, dto.assetId);
    if (asset.status === 'DISPOSED') throw new BadRequestException('Asset already disposed');

    const netBookValue = Number(asset.currentValue);
    const sale = dto.salePrice ?? 0;
    const gainLoss = sale - netBookValue;

    const disp = await prisma.assetDisposal.create({
      data: {
        tenantId,
        assetId: dto.assetId,
        disposalDate: new Date(dto.disposalDate),
        disposalType: dto.disposalType,
        salePrice: sale,
        gainLoss,
        notes: dto.notes,
      },
    });

    // Update asset status
    await prisma.fixedAsset.update({
      where: { id: dto.assetId },
      data: { status: 'DISPOSED', currentValue: 0 },
    });

    return disp;
  }

  async listAssetDisposals(tenantId: string) {
    return prisma.assetDisposal.findMany({
      where: { tenantId },
      orderBy: { disposalDate: 'desc' },
    });
  }

  async postAssetDisposalGL(tenantId: string, disposalId: string) {
    const disp = await prisma.assetDisposal.findFirst({ where: { id: disposalId, tenantId } });
    if (!disp) throw new NotFoundException('Disposal record not found');
    if (disp.glJournalId) throw new BadRequestException('Disposal already posted to GL');

    const asset = await this.getAsset(tenantId, disp.assetId);
    const purchaseVal = Number(asset.purchaseValue);
    const accumDepAgg = await prisma.assetDepreciation.aggregate({
      where: { tenantId, assetId: asset.id },
      _sum: { amount: true },
    });
    const accumDep = Number(accumDepAgg._sum?.amount ?? 0);
    const sale = Number(disp.salePrice);
    const gainLoss = Number(disp.gainLoss);

    const journal = await prisma.journal.create({
      data: {
        tenantId,
        orgId: asset.orgId,
        entryNumber: `JRN-DISP-${Date.now()}`,
        date: new Date(disp.disposalDate),
        status: 'POSTED',
        notes: `GL Write-off for asset disposal: ${asset.name} (${asset.assetCode})`,
      },
    });

    // Write off Asset Cost + Accumulated Depreciation, Debit Cash (if sold), Recognize Gain/Loss
    const entries = [
      // Credit Asset Account (original purchase cost)
      {
        tenantId,
        journalId: journal.id,
        accountId: asset.accountId,
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(purchaseVal),
        description: `Write off original asset cost for ${asset.assetCode}`,
      },
      // Debit Accum Depreciation Account
      {
        tenantId,
        journalId: journal.id,
        accountId: asset.accumDepAccountId,
        debit: new Prisma.Decimal(accumDep),
        credit: new Prisma.Decimal(0),
        description: `Write off accumulated depreciation for ${asset.assetCode}`,
      },
    ];

    if (sale > 0) {
      // Debit Cash/Receivable
      entries.push({
        tenantId,
        journalId: journal.id,
        accountId: 'acc-cash-default',
        debit: new Prisma.Decimal(sale),
        credit: new Prisma.Decimal(0),
        description: `Debit cash received from disposal sale of ${asset.assetCode}`,
      });
    }

    if (gainLoss > 0) {
      // Credit Gain on Disposal
      entries.push({
        tenantId,
        journalId: journal.id,
        accountId: 'acc-gain-disposal-default',
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(gainLoss),
        description: `Credit gain on disposal for asset ${asset.assetCode}`,
      });
    } else if (gainLoss < 0) {
      // Debit Loss on Disposal
      entries.push({
        tenantId,
        journalId: journal.id,
        accountId: 'acc-loss-disposal-default',
        debit: new Prisma.Decimal(Math.abs(gainLoss)),
        credit: new Prisma.Decimal(0),
        description: `Debit loss on disposal for asset ${asset.assetCode}`,
      });
    }

    await prisma.journalEntry.createMany({ data: entries });
    await prisma.assetDisposal.update({
      where: { id: disposalId },
      data: { glJournalId: journal.id },
    });

    return { journalId: journal.id, gainLoss };
  }

  async triggerImpairmentPostGL(tenantId: string, impairmentId: string) {
    const imp = await prisma.assetImpairment.findFirst({ where: { id: impairmentId, tenantId } });
    if (!imp) throw new NotFoundException('Impairment not found');
    if (imp.glJournalId) throw new BadRequestException('Impairment already posted');

    const asset = await this.getAsset(tenantId, imp.assetId);
    const loss = Number(imp.impairmentLoss);

    const journal = await prisma.journal.create({
      data: {
        tenantId,
        orgId: asset.orgId,
        entryNumber: `JRN-IMP-${Date.now()}`,
        date: new Date(imp.testDate),
        status: 'POSTED',
        notes: `GL Posting for asset impairment loss: ${asset.name}`,
      },
    });

    // Debit Impairment Expense, Credit Accumulated Impairment/Asset
    await prisma.journalEntry.createMany({
      data: [
        {
          tenantId,
          journalId: journal.id,
          accountId: 'acc-impairment-expense-default',
          debit: new Prisma.Decimal(loss),
          credit: new Prisma.Decimal(0),
          description: `Debit impairment loss expense for ${asset.assetCode}`,
        },
        {
          tenantId,
          journalId: journal.id,
          accountId: asset.accountId,
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(loss),
          description: `Credit asset cost write-down for impairment of ${asset.assetCode}`,
        },
      ],
    });

    await prisma.assetImpairment.update({
      where: { id: impairmentId },
      data: { status: 'POSTED', glJournalId: journal.id, postedAt: new Date() },
    });

    return { journalId: journal.id, impairmentLoss: loss };
  }

  async calculateDepreciationAfterReval(tenantId: string, assetId: string): Promise<number> {
    const asset = await this.getAsset(tenantId, assetId);
    const netValue = Number(asset.currentValue);
    const salvage = Number(asset.salvageValue);
    const yearsLeft = asset.usefulLifeYears ?? 5; // simplified remaining life

    const nextMonthlyDep = Math.max(0, (netValue - salvage) / (yearsLeft * 12));
    return Math.round(nextMonthlyDep * 100) / 100;
  }

  async getAssetAuditReport(tenantId: string, assetId: string) {
    const asset = await this.getAsset(tenantId, assetId);
    const [revals, impairments, deps] = await Promise.all([
      prisma.assetRevaluation.findMany({ where: { tenantId, assetId } }),
      prisma.assetImpairment.findMany({ where: { tenantId, assetId } }),
      prisma.assetDepreciation.findMany({ where: { tenantId, assetId } }),
    ]);

    const totalRevalGain = revals.reduce((s, r) => s + Number(r.gainLoss), 0);
    const totalImpairmentLoss = impairments.reduce((s, i) => s + Number(i.impairmentLoss), 0);
    const totalDepreciation = deps.reduce((s, d) => s + Number(d.amount), 0);

    return {
      assetId,
      code: asset.assetCode,
      originalCost: Number(asset.purchaseValue),
      accumDepreciation: totalDepreciation,
      netRevaluations: totalRevalGain,
      netImpairments: totalImpairmentLoss,
      currentBookValue: Number(asset.currentValue),
    };
  }

  async bulkDisposeAssets(tenantId: string, dto: { assetIds: string[]; disposalDate: string; disposalType: string }) {
    const created = [];
    for (const assetId of dto.assetIds) {
      try {
        const disp = await this.createAssetDisposal(tenantId, {
          assetId,
          disposalDate: dto.disposalDate,
          disposalType: dto.disposalType,
        });
        created.push(disp);
      } catch (e) {
        // skip failed ones
      }
    }
    return { disposedCount: created.length, records: created };
  }
}
