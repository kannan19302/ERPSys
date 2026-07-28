import '../../../../core/error/exceptions.dart';
import '../../domain/entities/product.dart';

class ProductModel extends Product {
  const ProductModel({
    required super.id,
    required super.sku,
    required super.name,
    required super.type,
    required super.unit,
    required super.costPrice,
    required super.sellPrice,
    required super.isActive,
    super.description,
    super.category,
    super.barcode,
    super.brand,
    super.status,
    super.updatedAt,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Product is missing its id');
    }
    return ProductModel(
      id: id,
      sku: json['sku'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      type: json['type'] as String? ?? 'GOODS',
      category: json['category'] as String?,
      unit: json['unit'] as String? ?? 'EACH',
      // Prisma Decimal columns arrive as a number or a string depending on the
      // serialiser in play — accept both rather than assuming one.
      costPrice: asDouble(json['costPrice']),
      sellPrice: asDouble(json['sellPrice']),
      isActive: json['isActive'] as bool? ?? true,
      barcode: json['barcode'] as String?,
      brand: json['brand'] as String?,
      status: json['status'] as String?,
      updatedAt: DateTime.tryParse('${json['updatedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'sku': sku,
        'name': name,
        'description': description,
        'type': type,
        'category': category,
        'unit': unit,
        'costPrice': costPrice,
        'sellPrice': sellPrice,
        'isActive': isActive,
        'barcode': barcode,
        'brand': brand,
        'status': status,
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

class InventoryStatsModel extends InventoryStats {
  const InventoryStatsModel({
    required super.totalProducts,
    required super.activeProducts,
    required super.totalWarehouses,
    required super.lowStockItems,
  });

  factory InventoryStatsModel.fromJson(Map<String, dynamic> json) =>
      InventoryStatsModel(
        totalProducts: asInt(json['totalProducts']),
        activeProducts: asInt(json['activeProducts']),
        totalWarehouses: asInt(json['totalWarehouses']),
        lowStockItems: asInt(json['lowStockItems']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'totalProducts': totalProducts,
        'activeProducts': activeProducts,
        'totalWarehouses': totalWarehouses,
        'lowStockItems': lowStockItems,
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
