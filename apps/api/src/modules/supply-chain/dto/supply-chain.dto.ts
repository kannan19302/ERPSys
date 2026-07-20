import { z } from 'zod';

export const createCarrierSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  trackingUrl: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type CreateCarrierDto = z.infer<typeof createCarrierSchema>;

export const createCarrierServiceLevelSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  transitDays: z.number().int().positive().optional(),
});
export type CreateCarrierServiceLevelDto = z.infer<typeof createCarrierServiceLevelSchema>;

export const createAsnLineItemSchema = z.object({
  productId: z.string().min(1),
  expectedQty: z.number().positive(),
  uom: z.string().default('EA'),
  lotNumber: z.string().optional(),
  serialNos: z.string().optional(),
  notes: z.string().optional(),
});

export const createAsnSchema = z.object({
  asnNumber: z.string().min(1),
  vendorId: z.string().min(1),
  purchaseOrderId: z.string().optional(),
  warehouseId: z.string().min(1),
  shipDate: z.string().datetime().optional().nullable(),
  expectedArrival: z.string().datetime().optional().nullable(),
  carrierName: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lineItems: z.array(createAsnLineItemSchema).min(1),
});
export type CreateAsnDto = z.infer<typeof createAsnSchema>;

export const receiveAsnLineItemSchema = z.object({
  id: z.string().min(1),
  actualQty: z.number().nonnegative(),
  lotNumber: z.string().optional().nullable(),
  serialNos: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const receiveAsnSchema = z.object({
  lineItems: z.array(receiveAsnLineItemSchema).min(1),
  notes: z.string().optional().nullable(),
});
export type ReceiveAsnDto = z.infer<typeof receiveAsnSchema>;

export const createInboundShipmentSchema = z.object({
  shipmentNumber: z.string().min(1),
  asnId: z.string().optional().nullable(),
  carrierId: z.string().optional().nullable(),
  warehouseId: z.string().min(1),
  trackingNumber: z.string().optional().nullable(),
  expectedArrival: z.string().datetime().optional().nullable(),
  totalPallets: z.number().int().positive().optional().nullable(),
  totalCartons: z.number().int().positive().optional().nullable(),
  totalWeight: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreateInboundShipmentDto = z.infer<typeof createInboundShipmentSchema>;

export const createOutboundShipmentSchema = z.object({
  shipmentNumber: z.string().min(1),
  salesOrderId: z.string().optional().nullable(),
  carrierId: z.string().optional().nullable(),
  serviceLevelId: z.string().optional().nullable(),
  warehouseId: z.string().min(1),
  trackingNumber: z.string().optional().nullable(),
  estimatedDelivery: z.string().datetime().optional().nullable(),
  totalPallets: z.number().int().positive().optional().nullable(),
  totalCartons: z.number().int().positive().optional().nullable(),
  totalWeight: z.number().positive().optional().nullable(),
  recipientName: z.string().optional().nullable(),
  recipientAddr: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreateOutboundShipmentDto = z.infer<typeof createOutboundShipmentSchema>;

export const addTrackingEventSchema = z.object({
  eventCode: z.enum(['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION']),
  description: z.string().min(1),
  location: z.string().optional().nullable(),
  occurredAt: z.string().datetime().optional().nullable(),
  source: z.enum(['MANUAL', 'CARRIER_API', 'WEBHOOK']).default('MANUAL'),
});
export type AddTrackingEventDto = z.infer<typeof addTrackingEventSchema>;

export const reportExceptionSchema = z.object({
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  exceptionCode: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});
export type ReportExceptionDto = z.infer<typeof reportExceptionSchema>;

export const resolveExceptionSchema = z.object({
  resolutionNote: z.string().min(1),
});
export type ResolveExceptionDto = z.infer<typeof resolveExceptionSchema>;

// ── Vendor Returns ──

export const createVendorReturnSchema = z.object({
  rmaRequestId: z.string().min(1),
  warehouseId: z.string().min(1),
  shipmentNumber: z.string().min(1),
  carrier: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  creditMemoRef: z.string().optional().nullable(),
  creditAmount: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type CreateVendorReturnDto = z.infer<typeof createVendorReturnSchema>;

export const updateVendorReturnStatusSchema = z.object({
  status: z.enum(['PENDING', 'PACKED', 'SHIPPED', 'DELIVERED', 'LOST']),
  trackingNumber: z.string().optional().nullable(),
  creditMemoRef: z.string().optional().nullable(),
  creditAmount: z.number().positive().optional().nullable(),
});
export type UpdateVendorReturnStatusDto = z.infer<typeof updateVendorReturnStatusSchema>;

// ── Cross-Docking ──

export const createCrossDockStationSchema = z.object({
  warehouseId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  doorNumber: z.string().min(1),
  isInbound: z.boolean().default(true),
  isOutbound: z.boolean().default(true),
  notes: z.string().optional().nullable(),
});
export type CreateCrossDockStationDto = z.infer<typeof createCrossDockStationSchema>;

export const createCrossDockOrderSchema = z.object({
  orderNumber: z.string().min(1),
  type: z.enum(['OPPORTUNISTIC', 'PLANNED', 'FLOW_THROUGH']).default('OPPORTUNISTIC'),
  warehouseId: z.string().min(1),
  stationId: z.string().optional().nullable(),
  productId: z.string().min(1),
  expectedQty: z.number().positive(),
  inboundRef: z.string().optional().nullable(),
  outboundRef: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  expectedArrival: z.string().datetime().optional().nullable(),
  expectedDispatch: z.string().datetime().optional().nullable(),
});
export type CreateCrossDockOrderDto = z.infer<typeof createCrossDockOrderSchema>;

export const updateCrossDockOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'RECEIVING', 'STAGING', 'DISPATCHED', 'COMPLETED', 'CANCELLED']),
  receivedQty: z.number().nonnegative().optional().nullable(),
  dispatchedQty: z.number().nonnegative().optional().nullable(),
  cancelReason: z.string().optional().nullable(),
});
export type UpdateCrossDockOrderStatusDto = z.infer<typeof updateCrossDockOrderStatusSchema>;

// ── Route Optimization ──

export const routeOptimizationStopSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  priority: z.number().int().min(0).max(100).optional(),
});
export type RouteOptimizationStop = z.infer<typeof routeOptimizationStopSchema>;

export const optimizeRouteSchema = z.object({
  stops: z.array(routeOptimizationStopSchema).min(1),
  startLat: z.number().optional(),
  startLng: z.number().optional(),
});
export type OptimizeRouteDto = z.infer<typeof optimizeRouteSchema>;

export const routeEstimateSchema = z.object({
  lat1: z.number(),
  lng1: z.number(),
  lat2: z.number(),
  lng2: z.number(),
});
export type RouteEstimateDto = z.infer<typeof routeEstimateSchema>;
