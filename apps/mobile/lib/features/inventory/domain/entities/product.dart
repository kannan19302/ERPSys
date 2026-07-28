import 'package:equatable/equatable.dart';

/// A product as projected by `GET /inventory/products`.
///
/// The list endpoint returns a deliberately narrow projection (see
/// `getProducts()` in apps/api/src/modules/inventory/inventory-products.service.ts);
/// the detail endpoint returns the full row, so the extra fields are nullable.
class Product extends Equatable {
  const Product({
    required this.id,
    required this.sku,
    required this.name,
    required this.type,
    required this.unit,
    required this.costPrice,
    required this.sellPrice,
    required this.isActive,
    this.description,
    this.category,
    this.barcode,
    this.brand,
    this.status,
    this.updatedAt,
  });

  final String id;
  final String sku;
  final String name;
  final String? description;

  /// GOODS, SERVICE, CONSUMABLE, RAW_MATERIAL, FINISHED_GOOD, …
  final String type;
  final String? category;
  final String unit;
  final double costPrice;
  final double sellPrice;
  final bool isActive;
  final String? barcode;
  final String? brand;
  final String? status;
  final DateTime? updatedAt;

  /// Absolute unit margin. Presentation formats it; the value stays numeric.
  double get margin => sellPrice - costPrice;

  double? get marginPercent =>
      sellPrice == 0 ? null : (margin / sellPrice) * 100;

  @override
  List<Object?> get props => <Object?>[
        id,
        sku,
        name,
        description,
        type,
        category,
        unit,
        costPrice,
        sellPrice,
        isActive,
        barcode,
        brand,
        status,
        updatedAt,
      ];
}

/// `GET /inventory/products/stats`
class InventoryStats extends Equatable {
  const InventoryStats({
    required this.totalProducts,
    required this.activeProducts,
    required this.totalWarehouses,
    required this.lowStockItems,
  });

  const InventoryStats.zero()
      : totalProducts = 0,
        activeProducts = 0,
        totalWarehouses = 0,
        lowStockItems = 0;

  final int totalProducts;
  final int activeProducts;
  final int totalWarehouses;
  final int lowStockItems;

  @override
  List<Object?> get props =>
      <Object?>[totalProducts, activeProducts, totalWarehouses, lowStockItems];
}
