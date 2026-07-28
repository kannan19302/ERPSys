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
