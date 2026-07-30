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

class GetLeaseUseCase extends UseCase<Lease, String> {
  const GetLeaseUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Lease>> call(String id) => _repository.getLease(id);
}

class GetTenantUseCase extends UseCase<TenantDetail, String> {
  const GetTenantUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<TenantDetail>> call(String id) => _repository.getTenant(id);
}

class GetMaintenanceOrderUseCase extends UseCase<MaintenanceOrder, String> {
  const GetMaintenanceOrderUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<MaintenanceOrder>> call(String id) =>
      _repository.getMaintenanceOrder(id);
}

class SaveLeaseParams {
  const SaveLeaseParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveLeaseUseCase extends UseCase<Lease, SaveLeaseParams> {
  const SaveLeaseUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<Lease>> call(SaveLeaseParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createLease(params.payload)
        : _repository.updateLease(id, params.payload);
  }
}

class SaveTenantParams {
  const SaveTenantParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveTenantUseCase extends UseCase<TenantDetail, SaveTenantParams> {
  const SaveTenantUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<TenantDetail>> call(SaveTenantParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTenant(params.payload)
        : _repository.updateTenant(id, params.payload);
  }
}

class DeleteLeaseUseCase extends UseCase<void, String> {
  const DeleteLeaseUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteLease(id);
}

class DeleteTenantUseCase extends UseCase<void, String> {
  const DeleteTenantUseCase(this._repository);
  final RealEstateRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTenant(id);
}
