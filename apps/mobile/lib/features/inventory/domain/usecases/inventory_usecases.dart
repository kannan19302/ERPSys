import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/inventory.dart';
import '../entities/product.dart';
import '../repositories/inventory_repository.dart';

class ListProductsUseCase
    extends UseCase<Cacheable<Paginated<Product>>, ListQuery> {
  const ListProductsUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Product>>>> call(ListQuery params) =>
      _repository.listProducts(params);
}

class GetProductUseCase extends UseCase<Product, String> {
  const GetProductUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Product>> call(String id) => _repository.getProduct(id);
}

class GetInventoryStatsUseCase extends UseCase<InventoryStats, NoParams> {
  const GetInventoryStatsUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<InventoryStats>> call(NoParams params) => _repository.stats();
}

class SaveProductParams {
  const SaveProductParams({required this.payload, this.id});

  /// Null for a create, set for an update.
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveProductUseCase extends UseCase<Product, SaveProductParams> {
  const SaveProductUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Product>> call(SaveProductParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createProduct(params.payload)
        : _repository.updateProduct(id, params.payload);
  }
}

class DeleteProductUseCase extends UseCase<void, String> {
  const DeleteProductUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteProduct(id);
}

class AdjustStockUseCase extends UseCase<void, Map<String, dynamic>> {
  const AdjustStockUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<void>> call(Map<String, dynamic> payload) =>
      _repository.adjustStock(payload);
}

// ── Warehouses ─────────────────────────────────────────────────────────────

class ListWarehousesUseCase
    extends UseCase<Cacheable<Paginated<Warehouse>>, ListQuery> {
  const ListWarehousesUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Warehouse>>>> call(ListQuery params) =>
      _repository.listWarehouses(params);
}

class GetWarehouseUseCase extends UseCase<Warehouse, String> {
  const GetWarehouseUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Warehouse>> call(String id) => _repository.getWarehouse(id);
}

class SaveWarehouseParams {
  const SaveWarehouseParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveWarehouseUseCase extends UseCase<Warehouse, SaveWarehouseParams> {
  const SaveWarehouseUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Warehouse>> call(SaveWarehouseParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createWarehouse(params.payload)
        : _repository.updateWarehouse(id, params.payload);
  }
}

class DeleteWarehouseUseCase extends UseCase<void, String> {
  const DeleteWarehouseUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteWarehouse(id);
}

// ── Product Categories ─────────────────────────────────────────────────────

class ListProductCategoriesUseCase
    extends UseCase<Cacheable<Paginated<ProductCategory>>, ListQuery> {
  const ListProductCategoriesUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<ProductCategory>>>> call(
    ListQuery params,
  ) =>
      _repository.listProductCategories(params);
}

class GetProductCategoryUseCase extends UseCase<ProductCategory, String> {
  const GetProductCategoryUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<ProductCategory>> call(String id) =>
      _repository.getProductCategory(id);
}

class SaveProductCategoryParams {
  const SaveProductCategoryParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveProductCategoryUseCase
    extends UseCase<ProductCategory, SaveProductCategoryParams> {
  const SaveProductCategoryUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<ProductCategory>> call(SaveProductCategoryParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createProductCategory(params.payload)
        : _repository.updateProductCategory(id, params.payload);
  }
}

class DeleteProductCategoryUseCase extends UseCase<void, String> {
  const DeleteProductCategoryUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<void>> call(String id) =>
      _repository.deleteProductCategory(id);
}

// ── Stock Levels ───────────────────────────────────────────────────────────

class ListStockLevelsUseCase
    extends UseCase<Cacheable<Paginated<StockLevel>>, ListQuery> {
  const ListStockLevelsUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<StockLevel>>>> call(ListQuery params) =>
      _repository.listStockLevels(params);
}

class GetStockLevelUseCase extends UseCase<StockLevel, String> {
  const GetStockLevelUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<StockLevel>> call(String id) => _repository.getStockLevel(id);
}

// ── Stock Movements ────────────────────────────────────────────────────────

class ListStockMovementsUseCase
    extends UseCase<Cacheable<Paginated<StockMovement>>, ListQuery> {
  const ListStockMovementsUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<StockMovement>>>> call(
    ListQuery params,
  ) =>
      _repository.listStockMovements(params);
}

class GetStockMovementUseCase extends UseCase<StockMovement, String> {
  const GetStockMovementUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<StockMovement>> call(String id) =>
      _repository.getStockMovement(id);
}

class CreateStockMovementUseCase
    extends UseCase<StockMovement, Map<String, dynamic>> {
  const CreateStockMovementUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<StockMovement>> call(Map<String, dynamic> params) =>
      _repository.createStockMovement(params);
}

// ── Reorder Rules ──────────────────────────────────────────────────────────

class ListReorderRulesUseCase
    extends UseCase<Cacheable<Paginated<ReorderRule>>, ListQuery> {
  const ListReorderRulesUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<ReorderRule>>>> call(ListQuery params) =>
      _repository.listReorderRules(params);
}

class GetReorderRuleUseCase extends UseCase<ReorderRule, String> {
  const GetReorderRuleUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<ReorderRule>> call(String id) =>
      _repository.getReorderRule(id);
}

class SaveReorderRuleParams {
  const SaveReorderRuleParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveReorderRuleUseCase
    extends UseCase<ReorderRule, SaveReorderRuleParams> {
  const SaveReorderRuleUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<ReorderRule>> call(SaveReorderRuleParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createReorderRule(params.payload)
        : _repository.updateReorderRule(id, params.payload);
  }
}

class DeleteReorderRuleUseCase extends UseCase<void, String> {
  const DeleteReorderRuleUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteReorderRule(id);
}

// ── Inventory Adjustments ──────────────────────────────────────────────────

class ListInventoryAdjustmentsUseCase
    extends UseCase<Cacheable<Paginated<InventoryAdjustment>>, ListQuery> {
  const ListInventoryAdjustmentsUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<InventoryAdjustment>>>> call(
    ListQuery params,
  ) =>
      _repository.listInventoryAdjustments(params);
}

class GetInventoryAdjustmentUseCase
    extends UseCase<InventoryAdjustment, String> {
  const GetInventoryAdjustmentUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<InventoryAdjustment>> call(String id) =>
      _repository.getInventoryAdjustment(id);
}

class CreateInventoryAdjustmentUseCase
    extends UseCase<InventoryAdjustment, Map<String, dynamic>> {
  const CreateInventoryAdjustmentUseCase(this._repository);

  final InventoryRepository _repository;

  @override
  Future<Result<InventoryAdjustment>> call(Map<String, dynamic> params) =>
      _repository.createInventoryAdjustment(params);
}
