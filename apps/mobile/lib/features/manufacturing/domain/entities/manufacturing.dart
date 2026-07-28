import 'package:equatable/equatable.dart';

class Bom extends Equatable {
  const Bom({
    required this.id,
    required this.name,
    required this.productId,
    required this.productName,
    required this.type,
    required this.quantity,
    required this.status,
    this.items = const <BomItem>[],
    this.wastagePercentage,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String productId;
  final String productName;
  final String type;
  final double quantity;
  final String status;
  final List<BomItem> items;
  final double? wastagePercentage;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, productId, productName, type, quantity, status, items,
        wastagePercentage, createdAt, updatedAt,
      ];
}

class BomItem extends Equatable {
  const BomItem({
    required this.id,
    required this.bomId,
    required this.productId,
    required this.productName,
    required this.quantity,
    this.rate,
    this.amount,
    this.scrapPercentage,
  });

  final String id;
  final String bomId;
  final String productId;
  final String productName;
  final double quantity;
  final double? rate;
  final double? amount;
  final double? scrapPercentage;

  @override
  List<Object?> get props => <Object?>[
        id, bomId, productId, productName, quantity, rate, amount, scrapPercentage,
      ];
}

class WorkOrder extends Equatable {
  const WorkOrder({
    required this.id,
    required this.workOrderNumber,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.status,
    this.producedQuantity = 0,
    this.bomId,
    this.workstationId,
    this.routingId,
    this.scheduledStart,
    this.scheduledEnd,
    this.actualStart,
    this.actualEnd,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String workOrderNumber;
  final String productId;
  final String productName;
  final double quantity;
  final double producedQuantity;
  final String status;
  final String? bomId;
  final String? workstationId;
  final String? routingId;
  final DateTime? scheduledStart;
  final DateTime? scheduledEnd;
  final DateTime? actualStart;
  final DateTime? actualEnd;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, workOrderNumber, productId, productName, quantity, producedQuantity,
        status, bomId, workstationId, routingId, scheduledStart, scheduledEnd,
        actualStart, actualEnd, createdAt, updatedAt,
      ];
}

class WorkOrderOperation extends Equatable {
  const WorkOrderOperation({
    required this.id,
    required this.workOrderId,
    required this.operationName,
    this.workstationId,
    this.status = 'PENDING',
    this.scheduledDuration = 0,
    this.actualDuration,
    this.startedAt,
    this.completedAt,
  });

  final String id;
  final String workOrderId;
  final String operationName;
  final String? workstationId;
  final String status;
  final double scheduledDuration;
  final double? actualDuration;
  final DateTime? startedAt;
  final DateTime? completedAt;

  @override
  List<Object?> get props => <Object?>[
        id, workOrderId, operationName, workstationId, status,
        scheduledDuration, actualDuration, startedAt, completedAt,
      ];
}

class MrpRun extends Equatable {
  const MrpRun({
    required this.id,
    required this.productId,
    required this.productName,
    required this.demandQuantity,
    required this.supplyQuantity,
    required this.netRequirement,
    this.status = 'DRAFT',
    this.createdAt,
  });

  final String id;
  final String productId;
  final String productName;
  final double demandQuantity;
  final double supplyQuantity;
  final double netRequirement;
  final String status;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, productId, productName, demandQuantity, supplyQuantity,
        netRequirement, status, createdAt,
      ];
}

class Workstation extends Equatable {
  const Workstation({
    required this.id,
    required this.name,
    this.code,
    this.location,
    this.status = 'AVAILABLE',
    this.capacity = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? code;
  final String? location;
  final String status;
  final double capacity;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, code, location, status, capacity, createdAt, updatedAt,
      ];
}

class Routing extends Equatable {
  const Routing({
    required this.id,
    required this.name,
    this.productId,
    this.productName,
    this.status = 'ACTIVE',
    this.steps = const <RoutingStep>[],
    this.totalDuration = 0,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String? productId;
  final String? productName;
  final String status;
  final List<RoutingStep> steps;
  final double totalDuration;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, productId, productName, status, steps, totalDuration, createdAt, updatedAt,
      ];
}

class RoutingStep extends Equatable {
  const RoutingStep({
    required this.id,
    required this.routingId,
    required this.stepName,
    required this.stepOrder,
    this.workstationId,
    this.duration = 0,
    this.description,
  });

  final String id;
  final String routingId;
  final String stepName;
  final int stepOrder;
  final String? workstationId;
  final double duration;
  final String? description;

  @override
  List<Object?> get props => <Object?>[
        id, routingId, stepName, stepOrder, workstationId, duration, description,
      ];
}

class QualityInspection extends Equatable {
  const QualityInspection({
    required this.id,
    required this.inspectionNumber,
    required this.productId,
    required this.productName,
    this.workOrderId,
    this.type = 'IN_PROCESS',
    this.status = 'PENDING',
    this.inspectedBy,
    this.totalQty = 0,
    this.passedQty = 0,
    this.failedQty = 0,
    this.createdAt,
  });

  final String id;
  final String inspectionNumber;
  final String productId;
  final String productName;
  final String? workOrderId;
  final String type;
  final String status;
  final String? inspectedBy;
  final double totalQty;
  final double passedQty;
  final double failedQty;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, inspectionNumber, productId, productName, workOrderId, type, status,
        inspectedBy, totalQty, passedQty, failedQty, createdAt,
      ];
}
