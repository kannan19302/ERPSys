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
