import 'package:equatable/equatable.dart';

class Shipment extends Equatable {
  const Shipment({
    required this.id,
    required this.shipmentNumber,
    required this.carrierId,
    required this.carrierName,
    required this.status,
    required this.origin,
    required this.destination,
    this.estimatedDelivery,
    this.actualDelivery,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String shipmentNumber;
  final String carrierId;
  final String carrierName;
  final String status;
  final String origin;
  final String destination;
  final DateTime? estimatedDelivery;
  final DateTime? actualDelivery;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        shipmentNumber,
        carrierId,
        carrierName,
        status,
        origin,
        destination,
        estimatedDelivery,
        actualDelivery,
        createdAt,
        updatedAt,
      ];
}

class Carrier extends Equatable {
  const Carrier({
    required this.id,
    required this.name,
    this.trackingUrl,
    this.phone,
    this.email,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? trackingUrl;
  final String? phone;
  final String? email;
  final bool isActive;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        trackingUrl,
        phone,
        email,
        isActive,
        createdAt,
      ];
}

class DemandForecast extends Equatable {
  const DemandForecast({
    required this.id,
    required this.productId,
    required this.productName,
    required this.period,
    required this.forecastQuantity,
    this.actualQuantity,
    this.accuracy,
    this.createdAt,
  });

  final String id;
  final String productId;
  final String productName;
  final String period;
  final double forecastQuantity;
  final double? actualQuantity;
  final double? accuracy;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        productId,
        productName,
        period,
        forecastQuantity,
        actualQuantity,
        accuracy,
        createdAt,
      ];
}

class ReorderSuggestion extends Equatable {
  const ReorderSuggestion({
    required this.id,
    required this.productId,
    required this.productName,
    required this.reorderQuantity,
    this.status,
    this.createdAt,
  });

  final String id;
  final String productId;
  final String productName;
  final double reorderQuantity;
  final String? status;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        productId,
        productName,
        reorderQuantity,
        status,
        createdAt,
      ];
}

class SupplyChainRoute extends Equatable {
  const SupplyChainRoute({
    required this.id,
    required this.name,
    required this.origin,
    required this.destination,
    this.carrierId,
    this.carrierName,
    this.transitTime,
    this.cost = 0,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String name;
  final String origin;
  final String destination;
  final String? carrierId;
  final String? carrierName;
  final int? transitTime;
  final double cost;
  final bool isActive;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, origin, destination, carrierId, carrierName,
        transitTime, cost, isActive, createdAt,
      ];
}

class DockAppointment extends Equatable {
  const DockAppointment({
    required this.id,
    this.warehouseId,
    this.warehouseName,
    this.carrierId,
    this.carrierName,
    this.scheduledAt,
    this.arrivedAt,
    this.departedAt,
    this.status = 'SCHEDULED',
    this.reference,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String? warehouseId;
  final String? warehouseName;
  final String? carrierId;
  final String? carrierName;
  final DateTime? scheduledAt;
  final DateTime? arrivedAt;
  final DateTime? departedAt;
  final String status;
  final String? reference;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, warehouseId, warehouseName, carrierId, carrierName,
        scheduledAt, arrivedAt, departedAt, status, reference, notes, createdAt,
      ];
}

class WarehouseTransfer extends Equatable {
  const WarehouseTransfer({
    required this.id,
    this.fromWarehouseId,
    this.fromWarehouseName,
    this.toWarehouseId,
    this.toWarehouseName,
    this.productId,
    this.productName,
    this.quantity = 0,
    this.status = 'PENDING',
    this.reference,
    this.createdAt,
  });

  final String id;
  final String? fromWarehouseId;
  final String? fromWarehouseName;
  final String? toWarehouseId;
  final String? toWarehouseName;
  final String? productId;
  final String? productName;
  final double quantity;
  final String status;
  final String? reference;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, fromWarehouseId, fromWarehouseName, toWarehouseId, toWarehouseName,
        productId, productName, quantity, status, reference, createdAt,
      ];
}

class TrackingEvent extends Equatable {
  const TrackingEvent({
    required this.id,
    this.shipmentId,
    this.location,
    this.status,
    this.timestamp,
    this.description,
    this.createdAt,
  });

  final String id;
  final String? shipmentId;
  final String? location;
  final String? status;
  final DateTime? timestamp;
  final String? description;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, shipmentId, location, status, timestamp, description, createdAt,
      ];
}