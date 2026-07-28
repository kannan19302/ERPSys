import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/pwa.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class PwaRepository {
  Future<Result<Cacheable<Paginated<PwaPushSubscription>>>> listPushSubscriptions(ListQuery query);
  Future<Result<void>> deletePushSubscription(String id);
  Future<Result<PwaManifestConfig>> getManifestConfig();
  Future<Result<PwaManifestConfig>> updateManifestConfig(Map<String, dynamic> payload);
  Future<Result<Cacheable<Paginated<PwaOfflineQueueItem>>>> listOfflineQueue(ListQuery query);
  Future<Result<PwaOfflineQueueItem>> getOfflineQueueItem(String id);
  Future<Result<PwaOfflineQueueItem>> retryOfflineQueueItem(String id);
}
