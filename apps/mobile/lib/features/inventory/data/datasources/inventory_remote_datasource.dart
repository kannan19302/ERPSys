import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/product_model.dart';

abstract class InventoryRemoteDataSource {
  Future<Paginated<ProductModel>> listProducts(ListQuery query);

  Future<ProductModel> getProduct(String id);

  Future<InventoryStatsModel> stats();

  Future<ProductModel> createProduct(Map<String, dynamic> payload);

  Future<ProductModel> updateProduct(String id, Map<String, dynamic> payload);

  Future<void> deleteProduct(String id);

  Future<void> adjustStock(Map<String, dynamic> payload);
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
      InventoryStatsModel.fromJson(await _client.getObject(ApiPaths.productStats));

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
  Future<void> deleteProduct(String id) => _client.delete(ApiPaths.product(id));

  @override
  Future<void> adjustStock(Map<String, dynamic> payload) async {
    await _client.patch(ApiPaths.stockAdjust, body: payload);
  }
}
