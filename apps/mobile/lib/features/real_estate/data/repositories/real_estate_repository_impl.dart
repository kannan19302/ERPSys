import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/real_estate.dart';
import '../../domain/repositories/real_estate_repository.dart';
import '../datasources/real_estate_remote_data_source.dart';
import '../models/real_estate_models.dart';

class RealEstateRepositoryImpl implements RealEstateRepository {
  const RealEstateRepositoryImpl({
    required RealEstateRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _propertyNamespace = 'real-estate.properties';
  static const String _leaseNamespace = 'real-estate.leases';
  static const String _tenantNamespace = 'real-estate.tenants';
  static const String _maintenanceNamespace = 'real-estate.maintenance';
  static const String _valuationNamespace = 'real-estate.valuations';

  final RealEstateRemoteDataSource _remote;
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
      final List<Map<String, dynamic>> jsonItems = page.data
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
  Future<Result<Cacheable<Paginated<Property>>>> listProperties(ListQuery query) =>
      _paginated(_propertyNamespace, query, () => _remote.listProperties(query),
        PropertyModel.fromJson);

  @override
  Future<Result<Property>> getProperty(String id) =>
      _single(() => _remote.getProperty(id));

  @override
  Future<Result<Property>> createProperty(Map<String, dynamic> p) =>
      _write(() => _remote.createProperty(p));

  @override
  Future<Result<Property>> updateProperty(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateProperty(id, p));

  @override
  Future<Result<void>> deleteProperty(String id) =>
      _delete(() => _remote.deleteProperty(id));

  @override
  Future<Result<Cacheable<Paginated<Lease>>>> listLeases(ListQuery query) =>
      _paginated(_leaseNamespace, query, () => _remote.listLeases(query),
        LeaseModel.fromJson);

  @override
  Future<Result<Lease>> getLease(String id) =>
      _single(() => _remote.getLease(id));

  @override
  Future<Result<Lease>> createLease(Map<String, dynamic> p) =>
      _write(() => _remote.createLease(p));

  @override
  Future<Result<Lease>> updateLease(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateLease(id, p));

  @override
  Future<Result<void>> deleteLease(String id) =>
      _delete(() => _remote.deleteLease(id));

  @override
  Future<Result<Cacheable<Paginated<TenantDetail>>>> listTenants(ListQuery query) =>
      _paginated(_tenantNamespace, query, () => _remote.listTenants(query),
        TenantDetailModel.fromJson);

  @override
  Future<Result<TenantDetail>> getTenant(String id) =>
      _single(() => _remote.getTenant(id));

  @override
  Future<Result<TenantDetail>> createTenant(Map<String, dynamic> p) =>
      _write(() => _remote.createTenant(p));

  @override
  Future<Result<TenantDetail>> updateTenant(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateTenant(id, p));

  @override
  Future<Result<void>> deleteTenant(String id) =>
      _delete(() => _remote.deleteTenant(id));

  @override
  Future<Result<Cacheable<Paginated<MaintenanceOrder>>>> listMaintenanceOrders(
    ListQuery query) =>
      _paginated(_maintenanceNamespace, query,
        () => _remote.listMaintenanceOrders(query),
        MaintenanceOrderModel.fromJson);

  @override
  Future<Result<MaintenanceOrder>> getMaintenanceOrder(String id) =>
      _single(() => _remote.getMaintenanceOrder(id));

  @override
  Future<Result<MaintenanceOrder>> createMaintenanceOrder(Map<String, dynamic> p) =>
      _write(() => _remote.createMaintenanceOrder(p));

  @override
  Future<Result<MaintenanceOrder>> updateMaintenanceOrder(
    String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateMaintenanceOrder(id, p));

  @override
  Future<Result<void>> deleteMaintenanceOrder(String id) =>
      _delete(() => _remote.deleteMaintenanceOrder(id));

  @override
  Future<Result<MaintenanceOrder>> completeMaintenanceOrder(String id) =>
      _single(() => _remote.completeMaintenanceOrder(id));

  @override
  Future<Result<Cacheable<Paginated<PropertyValuation>>>> listPropertyValuations(
    ListQuery query) =>
      _paginated(_valuationNamespace, query,
        () => _remote.listPropertyValuations(query),
        PropertyValuationModel.fromJson);

  @override
  Future<Result<PropertyValuation>> createPropertyValuation(Map<String, dynamic> p) =>
      _write(() => _remote.createPropertyValuation(p));
}
