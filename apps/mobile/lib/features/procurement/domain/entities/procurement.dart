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
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, poNumber, vendorId, vendorName, status, items, subtotal,
        taxTotal, totalAmount, currency, orderDate, expectedDate,
        notes, createdAt, updatedAt,
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
    this.rating,
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
  final double? rating;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, email, phone, taxId, address, status,
        paymentTerms, currency, rating, notes, createdAt, updatedAt,
      ];
}

class RFQ extends Equatable {
  const RFQ({
    required this.id,
    required this.rfqNumber,
    required this.title,
    required this.status,
    this.vendorCount = 0,
    this.responseDeadline,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String rfqNumber;
  final String title;
  final String status;
  final int vendorCount;
  final DateTime? responseDeadline;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, rfqNumber, title, status, vendorCount,
        responseDeadline, notes, createdAt,
      ];
}

class SupplierQuotation extends Equatable {
  const SupplierQuotation({
    required this.id,
    this.rfqId,
    this.vendorId,
    this.vendorName,
    this.status = 'DRAFT',
    this.totalAmount = 0,
    this.validUntil,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String? rfqId;
  final String? vendorId;
  final String? vendorName;
  final String status;
  final double totalAmount;
  final DateTime? validUntil;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, rfqId, vendorId, vendorName, status,
        totalAmount, validUntil, notes, createdAt,
      ];
}

class PurchaseRequisition extends Equatable {
  const PurchaseRequisition({
    required this.id,
    required this.title,
    this.department,
    this.requestedBy,
    this.status = 'DRAFT',
    this.totalEstimated = 0,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String title;
  final String? department;
  final String? requestedBy;
  final String status;
  final double totalEstimated;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, department, requestedBy, status,
        totalEstimated, notes, createdAt,
      ];
}
