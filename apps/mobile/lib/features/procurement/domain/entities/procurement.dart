import 'package:equatable/equatable.dart';

class PurchaseOrder extends Equatable {
  const PurchaseOrder({
    required this.id,
    required this.poNumber,
    required this.vendorId,
    required this.vendorName,
    required this.status,
    this.items = const <PurchaseOrderItem>[],
    this.subtotal = 0,
    this.taxTotal = 0,
    this.totalAmount = 0,
    this.currency = 'USD',
    this.orderDate,
    this.expectedDate,
    this.notes,
    this.shippingAddress,
    this.terms,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String poNumber;
  final String vendorId;
  final String vendorName;
  final String status;
  final List<PurchaseOrderItem> items;
  final double subtotal;
  final double taxTotal;
  final double totalAmount;
  final String currency;
  final DateTime? orderDate;
  final DateTime? expectedDate;
  final String? notes;
  final String? shippingAddress;
  final String? terms;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, poNumber, vendorId, vendorName, status, items, subtotal,
        taxTotal, totalAmount, currency, orderDate, expectedDate,
        notes, shippingAddress, terms, createdAt, updatedAt,
      ];
}

class PurchaseOrderItem extends Equatable {
  const PurchaseOrderItem({
    required this.id,
    this.productId,
    this.productName,
    this.description,
    this.quantity = 0,
    this.receivedQuantity = 0,
    this.rate = 0,
    this.amount = 0,
    this.taxRate = 0,
    this.deliveryDate,
  });

  final String id;
  final String? productId;
  final String? productName;
  final String? description;
  final double quantity;
  final double receivedQuantity;
  final double rate;
  final double amount;
  final double taxRate;
  final DateTime? deliveryDate;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, description, quantity,
        receivedQuantity, rate, amount, taxRate, deliveryDate,
      ];
}

class Vendor extends Equatable {
  const Vendor({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.taxId,
    this.address,
    this.status = 'ACTIVE',
    this.paymentTerms,
    this.currency = 'USD',
    this.bankDetails,
    this.rating,
    this.totalPurchases = 0,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? taxId;
  final String? address;
  final String status;
  final String? paymentTerms;
  final String currency;
  final String? bankDetails;
  final double? rating;
  final double totalPurchases;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, email, phone, taxId, address, status,
        paymentTerms, currency, bankDetails, rating, totalPurchases,
        notes, createdAt, updatedAt,
      ];
}

class RFQ extends Equatable {
  const RFQ({
    required this.id,
    required this.rfqNumber,
    this.vendorId,
    this.vendorName,
    required this.status,
    this.items = const <RFQItem>[],
    this.deliveryDate,
    this.responseDeadline,
    this.vendorCount = 0,
    this.quotations = const <SupplierQuotation>[],
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String rfqNumber;
  final String? vendorId;
  final String? vendorName;
  final String status;
  final List<RFQItem> items;
  final DateTime? deliveryDate;
  final DateTime? responseDeadline;
  final int vendorCount;
  final List<SupplierQuotation> quotations;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, rfqNumber, vendorId, vendorName, status, items,
        deliveryDate, responseDeadline, vendorCount, quotations,
        notes, createdAt, updatedAt,
      ];
}

class RFQItem extends Equatable {
  const RFQItem({
    required this.id,
    this.productId,
    this.productName,
    this.description,
    this.quantity = 0,
    this.uom,
  });

  final String id;
  final String? productId;
  final String? productName;
  final String? description;
  final double quantity;
  final String? uom;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, description, quantity, uom,
      ];
}

class SupplierQuotation extends Equatable {
  const SupplierQuotation({
    required this.id,
    this.rfqId,
    this.rfqNumber,
    this.vendorId,
    this.vendorName,
    this.status = 'DRAFT',
    this.items = const <SupplierQuotationItem>[],
    this.subtotal = 0,
    this.taxTotal = 0,
    this.totalAmount = 0,
    this.currency = 'USD',
    this.validUntil,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? rfqId;
  final String? rfqNumber;
  final String? vendorId;
  final String? vendorName;
  final String status;
  final List<SupplierQuotationItem> items;
  final double subtotal;
  final double taxTotal;
  final double totalAmount;
  final String currency;
  final DateTime? validUntil;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, rfqId, rfqNumber, vendorId, vendorName, status, items,
        subtotal, taxTotal, totalAmount, currency, validUntil,
        notes, createdAt, updatedAt,
      ];
}

class SupplierQuotationItem extends Equatable {
  const SupplierQuotationItem({
    required this.id,
    this.productId,
    this.productName,
    this.description,
    this.quantity = 0,
    this.rate = 0,
    this.amount = 0,
    this.deliveryDate,
  });

  final String id;
  final String? productId;
  final String? productName;
  final String? description;
  final double quantity;
  final double rate;
  final double amount;
  final DateTime? deliveryDate;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, description, quantity,
        rate, amount, deliveryDate,
      ];
}

class PurchaseRequisition extends Equatable {
  const PurchaseRequisition({
    required this.id,
    required this.title,
    this.requisitionNumber,
    this.department,
    this.requestedBy,
    this.requestedById,
    this.status = 'DRAFT',
    this.priority = 'MEDIUM',
    this.items = const <PurchaseRequisitionItem>[],
    this.totalEstimated = 0,
    this.requiredDate,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String title;
  final String? requisitionNumber;
  final String? department;
  final String? requestedBy;
  final String? requestedById;
  final String status;
  final String priority;
  final List<PurchaseRequisitionItem> items;
  final double totalEstimated;
  final DateTime? requiredDate;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, requisitionNumber, department, requestedBy,
        requestedById, status, priority, items, totalEstimated,
        requiredDate, notes, createdAt, updatedAt,
      ];
}

class PurchaseRequisitionItem extends Equatable {
  const PurchaseRequisitionItem({
    required this.id,
    this.productId,
    this.productName,
    this.description,
    this.quantity = 0,
    this.estimatedRate = 0,
    this.estimatedAmount = 0,
    this.requiredDate,
  });

  final String id;
  final String? productId;
  final String? productName;
  final String? description;
  final double quantity;
  final double estimatedRate;
  final double estimatedAmount;
  final DateTime? requiredDate;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, description, quantity,
        estimatedRate, estimatedAmount, requiredDate,
      ];
}

class PurchaseReceipt extends Equatable {
  const PurchaseReceipt({
    required this.id,
    required this.receiptNumber,
    this.purchaseOrderId,
    this.poNumber,
    this.supplierId,
    this.supplierName,
    this.warehouseId,
    this.warehouseName,
    this.status = 'DRAFT',
    this.items = const <PurchaseReceiptItem>[],
    this.receivedDate,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String receiptNumber;
  final String? purchaseOrderId;
  final String? poNumber;
  final String? supplierId;
  final String? supplierName;
  final String? warehouseId;
  final String? warehouseName;
  final String status;
  final List<PurchaseReceiptItem> items;
  final DateTime? receivedDate;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, receiptNumber, purchaseOrderId, poNumber, supplierId,
        supplierName, warehouseId, warehouseName, status, items,
        receivedDate, notes, createdAt, updatedAt,
      ];
}

class PurchaseReceiptItem extends Equatable {
  const PurchaseReceiptItem({
    required this.id,
    this.productId,
    this.productName,
    this.orderedQuantity = 0,
    this.receivedQuantity = 0,
    this.acceptedQuantity = 0,
    this.rejectedQuantity = 0,
    this.rate = 0,
    this.amount = 0,
  });

  final String id;
  final String? productId;
  final String? productName;
  final double orderedQuantity;
  final double receivedQuantity;
  final double acceptedQuantity;
  final double rejectedQuantity;
  final double rate;
  final double amount;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, orderedQuantity, receivedQuantity,
        acceptedQuantity, rejectedQuantity, rate, amount,
      ];
}

class SupplierContract extends Equatable {
  const SupplierContract({
    required this.id,
    required this.contractNumber,
    required this.supplierId,
    required this.supplierName,
    required this.type,
    this.startDate,
    this.endDate,
    this.terms,
    this.value = 0,
    this.currency = 'USD',
    this.status = 'DRAFT',
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String contractNumber;
  final String supplierId;
  final String supplierName;
  final String type;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? terms;
  final double value;
  final String currency;
  final String status;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, contractNumber, supplierId, supplierName, type,
        startDate, endDate, terms, value, currency, status,
        notes, createdAt, updatedAt,
      ];
}

class ProcurementDashboardStats extends Equatable {
  const ProcurementDashboardStats({
    this.totalPO = 0,
    this.totalSpend = 0,
    this.pendingApprovals = 0,
    this.vendorCount = 0,
    this.spendByVendor = const <DashboardDataPoint>[],
    this.spendByMonth = const <DashboardDataPoint>[],
    this.recentPOs = const <PurchaseOrder>[],
    this.overdueDeliveries = 0,
  });

  final int totalPO;
  final double totalSpend;
  final int pendingApprovals;
  final int vendorCount;
  final List<DashboardDataPoint> spendByVendor;
  final List<DashboardDataPoint> spendByMonth;
  final List<PurchaseOrder> recentPOs;
  final int overdueDeliveries;

  @override
  List<Object?> get props => <Object?>[
        totalPO, totalSpend, pendingApprovals, vendorCount,
        spendByVendor, spendByMonth, recentPOs, overdueDeliveries,
      ];
}

class DashboardDataPoint extends Equatable {
  const DashboardDataPoint({required this.label, required this.value});

  final String label;
  final double value;

  @override
  List<Object?> get props => <Object?>[label, value];
}