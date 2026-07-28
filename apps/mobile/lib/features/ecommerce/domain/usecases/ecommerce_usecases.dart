import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/ecommerce.dart';
import '../repositories/ecommerce_repository.dart';

class ListEcommerceProductsUseCase extends UseCase<Cacheable<Paginated<EcommerceProduct>>, ListQuery> {
  const ListEcommerceProductsUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<EcommerceProduct>>>> call(ListQuery params) =>
      _repository.listProducts(params);
}

class GetEcommerceProductUseCase extends UseCase<EcommerceProduct, String> {
  const GetEcommerceProductUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<EcommerceProduct>> call(String id) => _repository.getProduct(id);
}

class SaveEcommerceProductParams {
  const SaveEcommerceProductParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveEcommerceProductUseCase extends UseCase<EcommerceProduct, SaveEcommerceProductParams> {
  const SaveEcommerceProductUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<EcommerceProduct>> call(SaveEcommerceProductParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createProduct(params.payload)
        : _repository.updateProduct(id, params.payload);
  }
}

class DeleteEcommerceProductUseCase extends UseCase<void, String> {
  const DeleteEcommerceProductUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteProduct(id);
}

class ListEcommerceCategoriesUseCase extends UseCase<Cacheable<Paginated<EcommerceCategory>>, ListQuery> {
  const ListEcommerceCategoriesUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<EcommerceCategory>>>> call(ListQuery params) =>
      _repository.listCategories(params);
}

class GetEcommerceCategoryUseCase extends UseCase<EcommerceCategory, String> {
  const GetEcommerceCategoryUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<EcommerceCategory>> call(String id) => _repository.getCategory(id);
}

class SaveEcommerceCategoryParams {
  const SaveEcommerceCategoryParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveEcommerceCategoryUseCase extends UseCase<EcommerceCategory, SaveEcommerceCategoryParams> {
  const SaveEcommerceCategoryUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<EcommerceCategory>> call(SaveEcommerceCategoryParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createCategory(params.payload)
        : _repository.updateCategory(id, params.payload);
  }
}

class DeleteEcommerceCategoryUseCase extends UseCase<void, String> {
  const DeleteEcommerceCategoryUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteCategory(id);
}

class ListEcommerceOrdersUseCase extends UseCase<Cacheable<Paginated<EcommerceOrder>>, ListQuery> {
  const ListEcommerceOrdersUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<EcommerceOrder>>>> call(ListQuery params) =>
      _repository.listOrders(params);
}

class GetEcommerceOrderUseCase extends UseCase<EcommerceOrder, String> {
  const GetEcommerceOrderUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<EcommerceOrder>> call(String id) => _repository.getOrder(id);
}

class GetCartUseCase extends UseCase<List<EcommerceCartItem>, NoParams> {
  const GetCartUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<List<EcommerceCartItem>>> call(NoParams _) => _repository.getCart();
}

class AddToCartUseCase extends UseCase<EcommerceCartItem, Map<String, dynamic>> {
  const AddToCartUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<EcommerceCartItem>> call(Map<String, dynamic> params) =>
      _repository.addToCart(params);
}

class RemoveFromCartUseCase extends UseCase<void, String> {
  const RemoveFromCartUseCase(this._repository);
  final EcommerceRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.removeFromCart(id);
}