import 'package:equatable/equatable.dart';

class Quotation extends Equatable {
  const Quotation({
    required this.id,
    required this.customerId,
    required this.customerName,
    required this.status,
    required this.items,
    required this.totalAmount,
    this.validUntil,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String customerId;
  final String customerName;
  final String status;
  final List<QuotationItem> items;
  final double totalAmount;
  final DateTime? validUntil;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        customerId,
        customerName,
        status,
        items,
        totalAmount,
        validUntil,
        notes,
        createdAt,
        updatedAt,
      ];
}

class QuotationItem extends Equatable {
  const QuotationItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.rate,
    required this.amount,
    this.deliveryDate,
  });

  final String id;
  final String productId;
  final String productName;
  final double quantity;
  final double rate;
  final double amount;
  final DateTime? deliveryDate;

  @override
  List<Object?> get props => <Object?>[
        id,
        productId,
        productName,
        quantity,
        rate,
        amount,
        deliveryDate,
      ];
}

class SalesOrder extends Equatable {
  const SalesOrder({
    required this.id,
    required this.customerId,
    required this.customerName,
    required this.status,
    required this.items,
    required this.totalAmount,
    this.deliveryDate,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String customerId;
  final String customerName;
  final String status;
  final List<SalesOrderItem> items;
  final double totalAmount;
  final DateTime? deliveryDate;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        customerId,
        customerName,
        status,
        items,
        totalAmount,
        deliveryDate,
        notes,
        createdAt,
        updatedAt,
      ];
}

class SalesOrderItem extends Equatable {
  const SalesOrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.rate,
    required this.amount,
  });

  final String id;
  final String productId;
  final String productName;
  final double quantity;
  final double rate;
  final double amount;

  @override
  List<Object?> get props => <Object?>[id, productId, productName, quantity, rate, amount];
}

class DeliveryNote extends Equatable {
  const DeliveryNote({
    required this.id,
    required this.salesOrderId,
    required this.customerName,
    required this.status,
    required this.items,
    this.deliveryDate,
    this.createdAt,
  });

  final String id;
  final String salesOrderId;
  final String customerName;
  final String status;
  final List<DeliveryNoteItem> items;
  final DateTime? deliveryDate;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        salesOrderId,
        customerName,
        status,
        items,
        deliveryDate,
        createdAt,
      ];
}

class DeliveryNoteItem extends Equatable {
  const DeliveryNoteItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
  });

  final String id;
  final String productId;
  final String productName;
  final double quantity;

  @override
  List<Object?> get props => <Object?>[id, productId, productName, quantity];
}

class SalesReturn extends Equatable {
  const SalesReturn({
    required this.id,
    required this.salesOrderId,
    required this.customerName,
    required this.status,
    required this.reason,
    required this.items,
    required this.totalAmount,
    this.createdAt,
  });

  final String id;
  final String salesOrderId;
  final String customerName;
  final String status;
  final String reason;
  final List<SalesReturnItem> items;
  final double totalAmount;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        salesOrderId,
        customerName,
        status,
        reason,
        items,
        totalAmount,
        createdAt,
      ];
}

class SalesReturnItem extends Equatable {
  const SalesReturnItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.rate,
    required this.amount,
  });

  final String id;
  final String productId;
  final String productName;
  final double quantity;
  final double rate;
  final double amount;

  @override
  List<Object?> get props => <Object?>[id, productId, productName, quantity, rate, amount];
}

class SalesPipeline extends Equatable {
  const SalesPipeline({
    required this.id,
    required this.name,
    required this.stages,
    this.createdAt,
  });

  final String id;
  final String name;
  final List<PipelineStage> stages;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[id, name, stages, createdAt];
}

class PipelineStage extends Equatable {
  const PipelineStage({
    required this.name,
    required this.order,
  });

  final String name;
  final int order;

  @override
  List<Object?> get props => <Object?>[name, order];
}

class Opportunity extends Equatable {
  const Opportunity({
    required this.id,
    required this.title,
    required this.customerName,
    required this.stage,
    this.expectedRevenue,
    this.probability,
    this.closeDate,
    this.status,
  });

  final String id;
  final String title;
  final String customerName;
  final String stage;
  final double? expectedRevenue;
  final double? probability;
  final DateTime? closeDate;
  final String? status;

  @override
  List<Object?> get props => <Object?>[
        id,
        title,
        customerName,
        stage,
        expectedRevenue,
        probability,
        closeDate,
        status,
      ];
}

class SalesActivity extends Equatable {
  const SalesActivity({
    required this.id,
    required this.type,
    required this.subject,
    this.description,
    this.dateTime,
    this.createdAt,
  });

  final String id;
  final String type;
  final String subject;
  final String? description;
  final DateTime? dateTime;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[id, type, subject, description, dateTime, createdAt];
}
