import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/inventory.dart';
import '../entities/product.dart';

/// Result of a read that may have been served from the offline cache.
class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});

  final T value;

  /// Non-null when the payload came from the cache rather than the network.
  final DateTime? cachedAt;

  bool get isFromCache => cachedAt != null;
}

abstract class InventoryRepository {
  /// Server-paginated product list (`GET /inventory/products`).
  Future<Result<Cacheable<Paginated<Product>>>> listProducts(ListQuery query);

  Future<Result<Product>> getProduct(String id);

  Future<Result<InventoryStats>> stats();

  Future<Result<Product>> createProduct(Map<String, dynamic> payload);

  Future<Result<Product>> updateProduct(
    String id,
    Map<String, dynamic> payload,
  );

  Future<Result<void>> deleteProduct(String id);

  Future<Result<void>> adjustStock(Map<String, dynamic> payload);

  // ── Warehouses ─────────────────────────────────────────────────────────

  Future<Result<Cacheable<Paginated<Warehouse>>>> listWarehouses(
    ListQuery query,
  );

  Future<Result<Warehouse>> getWarehouse(String id);

  Future<Result<Warehouse>> createWarehouse(Map<String, dynamic> payload);

  Future<Result<Warehouse>> updateWarehouse(
    String id,
    Map<String, dynamic> payload,
  );

  Future<Result<void>> deleteWarehouse(String id);

  // ── Product Categories ─────────────────────────────────────────────────

  Future<Result<Cacheable<Paginated<ProductCategory>>>> listProductCategories(
    ListQuery query,
  );

  Future<Result<ProductCategory>> getProductCategory(String id);

  Future<Result<ProductCategory>> createProductCategory(
    Map<String, dynamic> payload,
  );

  Future<Result<ProductCategory>> updateProductCategory(
    String id,
    Map<String, dynamic> payload,
  );

  Future<Result<void>> deleteProductCategory(String id);

  // ── Stock Levels ───────────────────────────────────────────────────────

  Future<Result<Cacheable<Paginated<StockLevel>>>> listStockLevels(
    ListQuery query,
  );

  Future<Result<StockLevel>> getStockLevel(String id);

  // ── Stock Movements ────────────────────────────────────────────────────

  Future<Result<Cacheable<Paginated<StockMovement>>>> listStockMovements(
    ListQuery query,
  );

  Future<Result<StockMovement>> getStockMovement(String id);

  Future<Result<StockMovement>> createStockMovement(
    Map<String, dynamic> payload,
  );

  // ── Reorder Rules ──────────────────────────────────────────────────────

  Future<Result<Cacheable<Paginated<ReorderRule>>>> listReorderRules(
    ListQuery query,
  );

  Future<Result<ReorderRule>> getReorderRule(String id);

  Future<Result<ReorderRule>> createReorderRule(Map<String, dynamic> payload);

  Future<Result<ReorderRule>> updateReorderRule(
    String id,
    Map<String, dynamic> payload,
  );

  Future<Result<void>> deleteReorderRule(String id);

  // ── Inventory Adjustments ──────────────────────────────────────────────

  Future<Result<Cacheable<Paginated<InventoryAdjustment>>>>
      listInventoryAdjustments(ListQuery query);

  Future<Result<InventoryAdjustment>> getInventoryAdjustment(String id);

  Future<Result<InventoryAdjustment>> createInventoryAdjustment(
    Map<String, dynamic> payload,
  );
}
