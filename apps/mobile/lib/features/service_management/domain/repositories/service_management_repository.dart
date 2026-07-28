import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/service_management.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class ServiceManagementRepository {
  Future<Result<Cacheable<Paginated<ServiceCatalog>>>> listCatalogs(ListQuery query);
  Future<Result<ServiceCatalog>> getCatalog(String id);
  Future<Result<ServiceCatalog>> createCatalog(Map<String, dynamic> payload);
  Future<Result<ServiceCatalog>> updateCatalog(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteCatalog(String id);

  Future<Result<Cacheable<Paginated<ServiceRequest>>>> listRequests(ListQuery query);
  Future<Result<ServiceRequest>> getRequest(String id);
  Future<Result<ServiceRequest>> createRequest(Map<String, dynamic> payload);
  Future<Result<ServiceRequest>> updateRequest(String id, Map<String, dynamic> payload);
  Future<Result<ServiceRequest>> assignRequest(String id, String userId);
  Future<Result<ServiceRequest>> resolveRequest(String id, String resolution);
  Future<Result<ServiceRequest>> closeRequest(String id);

  Future<Result<Cacheable<Paginated<ServiceContract>>>> listContracts(ListQuery query);
  Future<Result<ServiceContract>> getContract(String id);
  Future<Result<ServiceContract>> createContract(Map<String, dynamic> payload);
  Future<Result<ServiceContract>> updateContract(String id, Map<String, dynamic> payload);
  Future<Result<ServiceContract>> renewContract(String id);
  Future<Result<void>> terminateContract(String id);

  Future<Result<Cacheable<Paginated<ServiceLevelAgreement>>>> listSlas(ListQuery query);
  Future<Result<ServiceLevelAgreement>> getSla(String id);
  Future<Result<ServiceLevelAgreement>> createSla(Map<String, dynamic> payload);
  Future<Result<ServiceLevelAgreement>> updateSla(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteSla(String id);
}