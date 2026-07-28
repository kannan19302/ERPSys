import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/real_estate.dart';
import '../repositories/real_estate_repository.dart';

class ListPropertiesUseCase extends UseCase<Cacheable<Paginated<Property>>, ListQuery> {
  const ListPropertiesUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Property>>>> call(ListQuery params) =>
      _repository.listProperties(params);
}

class GetPropertyUseCase extends UseCase<Property, String> {
  const GetPropertyUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Property>> call(String id) => _repository.getProperty(id);
}

class SavePropertyParams {
  const SavePropertyParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePropertyUseCase extends UseCase<Property, SavePropertyParams> {
  const SavePropertyUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Property>> call(SavePropertyParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createProperty(params.payload)
        : _repository.updateProperty(id, params.payload);
  }
}

class DeletePropertyUseCase extends UseCase<void, String> {
  const DeletePropertyUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteProperty(id);
}

class ListLeasesUseCase extends UseCase<Cacheable<Paginated<Lease>>, ListQuery> {
  const ListLeasesUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Lease>>>> call(ListQuery params) =>
      _repository.listLeases(params);
}

class ListTenantsUseCase extends UseCase<Cacheable<Paginated<TenantDetail>>, ListQuery> {
  const ListTenantsUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<TenantDetail>>>> call(ListQuery params) =>
      _repository.listTenants(params);
}

class ListMaintenanceOrdersUseCase
    extends UseCase<Cacheable<Paginated<MaintenanceOrder>>, ListQuery> {
  const ListMaintenanceOrdersUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<MaintenanceOrder>>>> call(ListQuery params) =>
      _repository.listMaintenanceOrders(params);
}

class CompleteMaintenanceOrderUseCase extends UseCase<MaintenanceOrder, String> {
  const CompleteMaintenanceOrderUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<MaintenanceOrder>> call(String id) =>
      _repository.completeMaintenanceOrder(id);
}

class ListPropertyValuationsUseCase
    extends UseCase<Cacheable<Paginated<PropertyValuation>>, ListQuery> {
  const ListPropertyValuationsUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PropertyValuation>>>> call(ListQuery params) =>
      _repository.listPropertyValuations(params);
}
