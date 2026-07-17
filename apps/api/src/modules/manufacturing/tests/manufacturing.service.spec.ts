import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManufacturingService } from '../manufacturing.service';
import { Prisma } from '@prisma/client';

// Mock all Prisma delegates
vi.mock('@unerp/database', () => ({
  prisma: {
    bOM: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    bOMItem: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    workOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    workOrderOperation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workstation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    workstationShift: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    subcontractingOrder: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    subcontractingMaterial: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    equipmentTool: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    engineeringChangeOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workOrderComponentConsumption: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    qualityInspectionPlan: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    qualityInspection: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    nonConformanceReport: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    machineDowntimeLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    maintenanceRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
    inventoryItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    salesOrder: {
      findMany: vi.fn(),
    },
    mRPRun: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mRPPlannedItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    vendor: {
      findFirst: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
    },
    purchaseOrder: {
      count: vi.fn(),
      create: vi.fn(),
    },
    purchaseOrderItem: {
      create: vi.fn(),
    },
    warehouse: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: any) => Promise<any>) => fn({
      bOM: {
        create: vi.fn().mockResolvedValue({ id: 'bom-1', name: 'Laptop Assy', code: 'BOM-1' }),
      },
      bOMItem: { create: vi.fn() },
      workOrder: {
        create: vi.fn().mockResolvedValue({ id: 'wo-1', workOrderNumber: 'WO-1', quantity: 10 }),
      },
      workOrderOperation: {
        create: vi.fn(),
      },
      subcontractingMaterial: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      inventoryItem: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      subcontractingOrder: {
        update: vi.fn(),
      },
    })),
  },
}));

import { prisma } from '@unerp/database';

describe('ManufacturingService', () => {
  let service: ManufacturingService;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockEventEmitter = { emit: vi.fn() };
    service = new ManufacturingService(mockEventEmitter);
    vi.clearAllMocks();
  });

  describe('getBOMs', () => {
    it('should return all BOMs', async () => {
      const mockBOMs = [{ id: 'bom-1', name: 'Laptop Assembly', code: 'BOM-LAP' }];
      vi.mocked(prisma.bOM.findMany).mockResolvedValue(mockBOMs as any);

      const result = await service.getBOMs('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe('BOM-LAP');
    });
  });

  describe('getBOMTree (Recursive BOM Explosion)', () => {
    it('should explode multi-level BOM correctly', async () => {
      const mockBom = {
        id: 'bom-1',
        name: 'Finished Product BOM',
        code: 'BOM-FP',
        version: '1.0',
        status: 'APPROVED',
        materialCost: new Prisma.Decimal(100),
        overheadCost: new Prisma.Decimal(20),
        standardCost: new Prisma.Decimal(120),
        routingJson: [],
      };

      const mockBomItems = [
        { id: 'item-1', bomId: 'bom-1', productId: 'prod-comp-1', quantity: new Prisma.Decimal(2), type: 'COMPONENT' }
      ];

      vi.mocked(prisma.bOM.findFirst).mockResolvedValueOnce(mockBom as any).mockResolvedValueOnce(null as any);
      vi.mocked(prisma.bOMItem.findMany).mockResolvedValue(mockBomItems as any);
      vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: 'prod-comp-1', name: 'Component 1', sku: 'SKU-COMP1' } as any);

      const tree = await service.getBOMTree('tenant-1', 'bom-1') as any;
      expect(tree.id).toBe('bom-1');
      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].productName).toBe('Component 1');
      expect(tree.children[0].quantity).toBe(2);
    });
  });

  describe('createWorkOrder (Shift-Aware Scheduling)', () => {
    it('should schedule work order with capacity & shift offset adjustment', async () => {
      const mockBom = { id: 'bom-1', standardCost: new Prisma.Decimal(50), routingJson: [{ sequence: 1, name: 'Assemble', workstationCode: 'WS-1', durationMinutes: 30 }] };
      const mockWorkstation = {
        id: 'ws-1',
        capacityHours: new Prisma.Decimal(8),
        shifts: [{ startTime: '08:00', endTime: '16:00' }] // 8-hour capacity
      };
      // Active work orders allocated 10 hours (exceeding capacity)
      const mockExistingWO = [
        { id: 'wo-prev', quantity: new Prisma.Decimal(5) } // 5 * 2 = 10 hours allocated
      ];

      vi.mocked(prisma.bOM.findFirst).mockResolvedValue(mockBom as any);
      vi.mocked(prisma.workOrder.findFirst).mockResolvedValue(null as any); // no duplicate
      vi.mocked(prisma.workstation.findFirst).mockResolvedValue(mockWorkstation as any);
      vi.mocked(prisma.workOrder.findMany).mockResolvedValue(mockExistingWO as any);

      const result = await service.createWorkOrder('tenant-1', {
        bomId: 'bom-1',
        workOrderNumber: 'WO-NEW-101',
        quantity: 2,
        startDate: '2026-06-21T08:00:00Z',
        workstationId: 'ws-1'
      });

      expect(result).toBeDefined();
      // Verifies that transaction handler created the work order
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('completeOperationStep (Tool cycle calibration alarm)', () => {
    it('should increment tool cycles and trigger PM ticket if max cycles exceeded', async () => {
      const mockOp = { id: 'op-1', workstationCode: 'WS-CNC', sequence: 1, name: 'CNC Cutting' };
      const mockWorkstation = {
        id: 'ws-cnc',
        code: 'WS-CNC',
        name: 'CNC Station',
        tools: [{ id: 'tool-1', name: 'Drill Bit A', code: 'T-DRILL', currentCycles: 99, maxCycles: 100, status: 'OK' }]
      };

      vi.mocked(prisma.workOrderOperation.findFirst).mockResolvedValue(mockOp as any);
      vi.mocked(prisma.workOrderOperation.update).mockResolvedValue({ id: 'op-1', status: 'COMPLETED' } as any);
      vi.mocked(prisma.workstation.findFirst).mockResolvedValue(mockWorkstation as any);

      await service.completeOperationStep('tenant-1', 'wo-1', 'op-1', {});

      expect(prisma.equipmentTool.update).toHaveBeenCalledWith({
        where: { id: 'tool-1' },
        data: { currentCycles: 100, status: 'NEEDS_CALIBRATION' }
      });
      expect(prisma.maintenanceRequest.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          workstationId: 'ws-cnc',
          type: 'PREVENTIVE',
          priority: 'HIGH',
          title: 'Auto Calibration: Drill Bit A',
          description: 'Tool T-DRILL on CNC Station exceeded its limit of 100 cycles.',
          status: 'REQUESTED'
        }
      });
    });
  });

  describe('Engineering Change Orders (ECO)', () => {
    it('should submit an ECO under review', async () => {
      await service.submitECO('tenant-1', { bomId: 'bom-1', changeDescription: 'Upgrade component to standard', requestedBy: 'Eng John' });
      expect(prisma.bOM.update).toHaveBeenCalledWith({
        where: { id: 'bom-1' },
        data: { status: 'UNDER_REVIEW' }
      });
      expect(prisma.engineeringChangeOrder.create).toHaveBeenCalled();
    });

    it('should resolve an ECO and update BOM status', async () => {
      vi.mocked(prisma.engineeringChangeOrder.findFirst).mockResolvedValue({ id: 'eco-1', bomId: 'bom-1' } as any);
      await service.resolveECO('tenant-1', 'eco-1', 'APPROVED', 'Manager');
      expect(prisma.engineeringChangeOrder.update).toHaveBeenCalledWith({
        where: { id: 'eco-1' },
        data: { status: 'APPROVED', approvedBy: 'Manager' }
      });
      expect(prisma.bOM.update).toHaveBeenCalledWith({
        where: { id: 'bom-1' },
        data: { status: 'APPROVED' }
      });
    });
  });

  describe('Lot Genealogy Upstream & Downstream Tracking', () => {
    it('should fetch upstream and downstream lot consumption details', async () => {
      const mockConsumptions = [
        {
          id: 'con-1',
          workOrderId: 'wo-down',
          lotNumber: 'LOT-XYZ',
          quantityConsumed: new Prisma.Decimal(1),
          product: { name: 'Part A' },
          workOrder: { workOrderNumber: 'WO-DOWN-101', bom: { name: 'Finished Product A' }, lotNumber: 'LOT-FIN-A' }
        }
      ];

      vi.mocked(prisma.workOrderComponentConsumption.findMany).mockResolvedValue(mockConsumptions as any);
      vi.mocked(prisma.workOrder.findFirst).mockResolvedValue({
        workOrderNumber: 'WO-XYZ',
        quantity: new Prisma.Decimal(10),
        componentConsumptions: [
          { productId: 'sub-p1', product: { name: 'Sub Component 1', sku: 'SKU-SUB' }, lotNumber: 'LOT-SUB-VAL', quantityConsumed: new Prisma.Decimal(5) }
        ]
      } as any);

      const genealogy = await service.getLotGenealogy('tenant-1', 'LOT-XYZ') as any;
      expect(genealogy.lotNumber).toBe('LOT-XYZ');
      expect(genealogy.downstream).toHaveLength(1);
      expect(genealogy.downstream[0].finishedProductLot).toBe('LOT-FIN-A');
      expect(genealogy.upstream.components).toHaveLength(1);
      expect(genealogy.upstream.components[0].consumedLot).toBe('LOT-SUB-VAL');
    });
  });

  describe('Detailed OEE Analytics breakdown', () => {
    it('should compute OEE (Availability, Performance, Quality)', async () => {
      const mockDowntimes = [{ id: 'dt-1', durationMinutes: 120, workstationId: 'ws-1' }];
      const mockWorkstations = [{ id: 'ws-1', capacityHours: new Prisma.Decimal(40) }];
      const mockCompletedWOs = [
        {
          id: 'wo-1',
          quantity: new Prisma.Decimal(10),
          startDate: new Date('2026-06-21T08:00:00Z'),
          endDate: new Date('2026-06-21T09:00:00Z'), // 60 mins actual
          bom: { routingJson: [{ durationMinutes: 5 }] } // 50 mins standard
        }
      ];
      const mockInspections = [
        { id: 'insp-1', inspectedQty: new Prisma.Decimal(10), passedQty: new Prisma.Decimal(9) }
      ];

      vi.mocked(prisma.machineDowntimeLog.findMany).mockResolvedValue(mockDowntimes as any);
      vi.mocked(prisma.workstation.findMany).mockResolvedValue(mockWorkstations as any);
      vi.mocked(prisma.workOrder.findMany).mockResolvedValue(mockCompletedWOs as any);
      vi.mocked(prisma.qualityInspection.findMany).mockResolvedValue(mockInspections as any);

      const oeeMetrics = await service.getDetailedOEEAnalytics('tenant-1');
      expect(oeeMetrics.availability).toBe(95); // (40 - 2) / 40 * 100 = 95%
      expect(oeeMetrics.performance).toBe(83);  // 50 / 60 * 100 = 83%
      expect(oeeMetrics.quality).toBe(90);      // 9 / 10 * 100 = 90%
      expect(oeeMetrics.oee).toBe(71);          // 95 * 83.33 * 90 / 10000 = 71%
    });
  });
});
