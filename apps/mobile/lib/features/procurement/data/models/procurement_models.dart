import '../../../../core/error/exceptions.dart';
import '../../domain/entities/procurement.dart';

double asDouble(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v) ?? 0,
      _ => 0,
    };

int asInt(Object? value) => switch (value) {
      final int v => v,
      final num v => v.toInt(),
      final String v => int.tryParse(v) ?? 0,
      _ => 0,
    };

class PurchaseOrderModel extends PurchaseOrder {
  const PurchaseOrderModel({
    required super.id,
    required super.poNumber,
    required super.vendorId,
    required super.vendorName,
    required super.status,
    super.items = const <PurchaseOrderItem>[],
    super.subtotal = 0,
    super.taxTotal = 0,
    super.totalAmount = 0,
    super.currency = 'USD',
    super.orderDate,
    super.expectedDate,
    super.notes,
    super.shippingAddress,
    super.terms,
    super.createdAt,
    super.updatedAt,
  });

  factory PurchaseOrderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PurchaseOrder missing id');
    return PurchaseOrderModel(
      id: id,
      poNumber: json['poNumber'] as String? ?? '',
      vendorId: json['vendorId'] as String? ?? '',
      vendorName: json['vendorName'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      items: (json['items'] as List<dynamic>?)
              ?.map((e) =>
                  PurchaseOrderItemModel.fromJson(e as Map<String, dynamic>),)
              .toList(growable: false) ??
          const [],
      subtotal: asDouble(json['subtotal']),
      taxTotal: asDouble(json['taxTotal']),
      totalAmount: asDouble(json['totalAmount']),
      currency: json['currency'] as String? ?? 'USD',
      orderDate: DateTime.tryParse('${json['orderDate']}'),
      expectedDate: DateTime.tryParse('${json['expectedDate']}'),
      notes: json['notes'] as String?,
      shippingAddress: json['shippingAddress'] as String?,
      terms: json['terms'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'poNumber': poNumber,
        'vendorId': vendorId,
        'vendorName': vendorName,
        'status': status,
        'subtotal': subtotal,
        'taxTotal': taxTotal,
        'totalAmount': totalAmount,
        'currency': currency,
        'orderDate': orderDate?.toIso8601String(),
        'expectedDate': expectedDate?.toIso8601String(),
        'notes': notes,
        'shippingAddress': shippingAddress,
        'terms': terms,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PurchaseOrderItemModel extends PurchaseOrderItem {
  const PurchaseOrderItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.description,
    super.quantity = 0,
    super.receivedQuantity = 0,
    super.rate = 0,
    super.amount = 0,
    super.taxRate = 0,
    super.deliveryDate,
  });

  factory PurchaseOrderItemModel.fromJson(Map<String, dynamic> json) =>
      PurchaseOrderItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String?,
        productName: json['productName'] as String?,
        description: json['description'] as String?,
        quantity: asDouble(json['quantity']),
        receivedQuantity: asDouble(json['receivedQuantity']),
        rate: asDouble(json['rate']),
        amount: asDouble(json['amount']),
        taxRate: asDouble(json['taxRate']),
        deliveryDate: DateTime.tryParse('${json['deliveryDate']}'),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'description': description,
        'quantity': quantity,
        'receivedQuantity': receivedQuantity,
        'rate': rate,
        'amount': amount,
        'taxRate': taxRate,
        'deliveryDate': deliveryDate?.toIso8601String(),
      };
}

class VendorModel extends Vendor {
  const VendorModel({
    required super.id,
    required super.name,
    super.email,
    super.phone,
    super.taxId,
    super.address,
    super.status = 'ACTIVE',
    super.paymentTerms,
    super.currency = 'USD',
    super.bankDetails,
    super.rating,
    super.totalPurchases = 0,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory VendorModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Vendor missing id');
    return VendorModel(
      id: id,
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      taxId: json['taxId'] as String?,
      address: json['address'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      paymentTerms: json['paymentTerms'] as String?,
      currency: json['currency'] as String? ?? 'USD',
      bankDetails: json['bankDetails'] as String?,
      rating: asDouble(json['rating']),
      totalPurchases: asDouble(json['totalPurchases']),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'taxId': taxId,
        'address': address,
        'status': status,
        'paymentTerms': paymentTerms,
        'currency': currency,
        'bankDetails': bankDetails,
        'rating': rating,
        'totalPurchases': totalPurchases,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class RFQModel extends RFQ {
  const RFQModel({
    required super.id,
    required super.rfqNumber,
    super.vendorId,
    super.vendorName,
    required super.status,
    super.items = const <RFQItem>[],
    super.deliveryDate,
    super.responseDeadline,
    super.vendorCount = 0,
    super.quotations = const <SupplierQuotation>[],
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory RFQModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('RFQ missing id');
    return RFQModel(
      id: id,
      rfqNumber: json['rfqNumber'] as String? ?? '',
      vendorId: json['vendorId'] as String?,
      vendorName: json['vendorName'] as String?,
      status: json['status'] as String? ?? 'DRAFT',
      items: (json['items'] as List<dynamic>?)
              ?.map((e) =>
                  RFQItemModel.fromJson(e as Map<String, dynamic>),)
              .toList(growable: false) ??
          const [],
      deliveryDate: DateTime.tryParse('${json['deliveryDate']}'),
      responseDeadline: DateTime.tryParse('${json['responseDeadline']}'),
      vendorCount: asInt(json['vendorCount']),
      quotations: (json['quotations'] as List<dynamic>?)
              ?.map((e) => SupplierQuotationModel.fromJson(
                  e as Map<String, dynamic>,),)
              .toList(growable: false) ??
          const [],
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'rfqNumber': rfqNumber,
        'vendorId': vendorId,
        'vendorName': vendorName,
        'status': status,
        'deliveryDate': deliveryDate?.toIso8601String(),
        'responseDeadline': responseDeadline?.toIso8601String(),
        'vendorCount': vendorCount,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class RFQItemModel extends RFQItem {
  const RFQItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.description,
    super.quantity = 0,
    super.uom,
  });

  factory RFQItemModel.fromJson(Map<String, dynamic> json) => RFQItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String?,
        productName: json['productName'] as String?,
        description: json['description'] as String?,
        quantity: asDouble(json['quantity']),
        uom: json['uom'] as String?,
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'description': description,
        'quantity': quantity,
        'uom': uom,
      };
}

class SupplierQuotationModel extends SupplierQuotation {
  const SupplierQuotationModel({
    required super.id,
    super.rfqId,
    super.rfqNumber,
    super.vendorId,
    super.vendorName,
    super.status = 'DRAFT',
    super.items = const <SupplierQuotationItem>[],
    super.subtotal = 0,
    super.taxTotal = 0,
    super.totalAmount = 0,
    super.currency = 'USD',
    super.validUntil,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory SupplierQuotationModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SupplierQuotation missing id');
    return SupplierQuotationModel(
      id: id,
      rfqId: json['rfqId'] as String?,
      rfqNumber: json['rfqNumber'] as String?,
      vendorId: json['vendorId'] as String?,
      vendorName: json['vendorName'] as String?,
      status: json['status'] as String? ?? 'DRAFT',
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => SupplierQuotationItemModel.fromJson(
                  e as Map<String, dynamic>,),)
              .toList(growable: false) ??
          const [],
      subtotal: asDouble(json['subtotal']),
      taxTotal: asDouble(json['taxTotal']),
      totalAmount: asDouble(json['totalAmount']),
      currency: json['currency'] as String? ?? 'USD',
      validUntil: DateTime.tryParse('${json['validUntil']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'rfqId': rfqId,
        'rfqNumber': rfqNumber,
        'vendorId': vendorId,
        'vendorName': vendorName,
        'status': status,
        'subtotal': subtotal,
        'taxTotal': taxTotal,
        'totalAmount': totalAmount,
        'currency': currency,
        'validUntil': validUntil?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class SupplierQuotationItemModel extends SupplierQuotationItem {
  const SupplierQuotationItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.description,
    super.quantity = 0,
    super.rate = 0,
    super.amount = 0,
    super.deliveryDate,
  });

  factory SupplierQuotationItemModel.fromJson(Map<String, dynamic> json) =>
      SupplierQuotationItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String?,
        productName: json['productName'] as String?,
        description: json['description'] as String?,
        quantity: asDouble(json['quantity']),
        rate: asDouble(json['rate']),
        amount: asDouble(json['amount']),
        deliveryDate: DateTime.tryParse('${json['deliveryDate']}'),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'description': description,
        'quantity': quantity,
        'rate': rate,
        'amount': amount,
        'deliveryDate': deliveryDate?.toIso8601String(),
      };
}

class PurchaseRequisitionModel extends PurchaseRequisition {
  const PurchaseRequisitionModel({
    required super.id,
    required super.title,
    super.requisitionNumber,
    super.department,
    super.requestedBy,
    super.requestedById,
    super.status = 'DRAFT',
    super.priority = 'MEDIUM',
    super.items = const <PurchaseRequisitionItem>[],
    super.totalEstimated = 0,
    super.requiredDate,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory PurchaseRequisitionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PurchaseRequisition missing id');
    return PurchaseRequisitionModel(
      id: id,
      title: json['title'] as String? ?? '',
      requisitionNumber: json['requisitionNumber'] as String?,
      department: json['department'] as String?,
      requestedBy: json['requestedBy'] as String?,
      requestedById: json['requestedById'] as String?,
      status: json['status'] as String? ?? 'DRAFT',
      priority: json['priority'] as String? ?? 'MEDIUM',
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => PurchaseRequisitionItemModel.fromJson(
                  e as Map<String, dynamic>,),)
              .toList(growable: false) ??
          const [],
      totalEstimated: asDouble(json['totalEstimated']),
      requiredDate: DateTime.tryParse('${json['requiredDate']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'requisitionNumber': requisitionNumber,
        'department': department,
        'requestedBy': requestedBy,
        'requestedById': requestedById,
        'status': status,
        'priority': priority,
        'totalEstimated': totalEstimated,
        'requiredDate': requiredDate?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PurchaseRequisitionItemModel extends PurchaseRequisitionItem {
  const PurchaseRequisitionItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.description,
    super.quantity = 0,
    super.estimatedRate = 0,
    super.estimatedAmount = 0,
    super.requiredDate,
  });

  factory PurchaseRequisitionItemModel.fromJson(Map<String, dynamic> json) =>
      PurchaseRequisitionItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String?,
        productName: json['productName'] as String?,
        description: json['description'] as String?,
        quantity: asDouble(json['quantity']),
        estimatedRate: asDouble(json['estimatedRate']),
        estimatedAmount: asDouble(json['estimatedAmount']),
        requiredDate: DateTime.tryParse('${json['requiredDate']}'),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'description': description,
        'quantity': quantity,
        'estimatedRate': estimatedRate,
        'estimatedAmount': estimatedAmount,
        'requiredDate': requiredDate?.toIso8601String(),
      };
}

class PurchaseReceiptModel extends PurchaseReceipt {
  const PurchaseReceiptModel({
    required super.id,
    required super.receiptNumber,
    super.purchaseOrderId,
    super.poNumber,
    super.supplierId,
    super.supplierName,
    super.warehouseId,
    super.warehouseName,
    super.status = 'DRAFT',
    super.items = const <PurchaseReceiptItem>[],
    super.receivedDate,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory PurchaseReceiptModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PurchaseReceipt missing id');
    return PurchaseReceiptModel(
      id: id,
      receiptNumber: json['receiptNumber'] as String? ?? '',
      purchaseOrderId: json['purchaseOrderId'] as String?,
      poNumber: json['poNumber'] as String?,
      supplierId: json['supplierId'] as String?,
      supplierName: json['supplierName'] as String?,
      warehouseId: json['warehouseId'] as String?,
      warehouseName: json['warehouseName'] as String?,
      status: json['status'] as String? ?? 'DRAFT',
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => PurchaseReceiptItemModel.fromJson(
                  e as Map<String, dynamic>,),)
              .toList(growable: false) ??
          const [],
      receivedDate: DateTime.tryParse('${json['receivedDate']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'receiptNumber': receiptNumber,
        'purchaseOrderId': purchaseOrderId,
        'poNumber': poNumber,
        'supplierId': supplierId,
        'supplierName': supplierName,
        'warehouseId': warehouseId,
        'warehouseName': warehouseName,
        'status': status,
        'receivedDate': receivedDate?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class PurchaseReceiptItemModel extends PurchaseReceiptItem {
  const PurchaseReceiptItemModel({
    required super.id,
    super.productId,
    super.productName,
    super.orderedQuantity = 0,
    super.receivedQuantity = 0,
    super.acceptedQuantity = 0,
    super.rejectedQuantity = 0,
    super.rate = 0,
    super.amount = 0,
  });

  factory PurchaseReceiptItemModel.fromJson(Map<String, dynamic> json) =>
      PurchaseReceiptItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String?,
        productName: json['productName'] as String?,
        orderedQuantity: asDouble(json['orderedQuantity']),
        receivedQuantity: asDouble(json['receivedQuantity']),
        acceptedQuantity: asDouble(json['acceptedQuantity']),
        rejectedQuantity: asDouble(json['rejectedQuantity']),
        rate: asDouble(json['rate']),
        amount: asDouble(json['amount']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'orderedQuantity': orderedQuantity,
        'receivedQuantity': receivedQuantity,
        'acceptedQuantity': acceptedQuantity,
        'rejectedQuantity': rejectedQuantity,
        'rate': rate,
        'amount': amount,
      };
}

class SupplierContractModel extends SupplierContract {
  const SupplierContractModel({
    required super.id,
    required super.contractNumber,
    required super.supplierId,
    required super.supplierName,
    required super.type,
    super.startDate,
    super.endDate,
    super.terms,
    super.value = 0,
    super.currency = 'USD',
    super.status = 'DRAFT',
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory SupplierContractModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SupplierContract missing id');
    return SupplierContractModel(
      id: id,
      contractNumber: json['contractNumber'] as String? ?? '',
      supplierId: json['supplierId'] as String? ?? '',
      supplierName: json['supplierName'] as String? ?? '',
      type: json['type'] as String? ?? '',
      startDate: DateTime.tryParse('${json['startDate']}'),
      endDate: DateTime.tryParse('${json['endDate']}'),
      terms: json['terms'] as String?,
      value: asDouble(json['value']),
      currency: json['currency'] as String? ?? 'USD',
      status: json['status'] as String? ?? 'DRAFT',
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'contractNumber': contractNumber,
        'supplierId': supplierId,
        'supplierName': supplierName,
        'type': type,
        'startDate': startDate?.toIso8601String(),
        'endDate': endDate?.toIso8601String(),
        'terms': terms,
        'value': value,
        'currency': currency,
        'status': status,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class ProcurementDashboardStatsModel extends ProcurementDashboardStats {
  const ProcurementDashboardStatsModel({
    super.totalPO = 0,
    super.totalSpend = 0,
    super.pendingApprovals = 0,
    super.vendorCount = 0,
    super.spendByVendor = const <DashboardDataPoint>[],
    super.spendByMonth = const <DashboardDataPoint>[],
    super.recentPOs = const <PurchaseOrder>[],
    super.overdueDeliveries = 0,
  });

  factory ProcurementDashboardStatsModel.fromJson(Map<String, dynamic> json) =>
      ProcurementDashboardStatsModel(
        totalPO: asInt(json['totalPO']),
        totalSpend: asDouble(json['totalSpend']),
        pendingApprovals: asInt(json['pendingApprovals']),
        vendorCount: asInt(json['vendorCount']),
        spendByVendor: (json['spendByVendor'] as List<dynamic>?)
                ?.map((e) => DashboardDataPointModel.fromJson(
                    e as Map<String, dynamic>,),)
                .toList(growable: false) ??
            const [],
        spendByMonth: (json['spendByMonth'] as List<dynamic>?)
                ?.map((e) => DashboardDataPointModel.fromJson(
                    e as Map<String, dynamic>,),)
                .toList(growable: false) ??
            const [],
        recentPOs: (json['recentPOs'] as List<dynamic>?)
                ?.map((e) =>
                    PurchaseOrderModel.fromJson(e as Map<String, dynamic>),)
                .toList(growable: false) ??
            const [],
        overdueDeliveries: asInt(json['overdueDeliveries']),
      );
}

class DashboardDataPointModel extends DashboardDataPoint {
  const DashboardDataPointModel({
    required super.label,
    required super.value,
  });

  factory DashboardDataPointModel.fromJson(Map<String, dynamic> json) =>
      DashboardDataPointModel(
        label: json['label'] as String? ?? '',
        value: asDouble(json['value']),
      );
}