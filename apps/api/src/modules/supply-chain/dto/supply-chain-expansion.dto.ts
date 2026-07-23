import { z } from 'zod';

// ─── Global Trade Management ──────────────────────────

export const hsCodeSchema = z.object({
  code: z.string().min(2).max(20),
  description: z.string().min(1),
  chapter: z.string().optional(),
  section: z.string().optional(),
  dutyRate: z.number().optional(),
  dutyUnit: z.string().optional(),
  restricted: z.boolean().optional(),
  licenseRequired: z.boolean().optional(),
});
export type HsCodeDto = z.infer<typeof hsCodeSchema>;

export const countryOfOriginSchema = z.object({
  countryCode: z.string().length(2),
  countryName: z.string().min(1),
  region: z.string().optional(),
  tradeAgreement: z.string().optional(),
  preferentialRate: z.number().optional(),
  riskLevel: z.string().optional(),
  sanctions: z.boolean().optional(),
});
export type CountryOfOriginDto = z.infer<typeof countryOfOriginSchema>;

export const importDeclarationSchema = z.object({
  declarationNumber: z.string().min(1),
  entryNumber: z.string().optional(),
  portOfEntry: z.string().optional(),
  portOfLading: z.string().optional(),
  vessel: z.string().optional(),
  voyageNumber: z.string().optional(),
  containerNumber: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
  hsCodeId: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  invoiceValue: z.number().optional(),
  currency: z.string().optional(),
  dutyAmount: z.number().optional(),
  freightCost: z.number().optional(),
  insuranceCost: z.number().optional(),
  brokerName: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().optional(),
    productSku: z.string().optional(),
    productName: z.string().optional(),
    hsCodeId: z.string().optional(),
    countryOfOrigin: z.string().optional(),
    quantity: z.number(),
    uom: z.string().optional(),
    unitValue: z.number().optional(),
    dutyRate: z.number().optional(),
    taxRate: z.number().optional(),
  })).optional(),
});
export type ImportDeclarationDto = z.infer<typeof importDeclarationSchema>;

export const exportDeclarationSchema = z.object({
  declarationNumber: z.string().min(1),
  portOfExport: z.string().optional(),
  destinationCountry: z.string().optional(),
  shipmentId: z.string().optional(),
  carrierName: z.string().optional(),
  containerNumber: z.string().optional(),
  hsCodeId: z.string().optional(),
  invoiceValue: z.number().optional(),
  currency: z.string().optional(),
  exportLicense: z.string().optional(),
  eccn: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().optional(),
    productSku: z.string().optional(),
    quantity: z.number(),
    uom: z.string().optional(),
    unitValue: z.number().optional(),
  })).optional(),
});
export type ExportDeclarationDto = z.infer<typeof exportDeclarationSchema>;

export const complianceScreeningSchema = z.object({
  screenType: z.enum(['PARTY', 'END_USE', 'COUNTRY', 'PRODUCT']),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  entityName: z.string().optional(),
  screenList: z.string().optional(),
  notes: z.string().optional(),
});
export type ComplianceScreeningDto = z.infer<typeof complianceScreeningSchema>;

// ─── Supply Chain Planning ────────────────────────────

export const demandSenseRunSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  runType: z.string().optional(),
  horizonMonths: z.number().int().optional(),
  algorithm: z.string().optional(),
  productIds: z.array(z.string()).optional(),
});
export type DemandSenseRunDto = z.infer<typeof demandSenseRunSchema>;

export const supplyPlanSchema = z.object({
  planName: z.string().min(1),
  description: z.string().optional(),
  planType: z.string().optional(),
  planningHorizon: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  demandSource: z.string().optional(),
  constraints: z.any().optional(),
  assumptions: z.any().optional(),
  lines: z.array(z.object({
    productId: z.string().optional(),
    period: z.string(),
    forecastedQty: z.number().optional(),
    onHandQty: z.number().optional(),
    safetyStockQty: z.number().optional(),
    reorderPoint: z.number().optional(),
  })).optional(),
});
export type SupplyPlanDto = z.infer<typeof supplyPlanSchema>;

export const sopPlanSchema = z.object({
  planName: z.string().min(1),
  description: z.string().optional(),
  fiscalYear: z.number().int(),
  period: z.string(),
  planType: z.string().optional(),
  revenueTarget: z.number().optional(),
  costBudget: z.number().optional(),
  inventoryTarget: z.number().optional(),
  serviceLevel: z.number().optional(),
  assumptions: z.any().optional(),
});
export type SopPlanDto = z.infer<typeof sopPlanSchema>;

// ─── Logistics Execution ──────────────────────────────

export const transportModeSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  transitLeadTimeDays: z.number().int().optional(),
  costFactor: z.number().optional(),
  carbonFactor: z.number().optional(),
});
export type TransportModeDto = z.infer<typeof transportModeSchema>;

export const carrierRateSchema = z.object({
  carrierId: z.string(),
  serviceLevelId: z.string().optional(),
  originZip: z.string().optional(),
  destZip: z.string().optional(),
  originRegion: z.string().optional(),
  destRegion: z.string().optional(),
  weightMin: z.number().optional(),
  weightMax: z.number().optional(),
  rateType: z.string().optional(),
  baseRate: z.number(),
  perUnitRate: z.number().optional(),
  perWeightRate: z.number().optional(),
  perDistanceRate: z.number().optional(),
  fuelSurcharge: z.number().optional(),
  minimumCharge: z.number().optional(),
  maximumCharge: z.number().optional(),
  currency: z.string().optional(),
  effectiveDate: z.string(),
  expirationDate: z.string().optional(),
  transitDays: z.number().int().optional(),
});
export type CarrierRateDto = z.infer<typeof carrierRateSchema>;

export const loadBuildSchema = z.object({
  loadType: z.string().optional(),
  transportMode: z.string().optional(),
  carrierId: z.string().optional(),
  carrierName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverContact: z.string().optional(),
  originName: z.string().optional(),
  destName: z.string().optional(),
  scheduledPickup: z.string().optional(),
  scheduledDelivery: z.string().optional(),
  totalWeight: z.number().optional(),
  totalVolume: z.number().optional(),
  totalPallets: z.number().int().optional(),
  totalCartons: z.number().int().optional(),
  estimatedCost: z.number().optional(),
  bolNumber: z.string().optional(),
  temperatureReq: z.string().optional(),
  hazmat: z.boolean().optional(),
  notes: z.string().optional(),
  stops: z.array(z.object({
    stopSequence: z.number().int(),
    stopType: z.string().optional(),
    locationName: z.string().optional(),
    address: z.string().optional(),
    scheduledArrival: z.string().optional(),
    scheduledDeparture: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
  })).optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    productSku: z.string().optional(),
    productName: z.string().optional(),
    quantity: z.number(),
    uom: z.string().optional(),
    weight: z.number().optional(),
    volume: z.number().optional(),
    palletCount: z.number().int().optional(),
    cartonCount: z.number().int().optional(),
  })).optional(),
});
export type LoadBuildDto = z.infer<typeof loadBuildSchema>;

export const appointmentScheduleSchema = z.object({
  appointmentType: z.string(),
  carrierId: z.string().optional(),
  carrierName: z.string().optional(),
  carrierContact: z.string().optional(),
  vehicleNumber: z.string().optional(),
  warehouseId: z.string().optional(),
  dockDoor: z.string().optional(),
  scheduledStart: z.string(),
  scheduledEnd: z.string().optional(),
  poNumbers: z.string().optional(),
  referenceNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  totalWeight: z.number().optional(),
  totalPallets: z.number().int().optional(),
  totalCartons: z.number().int().optional(),
  notes: z.string().optional(),
});
export type AppointmentScheduleDto = z.infer<typeof appointmentScheduleSchema>;

export const deliveryConfirmationSchema = z.object({
  shipmentId: z.string().optional(),
  shipmentType: z.string().optional(),
  receivedBy: z.string().optional(),
  signatureName: z.string().optional(),
  damageNotes: z.string().optional(),
  carrierName: z.string().optional(),
  driverName: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().optional(),
    productSku: z.string().optional(),
    expectedQty: z.number(),
    deliveredQty: z.number(),
    damagedQty: z.number().optional(),
    rejectedQty: z.number().optional(),
    condition: z.string().optional(),
  })).optional(),
});
export type DeliveryConfirmationDto = z.infer<typeof deliveryConfirmationSchema>;

// ─── Supplier Risk Management ─────────────────────────

export const supplierRiskProfileSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string().optional(),
  financialHealth: z.number().min(0).max(100).optional(),
  geopoliticalRisk: z.number().min(0).max(100).optional(),
  operationalRisk: z.number().min(0).max(100).optional(),
  complianceRisk: z.number().min(0).max(100).optional(),
  qualityRisk: z.number().min(0).max(100).optional(),
  concentrationRisk: z.number().min(0).max(100).optional(),
  factors: z.array(z.object({
    factorType: z.string(),
    factorName: z.string(),
    score: z.number().min(0).max(100),
    weight: z.number().optional(),
    description: z.string().optional(),
    trend: z.string().optional(),
  })).optional(),
});
export type SupplierRiskProfileDto = z.infer<typeof supplierRiskProfileSchema>;

export const riskAlertSchema = z.object({
  alertType: z.string(),
  severity: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  profileId: z.string(),
  source: z.string().optional(),
});
export type RiskAlertDto = z.infer<typeof riskAlertSchema>;

export const alternativeSourcingSchema = z.object({
  productId: z.string().optional(),
  productSku: z.string().optional(),
  currentVendorId: z.string().optional(),
  currentVendorName: z.string().optional(),
  altVendorId: z.string(),
  altVendorName: z.string(),
  recommendationType: z.string(),
  currentPrice: z.number().optional(),
  altPrice: z.number().optional(),
  leadTimeDays: z.number().int().optional(),
  notes: z.string().optional(),
});
export type AlternativeSourcingDto = z.infer<typeof alternativeSourcingSchema>;

export const supplierDiversitySchema = z.object({
  diversityType: z.string(),
  certificationBody: z.string().optional(),
  certificationNumber: z.string().optional(),
  certificationDate: z.string().optional(),
  expirationDate: z.string().optional(),
  spendAmount: z.number().optional(),
  fiscalYear: z.number().int().optional(),
});
export type SupplierDiversityDto = z.infer<typeof supplierDiversitySchema>;

// ─── Control Tower ────────────────────────────────────

export const controlTowerEventSchema = z.object({
  eventType: z.string(),
  severity: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  sourceModule: z.string().optional(),
  sourceId: z.string().optional(),
  sourceType: z.string().optional(),
  assignedTo: z.string().optional(),
  impactScore: z.number().optional(),
});
export type ControlTowerEventDto = z.infer<typeof controlTowerEventSchema>;

export const controlTowerKpiSchema = z.object({
  kpiCode: z.string().min(1),
  kpiName: z.string().min(1),
  category: z.string(),
  subcategory: z.string().optional(),
  unit: z.string(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  thresholdGreen: z.number().optional(),
  thresholdYellow: z.number().optional(),
  thresholdRed: z.number().optional(),
  period: z.string(),
});
export type ControlTowerKpiDto = z.infer<typeof controlTowerKpiSchema>;

export const controlTowerAlertConfigSchema = z.object({
  alertName: z.string().min(1),
  description: z.string().optional(),
  eventType: z.string().optional(),
  kpiCode: z.string().optional(),
  condition: z.any(),
  severity: z.string().optional(),
  notificationChannels: z.any().optional(),
  recipients: z.any().optional(),
  autoResolve: z.boolean().optional(),
});
export type ControlTowerAlertConfigDto = z.infer<typeof controlTowerAlertConfigSchema>;

// ─── Inventory RMA ────────────────────────────────────

export const rmaSchema = z.object({
  rmaNumber: z.string().min(1),
  source: z.enum(['CUSTOMER', 'VENDOR', 'INTERNAL']),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  salesOrderId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  returnReason: z.string().optional(),
  returnType: z.string().optional(),
  priority: z.string().optional(),
  warehouseId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().optional(),
    productSku: z.string().optional(),
    expectedQty: z.number(),
    uom: z.string().optional(),
    lotNumber: z.string().optional(),
    serialNumbers: z.string().optional(),
    unitValue: z.number().optional(),
  })).optional(),
});
export type RmaDto = z.infer<typeof rmaSchema>;

export const rmaInspectionSchema = z.object({
  result: z.enum(['PASS', 'FAIL', 'CONDITIONAL_PASS']),
  overallCondition: z.string().optional(),
  defects: z.any().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    lineId: z.string(),
    disposition: z.string(),
    acceptedQty: z.number().optional(),
    rejectedQty: z.number().optional(),
    condition: z.string().optional(),
  })).optional(),
});
export type RmaInspectionDto = z.infer<typeof rmaInspectionSchema>;

// ─── Inventory Wave Planning ──────────────────────────

export const wavePlanSchema = z.object({
  planType: z.string().optional(),
  warehouseId: z.string().optional(),
  optimizationStrategy: z.string().optional(),
  sortMethod: z.string().optional(),
  notes: z.string().optional(),
  tasks: z.array(z.object({
    taskType: z.string(),
    sourceLocation: z.string().optional(),
    destLocation: z.string().optional(),
    productId: z.string().optional(),
    quantity: z.number(),
    uom: z.string().optional(),
    priority: z.number().int().optional(),
    orderRef: z.string().optional(),
  })).optional(),
});
export type WavePlanDto = z.infer<typeof wavePlanSchema>;

// ─── Inventory Safety Stock ───────────────────────────

export const safetyStockOptimizeSchema = z.object({
  productId: z.string(),
  warehouseId: z.string().optional(),
  serviceLevel: z.number().optional(),
  holdingCostPct: z.number().optional(),
  stockoutCost: z.number().optional(),
});
export type SafetyStockOptimizeDto = z.infer<typeof safetyStockOptimizeSchema>;

// ─── Procurement Sourcing ─────────────────────────────

export const sourcingProjectSchema = z.object({
  projectNumber: z.string().min(1),
  projectName: z.string().min(1),
  description: z.string().optional(),
  projectType: z.string().optional(),
  category: z.string().optional(),
  estimatedValue: z.number().optional(),
  currency: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  buyerId: z.string().optional(),
  expectedSavings: z.number().optional(),
  notes: z.string().optional(),
  participants: z.array(z.object({
    vendorId: z.string(),
    vendorName: z.string().optional(),
  })).optional(),
});
export type SourcingProjectDto = z.infer<typeof sourcingProjectSchema>;

export const supplierEvaluationSchema = z.object({
  projectId: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  evaluationDate: z.string().optional(),
  criteria: z.array(z.object({
    criterionName: z.string(),
    weight: z.number(),
    score: z.number().optional(),
    comments: z.string().optional(),
  })),
});
export type SupplierEvaluationDto = z.infer<typeof supplierEvaluationSchema>;

export const contractAwardSchema = z.object({
  awardNumber: z.string().min(1),
  projectId: z.string(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  awardAmount: z.number().optional(),
  currency: z.string().optional(),
  validUntil: z.string().optional(),
  termsSummary: z.string().optional(),
});
export type ContractAwardDto = z.infer<typeof contractAwardSchema>;

export const procurementContractSchema = z.object({
  contractNumber: z.string().min(1),
  contractName: z.string().min(1),
  contractType: z.string().optional(),
  vendorId: z.string(),
  vendorName: z.string().optional(),
  buyerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  autoRenew: z.boolean().optional(),
  autoRenewNoticeDays: z.number().int().optional(),
  contractValue: z.number().optional(),
  currency: z.string().optional(),
  maximumValue: z.number().optional(),
  estimatedAnnualValue: z.number().optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  governingLaw: z.string().optional(),
  notes: z.string().optional(),
  priceSchedules: z.array(z.object({
    productId: z.string().optional(),
    productSku: z.string().optional(),
    negotiatedPrice: z.number(),
    currency: z.string().optional(),
    priceType: z.string().optional(),
    minQty: z.number().optional(),
    maxQty: z.number().optional(),
    effectiveDate: z.string(),
    expirationDate: z.string().optional(),
  })).optional(),
  volumeCommitments: z.array(z.object({
    productId: z.string().optional(),
    committedQty: z.number(),
    commitmentPeriod: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    rebateRate: z.number().optional(),
    penaltyRate: z.number().optional(),
  })).optional(),
});
export type ProcurementContractDto = z.infer<typeof procurementContractSchema>;

export const supplierOnboardingSchema = z.object({
  vendorId: z.string(),
  vendorName: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  documents: z.any().optional(),
  bankInfo: z.any().optional(),
  insuranceInfo: z.any().optional(),
});
export type SupplierOnboardingDto = z.infer<typeof supplierOnboardingSchema>;
