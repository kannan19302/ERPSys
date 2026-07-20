import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import {
  CreateProductInput, UpdateProductInput,
  CreateCategoryInput, UpdateCategoryInput,
  CreateVariantInput, CreateBinLocationInput,
  CreateSerialNumberInput, UpdateSerialNumberInput,
  CreateBatchInput, UpdateBatchInput,
  CreateCycleCountInput, SubmitCycleCountInput,
  CreateCycleCountScheduleInput, UpdateCycleCountScheduleInput,
  CreateLicensePlateInput, AddLicensePlateItemInput, MoveLicensePlateInput,
  CreatePutawayTaskInput, CompletePutawayTaskInput,
  QuarantineBatchInput, ReleaseBatchQuarantineInput,
  CreateStockReservationInput,
  AssembleKitInput, DisassembleKitInput,
  CreateTransferApprovalRuleInput, UpdateTransferApprovalRuleInput, RejectTransferInput,
  CreateDockAppointmentInput, UpdateDockAppointmentInput,
  CreatePickWaveInput, RecordPickInput,
  CreateConsignmentStockInput, RecordConsignmentConsumptionInput,
  ReceiveWithTraceabilityInput,
  CreateQAInspectionTemplateInput, UpdateQAInspectionTemplateInput,
  CreateRequisitionFromReorderRuleInput,
  CreateKitVersionInput,
  CreateQAInspectionInput, SubmitQAInspectionInput,
  CreateReorderRuleInput, CreateKitInput,
  CreateStockEntryInput,
  TransferStockInput,
} from '@unerp/shared';
import { Prisma } from '@prisma/client';

import {
  buildPaginationValues,
  paginatedResult,
  resolveOrgId,
  PaginatedResult,
  PaginationParams,
} from '../../common/utils/pagination.util';
import { InventoryProductsService } from './inventory-products.service';
import { InventoryQaService } from './inventory-qa.service';

@Injectable()
export class InventoryService {
  private readonly productsService: InventoryProductsService;
  private readonly qaService: InventoryQaService;

  constructor(
    @Inject(InventoryProductsService)
    productsService?: InventoryProductsService,
    @Inject(InventoryQaService)
    qaService?: InventoryQaService,
  ) {
    this.productsService = productsService || new InventoryProductsService();
    this.qaService = qaService || new InventoryQaService();
  }

  // ─── PRODUCTS ─────────────────────────────────────

  async getProducts(
    tenantId: string,
    params: PaginationParams & { type?: string; category?: string } = {},
  ): Promise<PaginatedResult<any>> {
    return this.productsService.getProducts(tenantId, params);
  }

  async getProductById(tenantId: string, id: string) {
    return this.productsService.getProductById(tenantId, id);
  }

  async createProduct(tenantId: string, orgId: string, dto: CreateProductInput) {
    return this.productsService.createProduct(tenantId, orgId, dto);
  }

  async updateProduct(tenantId: string, id: string, dto: UpdateProductInput) {
    return this.productsService.updateProduct(tenantId, id, dto);
  }

  async deleteProduct(tenantId: string, id: string) {
    return this.productsService.deleteProduct(tenantId, id);
  }

  // ─── STOCK LEVELS ────────────────────────────────────

  async getStockLevels(tenantId: string, params: PaginationParams & { warehouseId?: string } = {}) {
    return this.productsService.getStockLevels(tenantId, params);
  }

  // ─── BULK ──────────────────────────────────────────

  async bulkAction(tenantId: string, action: string, ids: string[], data?: Record<string, unknown>) {
    return this.productsService.bulkAction(tenantId, action, ids, data);
  }

  // ─── STATS ─────────────────────────────────────────

  async getInventoryStats(tenantId: string) {
    return this.productsService.getInventoryStats(tenantId);
  }

  // ─── PRODUCT CATEGORIES ─────────────────────────────

  async getCategories(tenantId: string, params: PaginationParams = {}) {
    return this.productsService.getCategories(tenantId, params);
  }

  async getCategoryById(tenantId: string, id: string) {
    return this.productsService.getCategoryById(tenantId, id);
  }

  async createCategory(tenantId: string, orgId: string, dto: CreateCategoryInput) {
    return this.productsService.createCategory(tenantId, orgId, dto);
  }

  async updateCategory(tenantId: string, id: string, dto: UpdateCategoryInput) {
    return this.productsService.updateCategory(tenantId, id, dto);
  }

  async deleteCategory(tenantId: string, id: string) {
    return this.productsService.deleteCategory(tenantId, id);
  }

  // ─── PRODUCT VARIANTS ───────────────────────────────

  async getProductVariants(tenantId: string, parentSkuId: string) {
    return this.productsService.getProductVariants(tenantId, parentSkuId);
  }

  async createProductVariant(tenantId: string, dto: CreateVariantInput) {
    return this.productsService.createProductVariant(tenantId, dto);
  }

  async updateProductVariant(tenantId: string, id: string, dto: any) {
    return this.productsService.updateProductVariant(tenantId, id, dto);
  }

  async deleteProductVariant(tenantId: string, id: string) {
    return this.productsService.deleteProductVariant(tenantId, id);
  }

  // ─── UNITS OF MEASURE ───────────────────────────────

  async getUoMs(tenantId: string) {
    return this.productsService.getUoMs(tenantId);
  }

  async createUoM(tenantId: string, dto: any) {
    return this.productsService.createUoM(tenantId, dto);
  }

  async getUoMConversions(tenantId: string) {
    return this.productsService.getUoMConversions(tenantId);
  }

  async createUoMConversion(tenantId: string, dto: any) {
    return this.productsService.createUoMConversion(tenantId, dto);
  }

  // ─── BIN LOCATIONS ──────────────────────────────────

  async getBinLocations(tenantId: string, warehouseId?: string) {
    const where: any = { tenantId, isActive: true };
    if (warehouseId) where.warehouseId = warehouseId;

    return prisma.binLocation.findMany({
      where,
      include: { warehouse: true },
      orderBy: { code: 'asc' },
    });
  }

  async getBinLocationById(tenantId: string, id: string) {
    const bin = await prisma.binLocation.findFirst({
      where: { id, tenantId },
      include: { warehouse: true },
    });
    if (!bin) throw new NotFoundException('Bin location not found');
    return bin;
  }

  async createBinLocation(tenantId: string, dto: CreateBinLocationInput) {
    return prisma.binLocation.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        zone: dto.zone || 'A',
        aisle: dto.aisle,
        rack: dto.rack,
        bin: dto.bin,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity ? new Prisma.Decimal(dto.capacity) : null,
        isActive: dto.isActive,
      },
    });
  }

  async updateBinLocation(tenantId: string, id: string, dto: any) {
    const bin = await prisma.binLocation.findFirst({ where: { id, tenantId } });
    if (!bin) throw new NotFoundException('Bin location not found');

    return prisma.binLocation.update({
      where: { id },
      data: {
        zone: dto.zone,
        aisle: dto.aisle,
        rack: dto.rack,
        bin: dto.bin,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        capacity: dto.capacity ? new Prisma.Decimal(dto.capacity) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deleteBinLocation(tenantId: string, id: string) {
    const bin = await prisma.binLocation.findFirst({ where: { id, tenantId } });
    if (!bin) throw new NotFoundException('Bin location not found');

    await prisma.binLocation.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }

  // ─── TRACEABILITY (SERIAL NUMBERS) ──────────────────

  async getSerialNumbers(tenantId: string, params: PaginationParams & { productId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.serialNo = { contains: params.search, mode: 'insensitive' };
    }

    const { skip, take } = buildPaginationValues(params);

    const [serials, total] = await Promise.all([
      prisma.serialNumber.findMany({
        where,
        include: { product: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serialNumber.count({ where }),
    ]);

    return paginatedResult(serials, total, params);
  }

  async getSerialNumberById(tenantId: string, id: string) {
    const sn = await prisma.serialNumber.findFirst({
      where: { id, tenantId },
      include: { product: true, history: true },
    });
    if (!sn) throw new NotFoundException('Serial number not found');
    return sn;
  }

  async createSerialNumber(tenantId: string, dto: CreateSerialNumberInput) {
    return prisma.serialNumber.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        serialNo: dto.serialNo,
        status: dto.status || 'AVAILABLE',
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
        purchaseOrderId: dto.purchaseOrderId,
        salesOrderId: dto.salesOrderId,
        notes: dto.notes,
        customFields: (dto.customFields || {}) as any,
      },
    });
  }

  async updateSerialNumber(tenantId: string, id: string, dto: UpdateSerialNumberInput) {
    const sn = await prisma.serialNumber.findFirst({ where: { id, tenantId } });
    if (!sn) throw new NotFoundException('Serial number not found');

    const updateData: any = {
      status: dto.status,
      warehouseId: dto.warehouseId,
      notes: dto.notes,
      customFields: dto.customFields,
    };
    if (dto.purchaseDate !== undefined) updateData.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    if (dto.warrantyExpiry !== undefined) updateData.warrantyExpiry = dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null;

    return prisma.serialNumber.update({
      where: { id },
      data: updateData,
    });
  }

  async getSerialNumberHistory(tenantId: string, serialNumberId: string) {
    return prisma.serialNumberHistory.findMany({
      where: { tenantId, serialNumberId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── BATCH / LOT CONTROL ─────────────────────────────

  async getBatches(tenantId: string, params: PaginationParams & { productId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.batchNo = { contains: params.search, mode: 'insensitive' };
    }

    const { skip, take } = buildPaginationValues(params);

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: { product: true },
        skip,
        take,
        orderBy: { expiryDate: 'asc' },
      }),
      prisma.batch.count({ where }),
    ]);

    return paginatedResult(batches, total, params);
  }

  async getBatchById(tenantId: string, id: string) {
    const batch = await prisma.batch.findFirst({
      where: { id, tenantId },
      include: { product: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async createBatch(tenantId: string, dto: CreateBatchInput) {
    return prisma.batch.create({
      data: {
        tenantId,
        productId: dto.productId,
        batchNo: dto.batchNo,
        lotNo: dto.lotNo,
        quantity: new Prisma.Decimal(dto.quantity),
        manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        supplierBatchNo: dto.supplierBatchNo,
        costPrice: dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null,
        status: dto.status || 'ACTIVE',
        notes: dto.notes,
      },
    });
  }

  async updateBatch(tenantId: string, id: string, dto: UpdateBatchInput) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');

    const updateData: any = {
      lotNo: dto.lotNo,
      status: dto.status,
      notes: dto.notes,
      supplierBatchNo: dto.supplierBatchNo,
    };
    if (dto.quantity !== undefined) updateData.quantity = new Prisma.Decimal(dto.quantity);
    if (dto.manufactureDate !== undefined) updateData.manufactureDate = dto.manufactureDate ? new Date(dto.manufactureDate) : null;
    if (dto.expiryDate !== undefined) updateData.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.costPrice !== undefined) updateData.costPrice = dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null;

    return prisma.batch.update({
      where: { id },
      data: updateData,
    });
  }

  // ─── BATCH QUARANTINE WORKFLOW ───────────────────────

  async quarantineBatch(tenantId: string, id: string, userId: string, dto: QuarantineBatchInput) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status === 'QUARANTINE') throw new BadRequestException('Batch is already quarantined');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.batch.update({ where: { id }, data: { status: 'QUARANTINE' } });
      await tx.batchQuarantineLog.create({
        data: { tenantId, batchId: id, action: 'QUARANTINED', reason: dto.reason, performedBy: userId },
      });
      return updated;
    });
  }

  async releaseBatchQuarantine(tenantId: string, id: string, userId: string, dto: ReleaseBatchQuarantineInput) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'QUARANTINE') throw new BadRequestException('Batch is not quarantined');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.batch.update({ where: { id }, data: { status: 'ACTIVE' } });
      await tx.batchQuarantineLog.create({
        data: { tenantId, batchId: id, action: 'RELEASED', reason: dto.reason, performedBy: userId },
      });
      return updated;
    });
  }

  async rejectBatchQuarantine(tenantId: string, id: string, userId: string, dto: ReleaseBatchQuarantineInput) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'QUARANTINE') throw new BadRequestException('Batch is not quarantined');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.batch.update({ where: { id }, data: { status: 'EXPIRED' } });
      await tx.batchQuarantineLog.create({
        data: { tenantId, batchId: id, action: 'REJECTED', reason: dto.reason, performedBy: userId },
      });
      return updated;
    });
  }

  async getBatchQuarantineLog(tenantId: string, batchId: string) {
    return prisma.batchQuarantineLog.findMany({
      where: { tenantId, batchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Full genealogy trace for a batch: origin stock entry, license-plate placements, and consumption via stock entry items. */
  async getBatchGenealogy(tenantId: string, id: string) {
    const batch = await prisma.batch.findFirst({
      where: { id, tenantId },
      include: {
        product: true,
        originStockEntry: true,
        stockEntryItems: { include: { stockEntry: true } },
        licensePlateItems: { include: { licensePlate: true } },
      },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    return {
      batch: { id: batch.id, batchNo: batch.batchNo, lotNo: batch.lotNo, status: batch.status, product: batch.product },
      origin: batch.originStockEntry ?? null,
      consumedIn: batch.stockEntryItems.map((i) => i.stockEntry),
      licensePlates: batch.licensePlateItems.map((i) => i.licensePlate),
    };
  }

  /** Batches expiring within a window, FEFO-sorted (soonest expiry first), for proactive rotation/markdown decisions. */
  async getExpiringBatchesReport(tenantId: string, withinDays = 30) {
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    const batches = await prisma.batch.findMany({
      where: { tenantId, expiryDate: { not: null, lte: cutoff }, status: { in: ['ACTIVE', 'PARTIALLY_USED'] } },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });

    return {
      windowDays: withinDays,
      count: batches.length,
      batches: batches.map((b) => ({
        batchId: b.id,
        batchNo: b.batchNo,
        productName: b.product.name,
        sku: b.product.sku,
        quantity: Number(b.quantity) - Number(b.usedQty),
        expiryDate: b.expiryDate,
        daysUntilExpiry: b.expiryDate ? Math.ceil((b.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null,
      })),
    };
  }

  /** FEFO pick suggestion: allocates the requested quantity across the soonest-expiring batches first. */
  async getFefoPickSuggestion(tenantId: string, productId: string, warehouseId: string, quantity: number) {
    const batches = await prisma.batch.findMany({
      where: { tenantId, productId, status: { in: ['ACTIVE', 'PARTIALLY_USED'] } },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }],
    });

    let remaining = quantity;
    const allocations: Array<{ batchId: string; batchNo: string; expiryDate: Date | null; allocatedQty: number }> = [];

    for (const batch of batches) {
      if (remaining <= 0) break;
      const available = Number(batch.quantity) - Number(batch.usedQty);
      if (available <= 0) continue;
      const allocatedQty = Math.min(available, remaining);
      allocations.push({ batchId: batch.id, batchNo: batch.batchNo, expiryDate: batch.expiryDate, allocatedQty });
      remaining -= allocatedQty;
    }

    return { productId, warehouseId, requestedQty: quantity, fulfilledQty: quantity - remaining, shortfall: remaining, allocations };
  }

  /**
   * Recall notice: batch genealogy plus any consumption stock entries carrying a sales-order
   * reference, so an affected-customer list can be compiled from real traceability data
   * rather than assumed — entries without a populated reference are honestly listed as unknown.
   */
  async getBatchRecallNotice(tenantId: string, batchId: string) {
    const genealogy = await this.getBatchGenealogy(tenantId, batchId);

    const affectedReferences = genealogy.consumedIn
      .filter((entry) => entry.referenceType === 'SALES_ORDER' && entry.referenceDoc)
      .map((entry) => ({ salesOrderId: entry.referenceDoc, stockEntryNumber: entry.entryNumber }));

    const untracedConsumptions = genealogy.consumedIn.filter((entry) => !(entry.referenceType === 'SALES_ORDER' && entry.referenceDoc)).length;

    return {
      batch: genealogy.batch,
      generatedAt: new Date().toISOString(),
      affectedSalesOrders: affectedReferences,
      untracedConsumptions,
      licensePlatesInvolved: genealogy.licensePlates.map((p) => p.code),
      recommendedAction: genealogy.batch.status === 'QUARANTINE' ? 'Already quarantined — proceed to customer notification' : 'Quarantine remaining stock immediately, then notify affected customers',
    };
  }

  /** Where-used trace for a serial number: full status history plus any license-plate placements. */
  async getSerialNumberTrace(tenantId: string, serialNumberId: string) {
    const serial = await prisma.serialNumber.findFirst({
      where: { id: serialNumberId, tenantId },
      include: { product: true, history: { orderBy: { createdAt: 'desc' } }, licensePlateItems: { include: { licensePlate: true } } },
    });
    if (!serial) throw new NotFoundException('Serial number not found');

    return {
      serial: { id: serial.id, serialNo: serial.serialNo, status: serial.status, product: serial.product },
      history: serial.history,
      licensePlates: serial.licensePlateItems.map((i) => i.licensePlate),
    };
  }

  // ─── STOCK RESERVATIONS & ALLOCATION ─────────────────

  async getStockReservations(tenantId: string, params: PaginationParams & { productId?: string; warehouseId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;

    const { skip, take } = buildPaginationValues(params);
    const [reservations, total] = await Promise.all([
      prisma.stockReservation.findMany({
        where,
        include: { product: true, warehouse: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockReservation.count({ where }),
    ]);
    return paginatedResult(reservations, total, params);
  }

  /** Sum of currently ACTIVE reservations for a product in a warehouse — the "committed" quantity for allocation reporting. */
  async getAllocationSummary(tenantId: string, productId: string, warehouseId: string) {
    const [item, active] = await Promise.all([
      prisma.inventoryItem.findFirst({ where: { tenantId, productId, warehouseId } }),
      prisma.stockReservation.aggregate({
        where: { tenantId, productId, warehouseId, status: 'ACTIVE' },
        _sum: { quantity: true },
      }),
    ]);

    const onHand = Number(item?.quantity ?? 0);
    const reserved = Number(active._sum.quantity ?? 0);

    return { productId, warehouseId, onHand, reserved, available: onHand - reserved };
  }

  async createStockReservation(tenantId: string, userId: string, dto: CreateStockReservationInput) {
    const summary = await this.getAllocationSummary(tenantId, dto.productId, dto.warehouseId);
    if (summary.available < dto.quantity) {
      throw new BadRequestException(`Insufficient available stock: ${summary.available} available, ${dto.quantity} requested`);
    }

    return prisma.stockReservation.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantity: new Prisma.Decimal(dto.quantity),
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        notes: dto.notes,
        createdBy: userId,
        status: 'ACTIVE',
      },
    });
  }

  async releaseStockReservation(tenantId: string, id: string) {
    const reservation = await prisma.stockReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) throw new NotFoundException('Stock reservation not found');
    if (reservation.status !== 'ACTIVE') throw new BadRequestException('Reservation is not active');

    return prisma.stockReservation.update({ where: { id }, data: { status: 'RELEASED', releasedAt: new Date() } });
  }

  async fulfillStockReservation(tenantId: string, id: string) {
    const reservation = await prisma.stockReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) throw new NotFoundException('Stock reservation not found');
    if (reservation.status !== 'ACTIVE') throw new BadRequestException('Reservation is not active');

    return prisma.stockReservation.update({ where: { id }, data: { status: 'FULFILLED', fulfilledAt: new Date() } });
  }

  // ─── INVENTORY ANALYTICS (ABC, dead-stock, turnover) ─

  /** ABC classification by annual consumption value (Pareto: top ~80% value = A, next ~15% = B, remainder = C). */
  async getAbcClassification(tenantId: string, warehouseId?: string) {
    const where: any = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;

    const items = await prisma.inventoryItem.findMany({ where, include: { product: true } });
    const ranked = items
      .map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        sku: i.product.sku,
        value: Number(i.quantity) * Number(i.product.costPrice),
      }))
      .sort((a, b) => b.value - a.value);

    const totalValue = ranked.reduce((sum, r) => sum + r.value, 0);
    let cumulative = 0;
    const classified = ranked.map((r) => {
      cumulative += r.value;
      const cumulativePct = totalValue > 0 ? (cumulative / totalValue) * 100 : 0;
      const cls = cumulativePct <= 80 ? 'A' : cumulativePct <= 95 ? 'B' : 'C';
      return { ...r, cumulativePct: Number(cumulativePct.toFixed(2)), class: cls };
    });

    return {
      warehouseId: warehouseId ?? null,
      totalValue,
      counts: {
        A: classified.filter((c) => c.class === 'A').length,
        B: classified.filter((c) => c.class === 'B').length,
        C: classified.filter((c) => c.class === 'C').length,
      },
      items: classified,
    };
  }

  /** Dead-stock report: items with no stock movement (no stock ledger entry) in the trailing window, still holding value. */
  async getDeadStockReport(tenantId: string, warehouseId?: string, sinceDays = 90) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const where: any = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;

    const items = await prisma.inventoryItem.findMany({ where, include: { product: true } });
    const results: Array<{ productId: string; productName: string; sku: string; warehouseId: string; quantity: number; value: number; lastMovementAt: Date | null }> = [];

    for (const item of items) {
      if (Number(item.quantity) <= 0) continue;
      const lastEntry = await prisma.stockLedgerEntry.findFirst({
        where: { tenantId, productId: item.productId, warehouseId: item.warehouseId },
        orderBy: { createdAt: 'desc' },
      });
      const lastMovementAt = lastEntry?.createdAt ?? null;
      if (!lastMovementAt || lastMovementAt < since) {
        results.push({
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          warehouseId: item.warehouseId,
          quantity: Number(item.quantity),
          value: Number(item.quantity) * Number(item.product.costPrice),
          lastMovementAt,
        });
      }
    }

    return { warehouseId: warehouseId ?? null, windowDays: sinceDays, deadStockItems: results, totalDeadValue: results.reduce((s, r) => s + r.value, 0) };
  }

  /** Inventory turnover ratio: total quantity issued (OUT-type ledger entries) over the window, divided by average on-hand quantity. */
  async getTurnoverReport(tenantId: string, warehouseId?: string, sinceDays = 365) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const where: any = { tenantId, createdAt: { gte: since } };
    if (warehouseId) where.warehouseId = warehouseId;

    const [issuedAgg, itemsWhere] = await Promise.all([
      prisma.stockLedgerEntry.groupBy({
        by: ['productId'],
        where: { ...where, quantity: { lt: 0 } },
        _sum: { quantity: true },
      }),
      (async () => {
        const w: any = { tenantId };
        if (warehouseId) w.warehouseId = warehouseId;
        return prisma.inventoryItem.findMany({ where: w, include: { product: true } });
      })(),
    ]);

    const issuedByProduct = new Map(issuedAgg.map((r) => [r.productId, Math.abs(Number(r._sum.quantity ?? 0))]));

    const results = itemsWhere.map((item) => {
      const issued = issuedByProduct.get(item.productId) ?? 0;
      const onHand = Number(item.quantity);
      const turnoverRatio = onHand > 0 ? Number((issued / onHand).toFixed(2)) : null;
      return {
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        issuedQty: issued,
        onHandQty: onHand,
        turnoverRatio,
      };
    });

    return { warehouseId: warehouseId ?? null, windowDays: sinceDays, items: results.sort((a, b) => (b.turnoverRatio ?? 0) - (a.turnoverRatio ?? 0)) };
  }

  // ─── STOCK ENTRIES & LEDGER ─────────────────────────

  async getStockEntries(tenantId: string, params: PaginationParams & { type?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.entryNumber = { contains: params.search, mode: 'insensitive' };
    }

    const { skip, take } = buildPaginationValues(params);

    const [entries, total] = await Promise.all([
      prisma.stockEntry.findMany({
        where,
        include: { items: { include: { product: true } } },
        skip,
        take,
        orderBy: { postingDate: 'desc' },
      }),
      prisma.stockEntry.count({ where }),
    ]);

    return paginatedResult(entries, total, params);
  }

  async getStockEntryById(tenantId: string, id: string) {
    const entry = await prisma.stockEntry.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true, fromBin: true, toBin: true, batch: true } }, ledgerEntries: true },
    });
    if (!entry) throw new NotFoundException('Stock entry not found');
    return entry;
  }

  async createStockEntry(tenantId: string, orgId: string, userId: string, dto: CreateStockEntryInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.stockEntry.count({ where: { tenantId } });
    const entryNumber = `STE-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    let totalValue = 0;
    const itemsData = dto.items.map((item) => {
      const valRate = item.valuationRate || 0;
      const amt = valRate * item.qty;
      totalValue += amt;

      return {
        tenantId,
        productId: item.productId,
        fromWarehouseId: item.fromWarehouseId || dto.fromWarehouseId,
        toWarehouseId: item.toWarehouseId || dto.toWarehouseId,
        fromBinId: item.fromBinId,
        toBinId: item.toBinId,
        uomId: item.uomId,
        qty: new Prisma.Decimal(item.qty),
        quantity: new Prisma.Decimal(item.qty),
        valuationRate: new Prisma.Decimal(valRate),
        amount: new Prisma.Decimal(amt),
        batchId: item.batchId,
        batchNumber: item.batchNumber,
        serialNo: item.serialNo,
        serialNumber: item.serialNumber || item.serialNo,
      };
    });

    return prisma.stockEntry.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        entryNumber,
        type: dto.type,
        purpose: dto.purpose || dto.type,
        remarks: dto.remarks,
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        referenceDoc: dto.referenceDoc,
        referenceType: dto.referenceType,
        totalValue: new Prisma.Decimal(totalValue),
        createdBy: userId,
        status: 'DRAFT',
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
  }

  async submitStockEntry(tenantId: string, id: string, userId: string) {
    const entry = await prisma.stockEntry.findFirst({
      where: { id, tenantId, status: 'DRAFT' },
      include: { items: { include: { product: true } } },
    });
    if (!entry) throw new NotFoundException('Draft Stock Entry not found');

    await prisma.$transaction(async (tx) => {
      for (const item of entry.items) {
        // Adjust inventory levels & create ledger entries
        // 1. Deduct from source warehouse
        if (item.fromWarehouseId) {
          const invItem = await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: item.fromWarehouseId,
              },
            },
            update: {
              quantity: { decrement: item.quantity },
            },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: item.fromWarehouseId,
              quantity: new Prisma.Decimal(-Number(item.quantity)),
            },
          });

          // Check if there is a bin location from which to deduct
          if (item.fromBinId) {
            await tx.inventoryItemBin.upsert({
              where: {
                tenantId_productId_warehouseId_binLocationId: {
                  tenantId,
                  productId: item.productId,
                  warehouseId: item.fromWarehouseId,
                  binLocationId: item.fromBinId,
                },
              },
              update: {
                quantity: { decrement: item.quantity },
              },
              create: {
                tenantId,
                productId: item.productId,
                warehouseId: item.fromWarehouseId,
                binLocationId: item.fromBinId,
                quantity: new Prisma.Decimal(-Number(item.quantity)),
              },
            });
          }

          // Create ledger entry (OUT)
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: item.fromWarehouseId,
              stockEntryId: entry.id,
              quantity: new Prisma.Decimal(-Number(item.quantity)),
              qtyOut: item.quantity,
              balanceQty: invItem.quantity,
              valuationRate: item.valuationRate,
              incomingRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              voucherNumber: entry.entryNumber,
              batchNumber: item.batchNumber,
              serialNumber: item.serialNo,
            },
          });
        }

        // 2. Add to destination warehouse
        if (item.toWarehouseId) {
          const invItem = await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: item.toWarehouseId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: item.toWarehouseId,
              quantity: item.quantity,
            },
          });

          // Bin level update
          if (item.toBinId) {
            await tx.inventoryItemBin.upsert({
              where: {
                tenantId_productId_warehouseId_binLocationId: {
                  tenantId,
                  productId: item.productId,
                  warehouseId: item.toWarehouseId,
                  binLocationId: item.toBinId,
                },
              },
              update: {
                quantity: { increment: item.quantity },
              },
              create: {
                tenantId,
                productId: item.productId,
                warehouseId: item.toWarehouseId,
                binLocationId: item.toBinId,
                quantity: item.quantity,
              },
            });
          }

          // Create ledger entry (IN)
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: item.toWarehouseId,
              stockEntryId: entry.id,
              quantity: item.quantity,
              qtyIn: item.quantity,
              balanceQty: invItem.quantity,
              valuationRate: item.valuationRate,
              incomingRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              voucherNumber: entry.entryNumber,
              batchNumber: item.batchNumber,
              serialNumber: item.serialNo,
            },
          });
        }

        // 3. Serial Number Updates
        if (item.serialNo && item.product.hasSerialTracking) {
          const serialRec = await tx.serialNumber.findFirst({
            where: { tenantId, productId: item.productId, serialNo: item.serialNo },
          });

          if (serialRec) {
            let nextStatus = 'AVAILABLE';
            if (entry.type === 'MATERIAL_ISSUE' || entry.type === 'SCRAP') {
              nextStatus = entry.type === 'SCRAP' ? 'SCRAPPED' : 'SOLD';
            } else if (item.toWarehouseId) {
              nextStatus = 'AVAILABLE';
            }

            await tx.serialNumber.update({
              where: { id: serialRec.id },
              data: {
                status: nextStatus,
                warehouseId: item.toWarehouseId || null,
              },
            });

            await tx.serialNumberHistory.create({
              data: {
                tenantId,
                serialNumberId: serialRec.id,
                action: entry.type,
                fromStatus: serialRec.status,
                toStatus: nextStatus,
                reference: entry.entryNumber,
                performedBy: userId,
              },
            });
          }
        }

        // 4. Batch Level Updates
        if (item.batchId && item.product.hasBatchTracking) {
          if (item.fromWarehouseId) {
            await tx.batch.update({
              where: { id: item.batchId },
              data: {
                usedQty: { increment: item.quantity },
              },
            });
          } else if (item.toWarehouseId) {
            await tx.batch.update({
              where: { id: item.batchId },
              data: {
                quantity: { increment: item.quantity },
              },
            });
          }
        }
      }

      await tx.stockEntry.update({
        where: { id: entry.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          submittedBy: userId,
        },
      });
    });

    return this.getStockEntryById(tenantId, id);
  }

  async cancelStockEntry(tenantId: string, id: string, userId: string, reason: string) {
    const entry = await prisma.stockEntry.findFirst({
      where: { id, tenantId, status: 'SUBMITTED' },
      include: { items: { include: { product: true } } },
    });
    if (!entry) throw new NotFoundException('Submitted Stock Entry not found');

    await prisma.$transaction(async (tx) => {
      // Reverse each item's stock adjustment
      for (const item of entry.items) {
        // Reverse source warehouse deduction (we increment it back)
        if (item.fromWarehouseId) {
          const invItem = await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: item.fromWarehouseId,
              },
            },
            update: {
              quantity: { increment: item.quantity },
            },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: item.fromWarehouseId,
              quantity: item.quantity,
            },
          });

          if (item.fromBinId) {
            await tx.inventoryItemBin.upsert({
              where: {
                tenantId_productId_warehouseId_binLocationId: {
                  tenantId,
                  productId: item.productId,
                  warehouseId: item.fromWarehouseId,
                  binLocationId: item.fromBinId,
                },
              },
              update: {
                quantity: { increment: item.quantity },
              },
              create: {
                tenantId,
                productId: item.productId,
                warehouseId: item.fromWarehouseId,
                binLocationId: item.fromBinId,
                quantity: item.quantity,
              },
            });
          }

          // Ledger entry showing reversal
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: item.fromWarehouseId,
              stockEntryId: entry.id,
              quantity: item.quantity,
              qtyIn: item.quantity,
              balanceQty: invItem.quantity,
              valuationRate: item.valuationRate,
              incomingRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              voucherNumber: `${entry.entryNumber}-REV`,
              remarks: `Reversal of ${entry.entryNumber}`,
            },
          });
        }

        // Reverse destination warehouse addition (we decrement it)
        if (item.toWarehouseId) {
          const invItem = await tx.inventoryItem.upsert({
            where: {
              tenantId_productId_warehouseId: {
                tenantId,
                productId: item.productId,
                warehouseId: item.toWarehouseId,
              },
            },
            update: {
              quantity: { decrement: item.quantity },
            },
            create: {
              tenantId,
              productId: item.productId,
              warehouseId: item.toWarehouseId,
              quantity: new Prisma.Decimal(-Number(item.quantity)),
            },
          });

          if (item.toBinId) {
            await tx.inventoryItemBin.upsert({
              where: {
                tenantId_productId_warehouseId_binLocationId: {
                  tenantId,
                  productId: item.productId,
                  warehouseId: item.toWarehouseId,
                  binLocationId: item.toBinId,
                },
              },
              update: {
                quantity: { decrement: item.quantity },
              },
              create: {
                tenantId,
                productId: item.productId,
                warehouseId: item.toWarehouseId,
                binLocationId: item.toBinId,
                quantity: new Prisma.Decimal(-Number(item.quantity)),
              },
            });
          }

          // Ledger entry showing reversal
          await tx.stockLedgerEntry.create({
            data: {
              tenantId,
              productId: item.productId,
              warehouseId: item.toWarehouseId,
              stockEntryId: entry.id,
              quantity: new Prisma.Decimal(-Number(item.quantity)),
              qtyOut: item.quantity,
              balanceQty: invItem.quantity,
              valuationRate: item.valuationRate,
              incomingRate: item.valuationRate,
              voucherType: 'STOCK_ENTRY',
              voucherId: entry.id,
              voucherNumber: `${entry.entryNumber}-REV`,
              remarks: `Reversal of ${entry.entryNumber}`,
            },
          });
        }

        // Reverse serial updates
        if (item.serialNo && item.product.hasSerialTracking) {
          const serialRec = await tx.serialNumber.findFirst({
            where: { tenantId, productId: item.productId, serialNo: item.serialNo },
          });
          if (serialRec) {
            await tx.serialNumber.update({
              where: { id: serialRec.id },
              data: {
                status: 'AVAILABLE',
                warehouseId: item.fromWarehouseId || null,
              },
            });
            await tx.serialNumberHistory.create({
              data: {
                tenantId,
                serialNumberId: serialRec.id,
                action: 'CANCEL',
                fromStatus: serialRec.status,
                toStatus: 'AVAILABLE',
                reference: `${entry.entryNumber}-REV`,
                performedBy: userId,
              },
            });
          }
        }

        // Reverse batch updates
        if (item.batchId && item.product.hasBatchTracking) {
          if (item.fromWarehouseId) {
            await tx.batch.update({
              where: { id: item.batchId },
              data: {
                usedQty: { decrement: item.quantity },
              },
            });
          } else if (item.toWarehouseId) {
            await tx.batch.update({
              where: { id: item.batchId },
              data: {
                quantity: { decrement: item.quantity },
              },
            });
          }
        }
      }

      await tx.stockEntry.update({
        where: { id: entry.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });
    });

    return this.getStockEntryById(tenantId, id);
  }

  async getStockLedger(
    tenantId: string,
    params: PaginationParams & { productId?: string; warehouseId?: string } = {},
  ) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    if (params.search) {
      where.OR = [
        { voucherNumber: { contains: params.search, mode: 'insensitive' } },
        { batchNumber: { contains: params.search, mode: 'insensitive' } },
        { serialNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = buildPaginationValues(params);

    const [entries, total] = await Promise.all([
      prisma.stockLedgerEntry.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true, unit: true } },
          warehouse: { select: { name: true, code: true } },
        },
        skip,
        take,
        orderBy: { postingDate: 'desc' },
      }),
      prisma.stockLedgerEntry.count({ where }),
    ]);

    return paginatedResult(entries, total, params);
  }

  // ─── INTER-WAREHOUSE TRANSFERS ──────────────────────

  async transferStock(tenantId: string, orgId: string, userId: string, dto: TransferStockInput) {
    const stockItems = dto.items.map((item, index) => ({
      productId: item.productId,
      qty: item.qty,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      batchId: item.batchId,
      serialNo: item.serialNo,
      sortOrder: index,
    }));

    return this.createStockEntry(tenantId, orgId, userId, {
      type: 'MATERIAL_TRANSFER',
      purpose: 'MATERIAL_TRANSFER',
      remarks: dto.remarks || `Inter-warehouse transfer from ${dto.fromWarehouseId} to ${dto.toWarehouseId}`,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      items: stockItems,
    });
  }

  // ─── TRANSFER APPROVAL WORKFLOW ──────────────────────

  async getTransferApprovalRules(tenantId: string, params: PaginationParams & { warehouseId?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    const { skip, take } = buildPaginationValues(params);
    const [rules, total] = await Promise.all([
      prisma.transferApprovalRule.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.transferApprovalRule.count({ where }),
    ]);
    return paginatedResult(rules, total, params);
  }

  async createTransferApprovalRule(tenantId: string, dto: CreateTransferApprovalRuleInput) {
    return prisma.transferApprovalRule.create({
      data: { tenantId, warehouseId: dto.warehouseId, thresholdValue: new Prisma.Decimal(dto.thresholdValue), isActive: dto.isActive },
    });
  }

  async updateTransferApprovalRule(tenantId: string, id: string, dto: UpdateTransferApprovalRuleInput) {
    const rule = await prisma.transferApprovalRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Transfer approval rule not found');

    const data: any = { isActive: dto.isActive };
    if (dto.thresholdValue !== undefined) data.thresholdValue = new Prisma.Decimal(dto.thresholdValue);
    if (dto.warehouseId !== undefined) data.warehouseId = dto.warehouseId;

    return prisma.transferApprovalRule.update({ where: { id }, data });
  }

  async deleteTransferApprovalRule(tenantId: string, id: string) {
    const rule = await prisma.transferApprovalRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Transfer approval rule not found');
    await prisma.transferApprovalRule.delete({ where: { id } });
    return { success: true };
  }

  /** Highest applicable threshold for a warehouse: a warehouse-specific active rule wins over the tenant-wide rule. */
  private async resolveTransferApprovalThreshold(tenantId: string, warehouseId?: string | null) {
    const rules = await prisma.transferApprovalRule.findMany({ where: { tenantId, isActive: true } });
    const specific = warehouseId ? rules.find((r) => r.warehouseId === warehouseId) : undefined;
    const global = rules.find((r) => !r.warehouseId);
    const rule = specific ?? global;
    return rule ? Number(rule.thresholdValue) : null;
  }

  /**
   * Gate for submitting a transfer-type stock entry: if its value exceeds the configured
   * threshold, creates a PENDING approval and blocks submission instead of shipping the stock.
   */
  async requestTransferApproval(tenantId: string, stockEntryId: string, userId: string) {
    const entry = await prisma.stockEntry.findFirst({ where: { id: stockEntryId, tenantId, status: 'DRAFT' } });
    if (!entry) throw new NotFoundException('Draft stock entry not found');

    const threshold = await this.resolveTransferApprovalThreshold(tenantId, entry.fromWarehouseId ?? entry.toWarehouseId);
    const entryValue = Number(entry.totalValue);

    if (threshold === null || entryValue < threshold) {
      return this.submitStockEntry(tenantId, stockEntryId, userId);
    }

    const existing = await prisma.stockTransferApproval.findFirst({ where: { stockEntryId } });
    if (existing) return existing;

    return prisma.stockTransferApproval.create({
      data: {
        tenantId,
        stockEntryId,
        thresholdValue: new Prisma.Decimal(threshold),
        entryValue: new Prisma.Decimal(entryValue),
        status: 'PENDING',
        requestedBy: userId,
      },
    });
  }

  async getPendingTransferApprovals(tenantId: string, params: PaginationParams = {}) {
    const where = { tenantId, status: 'PENDING' };
    const { skip, take } = buildPaginationValues(params);
    const [approvals, total] = await Promise.all([
      prisma.stockTransferApproval.findMany({ where, include: { stockEntry: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.stockTransferApproval.count({ where }),
    ]);
    return paginatedResult(approvals, total, params);
  }

  async approveTransfer(tenantId: string, id: string, userId: string) {
    const approval = await prisma.stockTransferApproval.findFirst({ where: { id, tenantId, status: 'PENDING' } });
    if (!approval) throw new NotFoundException('Pending transfer approval not found');

    await prisma.stockTransferApproval.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
    });

    return this.submitStockEntry(tenantId, approval.stockEntryId, userId);
  }

  async rejectTransfer(tenantId: string, id: string, userId: string, dto: RejectTransferInput) {
    const approval = await prisma.stockTransferApproval.findFirst({ where: { id, tenantId, status: 'PENDING' } });
    if (!approval) throw new NotFoundException('Pending transfer approval not found');

    return prisma.stockTransferApproval.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: userId, approvedAt: new Date(), rejectedReason: dto.reason },
    });
  }

  // ─── MOVEMENT HISTORY / AUDIT TRAIL ──────────────────

  /** Consolidated per-product/per-warehouse movement timeline: stock ledger entries, cycle counts, and put-away tasks. */
  async getMovementHistory(tenantId: string, params: { productId?: string; warehouseId?: string; limit?: number } = {}) {
    const limit = params.limit ?? 100;
    const ledgerWhere: any = { tenantId };
    if (params.productId) ledgerWhere.productId = params.productId;
    if (params.warehouseId) ledgerWhere.warehouseId = params.warehouseId;

    const ledgerEntries = await prisma.stockLedgerEntry.findMany({
      where: ledgerWhere,
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const movements = ledgerEntries.map((e) => ({
      type: 'LEDGER' as const,
      timestamp: e.createdAt,
      productId: e.productId,
      productName: e.product.name,
      warehouseId: e.warehouseId,
      voucherType: e.voucherType,
      voucherNumber: e.voucherNumber,
      qtyIn: Number(e.qtyIn),
      qtyOut: Number(e.qtyOut),
      balanceQty: Number(e.balanceQty),
    }));

    return { productId: params.productId ?? null, warehouseId: params.warehouseId ?? null, movements };
  }

  // ─── WAVE PICK / PACK-LIST GENERATION ─────────────────

  async getPickWaves(tenantId: string, params: PaginationParams & { warehouseId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;
    const { skip, take } = buildPaginationValues(params);
    const [waves, total] = await Promise.all([
      prisma.pickWave.findMany({ where, include: { items: true, orders: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.pickWave.count({ where }),
    ]);
    return paginatedResult(waves, total, params);
  }

  async getPickWaveById(tenantId: string, id: string) {
    const wave = await prisma.pickWave.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true, binLocation: true } }, orders: true },
    });
    if (!wave) throw new NotFoundException('Pick wave not found');
    return wave;
  }

  /** Batches multiple sales orders into one wave, aggregating quantity per product and choosing the bin holding the most stock (shortest travel). */
  async createPickWave(tenantId: string, orgId: string, userId: string, dto: CreatePickWaveInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.pickWave.count({ where: { tenantId } });
    const waveNumber = `WAVE-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const productQty = new Map<string, number>();
    for (const orderId of dto.salesOrderIds) {
      const order = await prisma.salesOrder.findFirst({ where: { id: orderId, tenantId }, include: { lineItems: true } });
      if (!order) continue;
      for (const li of order.lineItems) {
        if (!li.productId) continue;
        productQty.set(li.productId, (productQty.get(li.productId) ?? 0) + Number(li.quantity));
      }
    }

    const items = await Promise.all(
      Array.from(productQty.entries()).map(async ([productId, quantity]) => {
        const bin = await prisma.inventoryItemBin.findFirst({
          where: { tenantId, productId, warehouseId: dto.warehouseId },
          orderBy: { quantity: 'desc' },
        });
        return { tenantId, productId, quantity: new Prisma.Decimal(quantity), binLocationId: bin?.binLocationId ?? null, status: 'PENDING' };
      }),
    );

    return prisma.pickWave.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        waveNumber,
        warehouseId: dto.warehouseId,
        notes: dto.notes,
        createdBy: userId,
        status: 'OPEN',
        orders: { create: dto.salesOrderIds.map((salesOrderId) => ({ tenantId, salesOrderId })) },
        items: { create: items },
      },
      include: { items: true, orders: true },
    });
  }

  /**
   * Recording a pick with scanned serials verifies each one is a real AVAILABLE serial for this
   * product before marking it RESERVED — a scan-out counterpart to receiveWithTraceability's
   * scan-in capture, closing the receive/pick/pack barcode-workflow loop end to end.
   */
  async recordPick(tenantId: string, waveItemId: string, dto: RecordPickInput) {
    const item = await prisma.pickWaveItem.findFirst({ where: { id: waveItemId, tenantId } });
    if (!item) throw new NotFoundException('Pick wave item not found');

    const scannedSerials = dto.scannedSerials ?? [];
    if (scannedSerials.length > 0) {
      const serials = await prisma.serialNumber.findMany({
        where: { tenantId, productId: item.productId, serialNo: { in: scannedSerials } },
      });
      const found = new Map(serials.map((s) => [s.serialNo, s]));

      for (const scanned of scannedSerials) {
        const serial = found.get(scanned);
        if (!serial) throw new BadRequestException(`Serial ${scanned} does not belong to this product`);
        if (serial.status !== 'AVAILABLE') throw new BadRequestException(`Serial ${scanned} is not AVAILABLE (status: ${serial.status})`);
      }

      await prisma.$transaction(async (tx) => {
        for (const scanned of scannedSerials) {
          const serial = found.get(scanned)!;
          await tx.serialNumber.update({ where: { id: serial.id }, data: { status: 'RESERVED' } });
          await tx.serialNumberHistory.create({
            data: { tenantId, serialNumberId: serial.id, action: 'TRANSFERRED', fromStatus: 'AVAILABLE', toStatus: 'RESERVED', reference: waveItemId, notes: 'Scanned at pick-wave pick' },
          });
        }
      });
    }

    const status = dto.pickedQty >= Number(item.quantity) ? 'PICKED' : 'SHORT';
    return prisma.pickWaveItem.update({
      where: { id: waveItemId },
      data: { pickedQty: new Prisma.Decimal(dto.pickedQty), status },
    });
  }

  /** Pack-list document: the wave's items grouped for packing, once every line has been picked. */
  async getPackList(tenantId: string, waveId: string) {
    const wave = await this.getPickWaveById(tenantId, waveId);
    const allPicked = wave.items.every((i) => i.status === 'PICKED');

    return {
      waveId: wave.id,
      waveNumber: wave.waveNumber,
      readyToPack: allPicked,
      lines: wave.items.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        sku: i.product.sku,
        quantity: Number(i.quantity),
        pickedQty: Number(i.pickedQty),
        binCode: i.binLocation?.code ?? null,
      })),
    };
  }

  /** Completing a wave advances its linked sales orders to PROCESSING (picked, ready to ship) — a real fulfillment-status integration, not just an inventory-side status flip. */
  async completePickWave(tenantId: string, id: string) {
    const wave = await prisma.pickWave.findFirst({ where: { id, tenantId }, include: { items: true, orders: true } });
    if (!wave) throw new NotFoundException('Pick wave not found');
    if (!wave.items.every((i) => i.status === 'PICKED')) {
      throw new BadRequestException('All pick wave items must be picked before completing the wave');
    }

    const updated = await prisma.pickWave.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date() } });

    await prisma.salesOrder.updateMany({
      where: { tenantId, id: { in: wave.orders.map((o) => o.salesOrderId) }, status: { in: ['CONFIRMED', 'DRAFT'] } },
      data: { status: 'PROCESSING' },
    });

    return updated;
  }

  // ─── VENDOR-MANAGED / CONSIGNMENT INVENTORY ──────────

  async getConsignmentStocks(tenantId: string, params: PaginationParams & { warehouseId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;
    const { skip, take } = buildPaginationValues(params);
    const [stocks, total] = await Promise.all([
      prisma.consignmentStock.findMany({ where, include: { product: true, warehouse: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.consignmentStock.count({ where }),
    ]);
    return paginatedResult(stocks, total, params);
  }

  async createConsignmentStock(tenantId: string, orgId: string, dto: CreateConsignmentStockInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.consignmentStock.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        supplierName: dto.supplierName,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantityOnHand: new Prisma.Decimal(dto.quantityOnHand),
        unitCost: new Prisma.Decimal(dto.unitCost),
        status: 'ACTIVE',
      },
    });
  }

  /** Consumption-triggered billing: recording a draw against consignment stock decrements on-hand and logs an unbilled charge for the supplier. */
  async recordConsignmentConsumption(tenantId: string, consignmentStockId: string, dto: RecordConsignmentConsumptionInput) {
    const stock = await prisma.consignmentStock.findFirst({ where: { id: consignmentStockId, tenantId } });
    if (!stock) throw new NotFoundException('Consignment stock not found');
    if (Number(stock.quantityOnHand) < dto.quantity) {
      throw new BadRequestException(`Insufficient consignment stock: ${stock.quantityOnHand} on hand, ${dto.quantity} requested`);
    }

    return prisma.$transaction(async (tx) => {
      await tx.consignmentStock.update({ where: { id: consignmentStockId }, data: { quantityOnHand: { decrement: dto.quantity } } });
      return tx.consignmentConsumption.create({
        data: {
          tenantId,
          consignmentStockId,
          quantity: new Prisma.Decimal(dto.quantity),
          totalCost: new Prisma.Decimal(dto.quantity * Number(stock.unitCost)),
          reference: dto.reference,
          billed: false,
        },
      });
    });
  }

  async getUnbilledConsignmentConsumptions(tenantId: string) {
    return prisma.consignmentConsumption.findMany({
      where: { tenantId, billed: false },
      include: { consignmentStock: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markConsignmentConsumptionBilled(tenantId: string, id: string) {
    const consumption = await prisma.consignmentConsumption.findFirst({ where: { id, tenantId } });
    if (!consumption) throw new NotFoundException('Consignment consumption not found');
    return prisma.consignmentConsumption.update({ where: { id }, data: { billed: true, billedAt: new Date() } });
  }

  // ─── RECEIPT WITH TRACEABILITY CAPTURE ───────────────

  /** Captures serial numbers and/or a batch/lot at the moment of receipt (one call), instead of a separate manual create step afterward. */
  async receiveWithTraceability(tenantId: string, orgId: string, userId: string, dto: ReceiveWithTraceabilityInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);

    const entry = await this.createStockEntry(tenantId, resolvedOrgId, userId, {
      type: 'MATERIAL_RECEIPT',
      purpose: 'MATERIAL_RECEIPT',
      remarks: 'Receipt with traceability capture',
      toWarehouseId: dto.warehouseId,
      items: [{ productId: dto.productId, qty: dto.quantity, toWarehouseId: dto.warehouseId, valuationRate: dto.valuationRate, batchNumber: dto.batchNo ?? undefined }],
    } as any);
    const submitted = await this.submitStockEntry(tenantId, entry.id, userId);

    const createdSerials = await Promise.all(
      dto.serialNumbers.map((serialNo) =>
        prisma.serialNumber.create({
          data: { tenantId, productId: dto.productId, warehouseId: dto.warehouseId, serialNo, status: 'AVAILABLE' },
        }),
      ),
    );

    const createdBatch = dto.batchNo
      ? await prisma.batch.create({
          data: {
            tenantId,
            productId: dto.productId,
            batchNo: dto.batchNo,
            lotNo: dto.lotNo,
            quantity: new Prisma.Decimal(dto.quantity),
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            costPrice: new Prisma.Decimal(dto.valuationRate),
            status: 'ACTIVE',
            originStockEntryId: entry.id,
          },
        })
      : null;

    return { stockEntry: submitted, serialNumbers: createdSerials, batch: createdBatch };
  }

  // ─── BARCODE LABEL GENERATION ─────────────────────────

  /** Label payload for a product SKU barcode (data only — printing/rendering is a client concern). */
  async getProductLabel(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Product not found');
    return { type: 'PRODUCT', barcodeValue: product.barcode || product.sku, sku: product.sku, name: product.name };
  }

  async getBatchLabel(tenantId: string, batchId: string) {
    const batch = await prisma.batch.findFirst({ where: { id: batchId, tenantId }, include: { product: true } });
    if (!batch) throw new NotFoundException('Batch not found');
    return { type: 'BATCH', barcodeValue: batch.batchNo, productName: batch.product.name, expiryDate: batch.expiryDate, lotNo: batch.lotNo };
  }

  async getLicensePlateLabel(tenantId: string, licensePlateId: string) {
    const plate = await prisma.licensePlate.findFirst({ where: { id: licensePlateId, tenantId } });
    if (!plate) throw new NotFoundException('License plate not found');
    return { type: 'LICENSE_PLATE', barcodeValue: plate.code, warehouseId: plate.warehouseId, status: plate.status };
  }

  async getBinLabel(tenantId: string, binId: string) {
    const bin = await prisma.binLocation.findFirst({ where: { id: binId, tenantId } });
    if (!bin) throw new NotFoundException('Bin location not found');
    return { type: 'BIN', barcodeValue: bin.code, zone: bin.zone, aisle: bin.aisle, rack: bin.rack };
  }

  // ─── CYCLE COUNTS ───────────────────────────────────

  async getCycleCounts(tenantId: string, params: PaginationParams & { warehouseId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;

    const { skip, take } = buildPaginationValues(params);

    const [counts, total] = await Promise.all([
      prisma.cycleCount.findMany({
        where,
        include: { items: { include: { product: true } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cycleCount.count({ where }),
    ]);

    return paginatedResult(counts, total, params);
  }

  async getCycleCountById(tenantId: string, id: string) {
    const cc = await prisma.cycleCount.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } } },
    });
    if (!cc) throw new NotFoundException('Cycle count session not found');
    return cc;
  }

  async createCycleCount(tenantId: string, _orgId: string, userId: string, dto: CreateCycleCountInput) {
    const itemsData = dto.items.map((item) => ({
      tenantId,
      productId: item.productId,
      binLocationId: item.binLocationId,
      expectedQty: new Prisma.Decimal(item.expectedQty),
      status: 'PENDING',
    }));

    return prisma.cycleCount.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        countedBy: dto.countedBy || userId,
        notes: dto.notes,
        status: 'DRAFT',
        createdBy: userId,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
  }

  async submitCycleCount(tenantId: string, id: string, userId: string, dto: SubmitCycleCountInput) {
    const cc = await prisma.cycleCount.findFirst({
      where: { id, tenantId, status: 'DRAFT' },
      include: { items: true },
    });
    if (!cc) throw new NotFoundException('Draft Cycle Count session not found');

    let totalVariance = 0;

    await prisma.$transaction(async (tx) => {
      for (const update of dto.items) {
        const item = cc.items.find((i) => i.id === update.id);
        if (!item) continue;

        const expected = Number(item.expectedQty);
        const counted = update.countedQty;
        const diff = counted - expected;
        totalVariance += Math.abs(diff);

        await tx.cycleCountItem.update({
          where: { id: item.id },
          data: {
            countedQty: new Prisma.Decimal(counted),
            varianceQty: new Prisma.Decimal(diff),
            variance: new Prisma.Decimal(diff),
            status: 'COUNTED',
            countedBy: userId,
            countedAt: new Date(),
            remarks: update.remarks,
          },
        });
      }

      await tx.cycleCount.update({
        where: { id: cc.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          variance: new Prisma.Decimal(totalVariance),
          remarks: dto.remarks,
        },
      });
    });

    return this.getCycleCountById(tenantId, id);
  }

  async approveCycleCount(tenantId: string, id: string, userId: string) {
    const cc = await prisma.cycleCount.findFirst({
      where: { id, tenantId, status: 'COMPLETED' },
      include: { items: { include: { product: true } } },
    });
    if (!cc) throw new NotFoundException('Completed Cycle Count session not found');

    // Create an automatic STOCK_ADJUSTMENT entry for variances
    const varianceItems = cc.items.filter((item) => Number(item.varianceQty) !== 0);

    if (varianceItems.length > 0) {
      const stockItems = varianceItems.map((item, index) => {
        const diff = Number(item.varianceQty);
        const qty = Math.abs(diff);
        const valRate = Number(item.product.costPrice);

        return {
          productId: item.productId,
          qty,
          fromWarehouseId: diff < 0 ? cc.warehouseId : null,
          toWarehouseId: diff > 0 ? cc.warehouseId : null,
          valuationRate: valRate,
          sortOrder: index,
        };
      });

      // Submit Stock Entry
      const entry = await this.createStockEntry(tenantId, 'org-system-default', userId, {
        type: 'STOCK_ADJUSTMENT',
        purpose: 'STOCK_ADJUSTMENT',
        remarks: `Auto variance adjustment for Cycle Count #${cc.id}`,
        fromWarehouseId: cc.warehouseId,
        items: stockItems,
      });

      await this.submitStockEntry(tenantId, entry.id, userId);
    }

    return prisma.cycleCount.update({
      where: { id: cc.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
      include: { items: true },
    });
  }

  // ─── CYCLE COUNT SCHEDULES ──────────────────────────

  async getCycleCountSchedules(tenantId: string, params: PaginationParams & { warehouseId?: string; active?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.active !== undefined) where.active = params.active === 'true';

    const { skip, take } = buildPaginationValues(params);
    const [schedules, total] = await Promise.all([
      prisma.cycleCountSchedule.findMany({ where, skip, take, orderBy: { nextDueDate: 'asc' } }),
      prisma.cycleCountSchedule.count({ where }),
    ]);
    return paginatedResult(schedules, total, params);
  }

  async getDueCycleCountSchedules(tenantId: string) {
    return prisma.cycleCountSchedule.findMany({
      where: { tenantId, active: true, nextDueDate: { lte: new Date() } },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async createCycleCountSchedule(tenantId: string, dto: CreateCycleCountScheduleInput) {
    return prisma.cycleCountSchedule.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        zone: dto.zone,
        binScope: dto.binScope,
        frequency: dto.frequency,
        blindCount: dto.blindCount,
        nextDueDate: new Date(dto.nextDueDate),
        active: dto.active,
      },
    });
  }

  async updateCycleCountSchedule(tenantId: string, id: string, dto: UpdateCycleCountScheduleInput) {
    const existing = await prisma.cycleCountSchedule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Cycle count schedule not found');

    const data: any = { ...dto };
    if (dto.nextDueDate) data.nextDueDate = new Date(dto.nextDueDate);

    return prisma.cycleCountSchedule.update({ where: { id }, data });
  }

  async deleteCycleCountSchedule(tenantId: string, id: string) {
    const existing = await prisma.cycleCountSchedule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Cycle count schedule not found');
    await prisma.cycleCountSchedule.delete({ where: { id } });
    return { success: true };
  }

  /** Rolls a completed schedule's due date forward by its frequency, so recurring counts keep firing without manual re-entry. */
  async rollForwardCycleCountSchedule(tenantId: string, id: string) {
    const schedule = await prisma.cycleCountSchedule.findFirst({ where: { id, tenantId } });
    if (!schedule) throw new NotFoundException('Cycle count schedule not found');

    const days = schedule.frequency === 'WEEKLY' ? 7 : schedule.frequency === 'QUARTERLY' ? 90 : 30;
    const nextDueDate = new Date(schedule.nextDueDate.getTime() + days * 24 * 60 * 60 * 1000);

    return prisma.cycleCountSchedule.update({ where: { id }, data: { nextDueDate } });
  }

  /** Perpetual-inventory accuracy KPI: % of counted items with zero variance, over a trailing window. */
  async getCycleCountAccuracy(tenantId: string, warehouseId?: string, sinceDays = 90) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const where: any = { tenantId, status: { in: ['COMPLETED', 'APPROVED'] }, completedAt: { gte: since } };
    if (warehouseId) where.warehouseId = warehouseId;

    const counts = await prisma.cycleCount.findMany({
      where,
      include: { items: true },
    });

    let totalItems = 0;
    let accurateItems = 0;
    let totalAbsVariance = 0;

    for (const cc of counts) {
      for (const item of cc.items) {
        if (item.countedQty === null) continue;
        totalItems += 1;
        const variance = Number(item.varianceQty ?? 0);
        totalAbsVariance += Math.abs(variance);
        if (variance === 0) accurateItems += 1;
      }
    }

    return {
      warehouseId: warehouseId ?? null,
      windowDays: sinceDays,
      sessionsCounted: counts.length,
      itemsCounted: totalItems,
      accurateItems,
      accuracyRate: totalItems > 0 ? Number(((accurateItems / totalItems) * 100).toFixed(2)) : null,
      totalAbsoluteVariance: totalAbsVariance,
    };
  }

  // ─── LICENSE PLATES (pallet/container tracking) ─────

  async getLicensePlates(tenantId: string, params: PaginationParams & { warehouseId?: string; status?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;

    const { skip, take } = buildPaginationValues(params);
    const [plates, total] = await Promise.all([
      prisma.licensePlate.findMany({
        where,
        include: { items: true, bin: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.licensePlate.count({ where }),
    ]);
    return paginatedResult(plates, total, params);
  }

  async getLicensePlateById(tenantId: string, id: string) {
    const plate = await prisma.licensePlate.findFirst({
      where: { id, tenantId },
      include: { items: { include: { inventoryItem: true, lotBatch: true, serialNumber: true } }, bin: true, warehouse: true },
    });
    if (!plate) throw new NotFoundException('License plate not found');
    return plate;
  }

  async createLicensePlate(tenantId: string, dto: CreateLicensePlateInput) {
    const existing = await prisma.licensePlate.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException('A license plate with this code already exists');

    return prisma.licensePlate.create({
      data: {
        tenantId,
        code: dto.code,
        warehouseId: dto.warehouseId,
        binId: dto.binId,
        status: 'OPEN',
      },
    });
  }

  async addLicensePlateItem(tenantId: string, licensePlateId: string, dto: AddLicensePlateItemInput) {
    const plate = await prisma.licensePlate.findFirst({ where: { id: licensePlateId, tenantId } });
    if (!plate) throw new NotFoundException('License plate not found');
    if (plate.status !== 'OPEN') throw new BadRequestException('Cannot add items to a closed or consumed license plate');

    await prisma.licensePlateItem.create({
      data: {
        tenantId,
        licensePlateId,
        inventoryItemId: dto.inventoryItemId,
        quantity: new Prisma.Decimal(dto.quantity),
        lotBatchId: dto.lotBatchId,
        serialNumberId: dto.serialNumberId,
      },
    });
    return this.getLicensePlateById(tenantId, licensePlateId);
  }

  async moveLicensePlate(tenantId: string, id: string, dto: MoveLicensePlateInput) {
    const plate = await prisma.licensePlate.findFirst({ where: { id, tenantId } });
    if (!plate) throw new NotFoundException('License plate not found');
    if (plate.status === 'CONSUMED') throw new BadRequestException('Cannot move a consumed license plate');

    return prisma.licensePlate.update({ where: { id }, data: { binId: dto.binId } });
  }

  async closeLicensePlate(tenantId: string, id: string) {
    const plate = await prisma.licensePlate.findFirst({ where: { id, tenantId } });
    if (!plate) throw new NotFoundException('License plate not found');
    if (plate.status !== 'OPEN') throw new BadRequestException('License plate is not open');

    return prisma.licensePlate.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date() } });
  }

  // ─── DIRECTED PUT-AWAY TASKS ─────────────────────────

  async getPutawayTasks(tenantId: string, params: PaginationParams & { status?: string; stockEntryId?: string } = {}) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.stockEntryId) where.stockEntryId = params.stockEntryId;

    const { skip, take } = buildPaginationValues(params);
    const [tasks, total] = await Promise.all([
      prisma.putawayTask.findMany({
        where,
        include: { inventoryItem: { include: { product: true } }, suggestedBin: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.putawayTask.count({ where }),
    ]);
    return paginatedResult(tasks, total, params);
  }

  /** Zone-based directed put-away: suggests the bin in the item's warehouse with the most free capacity, to minimize travel distance. */
  async suggestPutawayBin(tenantId: string, inventoryItemId: string) {
    const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, tenantId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const bins = await prisma.binLocation.findMany({
      where: { tenantId, warehouseId: item.warehouseId, isActive: true },
      include: { _count: { select: { inventoryBins: true } } },
    });
    if (bins.length === 0) return null;

    bins.sort((a, b) => {
      const aFree = (a.capacity ?? Infinity) === Infinity ? Infinity : Number(a.capacity) - a._count.inventoryBins;
      const bFree = (b.capacity ?? Infinity) === Infinity ? Infinity : Number(b.capacity) - b._count.inventoryBins;
      return bFree - aFree;
    });

    return bins[0];
  }

  async createPutawayTask(tenantId: string, dto: CreatePutawayTaskInput) {
    let suggestedBinId = dto.suggestedBinId ?? null;
    if (!suggestedBinId) {
      const suggestion = await this.suggestPutawayBin(tenantId, dto.inventoryItemId);
      suggestedBinId = suggestion?.id ?? null;
    }

    return prisma.putawayTask.create({
      data: {
        tenantId,
        stockEntryId: dto.stockEntryId,
        inventoryItemId: dto.inventoryItemId,
        quantity: new Prisma.Decimal(dto.quantity),
        suggestedBinId,
        status: 'PENDING',
      },
      include: { suggestedBin: true },
    });
  }

  async completePutawayTask(tenantId: string, id: string, _dto: CompletePutawayTaskInput) {
    const task = await prisma.putawayTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Putaway task not found');
    if (task.status === 'COMPLETE') throw new BadRequestException('Putaway task already completed');

    return prisma.putawayTask.update({
      where: { id },
      data: { status: 'COMPLETE', completedAt: new Date() },
    });
  }

  // ─── YARD / DOCK APPOINTMENT SCHEDULING ───────────────

  async getDockAppointments(tenantId: string, params: PaginationParams & { warehouseId?: string; status?: string; dockDoor?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.status) where.status = params.status;
    if (params.dockDoor) where.dockDoor = params.dockDoor;
    const { skip, take } = buildPaginationValues(params);
    const [appointments, total] = await Promise.all([
      prisma.dockAppointment.findMany({ where, skip, take, orderBy: { scheduledAt: 'asc' } }),
      prisma.dockAppointment.count({ where }),
    ]);
    return paginatedResult(appointments, total, params);
  }

  /** Rejects a new appointment that overlaps an existing one on the same dock door. */
  private async assertNoDockConflict(tenantId: string, warehouseId: string, dockDoor: string, scheduledAt: Date, durationMinutes: number, excludeId?: string) {
    const start = scheduledAt;
    const end = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

    const candidates = await prisma.dockAppointment.findMany({
      where: {
        tenantId, warehouseId, dockDoor,
        status: { notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    for (const existing of candidates) {
      const existingStart = existing.scheduledAt;
      const existingEnd = new Date(existing.scheduledAt.getTime() + existing.durationMinutes * 60 * 1000);
      if (start < existingEnd && end > existingStart) {
        throw new BadRequestException(`Dock door ${dockDoor} is already booked from ${existingStart.toISOString()} to ${existingEnd.toISOString()}`);
      }
    }
  }

  async createDockAppointment(tenantId: string, orgId: string, dto: CreateDockAppointmentInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const scheduledAt = new Date(dto.scheduledAt);
    await this.assertNoDockConflict(tenantId, dto.warehouseId, dto.dockDoor, scheduledAt, dto.durationMinutes);

    return prisma.dockAppointment.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        warehouseId: dto.warehouseId,
        dockDoor: dto.dockDoor,
        type: dto.type,
        carrierName: dto.carrierName ?? '',
        referenceType: dto.referenceType ?? null,
        referenceId: dto.referenceId ?? null,
        scheduledAt,
        durationMinutes: dto.durationMinutes,
        notes: dto.notes ?? null,
        status: 'SCHEDULED',
      },
    });
  }

  async updateDockAppointment(tenantId: string, id: string, dto: UpdateDockAppointmentInput) {
    const existing = await prisma.dockAppointment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Dock appointment not found');

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : existing.scheduledAt;
    const durationMinutes = dto.durationMinutes ?? existing.durationMinutes;
    const dockDoor = dto.dockDoor ?? existing.dockDoor;
    const warehouseId = dto.warehouseId ?? existing.warehouseId;

    if (dto.scheduledAt || dto.durationMinutes || dto.dockDoor || dto.warehouseId) {
      await this.assertNoDockConflict(tenantId, warehouseId, dockDoor, scheduledAt, durationMinutes, id);
    }

    return prisma.dockAppointment.update({
      where: { id },
      data: {
        scheduledAt, durationMinutes, dockDoor, warehouseId,
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.carrierName !== undefined ? { carrierName: dto.carrierName ?? '' } : {}),
        ...(dto.referenceType !== undefined ? { referenceType: dto.referenceType } : {}),
        ...(dto.referenceId !== undefined ? { referenceId: dto.referenceId } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  async checkInDockAppointment(tenantId: string, id: string) {
    const appointment = await prisma.dockAppointment.findFirst({ where: { id, tenantId, status: 'SCHEDULED' } });
    if (!appointment) throw new NotFoundException('Scheduled dock appointment not found');
    return prisma.dockAppointment.update({ where: { id }, data: { status: 'CHECKED_IN', checkedInAt: new Date() } });
  }

  async completeDockAppointment(tenantId: string, id: string) {
    const appointment = await prisma.dockAppointment.findFirst({ where: { id, tenantId } });
    if (!appointment) throw new NotFoundException('Dock appointment not found');
    if (appointment.status === 'COMPLETED') throw new BadRequestException('Dock appointment already completed');
    return prisma.dockAppointment.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date() } });
  }

  async cancelDockAppointment(tenantId: string, id: string) {
    const appointment = await prisma.dockAppointment.findFirst({ where: { id, tenantId } });
    if (!appointment) throw new NotFoundException('Dock appointment not found');
    return prisma.dockAppointment.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  /** Utilization by dock door over a window — booked minutes vs. total available minutes. */
  async getDockUtilization(tenantId: string, warehouseId: string, sinceDays = 7) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const appointments = await prisma.dockAppointment.findMany({
      where: { tenantId, warehouseId, scheduledAt: { gte: since }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
    });

    const byDoor = new Map<string, number>();
    for (const a of appointments) {
      byDoor.set(a.dockDoor, (byDoor.get(a.dockDoor) ?? 0) + a.durationMinutes);
    }

    const totalAvailableMinutes = sinceDays * 24 * 60;
    return {
      warehouseId,
      windowDays: sinceDays,
      doors: Array.from(byDoor.entries()).map(([dockDoor, bookedMinutes]) => ({
        dockDoor,
        bookedMinutes,
        utilizationPct: Number(((bookedMinutes / totalAvailableMinutes) * 100).toFixed(2)),
      })),
    };
  }

  // ─── DYNAMIC SLOTTING OPTIMIZATION ────────────────────

  /**
   * Recommends re-slotting: fast-moving products (high pick frequency over the trailing window)
   * that aren't in a preferred zone ("A" — closest to packing, by convention) get a move-to-A
   * recommendation; slow movers currently occupying zone A get a move-to-reserve recommendation.
   * Per 2026 WMS market benchmarking (Manhattan Active WMS), confirmed via discovery pass.
   */
  async getSlottingRecommendations(tenantId: string, warehouseId: string, sinceDays = 30) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

    const [pickFrequency, binAssignments, preferredBins, reserveBins] = await Promise.all([
      prisma.stockLedgerEntry.groupBy({
        by: ['productId'],
        where: { tenantId, warehouseId, createdAt: { gte: since }, quantity: { lt: 0 } },
        _sum: { quantity: true },
      }),
      prisma.inventoryItemBin.findMany({
        where: { tenantId, warehouseId },
        include: { product: true, binLocation: true },
      }),
      prisma.binLocation.findMany({ where: { tenantId, warehouseId, zone: 'A', isActive: true } }),
      prisma.binLocation.findMany({ where: { tenantId, warehouseId, zone: { not: 'A' }, isActive: true } }),
    ]);

    const pickFreqByProduct = new Map(pickFrequency.map((f) => [f.productId, Math.abs(Number(f._sum.quantity ?? 0))]));
    const frequencies = Array.from(pickFreqByProduct.values()).sort((a, b) => b - a);
    const fastMoverThreshold = frequencies[Math.floor(frequencies.length * 0.2)] ?? 0;

    const recommendations: Array<{ productId: string; productName: string; currentBinCode: string; currentZone: string; pickFrequency: number; recommendation: string; suggestedBinCode: string | null }> = [];

    for (const assignment of binAssignments) {
      const freq = pickFreqByProduct.get(assignment.productId) ?? 0;
      const isFastMover = freq > 0 && freq >= fastMoverThreshold;
      const inZoneA = assignment.binLocation.zone === 'A';

      if (isFastMover && !inZoneA && preferredBins.length > 0) {
        recommendations.push({
          productId: assignment.productId,
          productName: assignment.product.name,
          currentBinCode: assignment.binLocation.code,
          currentZone: assignment.binLocation.zone,
          pickFrequency: freq,
          recommendation: 'MOVE_TO_PREFERRED_ZONE',
          suggestedBinCode: preferredBins[0]!.code,
        });
      } else if (!isFastMover && inZoneA && freq === 0 && reserveBins.length > 0) {
        recommendations.push({
          productId: assignment.productId,
          productName: assignment.product.name,
          currentBinCode: assignment.binLocation.code,
          currentZone: assignment.binLocation.zone,
          pickFrequency: freq,
          recommendation: 'MOVE_TO_RESERVE_ZONE',
          suggestedBinCode: reserveBins[0]!.code,
        });
      }
    }

    return { warehouseId, windowDays: sinceDays, count: recommendations.length, recommendations };
  }

  /** Executes a slotting move: relocates a product's bin-level quantity from one bin to another (real stock move, no new schema). */
  async executeSlottingMove(tenantId: string, productId: string, warehouseId: string, fromBinId: string, toBinId: string) {
    const fromAssignment = await prisma.inventoryItemBin.findFirst({ where: { tenantId, productId, warehouseId, binLocationId: fromBinId } });
    if (!fromAssignment) throw new NotFoundException('Source bin assignment not found');
    if (Number(fromAssignment.quantity) <= 0) throw new BadRequestException('Source bin has no quantity to move');

    const qty = fromAssignment.quantity;

    return prisma.$transaction(async (tx) => {
      await tx.inventoryItemBin.update({ where: { id: fromAssignment.id }, data: { quantity: 0 } });
      return tx.inventoryItemBin.upsert({
        where: { tenantId_productId_warehouseId_binLocationId: { tenantId, productId, warehouseId, binLocationId: toBinId } },
        update: { quantity: { increment: qty } },
        create: { tenantId, productId, warehouseId, binLocationId: toBinId, quantity: qty },
      });
    });
  }

  // ─── CROSS-DOCKING ────────────────────────────────────

  /**
   * Cross-dock opportunities: pending inbound receipts (PutawayTask) whose product is also
   * needed by an open, not-yet-picked wave item in the same warehouse — routing straight from
   * receiving to shipping instead of storage-then-retrieval, per 2026 WMS market benchmarking
   * (Manhattan Active WMS, NetSuite WMS) confirmed via discovery pass.
   */
  async getCrossDockOpportunities(tenantId: string, warehouseId?: string) {
    const putawayWhere: any = { tenantId, status: 'PENDING' };
    const putawayTasks = await prisma.putawayTask.findMany({
      where: putawayWhere,
      include: { inventoryItem: { include: { product: true } } },
    });

    const opportunities: Array<{ putawayTaskId: string; productId: string; productName: string; inboundQty: number; pickWaveItemId: string; demandQty: number; matchedQty: number }> = [];

    for (const task of putawayTasks) {
      const item = task.inventoryItem;
      if (warehouseId && item.warehouseId !== warehouseId) continue;

      const demandItem = await prisma.pickWaveItem.findFirst({
        where: { tenantId, productId: item.productId, status: 'PENDING' },
        include: { pickWave: true },
      });
      if (!demandItem || demandItem.pickWave.warehouseId !== item.warehouseId) continue;

      opportunities.push({
        putawayTaskId: task.id,
        productId: item.productId,
        productName: item.product.name,
        inboundQty: Number(task.quantity),
        pickWaveItemId: demandItem.id,
        demandQty: Number(demandItem.quantity),
        matchedQty: Math.min(Number(task.quantity), Number(demandItem.quantity)),
      });
    }

    return { warehouseId: warehouseId ?? null, count: opportunities.length, opportunities };
  }

  /** Executes a cross-dock: completes the inbound receipt task and marks the matched pick-wave item picked, bypassing put-away/storage entirely. */
  async executeCrossDock(tenantId: string, putawayTaskId: string, pickWaveItemId: string) {
    const task = await prisma.putawayTask.findFirst({ where: { id: putawayTaskId, tenantId } });
    if (!task) throw new NotFoundException('Putaway task not found');
    if (task.status === 'COMPLETE') throw new BadRequestException('Putaway task already completed');

    const waveItem = await prisma.pickWaveItem.findFirst({ where: { id: pickWaveItemId, tenantId } });
    if (!waveItem) throw new NotFoundException('Pick wave item not found');
    if (waveItem.status === 'PICKED') throw new BadRequestException('Pick wave item is already picked');

    const matchedQty = Math.min(Number(task.quantity), Number(waveItem.quantity));

    return prisma.$transaction(async (tx) => {
      const updatedTask = await tx.putawayTask.update({
        where: { id: putawayTaskId },
        data: { status: 'COMPLETE', completedAt: new Date() },
      });
      await tx.pickWaveItem.update({
        where: { id: pickWaveItemId },
        data: { pickedQty: new Prisma.Decimal(matchedQty), status: matchedQty >= Number(waveItem.quantity) ? 'PICKED' : 'SHORT' },
      });
      return updatedTask;
    });
  }

  // ─── QUALITY INSPECTIONS ────────────────────────────

  async getQAInspections(tenantId: string, params: PaginationParams & { status?: string } = {}) {
    return this.qaService.getQAInspections(tenantId, params);
  }

  async getQAInspectionById(tenantId: string, id: string) {
    return this.qaService.getQAInspectionById(tenantId, id);
  }

  async createQAInspection(tenantId: string, orgId: string, userId: string, dto: CreateQAInspectionInput) {
    return this.qaService.createQAInspection(tenantId, orgId, userId, dto);
  }

  async submitQAInspection(tenantId: string, id: string, userId: string, dto: SubmitQAInspectionInput) {
    return this.qaService.submitQAInspection(tenantId, id, userId, dto);
  }

  async routeQAInspectionDisposition(tenantId: string, id: string, userId: string) {
    return this.qaService.routeQAInspectionDisposition(tenantId, id, userId);
  }

  // ─── QA INSPECTION TEMPLATES ──────────────────────────

  async getQAInspectionTemplates(tenantId: string, params: PaginationParams & { productId?: string } = {}) {
    return this.qaService.getQAInspectionTemplates(tenantId, params);
  }

  async createQAInspectionTemplate(tenantId: string, dto: CreateQAInspectionTemplateInput) {
    return this.qaService.createQAInspectionTemplate(tenantId, dto);
  }

  async updateQAInspectionTemplate(tenantId: string, id: string, dto: UpdateQAInspectionTemplateInput) {
    return this.qaService.updateQAInspectionTemplate(tenantId, id, dto);
  }

  async deleteQAInspectionTemplate(tenantId: string, id: string) {
    return this.qaService.deleteQAInspectionTemplate(tenantId, id);
  }

  async createQAInspectionFromTemplate(tenantId: string, orgId: string, userId: string, templateId: string, dto: CreateQAInspectionInput) {
    return this.qaService.createQAInspectionFromTemplate(tenantId, orgId, userId, templateId, dto);
  }

  // ─── REORDER RULES ──────────────────────────────────

  async getReorderRules(tenantId: string, params: PaginationParams = {}) {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);

    const [rules, total] = await Promise.all([
      prisma.reorderRule.findMany({
        where,
        include: { product: true },
        skip,
        take,
      }),
      prisma.reorderRule.count({ where }),
    ]);

    return paginatedResult(rules, total, params);
  }

  async createReorderRule(tenantId: string, dto: CreateReorderRuleInput) {
    return prisma.reorderRule.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        minQty: new Prisma.Decimal(dto.minQty),
        maxQty: dto.maxQty ? new Prisma.Decimal(dto.maxQty) : null,
        reorderQty: new Prisma.Decimal(dto.reorderQty),
        leadTimeDays: dto.leadTimeDays,
        preferredVendorId: dto.preferredVendorId,
        autoCreatePO: dto.autoCreatePO,
        isActive: dto.isActive,
      },
    });
  }

  async updateReorderRule(tenantId: string, id: string, dto: any) {
    const rule = await prisma.reorderRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Reorder rule not found');

    const updateData: any = {
      isActive: dto.isActive,
      autoCreatePO: dto.autoCreatePO,
      leadTimeDays: dto.leadTimeDays,
      preferredVendorId: dto.preferredVendorId,
    };
    if (dto.minQty !== undefined) updateData.minQty = new Prisma.Decimal(dto.minQty);
    if (dto.maxQty !== undefined) updateData.maxQty = dto.maxQty ? new Prisma.Decimal(dto.maxQty) : null;
    if (dto.reorderQty !== undefined) updateData.reorderQty = new Prisma.Decimal(dto.reorderQty);

    return prisma.reorderRule.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteReorderRule(tenantId: string, id: string) {
    const rule = await prisma.reorderRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Reorder rule not found');

    await prisma.reorderRule.delete({ where: { id } });
    return { success: true };
  }

  /** Reorder dashboard: active rules whose on-hand quantity has fallen to/below minQty, with a lead-time-aware suggested order date. */
  async getReorderDashboard(tenantId: string) {
    const rules = await prisma.reorderRule.findMany({ where: { tenantId, isActive: true }, include: { product: true } });

    const triggered = await Promise.all(
      rules.map(async (rule) => {
        const where: any = { tenantId, productId: rule.productId };
        if (rule.warehouseId) where.warehouseId = rule.warehouseId;
        const items = await prisma.inventoryItem.findMany({ where });
        const onHand = items.reduce((sum, i) => sum + Number(i.quantity), 0);
        const isTriggered = onHand <= Number(rule.minQty);
        const suggestedOrderDate = new Date(Date.now() - rule.leadTimeDays * 24 * 60 * 60 * 1000);

        return {
          ruleId: rule.id,
          productId: rule.productId,
          productName: rule.product.name,
          warehouseId: rule.warehouseId,
          onHand,
          minQty: Number(rule.minQty),
          reorderQty: Number(rule.reorderQty),
          leadTimeDays: rule.leadTimeDays,
          isTriggered,
          suggestedOrderDate: isTriggered ? suggestedOrderDate : null,
          autoCreatePO: rule.autoCreatePO,
        };
      }),
    );

    return { rules: triggered, triggeredCount: triggered.filter((t) => t.isTriggered).length };
  }

  /** Creates a purchase requisition from a triggered reorder rule and stamps lastTriggeredAt, instead of leaving the trigger as a dashboard-only signal. */
  async createRequisitionFromReorderRule(tenantId: string, orgId: string, userId: string, ruleId: string, dto: CreateRequisitionFromReorderRuleInput) {
    const rule = await prisma.reorderRule.findFirst({ where: { id: ruleId, tenantId }, include: { product: true } });
    if (!rule) throw new NotFoundException('Reorder rule not found');

    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const count = await prisma.purchaseRequisition.count({ where: { tenantId } });
    const requisitionNumber = `REQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;
    const estimatedPrice = Number(rule.product.costPrice);
    const totalAmount = estimatedPrice * Number(rule.reorderQty);

    const requisition = await prisma.purchaseRequisition.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        requisitionNumber,
        title: `Auto-reorder: ${rule.product.name}`,
        status: 'DRAFT',
        requestedById: userId,
        requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : null,
        estimatedCost: new Prisma.Decimal(totalAmount),
        notes: `Auto-generated from reorder rule ${rule.id} (min ${rule.minQty}, lead time ${rule.leadTimeDays}d)`,
        lineItems: {
          create: [{
            tenantId,
            productId: rule.productId,
            description: rule.product.name,
            quantity: new Prisma.Decimal(rule.reorderQty),
            estimatedPrice: new Prisma.Decimal(estimatedPrice),
            totalAmount: new Prisma.Decimal(totalAmount),
          }],
        },
      },
      include: { lineItems: true },
    });

    await prisma.reorderRule.update({ where: { id: ruleId }, data: { lastTriggeredAt: new Date() } });

    return requisition;
  }

  // ─── STOCK ALERTS ───────────────────────────────────

  async getStockAlerts(tenantId: string, params: PaginationParams & { isResolved?: boolean } = {}) {
    const where: any = { tenantId };
    if (params.isResolved !== undefined) where.isResolved = params.isResolved;

    const { skip, take } = buildPaginationValues(params);

    const [alerts, total] = await Promise.all([
      prisma.stockAlert.findMany({
        where,
        include: { product: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockAlert.count({ where }),
    ]);

    return paginatedResult(alerts, total, params);
  }

  async resolveStockAlert(tenantId: string, id: string) {
    const alert = await prisma.stockAlert.findFirst({ where: { id, tenantId } });
    if (!alert) throw new NotFoundException('Stock alert not found');

    return prisma.stockAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  // ─── PRODUCT KITS ───────────────────────────────────

  async getProductKits(tenantId: string, params: PaginationParams = {}) {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);

    const [kits, total] = await Promise.all([
      prisma.productKit.findMany({
        where,
        include: { product: true, components: { include: { product: true } } },
        skip,
        take,
      }),
      prisma.productKit.count({ where }),
    ]);

    return paginatedResult(kits, total, params);
  }

  async getProductKitById(tenantId: string, id: string) {
    const kit = await prisma.productKit.findFirst({
      where: { id, tenantId },
      include: { product: true, components: { include: { product: true } } },
    });
    if (!kit) throw new NotFoundException('Product kit not found');
    return kit;
  }

  async createProductKit(tenantId: string, orgId: string, dto: CreateKitInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);

    const comps = dto.components.map((c) => ({
      tenantId,
      productId: c.productId,
      quantity: new Prisma.Decimal(c.quantity),
      sortOrder: c.sortOrder ?? 0,
    }));

    return prisma.productKit.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        productId: dto.productId,
        name: dto.name,
        description: dto.description,
        sellPrice: new Prisma.Decimal(dto.sellPrice),
        discount: new Prisma.Decimal(dto.discount ?? 0),
        isActive: dto.isActive,
        components: {
          create: comps,
        },
      },
      include: { components: true },
    });
  }

  async updateProductKit(tenantId: string, id: string, dto: any) {
    const kit = await prisma.productKit.findFirst({ where: { id, tenantId } });
    if (!kit) throw new NotFoundException('Product kit not found');

    return prisma.productKit.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        sellPrice: dto.sellPrice !== undefined ? new Prisma.Decimal(dto.sellPrice) : undefined,
        discount: dto.discount !== undefined ? new Prisma.Decimal(dto.discount) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deleteProductKit(tenantId: string, id: string) {
    const kit = await prisma.productKit.findFirst({ where: { id, tenantId } });
    if (!kit) throw new NotFoundException('Product kit not found');

    await prisma.productKit.delete({ where: { id } });
    return { success: true };
  }

  // ─── KIT BOM VERSIONING ───────────────────────────────

  async getKitVersions(tenantId: string, kitId: string) {
    return prisma.kitVersion.findMany({ where: { tenantId, kitId }, orderBy: { versionNo: 'desc' } });
  }

  /** Snapshots the kit's current component list as a new version, so BOM changes over time are auditable and revertible. */
  async createKitVersion(tenantId: string, kitId: string, userId: string, dto: CreateKitVersionInput) {
    const kit = await this.getProductKitById(tenantId, kitId);
    const latest = await prisma.kitVersion.findFirst({ where: { tenantId, kitId }, orderBy: { versionNo: 'desc' } });
    const versionNo = (latest?.versionNo ?? 0) + 1;

    const snapshot = kit.components.map((c) => ({ productId: c.productId, productName: c.product.name, quantity: Number(c.quantity) }));

    return prisma.$transaction(async (tx) => {
      await tx.kitVersion.updateMany({ where: { tenantId, kitId, isActive: true }, data: { isActive: false } });
      return tx.kitVersion.create({
        data: { tenantId, kitId, versionNo, componentsSnapshot: snapshot, isActive: true, notes: dto.notes, createdBy: userId },
      });
    });
  }

  /** Reverts the kit's live components to match a prior version's snapshot. */
  async activateKitVersion(tenantId: string, kitId: string, versionId: string) {
    const version = await prisma.kitVersion.findFirst({ where: { id: versionId, tenantId, kitId } });
    if (!version) throw new NotFoundException('Kit version not found');

    const snapshot = version.componentsSnapshot as Array<{ productId: string; quantity: number }>;

    await prisma.$transaction(async (tx) => {
      await tx.productKitItem.deleteMany({ where: { tenantId, kitId } });
      await tx.productKitItem.createMany({
        data: snapshot.map((c) => ({ tenantId, kitId, productId: c.productId, quantity: new Prisma.Decimal(c.quantity) })),
      });
      await tx.kitVersion.updateMany({ where: { tenantId, kitId, isActive: true }, data: { isActive: false } });
      await tx.kitVersion.update({ where: { id: versionId }, data: { isActive: true } });
    });

    return this.getProductKitById(tenantId, kitId);
  }

  /** How many kits can be assembled right now from on-hand component stock in a warehouse. */
  async getKitAvailability(tenantId: string, kitId: string, warehouseId: string) {
    const kit = await this.getProductKitById(tenantId, kitId);

    const componentAvailability = await Promise.all(
      kit.components.map(async (c) => {
        const item = await prisma.inventoryItem.findFirst({ where: { tenantId, productId: c.productId, warehouseId } });
        const onHand = Number(item?.quantity ?? 0);
        const perKit = Number(c.quantity);
        const buildable = perKit > 0 ? Math.floor(onHand / perKit) : 0;
        return { productId: c.productId, productName: c.product.name, perKitQty: perKit, onHand, buildable };
      }),
    );

    const maxBuildable = componentAvailability.length > 0 ? Math.min(...componentAvailability.map((c) => c.buildable)) : 0;
    return { kitId, warehouseId, maxBuildable, components: componentAvailability };
  }

  /** Rolled-up cost of a kit from its component cost prices, compared against the kit's sell price for margin visibility. */
  async getKitCostRollup(tenantId: string, kitId: string) {
    const kit = await this.getProductKitById(tenantId, kitId);
    const componentCosts = kit.components.map((c) => ({
      productId: c.productId,
      productName: c.product.name,
      quantity: Number(c.quantity),
      unitCost: Number(c.product.costPrice),
      lineCost: Number(c.quantity) * Number(c.product.costPrice),
    }));
    const totalCost = componentCosts.reduce((sum, c) => sum + c.lineCost, 0);
    const sellPrice = Number(kit.sellPrice) * (1 - Number(kit.discount) / 100);

    return { kitId, components: componentCosts, totalCost, sellPrice, margin: sellPrice - totalCost, marginPct: sellPrice > 0 ? Number((((sellPrice - totalCost) / sellPrice) * 100).toFixed(2)) : null };
  }

  /** Assembles kits: consumes component stock and produces finished-kit stock via a STOCK_ADJUSTMENT entry. */
  async assembleKit(tenantId: string, orgId: string, userId: string, kitId: string, dto: AssembleKitInput) {
    const kit = await this.getProductKitById(tenantId, kitId);
    const availability = await this.getKitAvailability(tenantId, kitId, dto.warehouseId);
    if (availability.maxBuildable < dto.quantity) {
      throw new BadRequestException(`Insufficient component stock: can build ${availability.maxBuildable}, requested ${dto.quantity}`);
    }

    const items = [
      ...kit.components.map((c) => ({
        productId: c.productId,
        qty: Number(c.quantity) * dto.quantity,
        fromWarehouseId: dto.warehouseId,
        valuationRate: Number(c.product.costPrice),
      })),
      { productId: kit.productId, qty: dto.quantity, toWarehouseId: dto.warehouseId, valuationRate: Number(kit.product.costPrice) },
    ];

    const entry = await this.createStockEntry(tenantId, orgId, userId, {
      type: 'STOCK_ADJUSTMENT',
      purpose: 'STOCK_ADJUSTMENT',
      remarks: `Kit assembly: ${dto.quantity} x ${kit.name}`,
      items,
    } as any);

    return this.submitStockEntry(tenantId, entry.id, userId);
  }

  /** Disassembles kits: consumes finished-kit stock and returns component stock via a STOCK_ADJUSTMENT entry. */
  async disassembleKit(tenantId: string, orgId: string, userId: string, kitId: string, dto: DisassembleKitInput) {
    const kit = await this.getProductKitById(tenantId, kitId);
    const kitItem = await prisma.inventoryItem.findFirst({ where: { tenantId, productId: kit.productId, warehouseId: dto.warehouseId } });
    const onHandKits = Number(kitItem?.quantity ?? 0);
    if (onHandKits < dto.quantity) {
      throw new BadRequestException(`Insufficient kit stock: ${onHandKits} on hand, ${dto.quantity} requested`);
    }

    const items = [
      { productId: kit.productId, qty: dto.quantity, fromWarehouseId: dto.warehouseId, valuationRate: Number(kit.product.costPrice) },
      ...kit.components.map((c) => ({
        productId: c.productId,
        qty: Number(c.quantity) * dto.quantity,
        toWarehouseId: dto.warehouseId,
        valuationRate: Number(c.product.costPrice),
      })),
    ];

    const entry = await this.createStockEntry(tenantId, orgId, userId, {
      type: 'STOCK_ADJUSTMENT',
      purpose: 'STOCK_ADJUSTMENT',
      remarks: `Kit disassembly: ${dto.quantity} x ${kit.name}`,
      items,
    } as any);

    return this.submitStockEntry(tenantId, entry.id, userId);
  }

  // ─── VALUATION & REPORTS ────────────────────────────

  async getValuationReport(tenantId: string, params: PaginationParams & { warehouseId?: string; method?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    // Fetch products
    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: { inventoryItems: { where: params.warehouseId ? { warehouseId: params.warehouseId } : {} } },
    });

    const reportData = [];
    let totalInventoryValue = 0;

    for (const prod of products) {
      let qty = 0;
      for (const item of prod.inventoryItems) {
        qty += Number(item.quantity);
      }

      // Calculate cost based on specified or default costing method
      const method = params.method || prod.costingMethod || 'AVERAGE';
      let unitCost = Number(prod.costPrice);

      if (method === 'FIFO' || method === 'LIFO') {
        // Fetch all ledger entry histories to compute valuation rates
        const ledgers = await prisma.stockLedgerEntry.findMany({
          where: { tenantId, productId: prod.id, ... (params.warehouseId ? { warehouseId: params.warehouseId } : {}) },
          orderBy: { postingDate: method === 'FIFO' ? 'asc' : 'desc' },
        });

        if (ledgers.length > 0) {
          // Average the rate of the last 5 inbound receipts/purchases as fallback/simplified FIFO calculation
          const receipts = ledgers.filter((l) => Number(l.qtyIn) > 0);
          if (receipts.length > 0) {
            const sum = receipts.slice(0, 5).reduce((acc, curr) => acc + Number(curr.valuationRate), 0);
            unitCost = sum / Math.min(receipts.length, 5);
          }
        }
      } else {
        // AVERAGE method: simplified weighted average rate
        const ledger = await prisma.stockLedgerEntry.findFirst({
          where: { tenantId, productId: prod.id, ... (params.warehouseId ? { warehouseId: params.warehouseId } : {}) },
          orderBy: { postingDate: 'desc' },
        });
        if (ledger) {
          unitCost = Number(ledger.valuationRate) || unitCost;
        }
      }

      const totalVal = qty * unitCost;
      totalInventoryValue += totalVal;

      reportData.push({
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        quantity: qty,
        unit: prod.unit,
        costingMethod: method,
        unitCost,
        value: totalVal,
      });
    }

    return {
      totalValue: totalInventoryValue,
      products: reportData,
    };
  }

  async getInventoryAging(tenantId: string, params: PaginationParams & { warehouseId?: string } = {}) {
    const where: any = { tenantId };
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    const products = await prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        inventoryItems: { where: params.warehouseId ? { warehouseId: params.warehouseId } : {} },
        stockLedgerEntries: {
          where: { ... (params.warehouseId ? { warehouseId: params.warehouseId } : {}), qtyIn: { gt: 0 } },
          orderBy: { postingDate: 'desc' },
          take: 1,
        },
      },
    });

    const agingData = products.map((prod) => {
      let qty = 0;
      for (const item of prod.inventoryItems) {
        qty += Number(item.quantity);
      }

      const lastReceipt = prod.stockLedgerEntries[0];
      let daysOld = 0;
      if (lastReceipt) {
        const diffTime = Math.abs(new Date().getTime() - new Date(lastReceipt.postingDate).getTime());
        daysOld = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      let category = '0-30 Days';
      if (daysOld > 90) category = '90+ Days';
      else if (daysOld > 60) category = '61-90 Days';
      else if (daysOld > 30) category = '31-60 Days';

      return {
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        quantity: qty,
        lastReceiptDate: lastReceipt ? lastReceipt.postingDate : null,
        daysOld,
        agingCategory: category,
      };
    });

    return agingData;
  }
}