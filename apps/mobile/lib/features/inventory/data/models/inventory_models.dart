import '../../../../core/error/exceptions.dart';
import '../../domain/entities/inventory.dart';

class WarehouseModel extends Warehouse {
  const WarehouseModel({
    required super.id,
    required super.name,
    super.address,
    super.city,
    super.country,
    super.capacity,
    super.usedCapacity,
    super.isActive,
    super.createdAt,
  });

  factory WarehouseModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Warehouse is missing its id');
    }
    return WarehouseModel(
      id: id,
      name: json['name'] as String? ?? '',
      address: json['address'] as String?,
      city: json['city'] as String?,
      country: json['country'] as String?,
      capacity: asDouble(json['capacity']),
      usedCapacity: asDouble(json['usedCapacity']),
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'address': address,
        'city': city,
        'country': country,
        'capacity': capacity,
        'usedCapacity': usedCapacity,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class ProductCategoryModel extends ProductCategory {
  const ProductCategoryModel({
    required super.id,
    required super.name,
    super.parentId,
    super.description,
    super.isActive,
    super.createdAt,
  });

  factory ProductCategoryModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('ProductCategory is missing its id');
    }
    return ProductCategoryModel(
      id: id,
      name: json['name'] as String? ?? '',
      parentId: json['parentId'] as String?,
      description: json['description'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'parentId': parentId,
        'description': description,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class StockLevelModel extends StockLevel {
  const StockLevelModel({
    required super.id,
    required super.productId,
    required super.warehouseId,
    super.quantity,
    super.reservedQuantity,
    super.availableQuantity,
    super.reorderPoint,
    super.createdAt,
  });

  factory StockLevelModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('StockLevel is missing its id');
    }
    return StockLevelModel(
      id: id,
      productId: json['productId'] as String? ?? '',
      warehouseId: json['warehouseId'] as String? ?? '',
      quantity: asDouble(json['quantity']),
      reservedQuantity: asDouble(json['reservedQuantity']),
      availableQuantity: asDouble(json['availableQuantity']),
      reorderPoint: asDouble(json['reorderPoint']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'warehouseId': warehouseId,
        'quantity': quantity,
        'reservedQuantity': reservedQuantity,
        'availableQuantity': availableQuantity,
        'reorderPoint': reorderPoint,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class StockMovementModel extends StockMovement {
  const StockMovementModel({
    required super.id,
    required super.productId,
    required super.warehouseId,
    required super.type,
    required super.quantity,
    super.reference,
    super.reason,
    super.createdAt,
  });

  factory StockMovementModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('StockMovement is missing its id');
    }
    return StockMovementModel(
      id: id,
      productId: json['productId'] as String? ?? '',
      warehouseId: json['warehouseId'] as String? ?? '',
      type: json['type'] as String? ?? 'IN',
      quantity: asDouble(json['quantity']),
      reference: json['reference'] as String?,
      reason: json['reason'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'warehouseId': warehouseId,
        'type': type,
        'quantity': quantity,
        'reference': reference,
        'reason': reason,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class ReorderRuleModel extends ReorderRule {
  const ReorderRuleModel({
    required super.id,
    required super.productId,
    required super.warehouseId,
    super.minStock,
    super.maxStock,
    super.leadTime,
    super.isActive,
    super.createdAt,
  });

  factory ReorderRuleModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('ReorderRule is missing its id');
    }
    return ReorderRuleModel(
      id: id,
      productId: json['productId'] as String? ?? '',
      warehouseId: json['warehouseId'] as String? ?? '',
      minStock: asDouble(json['minStock']),
      maxStock: asDouble(json['maxStock']),
      leadTime: asInt(json['leadTime']),
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'warehouseId': warehouseId,
        'minStock': minStock,
        'maxStock': maxStock,
        'leadTime': leadTime,
        'isActive': isActive,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class InventoryAdjustmentModel extends InventoryAdjustment {
  const InventoryAdjustmentModel({
    required super.id,
    required super.productId,
    required super.warehouseId,
    required super.type,
    required super.quantity,
    super.reason,
    super.reference,
    super.createdAt,
  });

  factory InventoryAdjustmentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('InventoryAdjustment is missing its id');
    }
    return InventoryAdjustmentModel(
      id: id,
      productId: json['productId'] as String? ?? '',
      warehouseId: json['warehouseId'] as String? ?? '',
      type: json['type'] as String? ?? 'ADJUST',
      quantity: asDouble(json['quantity']),
      reason: json['reason'] as String?,
      reference: json['reference'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'productId': productId,
        'warehouseId': warehouseId,
        'type': type,
        'quantity': quantity,
        'reason': reason,
        'reference': reference,
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
