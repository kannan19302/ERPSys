import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
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
