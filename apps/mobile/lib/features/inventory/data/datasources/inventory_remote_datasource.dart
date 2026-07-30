import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/inventory_models.dart';
import '../models/product_model.dart';

abstract class InventoryRemoteDataSource {
  Future<Paginated<ProductModel>> listProducts(ListQuery query);

  Future<ProductModel> getProduct(String id);

  Future<InventoryStatsModel> stats();

  Future<ProductModel> createProduct(Map<String, dynamic> payload);

  Future<ProductModel> updateProduct(String id, Map<String, dynamic> payload);

  Future<void> deleteProduct(String id);

  Future<void> adjustStock(Map<String, dynamic> payload);

  // Warehouses
  Future<Paginated<WarehouseModel>> listWarehouses(ListQuery query);

  Future<WarehouseModel> getWarehouse(String id);

  Future<WarehouseModel> createWarehouse(Map<String, dynamic> payload);

  Future<WarehouseModel> updateWarehouse(
    String id,
    Map<String, dynamic> payload,
  );

  Future<void> deleteWarehouse(String id);

  // Product Categories
  Future<Paginated<ProductCategoryModel>> listProductCategories(
    ListQuery query,
  );

  Future<ProductCategoryModel> getProductCategory(String id);

  Future<ProductCategoryModel> createProductCategory(
    Map<String, dynamic> payload,
  );

  Future<ProductCategoryModel> updateProductCategory(
    String id,
    Map<String, dynamic> payload,
  );

  Future<void> deleteProductCategory(String id);

  // Stock Levels
  Future<Paginated<StockLevelModel>> listStockLevels(ListQuery query);

  Future<StockLevelModel> getStockLevel(String id);

  // Stock Movements
  Future<Paginated<StockMovementModel>> listStockMovements(ListQuery query);

  Future<StockMovementModel> getStockMovement(String id);

  Future<StockMovementModel> createStockMovement(Map<String, dynamic> payload);

  // Reorder Rules
  Future<Paginated<ReorderRuleModel>> listReorderRules(ListQuery query);

  Future<ReorderRuleModel> getReorderRule(String id);

  Future<ReorderRuleModel> createReorderRule(Map<String, dynamic> payload);

  Future<ReorderRuleModel> updateReorderRule(
    String id,
    Map<String, dynamic> payload,
  );

  Future<void> deleteReorderRule(String id);

  // Inventory Adjustments
  Future<Paginated<InventoryAdjustmentModel>> listInventoryAdjustments(
    ListQuery query,
  );

  Future<InventoryAdjustmentModel> getInventoryAdjustment(String id);

  Future<InventoryAdjustmentModel> createInventoryAdjustment(
    Map<String, dynamic> payload,
  );
}

class InventoryRemoteDataSourceImpl implements InventoryRemoteDataSource {
  const InventoryRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<ProductModel>> listProducts(ListQuery query) =>
      _client.getPaginated<ProductModel>(
        ApiPaths.products,
        query,
        ProductModel.fromJson,
      );

  @override
  Future<ProductModel> getProduct(String id) async =>
      ProductModel.fromJson(await _client.getObject(ApiPaths.product(id)));

  @override
  Future<InventoryStatsModel> stats() async =>
      InventoryStatsModel.fromJson(
        await _client.getObject(ApiPaths.productStats),
      );

  @override
  Future<ProductModel> createProduct(Map<String, dynamic> payload) async =>
      ProductModel.fromJson(
        await _client.post(ApiPaths.products, body: payload),
      );

  @override
  Future<ProductModel> updateProduct(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      ProductModel.fromJson(
        await _client.patch(ApiPaths.product(id), body: payload),
      );

  @override
  Future<void> deleteProduct(String id) =>
      _client.delete(ApiPaths.product(id));

  @override
  Future<void> adjustStock(Map<String, dynamic> payload) async {
    await _client.patch(ApiPaths.stockAdjust, body: payload);
  }

  // ── Warehouses ─────────────────────────────────────────────────────────

  @override
  Future<Paginated<WarehouseModel>> listWarehouses(ListQuery query) =>
      _client.getPaginated<WarehouseModel>(
        ApiPaths.warehouses,
        query,
        WarehouseModel.fromJson,
      );

  @override
  Future<WarehouseModel> getWarehouse(String id) async =>
      WarehouseModel.fromJson(
        await _client.getObject(ApiPaths.warehouse(id)),
      );

  @override
  Future<WarehouseModel> createWarehouse(Map<String, dynamic> payload) async =>
      WarehouseModel.fromJson(
        await _client.post(ApiPaths.warehouses, body: payload),
      );

  @override
  Future<WarehouseModel> updateWarehouse(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      WarehouseModel.fromJson(
        await _client.patch(ApiPaths.warehouse(id), body: payload),
      );

  @override
  Future<void> deleteWarehouse(String id) =>
      _client.delete(ApiPaths.warehouse(id));

  // ── Product Categories ─────────────────────────────────────────────────

  @override
  Future<Paginated<ProductCategoryModel>> listProductCategories(
    ListQuery query,
  ) =>
      _client.getPaginated<ProductCategoryModel>(
        ApiPaths.productCategories,
        query,
        ProductCategoryModel.fromJson,
      );

  @override
  Future<ProductCategoryModel> getProductCategory(String id) async =>
      ProductCategoryModel.fromJson(
        await _client.getObject(ApiPaths.productCategory(id)),
      );

  @override
  Future<ProductCategoryModel> createProductCategory(
    Map<String, dynamic> payload,
  ) async =>
      ProductCategoryModel.fromJson(
        await _client.post(ApiPaths.productCategories, body: payload),
      );

  @override
  Future<ProductCategoryModel> updateProductCategory(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      ProductCategoryModel.fromJson(
        await _client.patch(ApiPaths.productCategory(id), body: payload),
      );

  @override
  Future<void> deleteProductCategory(String id) =>
      _client.delete(ApiPaths.productCategory(id));

  // ── Stock Levels ───────────────────────────────────────────────────────

  @override
  Future<Paginated<StockLevelModel>> listStockLevels(ListQuery query) =>
      _client.getPaginated<StockLevelModel>(
        ApiPaths.stockLevels,
        query,
        StockLevelModel.fromJson,
      );

  @override
  Future<StockLevelModel> getStockLevel(String id) async =>
      StockLevelModel.fromJson(
        await _client.getObject(ApiPaths.stockLevel(id)),
      );

  // ── Stock Movements ────────────────────────────────────────────────────

  @override
  Future<Paginated<StockMovementModel>> listStockMovements(
    ListQuery query,
  ) =>
      _client.getPaginated<StockMovementModel>(
        ApiPaths.stockMovements,
        query,
        StockMovementModel.fromJson,
      );

  @override
  Future<StockMovementModel> getStockMovement(String id) async =>
      StockMovementModel.fromJson(
        await _client.getObject(ApiPaths.stockMovement(id)),
      );

  @override
  Future<StockMovementModel> createStockMovement(
    Map<String, dynamic> payload,
  ) async =>
      StockMovementModel.fromJson(
        await _client.post(ApiPaths.stockMovements, body: payload),
      );

  // ── Reorder Rules ──────────────────────────────────────────────────────

  @override
  Future<Paginated<ReorderRuleModel>> listReorderRules(ListQuery query) =>
      _client.getPaginated<ReorderRuleModel>(
        ApiPaths.reorderRules,
        query,
        ReorderRuleModel.fromJson,
      );

  @override
  Future<ReorderRuleModel> getReorderRule(String id) async =>
      ReorderRuleModel.fromJson(
        await _client.getObject(ApiPaths.reorderRule(id)),
      );

  @override
  Future<ReorderRuleModel> createReorderRule(
    Map<String, dynamic> payload,
  ) async =>
      ReorderRuleModel.fromJson(
        await _client.post(ApiPaths.reorderRules, body: payload),
      );

  @override
  Future<ReorderRuleModel> updateReorderRule(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      ReorderRuleModel.fromJson(
        await _client.patch(ApiPaths.reorderRule(id), body: payload),
      );

  @override
  Future<void> deleteReorderRule(String id) =>
      _client.delete(ApiPaths.reorderRule(id));

  // ── Inventory Adjustments ──────────────────────────────────────────────

  @override
  Future<Paginated<InventoryAdjustmentModel>> listInventoryAdjustments(
    ListQuery query,
  ) =>
      _client.getPaginated<InventoryAdjustmentModel>(
        ApiPaths.inventoryAdjustments,
        query,
        InventoryAdjustmentModel.fromJson,
      );

  @override
  Future<InventoryAdjustmentModel> getInventoryAdjustment(String id) async =>
      InventoryAdjustmentModel.fromJson(
        await _client.getObject(ApiPaths.inventoryAdjustment(id)),
      );

  @override
  Future<InventoryAdjustmentModel> createInventoryAdjustment(
    Map<String, dynamic> payload,
  ) async =>
      InventoryAdjustmentModel.fromJson(
        await _client.post(ApiPaths.inventoryAdjustments, body: payload),
      );
}
