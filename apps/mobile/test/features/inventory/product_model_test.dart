import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/error/exceptions.dart';
import 'package:unerp_mobile/features/inventory/data/models/product_model.dart';

void main() {
  group('ProductModel.fromJson', () {
    test('parses the projection returned by getProducts()', () {
      // Shape from apps/api/src/modules/inventory/inventory-products.service.ts
      final ProductModel product = ProductModel.fromJson(<String, dynamic>{
        'id': 'prod-1',
        'sku': 'SKU-001',
        'name': 'Widget',
        'description': 'A widget',
        'type': 'GOODS',
        'category': 'Hardware',
        'unit': 'EACH',
        'costPrice': 10.5,
        'sellPrice': 15.99,
        'isActive': true,
      });
      expect(product.sku, 'SKU-001');
      expect(product.costPrice, 10.5);
      expect(product.sellPrice, 15.99);
    });

    test('accepts Prisma Decimal serialised as a numeric string', () {
      final ProductModel product = ProductModel.fromJson(<String, dynamic>{
        'id': 'prod-1',
        'sku': 'SKU-001',
        'name': 'Widget',
        'type': 'GOODS',
        'unit': 'EACH',
        'costPrice': '10.50',
        'sellPrice': '15.99',
        'isActive': true,
      });
      expect(product.costPrice, 10.5);
      expect(product.sellPrice, 15.99);
    });

    test('throws ParseException when id is missing', () {
      expect(
        () => ProductModel.fromJson(<String, dynamic>{'sku': 'x'}),
        throwsA(isA<ParseException>()),
      );
    });

    test('defaults type/unit/isActive when absent', () {
      final ProductModel product = ProductModel.fromJson(<String, dynamic>{'id': 'p1'});
      expect(product.type, 'GOODS');
      expect(product.unit, 'EACH');
      expect(product.isActive, isTrue);
    });

    test('margin and marginPercent are derived, not stored', () {
      final ProductModel product = ProductModel.fromJson(<String, dynamic>{
        'id': 'p1',
        'costPrice': 40,
        'sellPrice': 100,
      });
      expect(product.margin, 60);
      expect(product.marginPercent, 60);
    });

    test('marginPercent is null when sellPrice is zero (no divide-by-zero)', () {
      final ProductModel product = ProductModel.fromJson(<String, dynamic>{
        'id': 'p1',
        'costPrice': 10,
        'sellPrice': 0,
      });
      expect(product.marginPercent, isNull);
    });

    test('round-trips through toJson', () {
      final ProductModel original = ProductModel.fromJson(<String, dynamic>{
        'id': 'p1',
        'sku': 'S1',
        'name': 'N',
        'type': 'SERVICE',
        'unit': 'HOUR',
        'costPrice': 1,
        'sellPrice': 2,
        'isActive': false,
      });
      final ProductModel restored = ProductModel.fromJson(original.toJson());
      expect(restored.sku, original.sku);
      expect(restored.isActive, isFalse);
    });
  });

  group('InventoryStatsModel.fromJson', () {
    test('parses getInventoryStats() output', () {
      final InventoryStatsModel stats = InventoryStatsModel.fromJson(<String, dynamic>{
        'totalProducts': 120,
        'activeProducts': 100,
        'totalWarehouses': 3,
        'lowStockItems': 7,
      });
      expect(stats.totalProducts, 120);
      expect(stats.lowStockItems, 7);
    });

    test('coerces numeric strings defensively', () {
      final InventoryStatsModel stats = InventoryStatsModel.fromJson(<String, dynamic>{
        'totalProducts': '120',
        'activeProducts': '100',
        'totalWarehouses': '3',
        'lowStockItems': '7',
      });
      expect(stats.totalProducts, 120);
    });
  });
}
