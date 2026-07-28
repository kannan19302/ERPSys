import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/saas_portal.dart';
import '../../domain/repositories/saas_portal_repository.dart';
import '../datasources/saas_portal_remote_data_source.dart';
import '../models/saas_portal_models.dart';

class SaasPortalRepositoryImpl implements SaasPortalRepository {
  const SaasPortalRepositoryImpl({
    required SaasPortalRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _planNamespace = 'saas-portal.plans';
  static const String _ticketNamespace = 'saas-portal.tickets';

  final SaasPortalRemoteDataSource _remote;
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
  Future<Result<PortalBillingInfo>> getBillingInfo() =>
      _single(() => _remote.getBillingInfo());

  @override
  Future<Result<PortalBillingInfo>> updateBillingInfo(Map<String, dynamic> payload) =>
      _write(() => _remote.updateBillingInfo(payload));

  @override
  Future<Result<Cacheable<Paginated<PortalPlan>>>> listPlans(ListQuery query) =>
      _paginated(_planNamespace, query, () => _remote.listPlans(query), PortalPlanModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<PortalSupportTicket>>>> listSupportTickets(ListQuery query) =>
      _paginated(_ticketNamespace, query, () => _remote.listSupportTickets(query), PortalSupportTicketModel.fromJson);

  @override
  Future<Result<PortalSupportTicket>> getSupportTicket(String id) =>
      _single(() => _remote.getSupportTicket(id));

  @override
  Future<Result<PortalSupportTicket>> createSupportTicket(Map<String, dynamic> payload) =>
      _write(() => _remote.createSupportTicket(payload));
}
