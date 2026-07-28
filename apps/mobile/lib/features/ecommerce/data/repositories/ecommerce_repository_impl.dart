import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/ecommerce.dart';
import '../../domain/repositories/ecommerce_repository.dart';
import '../datasources/ecommerce_remote_data_source.dart';
import '../models/ecommerce_models.dart';

class EcommerceRepositoryImpl implements EcommerceRepository {
  const EcommerceRepositoryImpl({
    required EcommerceRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _productNamespace = 'ecommerce.products';
  static const String _categoryNamespace = 'ecommerce.categories';
  static const String _orderNamespace = 'ecommerce.orders';

  final EcommerceRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<EcommerceProduct>>>> listProducts(ListQuery q) =>
      _paginated(_productNamespace, q, () => _remote.listProducts(q), EcommerceProductModel.fromJson);

  @override
  Future<Result<EcommerceProduct>> getProduct(String id) => _single(() => _remote.getProduct(id));

  @override
  Future<Result<EcommerceProduct>> createProduct(Map<String, dynamic> p) =>
      _write(() => _remote.createProduct(p));

  @override
  Future<Result<EcommerceProduct>> updateProduct(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateProduct(id, p));

  @override
  Future<Result<void>> deleteProduct(String id) => _delete(() => _remote.deleteProduct(id));

  @override
  Future<Result<Cacheable<Paginated<EcommerceCategory>>>> listCategories(ListQuery q) =>
      _paginated(_categoryNamespace, q, () => _remote.listCategories(q), EcommerceCategoryModel.fromJson);

  @override
  Future<Result<EcommerceCategory>> getCategory(String id) => _single(() => _remote.getCategory(id));

  @override
  Future<Result<EcommerceCategory>> createCategory(Map<String, dynamic> p) =>
      _write(() => _remote.createCategory(p));

  @override
  Future<Result<EcommerceCategory>> updateCategory(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateCategory(id, p));

  @override
  Future<Result<void>> deleteCategory(String id) => _delete(() => _remote.deleteCategory(id));

  @override
  Future<Result<Cacheable<Paginated<EcommerceOrder>>>> listOrders(ListQuery q) =>
      _paginated(_orderNamespace, q, () => _remote.listOrders(q), EcommerceOrderModel.fromJson);

  @override
  Future<Result<EcommerceOrder>> getOrder(String id) => _single(() => _remote.getOrder(id));

  @override
  Future<Result<EcommerceOrder>> updateOrderStatus(String id, String status) =>
      _write(() => _remote.updateOrderStatus(id, status));

  @override
  Future<Result<List<EcommerceCartItem>>> getCart() => _single(() async {
        final items = await _remote.getCart();
        return items;
      });

  @override
  Future<Result<EcommerceCartItem>> addToCart(Map<String, dynamic> p) =>
      _write(() => _remote.addToCart(p));

  @override
  Future<Result<EcommerceCartItem>> updateCartItem(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateCartItem(id, p));

  @override
  Future<Result<void>> removeFromCart(String id) => _delete(() => _remote.removeFromCart(id));

  @override
  Future<Result<void>> clearCart() => _delete(() => _remote.clearCart());
}