import '../../../../core/error/exceptions.dart';
import '../../domain/entities/manufacturing.dart';

class BomModel extends Bom {
  const BomModel({
    required super.id,
    required super.name,
    required super.productId,
    required super.productName,
    required super.type,
    required super.quantity,
    required super.status,
    super.items,
    super.wastagePercentage,
    super.createdAt,
    super.updatedAt,
  });

  factory BomModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Bom is missing its id');
    }
    return BomModel(
      id: id,
      name: json['name'] as String? ?? '',
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      type: json['type'] as String? ?? 'PRODUCTION',
      quantity: asDouble(json['quantity']),
      status: json['status'] as String? ?? 'ACTIVE',
      items: (json['items'] as List<dynamic>?)
              ?.map((Object? e) => BomItemModel.fromJson(e as Map<String, dynamic>))
              .toList(growable: false) ??
          const <BomItem>[],
      wastagePercentage: asDoubleOrNull(json['wastagePercentage']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'productId': productId,
        'productName': productName,
        'type': type,
        'quantity': quantity,
        'status': status,
        'items': items.map((BomItem e) => (e as BomItemModel).toJson()).toList(),
        'wastagePercentage': wastagePercentage,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class BomItemModel extends BomItem {
  const BomItemModel({
    required super.id,
    required super.bomId,
    required super.productId,
    required super.productName,
    required super.quantity,
    super.rate,
    super.amount,
    super.scrapPercentage,
  });

  factory BomItemModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('BomItem is missing its id');
    }
    return BomItemModel(
      id: id,
      bomId: json['bomId'] as String? ?? '',
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      quantity: asDouble(json['quantity']),
      rate: asDoubleOrNull(json['rate']),
      amount: asDoubleOrNull(json['amount']),
      scrapPercentage: asDoubleOrNull(json['scrapPercentage']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'bomId': bomId,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'rate': rate,
        'amount': amount,
        'scrapPercentage': scrapPercentage,
      };
}

class WorkOrderModel extends WorkOrder {
  const WorkOrderModel({
    required super.id,
    required super.workOrderNumber,
    required super.productId,
    required super.productName,
    required super.quantity,
    required super.status,
    super.producedQuantity,
    super.bomId,
    super.workstationId,
    super.routingId,
    super.scheduledStart,
    super.scheduledEnd,
    super.actualStart,
    super.actualEnd,
    super.createdAt,
    super.updatedAt,
  });

  factory WorkOrderModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('WorkOrder is missing its id');
    }
    return WorkOrderModel(
      id: id,
      workOrderNumber: json['workOrderNumber'] as String? ?? '',
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      quantity: asDouble(json['quantity']),
      producedQuantity: asDouble(json['producedQuantity']),
      status: json['status'] as String? ?? 'DRAFT',
      bomId: json['bomId'] as String?,
      workstationId: json['workstationId'] as String?,
      routingId: json['routingId'] as String?,
      scheduledStart: DateTime.tryParse('${json['scheduledStart']}'),
      scheduledEnd: DateTime.tryParse('${json['scheduledEnd']}'),
      actualStart: DateTime.tryParse('${json['actualStart']}'),
      actualEnd: DateTime.tryParse('${json['actualEnd']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'workOrderNumber': workOrderNumber,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'producedQuantity': producedQuantity,
        'status': status,
        'bomId': bomId,
        'workstationId': workstationId,
        'routingId': routingId,
        'scheduledStart': scheduledStart?.toIso8601String(),
        'scheduledEnd': scheduledEnd?.toIso8601String(),
        'actualStart': actualStart?.toIso8601String(),
        'actualEnd': actualEnd?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class WorkOrderOperationModel extends WorkOrderOperation {
  const WorkOrderOperationModel({
    required super.id,
    required super.workOrderId,
    required super.operationName,
    super.workstationId,
    super.status,
    super.scheduledDuration,
    super.actualDuration,
    super.startedAt,
    super.completedAt,
  });

  factory WorkOrderOperationModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('WorkOrderOperation is missing its id');
    }
    return WorkOrderOperationModel(
      id: id,
      workOrderId: json['workOrderId'] as String? ?? '',
      operationName: json['operationName'] as String? ?? '',
      workstationId: json['workstationId'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      scheduledDuration: asDouble(json['scheduledDuration']),
      actualDuration: asDoubleOrNull(json['actualDuration']),
      startedAt: DateTime.tryParse('${json['startedAt']}'),
      completedAt: DateTime.tryParse('${json['completedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'workOrderId': workOrderId,
        'operationName': operationName,
        'workstationId': workstationId,
        'status': status,
        'scheduledDuration': scheduledDuration,
        'actualDuration': actualDuration,
        'startedAt': startedAt?.toIso8601String(),
        'completedAt': completedAt?.toIso8601String(),
      };
}

class MrpRunModel extends MrpRun {
  const MrpRunModel({
    required super.id,
    required super.productId,
    required super.productName,
    required super.demandQuantity,
    required super.supplyQuantity,
    required super.netRequirement,
    super.status,
    super.createdAt,
  });

  factory MrpRunModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('MrpRun is missing its id');
    }
    return MrpRunModel(
      id: id,
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      demandQuantity: asDouble(json['demandQuantity']),
      supplyQuantity: asDouble(json['supplyQuantity']),
      netRequirement: asDouble(json['netRequirement']),
      status: json['status'] as String? ?? 'DRAFT',
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'demandQuantity': demandQuantity,
        'supplyQuantity': supplyQuantity,
        'netRequirement': netRequirement,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class WorkstationModel extends Workstation {
  const WorkstationModel({
    required super.id,
    required super.name,
    super.code,
    super.location,
    super.status,
    super.capacity,
    super.createdAt,
    super.updatedAt,
  });

  factory WorkstationModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Workstation is missing its id');
    }
    return WorkstationModel(
      id: id,
      name: json['name'] as String? ?? '',
      code: json['code'] as String?,
      location: json['location'] as String?,
      status: json['status'] as String? ?? 'AVAILABLE',
      capacity: asDouble(json['capacity']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'code': code,
        'location': location,
        'status': status,
        'capacity': capacity,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class RoutingModel extends Routing {
  const RoutingModel({
    required super.id,
    required super.name,
    super.productId,
    super.productName,
    super.status,
    super.steps,
    super.totalDuration,
    super.createdAt,
    super.updatedAt,
  });

  factory RoutingModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Routing is missing its id');
    }
    return RoutingModel(
      id: id,
      name: json['name'] as String? ?? '',
      productId: json['productId'] as String?,
      productName: json['productName'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      steps: (json['steps'] as List<dynamic>?)
              ?.map((Object? e) => RoutingStepModel.fromJson(e as Map<String, dynamic>))
              .toList(growable: false) ??
          const <RoutingStep>[],
      totalDuration: asDouble(json['totalDuration']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'productId': productId,
        'productName': productName,
        'status': status,
        'steps': steps.map((RoutingStep e) => (e as RoutingStepModel).toJson()).toList(),
        'totalDuration': totalDuration,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class RoutingStepModel extends RoutingStep {
  const RoutingStepModel({
    required super.id,
    required super.routingId,
    required super.stepName,
    required super.stepOrder,
    super.workstationId,
    super.duration,
    super.description,
  });

  factory RoutingStepModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('RoutingStep is missing its id');
    }
    return RoutingStepModel(
      id: id,
      routingId: json['routingId'] as String? ?? '',
      stepName: json['stepName'] as String? ?? '',
      stepOrder: asInt(json['stepOrder']),
      workstationId: json['workstationId'] as String?,
      duration: asDouble(json['duration']),
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'routingId': routingId,
        'stepName': stepName,
        'stepOrder': stepOrder,
        'workstationId': workstationId,
        'duration': duration,
        'description': description,
      };
}

class QualityInspectionModel extends QualityInspection {
  const QualityInspectionModel({
    required super.id,
    required super.inspectionNumber,
    required super.productId,
    required super.productName,
    super.workOrderId,
    super.type,
    super.status,
    super.inspectedBy,
    super.totalQty,
    super.passedQty,
    super.failedQty,
    super.createdAt,
  });

  factory QualityInspectionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('QualityInspection is missing its id');
    }
    return QualityInspectionModel(
      id: id,
      inspectionNumber: json['inspectionNumber'] as String? ?? '',
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      workOrderId: json['workOrderId'] as String?,
      type: json['type'] as String? ?? 'IN_PROCESS',
      status: json['status'] as String? ?? 'PENDING',
      inspectedBy: json['inspectedBy'] as String?,
      totalQty: asDouble(json['totalQty']),
      passedQty: asDouble(json['passedQty']),
      failedQty: asDouble(json['failedQty']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'inspectionNumber': inspectionNumber,
        'productId': productId,
        'productName': productName,
        'workOrderId': workOrderId,
        'type': type,
        'status': status,
        'inspectedBy': inspectedBy,
        'totalQty': totalQty,
        'passedQty': passedQty,
        'failedQty': failedQty,
        'createdAt': createdAt?.toIso8601String(),
      };
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
