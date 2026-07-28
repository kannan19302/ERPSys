import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/ecommerce_models.dart';

abstract class EcommerceRemoteDataSource {
  Future<Paginated<EcommerceProductModel>> listProducts(ListQuery query);
  Future<EcommerceProductModel> getProduct(String id);
  Future<EcommerceProductModel> createProduct(Map<String, dynamic> payload);
  Future<EcommerceProductModel> updateProduct(String id, Map<String, dynamic> payload);
  Future<void> deleteProduct(String id);

  Future<Paginated<EcommerceCategoryModel>> listCategories(ListQuery query);
  Future<EcommerceCategoryModel> getCategory(String id);
  Future<EcommerceCategoryModel> createCategory(Map<String, dynamic> payload);
  Future<EcommerceCategoryModel> updateCategory(String id, Map<String, dynamic> payload);
  Future<void> deleteCategory(String id);

  Future<Paginated<EcommerceOrderModel>> listOrders(ListQuery query);
  Future<EcommerceOrderModel> getOrder(String id);
  Future<EcommerceOrderModel> updateOrderStatus(String id, String status);

  Future<List<EcommerceCartItemModel>> getCart();
  Future<EcommerceCartItemModel> addToCart(Map<String, dynamic> payload);
  Future<EcommerceCartItemModel> updateCartItem(String id, Map<String, dynamic> payload);
  Future<void> removeFromCart(String id);
  Future<void> clearCart();
}

class EcommerceRemoteDataSourceImpl implements EcommerceRemoteDataSource {
  const EcommerceRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<EcommerceProductModel>> listProducts(ListQuery query) =>
      _client.getPaginated<EcommerceProductModel>(
        ApiPaths.ecommerceProducts, query, EcommerceProductModel.fromJson);

  @override
  Future<EcommerceProductModel> getProduct(String id) async =>
      EcommerceProductModel.fromJson(
        await _client.getObject(ApiPaths.ecommerceProduct(id)));

  @override
  Future<EcommerceProductModel> createProduct(Map<String, dynamic> payload) async =>
      EcommerceProductModel.fromJson(
        await _client.post(ApiPaths.ecommerceProducts, body: payload));

  @override
  Future<EcommerceProductModel> updateProduct(String id, Map<String, dynamic> payload) async =>
      EcommerceProductModel.fromJson(
        await _client.patch(ApiPaths.ecommerceProduct(id), body: payload));

  @override
  Future<void> deleteProduct(String id) =>
      _client.delete(ApiPaths.ecommerceProduct(id));

  @override
  Future<Paginated<EcommerceCategoryModel>> listCategories(ListQuery query) =>
      _client.getPaginated<EcommerceCategoryModel>(
        ApiPaths.ecommerceCategories, query, EcommerceCategoryModel.fromJson);

  @override
  Future<EcommerceCategoryModel> getCategory(String id) async =>
      EcommerceCategoryModel.fromJson(
        await _client.getObject(ApiPaths.ecommerceCategory(id)));

  @override
  Future<EcommerceCategoryModel> createCategory(Map<String, dynamic> payload) async =>
      EcommerceCategoryModel.fromJson(
        await _client.post(ApiPaths.ecommerceCategories, body: payload));

  @override
  Future<EcommerceCategoryModel> updateCategory(String id, Map<String, dynamic> payload) async =>
      EcommerceCategoryModel.fromJson(
        await _client.patch(ApiPaths.ecommerceCategory(id), body: payload));

  @override
  Future<void> deleteCategory(String id) =>
      _client.delete(ApiPaths.ecommerceCategory(id));

  @override
  Future<Paginated<EcommerceOrderModel>> listOrders(ListQuery query) =>
      _client.getPaginated<EcommerceOrderModel>(
        ApiPaths.ecommerceOrders, query, EcommerceOrderModel.fromJson);

  @override
  Future<EcommerceOrderModel> getOrder(String id) async =>
      EcommerceOrderModel.fromJson(
        await _client.getObject(ApiPaths.ecommerceOrder(id)));

  @override
  Future<EcommerceOrderModel> updateOrderStatus(String id, String status) async =>
      EcommerceOrderModel.fromJson(
        await _client.patch(ApiPaths.ecommerceOrder(id), body: <String, dynamic>{'status': status}));

  @override
  Future<List<EcommerceCartItemModel>> getCart() async {
    final items = await _client.getObject(ApiPaths.ecommerceCart);
    return (items['items'] as List<dynamic>?)
            ?.map((e) => EcommerceCartItemModel.fromJson(e as Map<String, dynamic>))
            .toList(growable: false) ??
        const [];
  }

  @override
  Future<EcommerceCartItemModel> addToCart(Map<String, dynamic> payload) async =>
      EcommerceCartItemModel.fromJson(
        await _client.post(ApiPaths.ecommerceCart, body: payload));

  @override
  Future<EcommerceCartItemModel> updateCartItem(String id, Map<String, dynamic> payload) async =>
      EcommerceCartItemModel.fromJson(
        await _client.patch(ApiPaths.ecommerceCart, body: <String, dynamic>{'itemId': id, ...payload}));

  @override
  Future<void> removeFromCart(String id) =>
      _client.delete(ApiPaths.ecommerceCart);

  @override
  Future<void> clearCart() =>
      _client.delete(ApiPaths.ecommerceCart);
}