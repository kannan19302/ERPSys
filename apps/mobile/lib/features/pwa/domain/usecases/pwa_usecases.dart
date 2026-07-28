import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/pwa.dart';
import '../repositories/pwa_repository.dart';

class ListPushSubscriptionsUseCase extends UseCase<Cacheable<Paginated<PwaPushSubscription>>, ListQuery> {
  const ListPushSubscriptionsUseCase(this._repository);
  final PwaRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PwaPushSubscription>>>> call(ListQuery params) =>
      _repository.listPushSubscriptions(params);
}

class DeletePushSubscriptionUseCase extends UseCase<void, String> {
  const DeletePushSubscriptionUseCase(this._repository);
  final PwaRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePushSubscription(id);
}

class GetManifestConfigUseCase extends UseCase<PwaManifestConfig, NoParams> {
  const GetManifestConfigUseCase(this._repository);
  final PwaRepository _repository;
  @override
  Future<Result<PwaManifestConfig>> call(NoParams params) => _repository.getManifestConfig();
}

class UpdateManifestConfigUseCase extends UseCase<PwaManifestConfig, Map<String, dynamic>> {
  const UpdateManifestConfigUseCase(this._repository);
  final PwaRepository _repository;
  @override
  Future<Result<PwaManifestConfig>> call(Map<String, dynamic> params) =>
      _repository.updateManifestConfig(params);
}

class ListOfflineQueueUseCase extends UseCase<Cacheable<Paginated<PwaOfflineQueueItem>>, ListQuery> {
  const ListOfflineQueueUseCase(this._repository);
  final PwaRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PwaOfflineQueueItem>>>> call(ListQuery params) =>
      _repository.listOfflineQueue(params);
}

class RetryOfflineQueueItemUseCase extends UseCase<PwaOfflineQueueItem, String> {
  const RetryOfflineQueueItemUseCase(this._repository);
  final PwaRepository _repository;
  @override
  Future<Result<PwaOfflineQueueItem>> call(String id) =>
      _repository.retryOfflineQueueItem(id);
}
