import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/saas.dart';
import '../../domain/repositories/saas_repository.dart';
import '../datasources/saas_remote_data_source.dart';
import '../models/saas_models.dart';

class SaasRepositoryImpl implements SaasRepository {
  const SaasRepositoryImpl({
    required SaasRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _planNamespace = 'saas.plans';
  static const String _subscriptionNamespace = 'saas.subscriptions';
  static const String _invoiceNamespace = 'saas.invoices';
  static const String _usageNamespace = 'saas.usage';
  static const String _quotaNamespace = 'saas.quotas';
  static const String _tenantNamespace = 'saas.tenants';

  final SaasRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<SaasPlan>>>> listPlans(ListQuery query) =>
      _paginated(_planNamespace, query, () => _remote.listPlans(query), SaasPlanModel.fromJson);

  @override
  Future<Result<SaasPlan>> getPlan(String id) =>
      _single(() => _remote.getPlan(id));

  @override
  Future<Result<SaasPlan>> createPlan(Map<String, dynamic> payload) =>
      _write(() => _remote.createPlan(payload));

  @override
  Future<Result<SaasPlan>> updatePlan(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updatePlan(id, payload));

  @override
  Future<Result<void>> deletePlan(String id) =>
      _delete(() => _remote.deletePlan(id));

  @override
  Future<Result<Cacheable<Paginated<SaasSubscription>>>> listSubscriptions(ListQuery query) =>
      _paginated(_subscriptionNamespace, query, () => _remote.listSubscriptions(query), SaasSubscriptionModel.fromJson);

  @override
  Future<Result<SaasSubscription>> getSubscription(String id) =>
      _single(() => _remote.getSubscription(id));

  @override
  Future<Result<SaasSubscription>> createSubscription(Map<String, dynamic> payload) =>
      _write(() => _remote.createSubscription(payload));

  @override
  Future<Result<SaasSubscription>> updateSubscription(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateSubscription(id, payload));

  @override
  Future<Result<void>> cancelSubscription(String id) =>
      _delete(() => _remote.cancelSubscription(id));

  @override
  Future<Result<Cacheable<Paginated<SaasInvoice>>>> listInvoices(ListQuery query) =>
      _paginated(_invoiceNamespace, query, () => _remote.listInvoices(query), SaasInvoiceModel.fromJson);

  @override
  Future<Result<SaasInvoice>> getInvoice(String id) =>
      _single(() => _remote.getInvoice(id));

  @override
  Future<Result<Cacheable<Paginated<SaasUsageRecord>>>> listUsage(ListQuery query) =>
      _paginated(_usageNamespace, query, () => _remote.listUsage(query), SaasUsageRecordModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<SaasQuota>>>> listQuotas(ListQuery query) =>
      _paginated(_quotaNamespace, query, () => _remote.listQuotas(query), SaasQuotaModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<SaasTenant>>>> listTenants(ListQuery query) =>
      _paginated(_tenantNamespace, query, () => _remote.listTenants(query), SaasTenantModel.fromJson);

  @override
  Future<Result<SaasTenant>> getTenant(String id) =>
      _single(() => _remote.getTenant(id));

  @override
  Future<Result<SaasTenant>> updateTenant(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateTenant(id, payload));
}
