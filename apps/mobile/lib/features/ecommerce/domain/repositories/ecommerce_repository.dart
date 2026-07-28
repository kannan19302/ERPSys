import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/ecommerce.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class EcommerceRepository {
  Future<Result<Cacheable<Paginated<EcommerceProduct>>>> listProducts(ListQuery query);
  Future<Result<EcommerceProduct>> getProduct(String id);
  Future<Result<EcommerceProduct>> createProduct(Map<String, dynamic> payload);
  Future<Result<EcommerceProduct>> updateProduct(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteProduct(String id);

  Future<Result<Cacheable<Paginated<EcommerceCategory>>>> listCategories(ListQuery query);
  Future<Result<EcommerceCategory>> getCategory(String id);
  Future<Result<EcommerceCategory>> createCategory(Map<String, dynamic> payload);
  Future<Result<EcommerceCategory>> updateCategory(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteCategory(String id);

  Future<Result<Cacheable<Paginated<EcommerceOrder>>>> listOrders(ListQuery query);
  Future<Result<EcommerceOrder>> getOrder(String id);
  Future<Result<EcommerceOrder>> updateOrderStatus(String id, String status);

  Future<Result<List<EcommerceCartItem>>> getCart();
  Future<Result<EcommerceCartItem>> addToCart(Map<String, dynamic> payload);
  Future<Result<EcommerceCartItem>> updateCartItem(String id, Map<String, dynamic> payload);
  Future<Result<void>> removeFromCart(String id);
  Future<Result<void>> clearCart();
}