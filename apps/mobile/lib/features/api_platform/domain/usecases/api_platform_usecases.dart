import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/api_platform.dart';
import '../repositories/api_platform_repository.dart';

class ListApiKeysUseCase extends UseCase<Cacheable<Paginated<ApiKey>>, ListQuery> {
  const ListApiKeysUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ApiKey>>>> call(ListQuery params) =>
      _repository.listApiKeys(params);
}

class SaveApiKeyParams {
  const SaveApiKeyParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveApiKeyUseCase extends UseCase<ApiKey, SaveApiKeyParams> {
  const SaveApiKeyUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<ApiKey>> call(SaveApiKeyParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createApiKey(params.payload)
        : _repository.updateApiKey(id, params.payload);
  }
}

class DeleteApiKeyUseCase extends UseCase<void, String> {
  const DeleteApiKeyUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteApiKey(id);
}

class RevokeApiKeyUseCase extends UseCase<ApiKey, String> {
  const RevokeApiKeyUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<ApiKey>> call(String id) => _repository.revokeApiKey(id);
}

class ListWebhooksUseCase extends UseCase<Cacheable<Paginated<WebhookEndpoint>>, ListQuery> {
  const ListWebhooksUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<WebhookEndpoint>>>> call(ListQuery params) =>
      _repository.listWebhooks(params);
}

class SaveWebhookParams {
  const SaveWebhookParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveWebhookUseCase extends UseCase<WebhookEndpoint, SaveWebhookParams> {
  const SaveWebhookUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<WebhookEndpoint>> call(SaveWebhookParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createWebhook(params.payload)
        : _repository.updateWebhook(id, params.payload);
  }
}

class DeleteWebhookUseCase extends UseCase<void, String> {
  const DeleteWebhookUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteWebhook(id);
}

class ListUsageLogsUseCase extends UseCase<Cacheable<Paginated<ApiUsageLog>>, ListQuery> {
  const ListUsageLogsUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ApiUsageLog>>>> call(ListQuery params) =>
      _repository.listUsageLogs(params);
}

class ListRateLimitsUseCase extends UseCase<Cacheable<Paginated<ApiRateLimitRule>>, ListQuery> {
  const ListRateLimitsUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ApiRateLimitRule>>>> call(ListQuery params) =>
      _repository.listRateLimits(params);
}

class SaveRateLimitParams {
  const SaveRateLimitParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveRateLimitUseCase extends UseCase<ApiRateLimitRule, SaveRateLimitParams> {
  const SaveRateLimitUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<ApiRateLimitRule>> call(SaveRateLimitParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createRateLimit(params.payload)
        : _repository.updateRateLimit(id, params.payload);
  }
}

class DeleteRateLimitUseCase extends UseCase<void, String> {
  const DeleteRateLimitUseCase(this._repository);
  final ApiPlatformRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteRateLimit(id);
}


class GetWebhookUseCase extends UseCase<WebhookEndpoint, String> {
  GetWebhookUseCase(this.repository);
  final ApiPlatformRepository repository;
  @override
  Future<Result<WebhookEndpoint>> call(String params) async => throw UnimplementedError();
}
class GetUsageLogUseCase extends UseCase<ApiUsageLog, String> {
  GetUsageLogUseCase(this.repository);
  final ApiPlatformRepository repository;
  @override
  Future<Result<ApiUsageLog>> call(String params) async => throw UnimplementedError();
}
class GetApiKeyUseCase extends UseCase<ApiKey, String> {
  GetApiKeyUseCase(this.repository);
  final ApiPlatformRepository repository;
  @override
  Future<Result<ApiKey>> call(String params) async => throw UnimplementedError();
}

