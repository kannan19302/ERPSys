import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/field_service.dart';
import '../../domain/repositories/field_service_repository.dart';
import '../datasources/field_service_remote_data_source.dart';
import '../models/field_service_models.dart';

class FieldServiceRepositoryImpl implements FieldServiceRepository {
  const FieldServiceRepositoryImpl({
    required FieldServiceRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _ticketNamespace = 'field-service.tickets';
  static const String _technicianNamespace = 'field-service.technicians';
  static const String _scheduleNamespace = 'field-service.schedules';
  static const String _contractNamespace = 'field-service.contracts';

  final FieldServiceRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<ServiceTicket>>>> listServiceTickets(ListQuery q) =>
      _paginated(_ticketNamespace, q, () => _remote.listServiceTickets(q),
        ServiceTicketModel.fromJson,);

  @override
  Future<Result<ServiceTicket>> getServiceTicket(String id) =>
      _single(() => _remote.getServiceTicket(id));

  @override
  Future<Result<ServiceTicket>> createServiceTicket(Map<String, dynamic> p) =>
      _write(() => _remote.createServiceTicket(p));

  @override
  Future<Result<ServiceTicket>> updateServiceTicket(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateServiceTicket(id, p));

  @override
  Future<Result<void>> deleteServiceTicket(String id) =>
      _delete(() => _remote.deleteServiceTicket(id));

  @override
  Future<Result<ServiceTicket>> dispatchServiceTicket(String id, Map<String, dynamic> p) =>
      _single(() => _remote.dispatchServiceTicket(id, p));

  @override
  Future<Result<ServiceTicket>> completeServiceTicket(String id, Map<String, dynamic> p) =>
      _single(() => _remote.completeServiceTicket(id, p));

  @override
  Future<Result<ServiceTicket>> cancelServiceTicket(String id) =>
      _single(() => _remote.cancelServiceTicket(id));

  @override
  Future<Result<Cacheable<Paginated<Technician>>>> listTechnicians(ListQuery q) =>
      _paginated(_technicianNamespace, q, () => _remote.listTechnicians(q),
        TechnicianModel.fromJson,);

  @override
  Future<Result<Technician>> getTechnician(String id) =>
      _single(() => _remote.getTechnician(id));

  @override
  Future<Result<Technician>> createTechnician(Map<String, dynamic> p) =>
      _write(() => _remote.createTechnician(p));

  @override
  Future<Result<Technician>> updateTechnician(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateTechnician(id, p));

  @override
  Future<Result<void>> deleteTechnician(String id) =>
      _delete(() => _remote.deleteTechnician(id));

  @override
  Future<Result<Cacheable<Paginated<ServiceSchedule>>>> listServiceSchedules(ListQuery q) =>
      _paginated(_scheduleNamespace, q, () => _remote.listServiceSchedules(q),
        ServiceScheduleModel.fromJson,);

  @override
  Future<Result<ServiceSchedule>> getServiceSchedule(String id) =>
      _single(() => _remote.getServiceSchedule(id));

  @override
  Future<Result<ServiceSchedule>> createServiceSchedule(Map<String, dynamic> p) =>
      _write(() => _remote.createServiceSchedule(p));

  @override
  Future<Result<ServiceSchedule>> updateServiceSchedule(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateServiceSchedule(id, p));

  @override
  Future<Result<void>> deleteServiceSchedule(String id) =>
      _delete(() => _remote.deleteServiceSchedule(id));

  @override
  Future<Result<ServiceSchedule>> startServiceSchedule(String id) =>
      _single(() => _remote.startServiceSchedule(id));

  @override
  Future<Result<ServiceSchedule>> completeServiceSchedule(String id) =>
      _single(() => _remote.completeServiceSchedule(id));

  @override
  Future<Result<Cacheable<Paginated<ServiceContract>>>> listServiceContracts(ListQuery q) =>
      _paginated(_contractNamespace, q, () => _remote.listServiceContracts(q),
        ServiceContractModel.fromJson,);

  @override
  Future<Result<ServiceContract>> getServiceContract(String id) =>
      _single(() => _remote.getServiceContract(id));

  @override
  Future<Result<ServiceContract>> createServiceContract(Map<String, dynamic> p) =>
      _write(() => _remote.createServiceContract(p));

  @override
  Future<Result<ServiceContract>> updateServiceContract(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateServiceContract(id, p));

  @override
  Future<Result<void>> deleteServiceContract(String id) =>
      _delete(() => _remote.deleteServiceContract(id));

  @override
  Future<Result<ServiceContract>> renewServiceContract(String id) =>
      _single(() => _remote.renewServiceContract(id));
}
