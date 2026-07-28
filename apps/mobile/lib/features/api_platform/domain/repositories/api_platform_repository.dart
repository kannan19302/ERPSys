import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/api_platform.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class ApiPlatformRepository {
  Future<Result<Cacheable<Paginated<ApiKey>>>> listApiKeys(ListQuery query);
  Future<Result<ApiKey>> getApiKey(String id);
  Future<Result<ApiKey>> createApiKey(Map<String, dynamic> payload);
  Future<Result<ApiKey>> updateApiKey(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteApiKey(String id);
  Future<Result<ApiKey>> revokeApiKey(String id);

  Future<Result<Cacheable<Paginated<WebhookEndpoint>>>> listWebhooks(ListQuery query);
  Future<Result<WebhookEndpoint>> getWebhook(String id);
  Future<Result<WebhookEndpoint>> createWebhook(Map<String, dynamic> payload);
  Future<Result<WebhookEndpoint>> updateWebhook(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteWebhook(String id);

  Future<Result<Cacheable<Paginated<ApiUsageLog>>>> listUsageLogs(ListQuery query);

  Future<Result<Cacheable<Paginated<ApiRateLimitRule>>>> listRateLimits(ListQuery query);
  Future<Result<ApiRateLimitRule>> createRateLimit(Map<String, dynamic> payload);
  Future<Result<ApiRateLimitRule>> updateRateLimit(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteRateLimit(String id);
}
