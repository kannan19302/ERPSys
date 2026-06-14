import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ManufacturingService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}

  // ==========================================
  // BOM OPERATIONS
  // ==========================================

  async getBOMs(tenantId: string) {
    return prisma.bOM.findMany({
      where: { tenantId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBOMById(tenantId: string, id: string) {
    const bom = await prisma.bOM.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
      },
    });
    if (!bom) throw new NotFoundException('BOM not found');
    return bom;
  }

  async createBOM(
    tenantId: string,
    dto: {
      productId: string;
      name: string;
      code: string;
      materialCost?: number;
      overheadCost?: number;
      standardCost?: number;
      routingJson?: string;
      items: Array<{ productId: string; quantity: number; type?: string }>;
    }
  ) {
    const existing = await prisma.bOM.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`BOM code ${dto.code} already exists.`);

    return prisma.$transaction(async (tx) => {
      const bom = await tx.bOM.create({
        data: {
          tenantId,
          productId: dto.productId,
          name: dto.name,
          code: dto.code,
          materialCost: new Prisma.Decimal(dto.materialCost || 0),
          overheadCost: new Prisma.Decimal(dto.overheadCost || 0),
          standardCost: new Prisma.Decimal(dto.standardCost || 0),
          routingJson: dto.routingJson ? JSON.parse(dto.routingJson) : [],
        },
      });

      for (const item of dto.items) {
        await tx.bOMItem.create({
          data: {
            tenantId,
            bomId: bom.id,
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
            type: item.type || 'COMPONENT',
          },
        });
      }

      return bom;
    });
  }

  // ==========================================
  // WORK ORDERS & CAPACITY SCHEDULING
  // ==========================================

  async getWorkOrders(tenantId: string) {
    return prisma.workOrder.findMany({
      where: { tenantId },
      include: {
        bom: true,
        workstation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWorkOrder(
    tenantId: string,
    dto: {
      bomId: string;
      workOrderNumber: string;
      quantity: number;
      startDate?: string;
      workstationId?: string;
    }
  ) {
    const bom = await prisma.bOM.findFirst({ where: { id: dto.bomId, tenantId } });
    if (!bom) throw new NotFoundException('BOM not found');

    const existing = await prisma.workOrder.findFirst({
      where: { tenantId, workOrderNumber: dto.workOrderNumber },
    });
    if (existing) throw new BadRequestException(`Work order ${dto.workOrderNumber} already exists.`);

    // 1. Calculate Standard Cost
    const standardCost = Number(bom.standardCost) * dto.quantity;

    // 2. Capacity Constraint Scheduling (APS)
    let finalStartDate = dto.startDate ? new Date(dto.startDate) : new Date();
    if (dto.workstationId) {
      const workstation = await prisma.workstation.findFirst({
        where: { id: dto.workstationId, tenantId },
      });
      if (workstation) {
        // Find existing work orders scheduled at this workstation
        const existingWO = await prisma.workOrder.findMany({
          where: {
            tenantId,
            workstationId: dto.workstationId,
            status: { in: ['PLANNED', 'IN_PROGRESS'] },
          },
        });

        const workstationHoursAllocated = existingWO.reduce(
          (sum, wo) => sum + Number(wo.quantity) * 2, // assume 2 hours per unit assembly average
          0
        );

        // If allocated hours exceeds workstation capacity, shift the start date out
        if (workstationHoursAllocated > Number(workstation.capacityHours)) {
          const hoursExceeded = workstationHoursAllocated - Number(workstation.capacityHours);
          const daysToShift = Math.ceil(hoursExceeded / 8); // assume 8 hour shift day
          finalStartDate.setDate(finalStartDate.getDate() + daysToShift);
        }
      }
    }

    return prisma.workOrder.create({
      data: {
        tenantId,
        bomId: dto.bomId,
        workOrderNumber: dto.workOrderNumber,
        quantity: new Prisma.Decimal(dto.quantity),
        startDate: finalStartDate,
        status: 'DRAFT',
        workstationId: dto.workstationId || null,
        standardCost: new Prisma.Decimal(standardCost),
      },
    });
  }

  async startWorkOrder(tenantId: string, id: string) {
    const wo = await prisma.workOrder.findFirst({ where: { id, tenantId } });
    if (!wo) throw new NotFoundException('Work order not found');

    return prisma.workOrder.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startDate: new Date(),
      },
    });
  }

  async updateWorkOrderStatus(tenantId: string, id: string, status: string) {
    const wo = await prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: {
        bom: {
          include: {
            items: true,
          },
        },
      },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    // Cost Variance & Roll-Up Calculation upon completion
    let actualCost = wo.actualCost;
    let costVariance = wo.costVariance;

    if (status === 'COMPLETED') {
      const materialBase = Number(wo.bom.materialCost) * Number(wo.quantity);
      // Actual costing includes logged scrap penalty (+20% of standard cost per scrap)
      const scrapPenalty = wo.scrapQuantity ? Number(wo.scrapQuantity) * Number(wo.bom.standardCost) * 0.2 : 0;
      actualCost = new Prisma.Decimal(materialBase + scrapPenalty);
      costVariance = new Prisma.Decimal(Number(actualCost) - Number(wo.standardCost || 0));
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status,
        endDate: status === 'COMPLETED' ? new Date() : undefined,
        actualCost,
        costVariance,
      },
    });

    if (status === 'COMPLETED' && this.eventEmitter) {
      const warehouse = await prisma.warehouse.findFirst({ where: { tenantId } });
      const warehouseId = warehouse ? warehouse.id : null;

      // Filter input components vs co/by products
      const components = wo.bom.items.filter(item => item.type === 'COMPONENT');
      const outputs = wo.bom.items.filter(item => item.type !== 'COMPONENT');

      this.eventEmitter.emit('manufacturing.workorder.completed', {
        tenantId,
        workOrderId: id,
        productId: wo.bom.productId,
        quantity: Number(wo.quantity),
        warehouseId,
        items: components.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity) * Number(wo.quantity),
        })),
        outputs: outputs.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity) * Number(wo.quantity),
          type: item.type,
        })),
      });
    }

    return updated;
  }

  async logScrapAndOee(
    tenantId: string,
    id: string,
    dto: { oeeScore: number; scrapQuantity: number; lotNumber?: string }
  ) {
    const wo = await prisma.workOrder.findFirst({ where: { id, tenantId } });
    if (!wo) throw new NotFoundException('Work order not found');

    const standardCostVal = Number(wo.standardCost || 0);
    // Recalculate actual costs with new scrap details
    const actualCostVal = standardCostVal + dto.scrapQuantity * 10.0; // simple $10 scrap processing overhead
    const costVarianceVal = actualCostVal - standardCostVal;

    return prisma.workOrder.update({
      where: { id },
      data: {
        oeeScore: new Prisma.Decimal(dto.oeeScore),
        scrapQuantity: new Prisma.Decimal(dto.scrapQuantity),
        lotNumber: dto.lotNumber || null,
        actualCost: new Prisma.Decimal(actualCostVal),
        costVariance: new Prisma.Decimal(costVarianceVal),
      },
    });
  }

  // ==========================================
  // MRP PLANNING ENGINE
  // ==========================================

  async getMRPRuns(tenantId: string) {
    return prisma.mRPRun.findMany({
      where: { tenantId },
      include: {
        plannedItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { runDate: 'desc' },
    });
  }

  async runMRP(tenantId: string, runBy?: string) {
    // 1. Create running trace
    const run = await prisma.mRPRun.create({
      data: {
        tenantId,
        status: 'RUNNING',
        runBy,
      },
    });

    try {
      // 2. Fetch confirmed sales order lines
      const orders = await prisma.salesOrder.findMany({
        where: {
          tenantId,
          status: { in: ['CONFIRMED', 'PROCESSING'] },
        },
        include: {
          lineItems: true,
        },
      });

      // 3. Aggregate net stock and find requirements
      for (const order of orders) {
        for (const item of order.lineItems) {
          if (!item.productId) continue;

          // Check aggregate stock levels
          const stockRecords = await prisma.inventoryItem.findMany({
            where: { tenantId, productId: item.productId },
          });
          const stockQty = stockRecords.reduce((sum, r) => sum + Number(r.quantity), 0);
          const demanded = Number(item.quantity);

          if (stockQty < demanded) {
            const netReq = demanded - stockQty;

            // Check if finished product has BOM
            const bom = await prisma.bOM.findFirst({
              where: { tenantId, productId: item.productId, isActive: true },
              include: { items: true },
            });

            if (bom) {
              // 1. Suggest manufacturing finished item
              await prisma.mRPPlannedItem.create({
                data: {
                  tenantId,
                  mrpRunId: run.id,
                  productId: item.productId,
                  bomId: bom.id,
                  demandSource: 'SALES_ORDER',
                  demandSourceId: order.id,
                  quantityNeeded: new Prisma.Decimal(demanded),
                  quantityInStock: new Prisma.Decimal(stockQty),
                  netQuantityRequired: new Prisma.Decimal(netReq),
                  actionType: 'CREATE_WORK_ORDER',
                },
              });

              // 2. Explode BOM components requirements
              for (const comp of bom.items) {
                if (comp.type !== 'COMPONENT') continue; // skip co/by products

                const compStockRecords = await prisma.inventoryItem.findMany({
                  where: { tenantId, productId: comp.productId },
                });
                const compStockQty = compStockRecords.reduce((sum, r) => sum + Number(r.quantity), 0);
                const compDemanded = Number(comp.quantity) * netReq;

                if (compStockQty < compDemanded) {
                  const compNetReq = compDemanded - compStockQty;

                  // Check if component itself has a BOM
                  const subBom = await prisma.bOM.findFirst({
                    where: { tenantId, productId: comp.productId, isActive: true },
                  });

                  await prisma.mRPPlannedItem.create({
                    data: {
                      tenantId,
                      mrpRunId: run.id,
                      productId: comp.productId,
                      bomId: subBom ? subBom.id : null,
                      demandSource: 'SAFETY_STOCK',
                      demandSourceId: bom.id,
                      quantityNeeded: new Prisma.Decimal(compDemanded),
                      quantityInStock: new Prisma.Decimal(compStockQty),
                      netQuantityRequired: new Prisma.Decimal(compNetReq),
                      actionType: subBom ? 'CREATE_WORK_ORDER' : 'CREATE_PURCHASE_ORDER',
                    },
                  });
                }
              }
            } else {
              // Suggest simple purchase order for finished item without BOM
              await prisma.mRPPlannedItem.create({
                data: {
                  tenantId,
                  mrpRunId: run.id,
                  productId: item.productId,
                  demandSource: 'SALES_ORDER',
                  demandSourceId: order.id,
                  quantityNeeded: new Prisma.Decimal(demanded),
                  quantityInStock: new Prisma.Decimal(stockQty),
                  netQuantityRequired: new Prisma.Decimal(netReq),
                  actionType: 'CREATE_PURCHASE_ORDER',
                },
              });
            }
          }
        }
      }

      return prisma.mRPRun.update({
        where: { id: run.id },
        data: { status: 'COMPLETED' },
        include: { plannedItems: { include: { product: true } } },
      });
    } catch {
      return prisma.mRPRun.update({
        where: { id: run.id },
        data: { status: 'FAILED' },
      });
    }
  }

  async processMRPPlannedItem(tenantId: string, plannedItemId: string) {
    const plannedItem = await prisma.mRPPlannedItem.findFirst({
      where: { id: plannedItemId, tenantId },
      include: { product: true },
    });
    if (!plannedItem) throw new NotFoundException('Planned replenishment item not found');
    if (plannedItem.status === 'PROCESSED') throw new BadRequestException('Item already processed');

    let resultReference = '';

    if (plannedItem.actionType === 'CREATE_WORK_ORDER' && plannedItem.bomId) {
      const woCount = await prisma.workOrder.count({ where: { tenantId } });
      const wo = await prisma.workOrder.create({
        data: {
          tenantId,
          bomId: plannedItem.bomId,
          workOrderNumber: `WO-MRP-${woCount + 101}`,
          quantity: plannedItem.netQuantityRequired,
          status: 'PLANNED',
          standardCost: new Prisma.Decimal(Number(plannedItem.netQuantityRequired) * Number(plannedItem.product.costPrice)),
        },
      });
      resultReference = `Work Order: ${wo.workOrderNumber}`;
    } else {
      // CREATE_PURCHASE_ORDER
      // Find a vendor
      const vendor = await prisma.vendor.findFirst({ where: { tenantId } });
      const vendorId = vendor ? vendor.id : 'default-vendor-id';

      const poCount = await prisma.purchaseOrder.count({ where: { tenantId } });
      // Create a draft PO
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      const orgId = org ? org.id : 'default-org-id';

      const po = await prisma.purchaseOrder.create({
        data: {
          tenantId,
          orgId,
          vendorId,
          poNumber: `PO-MRP-${poCount + 101}`,
          status: 'DRAFT',
          totalAmount: new Prisma.Decimal(Number(plannedItem.netQuantityRequired) * Number(plannedItem.product.costPrice)),
          subtotal: new Prisma.Decimal(Number(plannedItem.netQuantityRequired) * Number(plannedItem.product.costPrice)),
          notes: `Auto-generated via MRP for Product SKU: ${plannedItem.product.sku}`,
        },
      });

      // Create PO Line item
      await prisma.purchaseOrderItem.create({
        data: {
          tenantId,
          purchaseOrderId: po.id,
          productId: plannedItem.productId,
          description: plannedItem.product.name,
          quantity: plannedItem.netQuantityRequired,
          unitPrice: plannedItem.product.costPrice,
          totalAmount: new Prisma.Decimal(Number(plannedItem.netQuantityRequired) * Number(plannedItem.product.costPrice)),
        },
      });

      resultReference = `Purchase Order: ${po.poNumber}`;
    }

    await prisma.mRPPlannedItem.update({
      where: { id: plannedItemId },
      data: { status: 'PROCESSED' },
    });

    return { success: true, reference: resultReference };
  }

  // ==========================================
  // QUALITY CONTROL & GATES & NCR
  // ==========================================

  async getQualityPlans(tenantId: string) {
    return prisma.qualityInspectionPlan.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQualityPlan(
    tenantId: string,
    dto: { productId: string; name: string; code: string; checks: string }
  ) {
    return prisma.qualityInspectionPlan.create({
      data: {
        tenantId,
        productId: dto.productId,
        name: dto.name,
        code: dto.code,
        checks: JSON.parse(dto.checks),
        status: 'ACTIVE',
      },
    });
  }

  async logInspection(
    tenantId: string,
    orgId: string,
    dto: {
      inspectionNumber: string;
      referenceType: string;
      referenceId: string;
      productId: string;
      status: string;
      inspectedQty: number;
      passedQty: number;
      inspectedBy: string;
      checklistJson: string;
    }
  ) {
    const rejectedQty = dto.inspectedQty - dto.passedQty;

    const qi = await prisma.qualityInspection.create({
      data: {
        tenantId,
        orgId,
        inspectionNumber: dto.inspectionNumber,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        productId: dto.productId,
        status: dto.status,
        inspectedQty: new Prisma.Decimal(dto.inspectedQty),
        passedQty: new Prisma.Decimal(dto.passedQty),
        rejectedQty: new Prisma.Decimal(rejectedQty),
        inspectedBy: dto.inspectedBy,
        checklist: JSON.parse(dto.checklistJson),
      },
    });

    // If status is FAILED or has rejected items, auto-log a Non-Conformance Report (NCR)
    if (dto.status === 'FAILED' || rejectedQty > 0) {
      await prisma.nonConformanceReport.create({
        data: {
          tenantId,
          qualityInspectionId: qi.id,
          workOrderId: dto.referenceType === 'Work Order' ? dto.referenceId : null,
          productId: dto.productId,
          title: `NCR: Failed Audit ${dto.inspectionNumber}`,
          description: `Automatic NCR triggered by failed inspection audit checks on ${qi.referenceType} (ID: ${qi.referenceId}). Total rejected quantity: ${rejectedQty}`,
          disposition: 'REWORK',
          status: 'OPEN',
          loggedBy: dto.inspectedBy,
        },
      });
    }

    return qi;
  }

  async getNCRs(tenantId: string) {
    return prisma.nonConformanceReport.findMany({
      where: { tenantId },
      include: {
        product: true,
        workOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNCR(
    tenantId: string,
    dto: {
      workOrderId?: string;
      productId: string;
      title: string;
      description?: string;
      disposition: string;
      loggedBy?: string;
    }
  ) {
    return prisma.nonConformanceReport.create({
      data: {
        tenantId,
        workOrderId: dto.workOrderId || null,
        productId: dto.productId,
        title: dto.title,
        description: dto.description || null,
        disposition: dto.disposition,
        loggedBy: dto.loggedBy || 'System QC',
        status: 'OPEN',
      },
    });
  }

  async resolveNCR(
    tenantId: string,
    id: string,
    dto: { disposition: string; status: string; resolvedBy?: string }
  ) {
    const existing = await prisma.nonConformanceReport.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('NCR not found');

    return prisma.nonConformanceReport.update({
      where: { id },
      data: {
        disposition: dto.disposition,
        status: dto.status,
        resolvedBy: dto.resolvedBy || 'QC Manager',
        resolvedAt: new Date(),
      },
    });
  }

  // ==========================================
  // CMMS & MACHINE DOWNTIME
  // ==========================================

  async getWorkstations(tenantId: string) {
    return prisma.workstation.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  async createWorkstation(
    tenantId: string,
    orgId: string,
    dto: { name: string; code: string; capacityHours: number; hourlyOverheadRate: number }
  ) {
    return prisma.workstation.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        code: dto.code,
        capacityHours: new Prisma.Decimal(dto.capacityHours),
        hourlyOverheadRate: new Prisma.Decimal(dto.hourlyOverheadRate),
      },
    });
  }

  async getDowntimeLogs(tenantId: string) {
    return prisma.machineDowntimeLog.findMany({
      where: { tenantId },
      include: { workstation: true },
      orderBy: { startTime: 'desc' },
    });
  }

  async logDowntime(
    tenantId: string,
    dto: { workstationId: string; downtimeCode: string; startTime: string; endTime?: string; notes?: string }
  ) {
    const start = new Date(dto.startTime);
    const end = dto.endTime ? new Date(dto.endTime) : null;
    let duration: number | null = null;
    if (end) {
      duration = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    return prisma.machineDowntimeLog.create({
      data: {
        tenantId,
        workstationId: dto.workstationId,
        downtimeCode: dto.downtimeCode,
        startTime: start,
        endTime: end,
        durationMinutes: duration,
        notes: dto.notes || null,
      },
    });
  }

  async getMaintenanceRequests(tenantId: string) {
    return prisma.maintenanceRequest.findMany({
      where: { tenantId },
      include: { workstation: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMaintenanceRequest(
    tenantId: string,
    dto: { workstationId: string; type: string; priority: string; title: string; description?: string }
  ) {
    return prisma.maintenanceRequest.create({
      data: {
        tenantId,
        workstationId: dto.workstationId,
        type: dto.type,
        priority: dto.priority,
        title: dto.title,
        description: dto.description || null,
        status: 'REQUESTED',
      },
    });
  }

  // ==========================================
  // SUBCONTRACTING OPERATIONS
  // ==========================================

  async getSubcontractingOrders(tenantId: string) {
    return prisma.subcontractingOrder.findMany({
      where: { tenantId },
      include: {
        vendor: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubcontractingOrder(
    tenantId: string,
    dto: { vendorId: string; productId: string; quantity: number; unitCost: number; deliveryDate?: string }
  ) {
    const total = dto.quantity * dto.unitCost;

    return prisma.subcontractingOrder.create({
      data: {
        tenantId,
        vendorId: dto.vendorId,
        productId: dto.productId,
        quantity: new Prisma.Decimal(dto.quantity),
        unitCost: new Prisma.Decimal(dto.unitCost),
        totalCost: new Prisma.Decimal(total),
        status: 'SENT',
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
      },
    });
  }

  async updateSubcontractingStatus(tenantId: string, id: string, status: string) {
    return prisma.subcontractingOrder.updateMany({
      where: { id, tenantId },
      data: { status },
    });
  }

  async getWorkstationLoadBalancing(tenantId: string) {
    const workstations = await prisma.workstation.findMany({ where: { tenantId } });
    const loadList = [];

    for (const ws of workstations) {
      const activeWO = await prisma.workOrder.findMany({
        where: {
          tenantId,
          workstationId: ws.id,
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
        },
      });

      const allocatedHours = activeWO.reduce(
        (sum, w) => sum + Number(w.quantity) * 1.5, // 1.5 hours standard per unit
        0
      );

      const capacity = Number(ws.capacityHours);
      const rate = capacity > 0 ? (allocatedHours / capacity) * 100 : 0;

      loadList.push({
        workstation: ws.name,
        capacityHours: capacity,
        allocatedHours,
        status: rate > 90 ? 'OVERLOADED' : 'HEALTHY',
        utilizationRate: rate,
      });
    }

    // Fallback if no workstations seeded yet
    if (loadList.length === 0) {
      return [
        { workstation: 'CNC Cutting Machine', capacityHours: 80, allocatedHours: 0, status: 'HEALTHY', utilizationRate: 0 },
        { workstation: 'Assembly Line A', capacityHours: 120, allocatedHours: 0, status: 'HEALTHY', utilizationRate: 0 },
        { workstation: 'Packaging Station', capacityHours: 60, allocatedHours: 0, status: 'HEALTHY', utilizationRate: 0 }
      ];
    }

    return loadList;
  }
}
