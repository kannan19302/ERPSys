import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/service_management.dart';
import '../../domain/repositories/service_management_repository.dart';
import '../datasources/service_management_remote_data_source.dart';
import '../models/service_management_models.dart';

class ServiceManagementRepositoryImpl implements ServiceManagementRepository {
  const ServiceManagementRepositoryImpl({
    required ServiceManagementRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _catalogNamespace = 'service.catalogs';
  static const String _requestNamespace = 'service.requests';
  static const String _contractNamespace = 'service.contracts';
  static const String _slaNamespace = 'service.slas';

  final ServiceManagementRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<ServiceCatalog>>>> listCatalogs(ListQuery q) =>
      _paginated(_catalogNamespace, q, () => _remote.listCatalogs(q), ServiceCatalogModel.fromJson);

  @override
  Future<Result<ServiceCatalog>> getCatalog(String id) => _single(() => _remote.getCatalog(id));

  @override
  Future<Result<ServiceCatalog>> createCatalog(Map<String, dynamic> p) =>
      _write(() => _remote.createCatalog(p));

  @override
  Future<Result<ServiceCatalog>> updateCatalog(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateCatalog(id, p));

  @override
  Future<Result<void>> deleteCatalog(String id) => _delete(() => _remote.deleteCatalog(id));

  @override
  Future<Result<Cacheable<Paginated<ServiceRequest>>>> listRequests(ListQuery q) =>
      _paginated(_requestNamespace, q, () => _remote.listRequests(q), ServiceRequestModel.fromJson);

  @override
  Future<Result<ServiceRequest>> getRequest(String id) => _single(() => _remote.getRequest(id));

  @override
  Future<Result<ServiceRequest>> createRequest(Map<String, dynamic> p) =>
      _write(() => _remote.createRequest(p));

  @override
  Future<Result<ServiceRequest>> updateRequest(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateRequest(id, p));

  @override
  Future<Result<ServiceRequest>> assignRequest(String id, String userId) =>
      _write(() => _remote.assignRequest(id, userId));

  @override
  Future<Result<ServiceRequest>> resolveRequest(String id, String resolution) =>
      _write(() => _remote.resolveRequest(id, resolution));

  @override
  Future<Result<ServiceRequest>> closeRequest(String id) =>
      _write(() => _remote.closeRequest(id));

  @override
  Future<Result<Cacheable<Paginated<ServiceContract>>>> listContracts(ListQuery q) =>
      _paginated(_contractNamespace, q, () => _remote.listContracts(q), ServiceContractModel.fromJson);

  @override
  Future<Result<ServiceContract>> getContract(String id) => _single(() => _remote.getContract(id));

  @override
  Future<Result<ServiceContract>> createContract(Map<String, dynamic> p) =>
      _write(() => _remote.createContract(p));

  @override
  Future<Result<ServiceContract>> updateContract(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateContract(id, p));

  @override
  Future<Result<ServiceContract>> renewContract(String id) =>
      _write(() => _remote.renewContract(id));

  @override
  Future<Result<void>> terminateContract(String id) => _delete(() => _remote.terminateContract(id));

  @override
  Future<Result<Cacheable<Paginated<ServiceLevelAgreement>>>> listSlas(ListQuery q) =>
      _paginated(_slaNamespace, q, () => _remote.listSlas(q), ServiceLevelAgreementModel.fromJson);

  @override
  Future<Result<ServiceLevelAgreement>> getSla(String id) => _single(() => _remote.getSla(id));

  @override
  Future<Result<ServiceLevelAgreement>> createSla(Map<String, dynamic> p) =>
      _write(() => _remote.createSla(p));

  @override
  Future<Result<ServiceLevelAgreement>> updateSla(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateSla(id, p));

  @override
  Future<Result<void>> deleteSla(String id) => _delete(() => _remote.deleteSla(id));
}