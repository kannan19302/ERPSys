// ─────────────────────────────────────────────────
// Inventory Module Input Types
// Used by both frontend (forms) and backend (DTOs)
// ─────────────────────────────────────────────────

// ── Product Categories ──
export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

// ── Product Variants ──
export interface CreateVariantInput {
  parentSkuId: string;
  sku: string;
  name: string;
  attributes?: Record<string, unknown>;
  costPrice: number;
  sellPrice: number;
  barcode?: string | null;
  isActive?: boolean;
}

// ── Bin Locations ──
export interface CreateBinLocationInput {
  warehouseId: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  bin?: string;
  code: string;
  name?: string;
  description?: string | null;
  capacity?: number | null;
  isActive?: boolean;
}

// ── Serial Numbers ──
export interface CreateSerialNumberInput {
  productId: string;
  warehouseId?: string | null;
  serialNo: string;
  status?: string;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  purchaseOrderId?: string | null;
  salesOrderId?: string | null;
  notes?: string | null;
  customFields?: Record<string, unknown>;
}

export interface UpdateSerialNumberInput {
  status?: string;
  warehouseId?: string | null;
  notes?: string | null;
  customFields?: Record<string, unknown>;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
}

// ── Batches ──
export interface CreateBatchInput {
  productId: string;
  batchNo: string;
  lotNo?: string | null;
  quantity: number;
  manufactureDate?: string | null;
  expiryDate?: string | null;
  supplierBatchNo?: string | null;
  costPrice?: number | null;
  status?: string;
  notes?: string | null;
}

export interface UpdateBatchInput {
  lotNo?: string | null;
  status?: string;
  notes?: string | null;
  supplierBatchNo?: string | null;
  quantity?: number;
  manufactureDate?: string | null;
  expiryDate?: string | null;
  costPrice?: number | null;
}

// ── Cycle Counts ──
export interface CreateCycleCountItemInput {
  productId: string;
  binLocationId?: string | null;
  expectedQty: number;
}

export interface CreateCycleCountInput {
  warehouseId: string;
  countedBy?: string;
  notes?: string | null;
  items: CreateCycleCountItemInput[];
}

export interface SubmitCycleCountItemInput {
  id: string;
  countedQty: number;
  remarks?: string | null;
}

export interface SubmitCycleCountInput {
  items: SubmitCycleCountItemInput[];
  remarks?: string | null;
}

// ── Cycle Count Schedules ──
export interface CreateCycleCountScheduleInput {
  warehouseId: string;
  zone?: string | null;
  binScope?: string | null;
  frequency: string; // WEEKLY, MONTHLY, QUARTERLY
  blindCount?: boolean;
  nextDueDate: string;
  active?: boolean;
}

export interface UpdateCycleCountScheduleInput {
  warehouseId?: string;
  zone?: string | null;
  binScope?: string | null;
  frequency?: string;
  blindCount?: boolean;
  nextDueDate?: string;
  active?: boolean;
}

// ── License Plates ──
export interface CreateLicensePlateInput {
  code: string;
  warehouseId: string;
  binId?: string | null;
}

export interface AddLicensePlateItemInput {
  inventoryItemId: string;
  quantity: number;
  lotBatchId?: string | null;
  serialNumberId?: string | null;
}

export interface MoveLicensePlateInput {
  binId: string;
}

// ── Putaway Tasks ──
export interface CreatePutawayTaskInput {
  inventoryItemId: string;
  stockEntryId: string;
  quantity: number;
  suggestedBinId?: string | null;
}

export interface CompletePutawayTaskInput {
  // Minimal — the service only marks status COMPLETE
}

// ── Batch Quarantine ──
export interface QuarantineBatchInput {
  reason: string;
}

export interface ReleaseBatchQuarantineInput {
  reason: string;
}

// ── Stock Reservations ──
export interface CreateStockReservationInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  sourceType: string; // SALES_ORDER, TRANSFER, MANUAL
  sourceId?: string | null;
  notes?: string | null;
}

// ── Kit Assembly ──
export interface AssembleKitInput {
  warehouseId: string;
  quantity: number;
}

export interface DisassembleKitInput {
  warehouseId: string;
  quantity: number;
}

// ── Transfer Approval Rules ──
export interface CreateTransferApprovalRuleInput {
  warehouseId?: string | null;
  thresholdValue: number;
  isActive?: boolean;
}

export interface UpdateTransferApprovalRuleInput {
  warehouseId?: string | null;
  thresholdValue?: number;
  isActive?: boolean;
}

export interface RejectTransferInput {
  reason: string;
}

// ── Dock Appointments ──
export interface CreateDockAppointmentInput {
  warehouseId: string;
  dockDoor: string;
  type: string; // INBOUND, OUTBOUND
  carrierName?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  notes?: string | null;
}

export interface UpdateDockAppointmentInput {
  warehouseId?: string;
  dockDoor?: string;
  type?: string;
  carrierName?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  scheduledAt?: string;
  durationMinutes?: number;
  notes?: string | null;
}

// ── Pick Waves ──
export interface CreatePickWaveInput {
  salesOrderIds: string[];
  warehouseId: string;
  notes?: string | null;
}

export interface RecordPickInput {
  scannedSerials?: string[];
  pickedQty: number;
}

// ── Consignment Stock ──
export interface CreateConsignmentStockInput {
  supplierName: string;
  productId: string;
  warehouseId: string;
  quantityOnHand: number;
  unitCost: number;
}

export interface RecordConsignmentConsumptionInput {
  quantity: number;
  reference?: string | null;
}

// ── Receive With Traceability ──
export interface ReceiveWithTraceabilityInput {
  warehouseId: string;
  productId: string;
  quantity: number;
  valuationRate: number;
  batchNo?: string | null;
  serialNumbers: string[];
  lotNo?: string | null;
  expiryDate?: string | null;
}

// ── QA Inspection Templates ──
export interface CreateQAInspectionTemplateInput {
  name: string;
  productId?: string | null;
  checklist: Array<{ parameter: string; criteria: string }>;
  isActive?: boolean;
}

export interface UpdateQAInspectionTemplateInput {
  name?: string;
  productId?: string | null;
  checklist?: Array<{ parameter: string; criteria: string }>;
  isActive?: boolean;
}

// ── QA Inspections ──
export interface CreateQAInspectionCheckpointInput {
  parameter: string;
  criteria: string;
  sortOrder?: number;
}

export interface CreateQAInspectionInput {
  referenceType: string;
  referenceId: string;
  productId: string;
  warehouseId?: string | null;
  inspectedQty: number;
  inspectedBy?: string;
  remarks?: string | null;
  checkpoints: CreateQAInspectionCheckpointInput[];
}

export interface SubmitQAInspectionCheckpointInput {
  id: string;
  result?: string | null;  // PASS, FAIL, NA
  observedValue?: string | null;
  remarks?: string | null;
}

export interface SubmitQAInspectionInput {
  checkpoints: SubmitQAInspectionCheckpointInput[];
  status: string;           // PASS, FAIL, PARTIAL
  disposition?: string | null;
  acceptedQty: number;
  rejectedQty: number;
  remarks?: string | null;
}

// ── Reorder Rules ──
export interface CreateReorderRuleInput {
  productId: string;
  warehouseId?: string | null;
  minQty: number;
  maxQty?: number | null;
  reorderQty: number;
  leadTimeDays: number;
  preferredVendorId?: string | null;
  autoCreatePO?: boolean;
  isActive?: boolean;
}

export interface CreateRequisitionFromReorderRuleInput {
  requiredDate?: string | null;
}

// ── Product Kits ──
export interface CreateKitComponentInput {
  productId: string;
  quantity: number;
  sortOrder?: number;
}

export interface CreateKitInput {
  productId: string;
  name: string;
  description?: string | null;
  sellPrice: number;
  discount?: number;
  isActive?: boolean;
  components: CreateKitComponentInput[];
}

export interface CreateKitVersionInput {
  notes?: string | null;
}

// ── Stock Entries ──
export interface CreateStockEntryItemInput {
  productId: string;
  qty: number;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  fromBinId?: string | null;
  toBinId?: string | null;
  uomId?: string | null;
  valuationRate?: number;
  batchId?: string | null;
  batchNumber?: string | null;
  serialNo?: string | null;
  serialNumber?: string | null;
  sortOrder?: number;
}

export interface CreateStockEntryInput {
  type: string;
  purpose?: string;
  remarks?: string | null;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  referenceDoc?: string | null;
  referenceType?: string | null;
  items: CreateStockEntryItemInput[];
}

export interface TransferStockItemInput {
  productId: string;
  qty: number;
  batchId?: string | null;
  serialNo?: string | null;
}

export interface TransferStockInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  remarks?: string | null;
  items: TransferStockItemInput[];
}
