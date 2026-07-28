import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/product.dart';
import '../../domain/repositories/inventory_repository.dart';
import '../datasources/inventory_remote_datasource.dart';
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

  final InventoryRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  @override
  Future<Result<Cacheable<Paginated<Product>>>> listProducts(
    ListQuery query,
  ) async {
    try {
      final Paginated<ProductModel> page = await _remote.listProducts(query);

      await _cache.write(_tenantId, _listNamespace, query.cacheKey, <String, Object?>{
        'data': page.data.map((ProductModel p) => p.toJson()).toList(),
        'meta': page.meta.toJson(),
      });

      return Result<Cacheable<Paginated<Product>>>.ok(
        Cacheable<Paginated<Product>>(
          value: Paginated<Product>(data: page.data, meta: page.meta),
        ),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _listNamespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<Product>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<Product>>>.ok(
        Cacheable<Paginated<Product>>(
          value: Paginated<Product>.fromJson(
            cached.value,
            ProductModel.fromJson,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<Product>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<Product>> getProduct(String id) async {
    try {
      return Result<Product>.ok(await _remote.getProduct(id));
    } on Object catch (error) {
      return Result<Product>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<InventoryStats>> stats() async {
    try {
      final InventoryStatsModel stats = await _remote.stats();
      await _cache.write(_tenantId, _statsNamespace, 'current', stats.toJson());
      return Result<InventoryStats>.ok(stats);
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(_tenantId, _statsNamespace, 'current');
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
  Future<Result<Product>> createProduct(Map<String, dynamic> payload) async {
    try {
      final Product created = await _remote.createProduct(payload);
      // A write invalidates every cached page for this tenant's product list.
      await _cache.clearTenant(_tenantId);
      return Result<Product>.ok(created);
    } on Object catch (error) {
      return Result<Product>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Product>> updateProduct(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final Product updated = await _remote.updateProduct(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<Product>.ok(updated);
    } on Object catch (error) {
      return Result<Product>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteProduct(String id) async {
    try {
      await _remote.deleteProduct(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> adjustStock(Map<String, dynamic> payload) async {
    try {
      await _remote.adjustStock(payload);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }
}
