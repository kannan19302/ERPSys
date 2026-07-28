import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/api_platform.dart';
import '../../domain/repositories/api_platform_repository.dart';
import '../datasources/api_platform_remote_data_source.dart';
import '../models/api_platform_models.dart';

class ApiPlatformRepositoryImpl implements ApiPlatformRepository {
  const ApiPlatformRepositoryImpl({
    required ApiPlatformRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _keyNamespace = 'api-platform.keys';
  static const String _webhookNamespace = 'api-platform.webhooks';
  static const String _usageNamespace = 'api-platform.usage';
  static const String _rateLimitNamespace = 'api-platform.rate-limits';

  final ApiPlatformRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<ApiKey>>>> listApiKeys(ListQuery q) =>
      _paginated(_keyNamespace, q, () => _remote.listApiKeys(q),
        ApiKeyModel.fromJson);

  @override
  Future<Result<ApiKey>> getApiKey(String id) =>
      _single(() => _remote.getApiKey(id));

  @override
  Future<Result<ApiKey>> createApiKey(Map<String, dynamic> p) =>
      _write(() => _remote.createApiKey(p));

  @override
  Future<Result<ApiKey>> updateApiKey(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateApiKey(id, p));

  @override
  Future<Result<void>> deleteApiKey(String id) =>
      _delete(() => _remote.deleteApiKey(id));

  @override
  Future<Result<ApiKey>> revokeApiKey(String id) =>
      _single(() => _remote.revokeApiKey(id));

  @override
  Future<Result<Cacheable<Paginated<WebhookEndpoint>>>> listWebhooks(ListQuery q) =>
      _paginated(_webhookNamespace, q, () => _remote.listWebhooks(q),
        WebhookEndpointModel.fromJson);

  @override
  Future<Result<WebhookEndpoint>> getWebhook(String id) =>
      _single(() => _remote.getWebhook(id));

  @override
  Future<Result<WebhookEndpoint>> createWebhook(Map<String, dynamic> p) =>
      _write(() => _remote.createWebhook(p));

  @override
  Future<Result<WebhookEndpoint>> updateWebhook(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateWebhook(id, p));

  @override
  Future<Result<void>> deleteWebhook(String id) =>
      _delete(() => _remote.deleteWebhook(id));

  @override
  Future<Result<Cacheable<Paginated<ApiUsageLog>>>> listUsageLogs(ListQuery q) =>
      _paginated(_usageNamespace, q, () => _remote.listUsageLogs(q),
        ApiUsageLogModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<ApiRateLimitRule>>>> listRateLimits(ListQuery q) =>
      _paginated(_rateLimitNamespace, q, () => _remote.listRateLimits(q),
        ApiRateLimitRuleModel.fromJson);

  @override
  Future<Result<ApiRateLimitRule>> createRateLimit(Map<String, dynamic> p) =>
      _write(() => _remote.createRateLimit(p));

  @override
  Future<Result<ApiRateLimitRule>> updateRateLimit(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateRateLimit(id, p));

  @override
  Future<Result<void>> deleteRateLimit(String id) =>
      _delete(() => _remote.deleteRateLimit(id));
}
