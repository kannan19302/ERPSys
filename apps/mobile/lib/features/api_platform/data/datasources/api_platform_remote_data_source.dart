import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/api_platform_models.dart';

abstract class ApiPlatformRemoteDataSource {
  Future<Paginated<ApiKeyModel>> listApiKeys(ListQuery query);
  Future<ApiKeyModel> getApiKey(String id);
  Future<ApiKeyModel> createApiKey(Map<String, dynamic> payload);
  Future<ApiKeyModel> updateApiKey(String id, Map<String, dynamic> payload);
  Future<void> deleteApiKey(String id);
  Future<ApiKeyModel> revokeApiKey(String id);

  Future<Paginated<WebhookEndpointModel>> listWebhooks(ListQuery query);
  Future<WebhookEndpointModel> getWebhook(String id);
  Future<WebhookEndpointModel> createWebhook(Map<String, dynamic> payload);
  Future<WebhookEndpointModel> updateWebhook(String id, Map<String, dynamic> payload);
  Future<void> deleteWebhook(String id);

  Future<Paginated<ApiUsageLogModel>> listUsageLogs(ListQuery query);

  Future<Paginated<ApiRateLimitRuleModel>> listRateLimits(ListQuery query);
  Future<ApiRateLimitRuleModel> createRateLimit(Map<String, dynamic> payload);
  Future<ApiRateLimitRuleModel> updateRateLimit(String id, Map<String, dynamic> payload);
  Future<void> deleteRateLimit(String id);
}

class ApiPlatformRemoteDataSourceImpl implements ApiPlatformRemoteDataSource {
  const ApiPlatformRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<ApiKeyModel>> listApiKeys(ListQuery query) =>
      _client.getPaginated<ApiKeyModel>(
        ApiPaths.apiKeys, query, ApiKeyModel.fromJson,);

  @override
  Future<ApiKeyModel> getApiKey(String id) async =>
      ApiKeyModel.fromJson(
        await _client.getObject(ApiPaths.apiKey(id)),);

  @override
  Future<ApiKeyModel> createApiKey(Map<String, dynamic> payload) async =>
      ApiKeyModel.fromJson(
        await _client.post(ApiPaths.apiKeys, body: payload),);

  @override
  Future<ApiKeyModel> updateApiKey(String id, Map<String, dynamic> payload) async =>
      ApiKeyModel.fromJson(
        await _client.patch(ApiPaths.apiKey(id), body: payload),);

  @override
  Future<void> deleteApiKey(String id) =>
      _client.delete(ApiPaths.apiKey(id));

  @override
  Future<ApiKeyModel> revokeApiKey(String id) async =>
      ApiKeyModel.fromJson(
        await _client.post('${ApiPaths.apiKey(id)}/revoke'),);

  @override
  Future<Paginated<WebhookEndpointModel>> listWebhooks(ListQuery query) =>
      _client.getPaginated<WebhookEndpointModel>(
        ApiPaths.webhooks, query, WebhookEndpointModel.fromJson,);

  @override
  Future<WebhookEndpointModel> getWebhook(String id) async =>
      WebhookEndpointModel.fromJson(
        await _client.getObject(ApiPaths.webhook(id)),);

  @override
  Future<WebhookEndpointModel> createWebhook(Map<String, dynamic> payload) async =>
      WebhookEndpointModel.fromJson(
        await _client.post(ApiPaths.webhooks, body: payload),);

  @override
  Future<WebhookEndpointModel> updateWebhook(String id, Map<String, dynamic> payload) async =>
      WebhookEndpointModel.fromJson(
        await _client.patch(ApiPaths.webhook(id), body: payload),);

  @override
  Future<void> deleteWebhook(String id) =>
      _client.delete(ApiPaths.webhook(id));

  @override
  Future<Paginated<ApiUsageLogModel>> listUsageLogs(ListQuery query) =>
      _client.getPaginated<ApiUsageLogModel>(
        ApiPaths.apiUsageLogs, query, ApiUsageLogModel.fromJson,);

  @override
  Future<Paginated<ApiRateLimitRuleModel>> listRateLimits(ListQuery query) =>
      _client.getPaginated<ApiRateLimitRuleModel>(
        ApiPaths.apiRateLimits, query, ApiRateLimitRuleModel.fromJson,);

  @override
  Future<ApiRateLimitRuleModel> createRateLimit(Map<String, dynamic> payload) async =>
      ApiRateLimitRuleModel.fromJson(
        await _client.post(ApiPaths.apiRateLimits, body: payload),);

  @override
  Future<ApiRateLimitRuleModel> updateRateLimit(String id, Map<String, dynamic> payload) async =>
      ApiRateLimitRuleModel.fromJson(
        await _client.patch('${ApiPaths.apiRateLimits}/$id', body: payload),);

  @override
  Future<void> deleteRateLimit(String id) =>
      _client.delete('${ApiPaths.apiRateLimits}/$id');
}
