import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import {
  CreateFixedAssetCategoryInput,
  CreateFixedAssetInput,
  UpdateFixedAssetInput,
  TransferFixedAssetInput,
  LogFixedAssetMaintenanceInput,
} from '@unerp/shared';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FixedAssetCreatedEvent } from './events/fixed-asset-created.event';
import { FixedAssetDepreciatedEvent } from './events/fixed-asset-depreciated.event';

@Injectable()
export class FixedAssetsService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}
  
  // ─── CATEGORY METHODS ──────────────────────────────

  async getCategories(tenantId: string) {
    return prisma.fixedAssetCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(tenantId: string, input: CreateFixedAssetCategoryInput) {
    const existing = await prisma.fixedAssetCategory.findFirst({
      where: { tenantId, name: input.name },
    });
    if (existing) {
      throw new BadRequestException(`Asset category with name "${input.name}" already exists.`);
    }

    return prisma.fixedAssetCategory.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        depreciationMethod: input.depreciationMethod,
        expectedLifeMonths: input.expectedLifeMonths,
        depreciationRate: input.depreciationRate ? new Prisma.Decimal(input.depreciationRate) : null,
        assetAccountId: input.assetAccountId,
        depreciationAccountId: input.depreciationAccountId,
        expenseAccountId: input.expenseAccountId,
      },
    });
  }

  // ─── FIXED ASSET METHODS ───────────────────────────

  async getAssets(tenantId: string, filters?: { categoryId?: string; status?: string; locationId?: string }) {
    const whereClause: Prisma.FixedAssetWhereInput = { tenantId };

    if (filters?.categoryId) whereClause.categoryId = filters.categoryId;
    if (filters?.status) whereClause.status = filters.status;
    if (filters?.locationId) whereClause.locationId = filters.locationId;

    return prisma.fixedAsset.findMany({
      where: whereClause,
      include: {
        category: true,
        location: true,
        custodian: true,
      },
      orderBy: { assetCode: 'asc' },
    });
  }

  async getAssetById(tenantId: string, id: string) {
    const asset = await prisma.fixedAsset.findFirst({
      where: { tenantId, id },
      include: {
        category: true,
        location: true,
        custodian: true,
        depreciations: {
          orderBy: { date: 'desc' },
        },
        transfers: {
          orderBy: { transferDate: 'desc' },
        },
        maintenanceLogs: {
          orderBy: { maintenanceDate: 'desc' },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Fixed Asset with ID "${id}" not found.`);
    }

    return asset;
  }

  async createAsset(tenantId: string, orgId: string, userId: string, input: CreateFixedAssetInput) {
    // Verify asset code uniqueness
    const existingCode = await prisma.fixedAsset.findUnique({
      where: {
        tenantId_assetCode: {
          tenantId,
          assetCode: input.assetCode,
        },
      },
    });
    if (existingCode) {
      throw new BadRequestException(`Asset code "${input.assetCode}" is already in use.`);
    }

    // Verify category exists
    if (input.categoryId) {
      const category = await prisma.fixedAssetCategory.findFirst({
        where: { tenantId, id: input.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Asset category with ID "${input.categoryId}" not found.`);
      }
    }

    // Initial asset value equals purchase value
    const currentValue = new Prisma.Decimal(input.purchaseValue);

    const asset = await prisma.fixedAsset.create({
      data: {
        tenantId,
        orgId,
        assetCode: input.assetCode,
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        purchaseDate: new Date(input.purchaseDate),
        purchaseValue: new Prisma.Decimal(input.purchaseValue),
        salvageValue: new Prisma.Decimal(input.salvageValue),
        usefulLifeYears: input.usefulLifeYears,
        depreciationMethod: input.depreciationMethod,
        depreciationRate: input.depreciationRate ? new Prisma.Decimal(input.depreciationRate) : null,
        currentValue,
        accountId: input.accountId,
        accumDepAccountId: input.accumDepAccountId,
        locationId: input.locationId,
        custodianId: input.custodianId,
        status: 'ACTIVE',
        createdBy: userId,
        updatedBy: userId,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit(
        'assets.asset.created',
        new FixedAssetCreatedEvent(
          tenantId,
          asset.id,
          asset.assetCode,
          asset.name,
          Number(asset.purchaseValue),
          asset.purchaseDate
        )
      );
    }

    return asset;
  }

  async updateAsset(tenantId: string, id: string, userId: string, input: UpdateFixedAssetInput) {
    await this.getAssetById(tenantId, id);

    const updateData: Prisma.FixedAssetUpdateInput = {
      name: input.name,
      description: input.description,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchaseValue: input.purchaseValue ? new Prisma.Decimal(input.purchaseValue) : undefined,
      salvageValue: input.salvageValue ? new Prisma.Decimal(input.salvageValue) : undefined,
      usefulLifeYears: input.usefulLifeYears,
      depreciationMethod: input.depreciationMethod,
      depreciationRate: input.depreciationRate ? new Prisma.Decimal(input.depreciationRate) : undefined,
      accountId: input.accountId,
      accumDepAccountId: input.accumDepAccountId,
      status: input.status,
      updatedBy: userId,
      category: input.categoryId !== undefined
        ? (input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true })
        : undefined,
      location: input.locationId !== undefined
        ? (input.locationId ? { connect: { id: input.locationId } } : { disconnect: true })
        : undefined,
      custodian: input.custodianId !== undefined
        ? (input.custodianId ? { connect: { id: input.custodianId } } : { disconnect: true })
        : undefined,
    };

    return prisma.fixedAsset.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── LOCATION & CUSTODY TRANSFER ──────────────────

  async transferAsset(tenantId: string, id: string, userId: string, input: TransferFixedAssetInput) {
    const asset = await this.getAssetById(tenantId, id);

    return prisma.$transaction(async (tx) => {
      // 1. Create transfer log
      const log = await tx.assetTransferLog.create({
        data: {
          tenantId,
          assetId: id,
          transferDate: new Date(input.transferDate),
          fromLocationId: asset.locationId,
          toLocationId: input.toLocationId,
          fromCustodianId: asset.custodianId,
          toCustodianId: input.toCustodianId,
          reason: input.reason,
          performedBy: userId,
        },
      });

      // 2. Update asset status
      await tx.fixedAsset.update({
        where: { id },
        data: {
          locationId: input.toLocationId,
          custodianId: input.toCustodianId,
          updatedBy: userId,
        },
      });

      return log;
    });
  }

  // ─── MAINTENANCE METHODS ──────────────────────────

  async logMaintenance(tenantId: string, id: string, userId: string, input: LogFixedAssetMaintenanceInput) {
    await this.getAssetById(tenantId, id);

    return prisma.$transaction(async (tx) => {
      // 1. Create maintenance record
      const log = await tx.assetMaintenanceLog.create({
        data: {
          tenantId,
          assetId: id,
          maintenanceDate: new Date(input.maintenanceDate),
          type: input.type,
          description: input.description,
          cost: new Prisma.Decimal(input.cost),
          performedBy: input.performedBy,
          nextMaintenanceDate: input.nextMaintenanceDate ? new Date(input.nextMaintenanceDate) : null,
        },
      });

      // 2. Temporarily set status to maintenance if CORRECTIVE or CALIBRATION
      if (input.type === 'CORRECTIVE' || input.type === 'CALIBRATION') {
        await tx.fixedAsset.update({
          where: { id },
          data: {
            status: 'UNDER_MAINTENANCE',
            updatedBy: userId,
          },
        });
      }

      return log;
    });
  }

  // ─── DEPRECIATION MATHEMATICS & GL POSTING ────────

  async postDepreciation(tenantId: string, orgId: string, userId: string, assetId: string, periodName: string) {
    const asset = await this.getAssetById(tenantId, assetId);

    // Verify depreciation hasn't already been run for this asset in this period
    const existing = await prisma.assetDepreciation.findFirst({
      where: { tenantId, assetId, periodName },
    });
    if (existing) {
      throw new BadRequestException(`Depreciation for asset "${asset.name}" in period "${periodName}" is already posted.`);
    }

    // Load category mapping GL accounts
    let category = asset.category;
    if (!category && asset.categoryId) {
      category = await prisma.fixedAssetCategory.findFirst({
        where: { tenantId, id: asset.categoryId },
      });
    }

    // Depreciation math
    let amount = new Prisma.Decimal(0);
    const cost = new Prisma.Decimal(asset.purchaseValue);
    const salvage = new Prisma.Decimal(asset.salvageValue);
    const method = asset.depreciationMethod;

    if (method === 'SLM' || method === 'STRAIGHT_LINE') {
      const depreciableAmount = cost.minus(salvage);
      const annualDep = depreciableAmount.div(asset.usefulLifeYears);
      amount = annualDep.div(12); // monthly depreciation slice
    } else if (method === 'WDV' || method === 'DOUBLE_DECLINING') {
      // Written Down Value (WDV)
      const rate = asset.depreciationRate 
        ? new Prisma.Decimal(asset.depreciationRate).div(100) 
        : (category?.depreciationRate ? new Prisma.Decimal(category.depreciationRate).div(100) : new Prisma.Decimal(0.20)); // default 20%
      
      const currentAssetVal = new Prisma.Decimal(asset.currentValue);
      const annualDep = currentAssetVal.mul(rate);
      amount = annualDep.div(12);
    } else {
      throw new BadRequestException(`Unsupported depreciation method "${method}".`);
    }

    // Safeguard to ensure book value never drops below salvage value
    const currentVal = new Prisma.Decimal(asset.currentValue);
    const maxAllowedDepreciation = currentVal.minus(salvage);
    if (amount.greaterThan(maxAllowedDepreciation)) {
      amount = maxAllowedDepreciation;
    }

    if (amount.lessThanOrEqualTo(0)) {
      throw new BadRequestException(`Asset "${asset.name}" has already reached its salvage value or cannot be depreciated further.`);
    }

    const newBookValue = currentVal.minus(amount);
    const pastDepSum = await prisma.assetDepreciation.aggregate({
      where: { tenantId, assetId },
      _sum: { amount: true },
    });
    const oldAccumulated = pastDepSum._sum.amount ? new Prisma.Decimal(pastDepSum._sum.amount) : new Prisma.Decimal(0);
    const newAccumulated = oldAccumulated.plus(amount);

    return prisma.$transaction(async (tx) => {
      let journalId: string | null = null;

      // GL Journal posting (only if cost, accumulated dep, and expense accounts are mapped)
      const assetAcc = asset.accountId || category?.assetAccountId;
      const accumAcc = asset.accumDepAccountId || category?.depreciationAccountId;
      const expenseAcc = category?.expenseAccountId;

      if (assetAcc && accumAcc && expenseAcc) {
        const entryNumber = `JV-DEP-${asset.assetCode}-${periodName}-${Date.now().toString().slice(-4)}`;
        
        const journal = await tx.journal.create({
          data: {
            tenantId,
            orgId,
            entryNumber,
            date: new Date(),
            status: 'POSTED',
            notes: `Depreciation run for ${asset.name} (${asset.assetCode}) for period ${periodName}`,
            createdBy: userId,
          },
        });

        journalId = journal.id;

        // Debit Depreciation Expense
        await tx.journalEntry.create({
          data: {
            tenantId,
            journalId: journal.id,
            accountId: expenseAcc,
            debit: amount,
            credit: 0,
            description: `Depreciation Expense - ${asset.name}`,
          },
        });

        // Credit Accumulated Depreciation
        await tx.journalEntry.create({
          data: {
            tenantId,
            journalId: journal.id,
            accountId: accumAcc,
            debit: 0,
            credit: amount,
            description: `Accumulated Depreciation Contra-Asset - ${asset.name}`,
          },
        });
      }

      // Record Depreciation Run
      const depRecord = await tx.assetDepreciation.create({
        data: {
          tenantId,
          assetId,
          date: new Date(),
          amount,
          periodName,
          accumulatedDepreciation: newAccumulated,
          bookValue: newBookValue,
          status: 'POSTED',
          journalId,
        },
      });

      // Update Asset Net Book Value
      await tx.fixedAsset.update({
        where: { id: assetId },
        data: {
          currentValue: newBookValue,
          updatedBy: userId,
        },
      });

      if (this.eventEmitter) {
        this.eventEmitter.emit(
          'assets.asset.depreciated',
          new FixedAssetDepreciatedEvent(
            tenantId,
            assetId,
            Number(amount),
            periodName,
            journalId
          )
        );
      }

      return depRecord;
    });
  }
}
