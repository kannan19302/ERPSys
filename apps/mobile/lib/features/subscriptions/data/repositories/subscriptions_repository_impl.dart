import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/subscriptions.dart';
import '../../domain/repositories/subscriptions_repository.dart';
import '../datasources/subscriptions_remote_data_source.dart';
import '../models/subscriptions_models.dart';

class SubscriptionsRepositoryImpl implements SubscriptionsRepository {
  const SubscriptionsRepositoryImpl({
    required SubscriptionsRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _planNamespace = 'subscriptions.plans';
  static const String _billingNamespace = 'subscriptions.billing';
  static const String _usageNamespace = 'subscriptions.usage';

  final SubscriptionsRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<SubscriptionPlan>>>> listPlans(ListQuery query) =>
      _paginated(_planNamespace, query, () => _remote.listPlans(query), SubscriptionPlanModel.fromJson);

  @override
  Future<Result<SubscriptionPlan>> getPlan(String id) =>
      _single(() => _remote.getPlan(id));

  @override
  Future<Result<Cacheable<Paginated<SubscriptionBillingCycle>>>> listBillingCycles(ListQuery query) =>
      _paginated(_billingNamespace, query, () => _remote.listBillingCycles(query), SubscriptionBillingCycleModel.fromJson);

  @override
  Future<Result<SubscriptionBillingCycle>> getBillingCycle(String id) =>
      _single(() => _remote.getBillingCycle(id));

  @override
  Future<Result<Cacheable<Paginated<SubscriptionUsageRecord>>>> listUsage(ListQuery query) =>
      _paginated(_usageNamespace, query, () => _remote.listUsage(query), SubscriptionUsageRecordModel.fromJson);

  @override
  Future<Result<ChurnSurveyResponse>> submitChurnSurvey(Map<String, dynamic> payload) =>
      _write(() => _remote.submitChurnSurvey(payload));
}
