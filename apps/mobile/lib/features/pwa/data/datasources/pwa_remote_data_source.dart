import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/pwa_models.dart';

abstract class PwaRemoteDataSource {
  Future<Paginated<PwaPushSubscriptionModel>> listPushSubscriptions(ListQuery query);
  Future<void> deletePushSubscription(String id);
  Future<PwaManifestConfigModel> getManifestConfig();
  Future<PwaManifestConfigModel> updateManifestConfig(Map<String, dynamic> payload);
  Future<Paginated<PwaOfflineQueueItemModel>> listOfflineQueue(ListQuery query);
  Future<PwaOfflineQueueItemModel> getOfflineQueueItem(String id);
  Future<PwaOfflineQueueItemModel> retryOfflineQueueItem(String id);
}

class PwaRemoteDataSourceImpl implements PwaRemoteDataSource {
  const PwaRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<PwaPushSubscriptionModel>> listPushSubscriptions(ListQuery query) =>
      _client.getPaginated<PwaPushSubscriptionModel>(
        ApiPaths.pwaPushSubscriptions, query, PwaPushSubscriptionModel.fromJson,);

  @override
  Future<void> deletePushSubscription(String id) =>
      _client.delete('${ApiPaths.pwaPushSubscriptions}/$id');

  @override
  Future<PwaManifestConfigModel> getManifestConfig() async =>
      PwaManifestConfigModel.fromJson(
        await _client.getObject(ApiPaths.pwaManifest),);

  @override
  Future<PwaManifestConfigModel> updateManifestConfig(Map<String, dynamic> payload) async =>
      PwaManifestConfigModel.fromJson(
        await _client.patch(ApiPaths.pwaManifest, body: payload),);

  @override
  Future<Paginated<PwaOfflineQueueItemModel>> listOfflineQueue(ListQuery query) =>
      _client.getPaginated<PwaOfflineQueueItemModel>(
        ApiPaths.pwaOfflineQueue, query, PwaOfflineQueueItemModel.fromJson,);

  @override
  Future<PwaOfflineQueueItemModel> getOfflineQueueItem(String id) async =>
      PwaOfflineQueueItemModel.fromJson(
        await _client.getObject(ApiPaths.pwaOfflineQueueItem(id)),);

  @override
  Future<PwaOfflineQueueItemModel> retryOfflineQueueItem(String id) async =>
      PwaOfflineQueueItemModel.fromJson(
        await _client.post('${ApiPaths.pwaOfflineQueue}/$id/retry'),);
}
