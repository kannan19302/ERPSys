import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/inventory.dart';
import '../../domain/entities/product.dart';
import '../../domain/repositories/inventory_repository.dart';
import '../datasources/inventory_remote_datasource.dart';
import '../models/inventory_models.dart';
import '../models/product_model.dart';

/// Network-first with a tenant-scoped fallback cache.
///
/// A successful read is cached; a *connectivity* failure falls back to that
/// cache. An API error (403, 404, 500) never falls back — showing stale rows
/// after a permission revocation or an entitlement change would be wrong.
class InventoryRepositoryImpl implements InventoryRepository {
  const InventoryRepositoryImpl({
    required InventoryRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _listNamespace = 'inventory.products';
  static const String _statsNamespace = 'inventory.stats';
  static const String _warehousesNamespace = 'inventory.warehouses';
  static const String _categoriesNamespace = 'inventory.categories';
  static const String _stockLevelsNamespace = 'inventory.stock-levels';
  static const String _stockMovementsNamespace = 'inventory.stock-movements';
  static const String _reorderRulesNamespace = 'inventory.reorder-rules';
  static const String _adjustmentsNamespace = 'inventory.adjustments';

  final InventoryRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  // ── Generic helpers ──────────────────────────────────────────────────────

  Future<Result<Cacheable<Paginated<T>>>> _cachedPaginated<T>({
    required String namespace,
    required ListQuery query,
    required Future<Paginated<T>> Function() fetch,
    required T Function(Map<String, dynamic>) fromJson,
  }) async {
    try {
      final Paginated<T> page = await fetch();

      await _cache.write(
        _tenantId,
        namespace,
        query.cacheKey,
        <String, Object?>{
          'data': (page.data as List<Object>)
              .map((Object item) => (item as dynamic).toJson() as Map<String, dynamic>)
              .toList(),
          'meta': page.meta.toJson(),
        },
      );

      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        namespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  Future<Result<T>> _fetchOrError<T>(
    Future<T> Function() fetch,
  ) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _mutateAndInvalidate<T>(
    Future<T> Function() mutate,
  ) async {
    try {
      final T result = await mutate();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _deleteAndInvalidate(
    Future<void> Function() delete,
  ) async {
    try {
      await delete();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  // ── Products ─────────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Product>>>> listProducts(
    ListQuery query,
  ) =>
      _cachedPaginated<Product>(
        namespace: _listNamespace,
        query: query,
        fetch: () => _remote.listProducts(query),
        fromJson: ProductModel.fromJson,
      );

  @override
  Future<Result<Product>> getProduct(String id) =>
      _fetchOrError(() => _remote.getProduct(id));

  @override
  Future<Result<InventoryStats>> stats() async {
    try {
      final InventoryStatsModel stats = await _remote.stats();
      await _cache.write(
        _tenantId,
        _statsNamespace,
        'current',
        stats.toJson(),
      );
      return Result<InventoryStats>.ok(stats);
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _statsNamespace,
        'current',
      );
      if (cached == null) {
        return Result<InventoryStats>.err(mapExceptionToFailure(error));
      }
      return Result<InventoryStats>.ok(
        InventoryStatsModel.fromJson(cached.value),
      );
    } on Object catch (error) {
      return Result<InventoryStats>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Product>> createProduct(Map<String, dynamic> payload) =>
      _mutateAndInvalidate(() => _remote.createProduct(payload));

  @override
  Future<Result<Product>> updateProduct(
    String id,
    Map<String, dynamic> payload,
  ) =>
      _mutateAndInvalidate(() => _remote.updateProduct(id, payload));

  @override
  Future<Result<void>> deleteProduct(String id) =>
      _deleteAndInvalidate(() => _remote.deleteProduct(id));

  @override
  Future<Result<void>> adjustStock(Map<String, dynamic> payload) =>
      _mutateAndInvalidate(() async {
        await _remote.adjustStock(payload);
        return;
      });

  // ── Warehouses ───────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Warehouse>>>> listWarehouses(
    ListQuery query,
  ) =>
      _cachedPaginated<Warehouse>(
        namespace: _warehousesNamespace,
        query: query,
        fetch: () => _remote.listWarehouses(query),
        fromJson: WarehouseModel.fromJson,
      );

  @override
  Future<Result<Warehouse>> getWarehouse(String id) =>
      _fetchOrError(() => _remote.getWarehouse(id));

  @override
  Future<Result<Warehouse>> createWarehouse(Map<String, dynamic> payload) =>
      _mutateAndInvalidate(() => _remote.createWarehouse(payload));

  @override
  Future<Result<Warehouse>> updateWarehouse(
    String id,
    Map<String, dynamic> payload,
  ) =>
      _mutateAndInvalidate(() => _remote.updateWarehouse(id, payload));

  @override
  Future<Result<void>> deleteWarehouse(String id) =>
      _deleteAndInvalidate(() => _remote.deleteWarehouse(id));

  // ── Product Categories ───────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<ProductCategory>>>> listProductCategories(
    ListQuery query,
  ) =>
      _cachedPaginated<ProductCategory>(
        namespace: _categoriesNamespace,
        query: query,
        fetch: () => _remote.listProductCategories(query),
        fromJson: ProductCategoryModel.fromJson,
      );

  @override
  Future<Result<ProductCategory>> getProductCategory(String id) =>
      _fetchOrError(() => _remote.getProductCategory(id));

  @override
  Future<Result<ProductCategory>> createProductCategory(
    Map<String, dynamic> payload,
  ) =>
      _mutateAndInvalidate(() => _remote.createProductCategory(payload));

  @override
  Future<Result<ProductCategory>> updateProductCategory(
    String id,
    Map<String, dynamic> payload,
  ) =>
      _mutateAndInvalidate(
        () => _remote.updateProductCategory(id, payload),
      );

  @override
  Future<Result<void>> deleteProductCategory(String id) =>
      _deleteAndInvalidate(() => _remote.deleteProductCategory(id));

  // ── Stock Levels ─────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<StockLevel>>>> listStockLevels(
    ListQuery query,
  ) =>
      _cachedPaginated<StockLevel>(
        namespace: _stockLevelsNamespace,
        query: query,
        fetch: () => _remote.listStockLevels(query),
        fromJson: StockLevelModel.fromJson,
      );

  @override
  Future<Result<StockLevel>> getStockLevel(String id) =>
      _fetchOrError(() => _remote.getStockLevel(id));

  // ── Stock Movements ──────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<StockMovement>>>> listStockMovements(
    ListQuery query,
  ) =>
      _cachedPaginated<StockMovement>(
        namespace: _stockMovementsNamespace,
        query: query,
        fetch: () => _remote.listStockMovements(query),
        fromJson: StockMovementModel.fromJson,
      );

  @override
  Future<Result<StockMovement>> getStockMovement(String id) =>
      _fetchOrError(() => _remote.getStockMovement(id));

  @override
  Future<Result<StockMovement>> createStockMovement(
    Map<String, dynamic> payload,
  ) =>
      _mutateAndInvalidate(() => _remote.createStockMovement(payload));

  // ── Reorder Rules ────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<ReorderRule>>>> listReorderRules(
    ListQuery query,
  ) =>
      _cachedPaginated<ReorderRule>(
        namespace: _reorderRulesNamespace,
        query: query,
        fetch: () => _remote.listReorderRules(query),
        fromJson: ReorderRuleModel.fromJson,
      );

  @override
  Future<Result<ReorderRule>> getReorderRule(String id) =>
      _fetchOrError(() => _remote.getReorderRule(id));

  @override
  Future<Result<ReorderRule>> createReorderRule(
    Map<String, dynamic> payload,
  ) =>
      _mutateAndInvalidate(() => _remote.createReorderRule(payload));

  @override
  Future<Result<ReorderRule>> updateReorderRule(
    String id,
    Map<String, dynamic> payload,
  ) =>
      _mutateAndInvalidate(() => _remote.updateReorderRule(id, payload));

  @override
  Future<Result<void>> deleteReorderRule(String id) =>
      _deleteAndInvalidate(() => _remote.deleteReorderRule(id));

  // ── Inventory Adjustments ────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<InventoryAdjustment>>>>
      listInventoryAdjustments(ListQuery query) =>
          _cachedPaginated<InventoryAdjustment>(
            namespace: _adjustmentsNamespace,
            query: query,
            fetch: () => _remote.listInventoryAdjustments(query),
            fromJson: InventoryAdjustmentModel.fromJson,
          );

  @override
  Future<Result<InventoryAdjustment>> getInventoryAdjustment(String id) =>
      _fetchOrError(() => _remote.getInventoryAdjustment(id));

  @override
  Future<Result<InventoryAdjustment>> createInventoryAdjustment(
    Map<String, dynamic> payload,
  ) =>
      _mutateAndInvalidate(
        () => _remote.createInventoryAdjustment(payload),
      );
}
