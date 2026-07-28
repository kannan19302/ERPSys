import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
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

  Future<Result<Product>> updateProduct(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteProduct(String id);
}
