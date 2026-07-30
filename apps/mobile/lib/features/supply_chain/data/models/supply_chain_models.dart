import '../../../../core/error/exceptions.dart';
import '../../domain/entities/supply_chain.dart';

class ShipmentModel extends Shipment {
  const ShipmentModel({
    required super.id,
    required super.shipmentNumber,
    required super.carrierId,
    required super.carrierName,
    required super.status,
    required super.origin,
    required super.destination,
    super.estimatedDelivery,
    super.actualDelivery,
    super.createdAt,
    super.updatedAt,
  });

  factory ShipmentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Shipment is missing its id');
    }
    return ShipmentModel(
      id: id,
      shipmentNumber: json['shipmentNumber'] as String? ?? '',
      carrierId: json['carrierId'] as String? ?? '',
      carrierName: json['carrierName'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      origin: json['origin'] as String? ?? '',
      destination: json['destination'] as String? ?? '',
      estimatedDelivery: DateTime.tryParse('${json['estimatedDelivery']}'),
      actualDelivery: DateTime.tryParse('${json['actualDelivery']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'shipmentNumber': shipmentNumber,
        'carrierId': carrierId,
        'carrierName': carrierName,
        'status': status,
        'origin': origin,
        'destination': destination,
        'estimatedDelivery': estimatedDelivery?.toIso8601String(),
        'actualDelivery': actualDelivery?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class CarrierModel extends Carrier {
  const CarrierModel({
    required super.id,
    required super.name,
    super.trackingUrl,
    super.phone,
    super.email,
    super.isActive,
    super.createdAt,
  });

  factory CarrierModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Carrier is missing its id');
    }
    return CarrierModel(
      id: id,
      name: json['name'] as String? ?? '',
      trackingUrl: json['trackingUrl'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'trackingUrl': trackingUrl,
        'phone': phone,
        'email': email,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class DemandForecastModel extends DemandForecast {
  const DemandForecastModel({
    required super.id,
    required super.productId,
    required super.productName,
    required super.period,
    required super.forecastQuantity,
    super.actualQuantity,
    super.accuracy,
    super.createdAt,
  });

  factory DemandForecastModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('DemandForecast is missing its id');
    }
    return DemandForecastModel(
      id: id,
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      period: json['period'] as String? ?? '',
      forecastQuantity: asDouble(json['forecastQuantity']),
      actualQuantity: asDoubleOrNull(json['actualQuantity']),
      accuracy: asDoubleOrNull(json['accuracy']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'period': period,
        'forecastQuantity': forecastQuantity,
        'actualQuantity': actualQuantity,
        'accuracy': accuracy,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class ReorderSuggestionModel extends ReorderSuggestion {
  const ReorderSuggestionModel({
    required super.id,
    required super.productId,
    required super.productName,
    required super.reorderQuantity,
    super.status,
    super.createdAt,
  });

  factory ReorderSuggestionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('ReorderSuggestion is missing its id');
    }
    return ReorderSuggestionModel(
      id: id,
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      reorderQuantity: asDouble(json['reorderQuantity']),
      status: json['status'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'productName': productName,
        'reorderQuantity': reorderQuantity,
        'status': status,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class SupplyChainRouteModel extends SupplyChainRoute {
  const SupplyChainRouteModel({
    required super.id,
    required super.name,
    required super.origin,
    required super.destination,
    super.carrierId,
    super.carrierName,
    super.transitTime,
    super.cost,
    super.isActive,
    super.createdAt,
  });

  factory SupplyChainRouteModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('SupplyChainRoute is missing its id');
    }
    return SupplyChainRouteModel(
      id: id,
      name: json['name'] as String? ?? '',
      origin: json['origin'] as String? ?? '',
      destination: json['destination'] as String? ?? '',
      carrierId: json['carrierId'] as String?,
      carrierName: json['carrierName'] as String?,
      transitTime: asIntOrNull(json['transitTime']),
      cost: asDouble(json['cost']),
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'origin': origin,
        'destination': destination,
        'carrierId': carrierId,
        'carrierName': carrierName,
        'transitTime': transitTime,
        'cost': cost,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class DockAppointmentModel extends DockAppointment {
  const DockAppointmentModel({
    required super.id,
    super.warehouseId,
    super.warehouseName,
    super.carrierId,
    super.carrierName,
    super.scheduledAt,
    super.arrivedAt,
    super.departedAt,
    super.status,
    super.reference,
    super.notes,
    super.createdAt,
  });

  factory DockAppointmentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('DockAppointment is missing its id');
    }
    return DockAppointmentModel(
      id: id,
      warehouseId: json['warehouseId'] as String?,
      warehouseName: json['warehouseName'] as String?,
      carrierId: json['carrierId'] as String?,
      carrierName: json['carrierName'] as String?,
      scheduledAt: DateTime.tryParse('${json['scheduledAt']}'),
      arrivedAt: DateTime.tryParse('${json['arrivedAt']}'),
      departedAt: DateTime.tryParse('${json['departedAt']}'),
      status: json['status'] as String? ?? 'SCHEDULED',
      reference: json['reference'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'warehouseId': warehouseId,
        'warehouseName': warehouseName,
        'carrierId': carrierId,
        'carrierName': carrierName,
        'scheduledAt': scheduledAt?.toIso8601String(),
        'arrivedAt': arrivedAt?.toIso8601String(),
        'departedAt': departedAt?.toIso8601String(),
        'status': status,
        'reference': reference,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class WarehouseTransferModel extends WarehouseTransfer {
  const WarehouseTransferModel({
    required super.id,
    super.fromWarehouseId,
    super.fromWarehouseName,
    super.toWarehouseId,
    super.toWarehouseName,
    super.productId,
    super.productName,
    super.quantity,
    super.status,
    super.reference,
    super.createdAt,
  });

  factory WarehouseTransferModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('WarehouseTransfer is missing its id');
    }
    return WarehouseTransferModel(
      id: id,
      fromWarehouseId: json['fromWarehouseId'] as String?,
      fromWarehouseName: json['fromWarehouseName'] as String?,
      toWarehouseId: json['toWarehouseId'] as String?,
      toWarehouseName: json['toWarehouseName'] as String?,
      productId: json['productId'] as String?,
      productName: json['productName'] as String?,
      quantity: asDouble(json['quantity']),
      status: json['status'] as String? ?? 'PENDING',
      reference: json['reference'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'fromWarehouseId': fromWarehouseId,
        'fromWarehouseName': fromWarehouseName,
        'toWarehouseId': toWarehouseId,
        'toWarehouseName': toWarehouseName,
        'productId': productId,
        'productName': productName,
        'quantity': quantity,
        'status': status,
        'reference': reference,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class TrackingEventModel extends TrackingEvent {
  const TrackingEventModel({
    required super.id,
    super.shipmentId,
    super.location,
    super.status,
    super.timestamp,
    super.description,
    super.createdAt,
  });

  factory TrackingEventModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('TrackingEvent is missing its id');
    }
    return TrackingEventModel(
      id: id,
      shipmentId: json['shipmentId'] as String?,
      location: json['location'] as String?,
      status: json['status'] as String?,
      timestamp: DateTime.tryParse('${json['timestamp']}'),
      description: json['description'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'shipmentId': shipmentId,
        'location': location,
        'status': status,
        'timestamp': timestamp?.toIso8601String(),
        'description': description,
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

int? asIntOrNull(Object? value) => switch (value) {
      final int v => v,
      final num v => v.toInt(),
      final String v => int.tryParse(v),
      _ => null,
    };