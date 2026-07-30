import 'package:equatable/equatable.dart';

class Warehouse extends Equatable {
  const Warehouse({
    required this.id,
    required this.name,
    this.address,
    this.city,
    this.country,
    this.capacity = 0,
    this.usedCapacity = 0,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? address;
  final String? city;
  final String? country;
  final double capacity;
  final double usedCapacity;
  final bool isActive;
  final DateTime? createdAt;

  double get utilizationPercent =>
      capacity == 0 ? 0 : (usedCapacity / capacity) * 100;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        address,
        city,
        country,
        capacity,
        usedCapacity,
        isActive,
        createdAt,
      ];
}

class ProductCategory extends Equatable {
  const ProductCategory({
    required this.id,
    required this.name,
    this.parentId,
    this.description,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? parentId;
  final String? description;
  final bool isActive;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        parentId,
        description,
        isActive,
        createdAt,
      ];
}

class StockLevel extends Equatable {
  const StockLevel({
    required this.id,
    required this.productId,
    required this.warehouseId,
    this.quantity = 0,
    this.reservedQuantity = 0,
    this.availableQuantity = 0,
    this.reorderPoint = 0,
    this.createdAt,
  });

  final String id;
  final String productId;
  final String warehouseId;
  final double quantity;
  final double reservedQuantity;
  final double availableQuantity;
  final double reorderPoint;
  final DateTime? createdAt;

  bool get isLowStock => availableQuantity <= reorderPoint;

  @override
  List<Object?> get props => <Object?>[
        id,
        productId,
        warehouseId,
        quantity,
        reservedQuantity,
        availableQuantity,
        reorderPoint,
        createdAt,
      ];
}

class StockMovement extends Equatable {
  const StockMovement({
    required this.id,
    required this.productId,
    required this.warehouseId,
    required this.type,
    required this.quantity,
    this.reference,
    this.reason,
    this.createdAt,
  });

  final String id;
  final String productId;
  final String warehouseId;
  final String type;
  final double quantity;
  final String? reference;
  final String? reason;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        productId,
        warehouseId,
        type,
        quantity,
        reference,
        reason,
        createdAt,
      ];
}

class ReorderRule extends Equatable {
  const ReorderRule({
    required this.id,
    required this.productId,
    required this.warehouseId,
    this.minStock = 0,
    this.maxStock = 0,
    this.leadTime = 0,
    this.isActive = true,
    this.createdAt,
  });

  final String id;
  final String productId;
  final String warehouseId;
  final double minStock;
  final double maxStock;
  final int leadTime;
  final bool isActive;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        productId,
        warehouseId,
        minStock,
        maxStock,
        leadTime,
        isActive,
        createdAt,
      ];
}

class InventoryAdjustment extends Equatable {
  const InventoryAdjustment({
    required this.id,
    required this.productId,
    required this.warehouseId,
    required this.type,
    required this.quantity,
    this.reason,
    this.reference,
    this.createdAt,
  });

  final String id;
  final String productId;
  final String warehouseId;
  final String type;
  final double quantity;
  final String? reason;
  final String? reference;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        productId,
        warehouseId,
        type,
        quantity,
        reason,
        reference,
        createdAt,
      ];
}
