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
                  PurchaseOrderItemModel.fromJson(e as Map<String, dynamic>))
              .toList(growable: false) ??
          const [],
      subtotal: asDouble(json['subtotal']),
      taxTotal: asDouble(json['taxTotal']),
      totalAmount: asDouble(json['totalAmount']),
      currency: json['currency'] as String? ?? 'USD',
      orderDate: DateTime.tryParse('${json['orderDate']}'),
      expectedDate: DateTime.tryParse('${json['expectedDate']}'),
      notes: json['notes'] as String?,
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
    super.rating,
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
      rating: asDouble(json['rating']),
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
        'rating': rating,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class RFQModel extends RFQ {
  const RFQModel({
    required super.id,
    required super.rfqNumber,
    required super.title,
    required super.status,
    super.vendorCount = 0,
    super.responseDeadline,
    super.notes,
    super.createdAt,
  });

  factory RFQModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('RFQ missing id');
    return RFQModel(
      id: id,
      rfqNumber: json['rfqNumber'] as String? ?? '',
      title: json['title'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      vendorCount: asInt(json['vendorCount']),
      responseDeadline: DateTime.tryParse('${json['responseDeadline']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'rfqNumber': rfqNumber,
        'title': title,
        'status': status,
        'vendorCount': vendorCount,
        'responseDeadline': responseDeadline?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class SupplierQuotationModel extends SupplierQuotation {
  const SupplierQuotationModel({
    required super.id,
    super.rfqId,
    super.vendorId,
    super.vendorName,
    super.status = 'DRAFT',
    super.totalAmount = 0,
    super.validUntil,
    super.notes,
    super.createdAt,
  });

  factory SupplierQuotationModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SupplierQuotation missing id');
    return SupplierQuotationModel(
      id: id,
      rfqId: json['rfqId'] as String?,
      vendorId: json['vendorId'] as String?,
      vendorName: json['vendorName'] as String?,
      status: json['status'] as String? ?? 'DRAFT',
      totalAmount: asDouble(json['totalAmount']),
      validUntil: DateTime.tryParse('${json['validUntil']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'rfqId': rfqId,
        'vendorId': vendorId,
        'vendorName': vendorName,
        'status': status,
        'totalAmount': totalAmount,
        'validUntil': validUntil?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class PurchaseRequisitionModel extends PurchaseRequisition {
  const PurchaseRequisitionModel({
    required super.id,
    required super.title,
    super.department,
    super.requestedBy,
    super.status = 'DRAFT',
    super.totalEstimated = 0,
    super.notes,
    super.createdAt,
  });

  factory PurchaseRequisitionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PurchaseRequisition missing id');
    return PurchaseRequisitionModel(
      id: id,
      title: json['title'] as String? ?? '',
      department: json['department'] as String?,
      requestedBy: json['requestedBy'] as String?,
      status: json['status'] as String? ?? 'DRAFT',
      totalEstimated: asDouble(json['totalEstimated']),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'department': department,
        'requestedBy': requestedBy,
        'status': status,
        'totalEstimated': totalEstimated,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}
