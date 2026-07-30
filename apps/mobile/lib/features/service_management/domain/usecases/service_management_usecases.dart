import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/service_management.dart';
import '../repositories/service_management_repository.dart';

class ListServiceCatalogsUseCase extends UseCase<Cacheable<Paginated<ServiceCatalog>>, ListQuery> {
  const ListServiceCatalogsUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ServiceCatalog>>>> call(ListQuery params) =>
      _repository.listCatalogs(params);
}

class GetServiceCatalogUseCase extends UseCase<ServiceCatalog, String> {
  const GetServiceCatalogUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceCatalog>> call(String id) => _repository.getCatalog(id);
}

class SaveServiceCatalogParams {
  const SaveServiceCatalogParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveServiceCatalogUseCase extends UseCase<ServiceCatalog, SaveServiceCatalogParams> {
  const SaveServiceCatalogUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceCatalog>> call(SaveServiceCatalogParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createCatalog(params.payload)
        : _repository.updateCatalog(id, params.payload);
  }
}

class DeleteServiceCatalogUseCase extends UseCase<void, String> {
  const DeleteServiceCatalogUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteCatalog(id);
}

class ListServiceRequestsUseCase extends UseCase<Cacheable<Paginated<ServiceRequest>>, ListQuery> {
  const ListServiceRequestsUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ServiceRequest>>>> call(ListQuery params) =>
      _repository.listRequests(params);
}

class GetServiceRequestUseCase extends UseCase<ServiceRequest, String> {
  const GetServiceRequestUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceRequest>> call(String id) => _repository.getRequest(id);
}

class SaveServiceRequestParams {
  const SaveServiceRequestParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveServiceRequestUseCase extends UseCase<ServiceRequest, SaveServiceRequestParams> {
  const SaveServiceRequestUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceRequest>> call(SaveServiceRequestParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createRequest(params.payload)
        : _repository.updateRequest(id, params.payload);
  }
}

class AssignServiceRequestUseCase extends UseCase<ServiceRequest, Map<String, dynamic>> {
  const AssignServiceRequestUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceRequest>> call(Map<String, dynamic> params) =>
      _repository.assignRequest(params['id'] as String, params['userId'] as String);
}

class ResolveServiceRequestUseCase extends UseCase<ServiceRequest, Map<String, dynamic>> {
  const ResolveServiceRequestUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceRequest>> call(Map<String, dynamic> params) =>
      _repository.resolveRequest(params['id'] as String, params['resolution'] as String);
}

class CloseServiceRequestUseCase extends UseCase<ServiceRequest, String> {
  const CloseServiceRequestUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceRequest>> call(String id) => _repository.closeRequest(id);
}

class ListServiceContractsUseCase extends UseCase<Cacheable<Paginated<ServiceContract>>, ListQuery> {
  const ListServiceContractsUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ServiceContract>>>> call(ListQuery params) =>
      _repository.listContracts(params);
}

class GetServiceContractUseCase extends UseCase<ServiceContract, String> {
  const GetServiceContractUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceContract>> call(String id) => _repository.getContract(id);
}

class SaveServiceContractParams {
  const SaveServiceContractParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveServiceContractUseCase extends UseCase<ServiceContract, SaveServiceContractParams> {
  const SaveServiceContractUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceContract>> call(SaveServiceContractParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createContract(params.payload)
        : _repository.updateContract(id, params.payload);
  }
}

class RenewServiceContractUseCase extends UseCase<ServiceContract, String> {
  const RenewServiceContractUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceContract>> call(String id) => _repository.renewContract(id);
}

class TerminateServiceContractUseCase extends UseCase<void, String> {
  const TerminateServiceContractUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.terminateContract(id);
}

class ListServiceSlasUseCase extends UseCase<Cacheable<Paginated<ServiceLevelAgreement>>, ListQuery> {
  const ListServiceSlasUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ServiceLevelAgreement>>>> call(ListQuery params) =>
      _repository.listSlas(params);
}

class GetServiceSlaUseCase extends UseCase<ServiceLevelAgreement, String> {
  const GetServiceSlaUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceLevelAgreement>> call(String id) => _repository.getSla(id);
}

class SaveServiceSlaParams {
  const SaveServiceSlaParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveServiceSlaUseCase extends UseCase<ServiceLevelAgreement, SaveServiceSlaParams> {
  const SaveServiceSlaUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<ServiceLevelAgreement>> call(SaveServiceSlaParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSla(params.payload)
        : _repository.updateSla(id, params.payload);
  }
}

class DeleteServiceSlaUseCase extends UseCase<void, String> {
  const DeleteServiceSlaUseCase(this._repository);
  final ServiceManagementRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteSla(id);
}

class DeleteServiceRequestUseCase extends UseCase<void, String> {
  DeleteServiceRequestUseCase(this.repository);
  final ServiceManagementRepository repository;
  @override
  Future<Result<void>> call(String params) async => throw UnimplementedError();
}

