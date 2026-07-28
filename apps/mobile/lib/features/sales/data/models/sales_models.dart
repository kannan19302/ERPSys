import '../../../../core/error/exceptions.dart';
import '../../domain/entities/sales.dart';

class QuotationModel extends Quotation {
  const QuotationModel({
    required super.id,
    required super.customerId,
    required super.customerName,
    required super.status,
    required super.items,
    required super.totalAmount,
    super.validUntil,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory QuotationModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Quotation is missing its id');
    }
    final List<QuotationItem> items =
        _parseItems<QuotationItem>(json['items'], QuotationItemModel.fromJson);

    return QuotationModel(
      id: id,
      customerId: json['customerId'] as String? ?? '',
      customerName: json['customerName'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      items: items,
      totalAmount: asDouble(json['totalAmount']),
      validUntil: DateTime.tryParse('${json['validUntil']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'customerId': customerId,
        'customerName': customerName,
        'status': status,
        'items': items.map((QuotationItem e) => (e as QuotationItemModel).toJson()).toList(),
        'totalAmount': totalAmount,
        'validUntil': validUntil?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class QuotationItemModel extends QuotationItem {
  const QuotationItemModel({
    required super.id,
    required super.productId,
    required super.productName,
    required super.quantity,
    required super.rate,
    required super.amount,
    super.deliveryDate,
  });

  factory QuotationItemModel.fromJson(Map<String, dynamic> json) => QuotationItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String? ?? '',
        productName: json['productName'] as String? ?? '',
        quantity: asDouble(json['quantity']),
        rate: asDouble(json['rate']),
        amount: asDouble(json['amount']),
        deliveryDate: DateTime.tryParse('${json['deliveryDate']}'),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'rate': rate,
        'amount': amount,
        'deliveryDate': deliveryDate?.toIso8601String(),
      };
}

class SalesOrderModel extends SalesOrder {
  const SalesOrderModel({
    required super.id,
    required super.customerId,
    required super.customerName,
    required super.status,
    required super.items,
    required super.totalAmount,
    super.deliveryDate,
    super.notes,
    super.createdAt,
    super.updatedAt,
  });

  factory SalesOrderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('SalesOrder is missing its id');
    }
    final List<SalesOrderItem> items =
        _parseItems<SalesOrderItem>(json['items'], SalesOrderItemModel.fromJson);

    return SalesOrderModel(
      id: id,
      customerId: json['customerId'] as String? ?? '',
      customerName: json['customerName'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      items: items,
      totalAmount: asDouble(json['totalAmount']),
      deliveryDate: DateTime.tryParse('${json['deliveryDate']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'customerId': customerId,
        'customerName': customerName,
        'status': status,
        'items': items.map((SalesOrderItem e) => (e as SalesOrderItemModel).toJson()).toList(),
        'totalAmount': totalAmount,
        'deliveryDate': deliveryDate?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class SalesOrderItemModel extends SalesOrderItem {
  const SalesOrderItemModel({
    required super.id,
    required super.productId,
    required super.productName,
    required super.quantity,
    required super.rate,
    required super.amount,
  });

  factory SalesOrderItemModel.fromJson(Map<String, dynamic> json) => SalesOrderItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String? ?? '',
        productName: json['productName'] as String? ?? '',
        quantity: asDouble(json['quantity']),
        rate: asDouble(json['rate']),
        amount: asDouble(json['amount']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'rate': rate,
        'amount': amount,
      };
}

class DeliveryNoteModel extends DeliveryNote {
  const DeliveryNoteModel({
    required super.id,
    required super.salesOrderId,
    required super.customerName,
    required super.status,
    required super.items,
    super.deliveryDate,
    super.createdAt,
  });

  factory DeliveryNoteModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('DeliveryNote is missing its id');
    }
    final List<DeliveryNoteItem> items =
        _parseItems<DeliveryNoteItem>(json['items'], DeliveryNoteItemModel.fromJson);

    return DeliveryNoteModel(
      id: id,
      salesOrderId: json['salesOrderId'] as String? ?? '',
      customerName: json['customerName'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      items: items,
      deliveryDate: DateTime.tryParse('${json['deliveryDate']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'salesOrderId': salesOrderId,
        'customerName': customerName,
        'status': status,
        'items': items.map((DeliveryNoteItem e) => (e as DeliveryNoteItemModel).toJson()).toList(),
        'deliveryDate': deliveryDate?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class DeliveryNoteItemModel extends DeliveryNoteItem {
  const DeliveryNoteItemModel({
    required super.id,
    required super.productId,
    required super.productName,
    required super.quantity,
  });

  factory DeliveryNoteItemModel.fromJson(Map<String, dynamic> json) => DeliveryNoteItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String? ?? '',
        productName: json['productName'] as String? ?? '',
        quantity: asDouble(json['quantity']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
      };
}

class SalesReturnModel extends SalesReturn {
  const SalesReturnModel({
    required super.id,
    required super.salesOrderId,
    required super.customerName,
    required super.status,
    required super.reason,
    required super.items,
    required super.totalAmount,
    super.createdAt,
  });

  factory SalesReturnModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('SalesReturn is missing its id');
    }
    final List<SalesReturnItem> items =
        _parseItems<SalesReturnItem>(json['items'], SalesReturnItemModel.fromJson);

    return SalesReturnModel(
      id: id,
      salesOrderId: json['salesOrderId'] as String? ?? '',
      customerName: json['customerName'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      reason: json['reason'] as String? ?? '',
      items: items,
      totalAmount: asDouble(json['totalAmount']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'salesOrderId': salesOrderId,
        'customerName': customerName,
        'status': status,
        'reason': reason,
        'items': items.map((SalesReturnItem e) => (e as SalesReturnItemModel).toJson()).toList(),
        'totalAmount': totalAmount,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class SalesReturnItemModel extends SalesReturnItem {
  const SalesReturnItemModel({
    required super.id,
    required super.productId,
    required super.productName,
    required super.quantity,
    required super.rate,
    required super.amount,
  });

  factory SalesReturnItemModel.fromJson(Map<String, dynamic> json) => SalesReturnItemModel(
        id: json['id'] as String? ?? '',
        productId: json['productId'] as String? ?? '',
        productName: json['productName'] as String? ?? '',
        quantity: asDouble(json['quantity']),
        rate: asDouble(json['rate']),
        amount: asDouble(json['amount']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'rate': rate,
        'amount': amount,
      };
}

class SalesPipelineModel extends SalesPipeline {
  const SalesPipelineModel({
    required super.id,
    required super.name,
    required super.stages,
    super.createdAt,
  });

  factory SalesPipelineModel.fromJson(Map<String, dynamic> json) {
    final Object? rawStages = json['stages'];
    final List<PipelineStage> stages = rawStages is List
        ? rawStages
            .whereType<Map<String, dynamic>>()
            .map(PipelineStageModel.fromJson)
            .toList(growable: false)
        : const <PipelineStage>[];

    return SalesPipelineModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      stages: stages,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'stages': stages
            .map((PipelineStage s) => (s as PipelineStageModel).toJson())
            .toList(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class PipelineStageModel extends PipelineStage {
  const PipelineStageModel({
    required super.name,
    required super.order,
  });

  factory PipelineStageModel.fromJson(Map<String, dynamic> json) => PipelineStageModel(
        name: json['name'] as String? ?? '',
        order: asInt(json['order']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'name': name,
        'order': order,
      };
}

class OpportunityModel extends Opportunity {
  const OpportunityModel({
    required super.id,
    required super.title,
    required super.customerName,
    required super.stage,
    super.expectedRevenue,
    super.probability,
    super.closeDate,
    super.status,
  });

  factory OpportunityModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Opportunity is missing its id');
    }
    return OpportunityModel(
      id: id,
      title: json['title'] as String? ?? '',
      customerName: json['customerName'] as String? ?? '',
      stage: json['stage'] as String? ?? '',
      expectedRevenue: asDoubleOrNull(json['expectedRevenue']),
      probability: asDoubleOrNull(json['probability']),
      closeDate: DateTime.tryParse('${json['closeDate']}'),
      status: json['status'] as String?,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'customerName': customerName,
        'stage': stage,
        'expectedRevenue': expectedRevenue,
        'probability': probability,
        'closeDate': closeDate?.toIso8601String(),
        'status': status,
      };
}

class SalesActivityModel extends SalesActivity {
  const SalesActivityModel({
    required super.id,
    required super.type,
    required super.subject,
    super.description,
    super.dateTime,
    super.createdAt,
  });

  factory SalesActivityModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('SalesActivity is missing its id');
    }
    return SalesActivityModel(
      id: id,
      type: json['type'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      description: json['description'] as String?,
      dateTime: DateTime.tryParse('${json['dateTime']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'type': type,
        'subject': subject,
        'description': description,
        'dateTime': dateTime?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

List<T> _parseItems<T>(Object? raw, T Function(Map<String, dynamic>) fromJson) {
  if (raw is List) {
    return raw.whereType<Map<String, dynamic>>().map(fromJson).toList(growable: false);
  }
  return <T>[];
}

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

double? asDoubleOrNull(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v),
      _ => null,
    };
