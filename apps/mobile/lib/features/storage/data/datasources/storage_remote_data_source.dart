import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/storage_models.dart';

abstract class StorageRemoteDataSource {
  Future<Paginated<StorageBucketModel>> listBuckets(ListQuery query);
  Future<StorageBucketModel> getBucket(String id);
  Future<StorageBucketModel> createBucket(Map<String, dynamic> payload);
  Future<StorageBucketModel> updateBucket(String id, Map<String, dynamic> payload);
  Future<void> deleteBucket(String id);

  Future<Paginated<StorageFileModel>> listFiles(ListQuery query);
  Future<StorageFileModel> getFile(String id);
  Future<StorageFileModel> createFile(Map<String, dynamic> payload);
  Future<StorageFileModel> updateFile(String id, Map<String, dynamic> payload);
  Future<void> deleteFile(String id);

  Future<Paginated<StoragePolicyModel>> listPolicies(ListQuery query);
  Future<StoragePolicyModel> getPolicy(String id);
  Future<StoragePolicyModel> createPolicy(Map<String, dynamic> payload);
  Future<StoragePolicyModel> updatePolicy(String id, Map<String, dynamic> payload);
  Future<void> deletePolicy(String id);
}

class StorageRemoteDataSourceImpl implements StorageRemoteDataSource {
  const StorageRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<StorageBucketModel>> listBuckets(ListQuery query) =>
      _client.getPaginated<StorageBucketModel>(
        ApiPaths.storageBuckets, query, StorageBucketModel.fromJson);

  @override
  Future<StorageBucketModel> getBucket(String id) async =>
      StorageBucketModel.fromJson(
        await _client.getObject(ApiPaths.storageBucket(id)));

  @override
  Future<StorageBucketModel> createBucket(Map<String, dynamic> payload) async =>
      StorageBucketModel.fromJson(
        await _client.post(ApiPaths.storageBuckets, body: payload));

  @override
  Future<StorageBucketModel> updateBucket(
    String id, Map<String, dynamic> payload) async =>
      StorageBucketModel.fromJson(
        await _client.patch(ApiPaths.storageBucket(id), body: payload));

  @override
  Future<void> deleteBucket(String id) =>
      _client.delete(ApiPaths.storageBucket(id));

  @override
  Future<Paginated<StorageFileModel>> listFiles(ListQuery query) =>
      _client.getPaginated<StorageFileModel>(
        ApiPaths.storageFiles, query, StorageFileModel.fromJson);

  @override
  Future<StorageFileModel> getFile(String id) async =>
      StorageFileModel.fromJson(
        await _client.getObject(ApiPaths.storageFile(id)));

  @override
  Future<StorageFileModel> createFile(Map<String, dynamic> payload) async =>
      StorageFileModel.fromJson(
        await _client.post(ApiPaths.storageFiles, body: payload));

  @override
  Future<StorageFileModel> updateFile(
    String id, Map<String, dynamic> payload) async =>
      StorageFileModel.fromJson(
        await _client.patch(ApiPaths.storageFile(id), body: payload));

  @override
  Future<void> deleteFile(String id) =>
      _client.delete(ApiPaths.storageFile(id));

  @override
  Future<Paginated<StoragePolicyModel>> listPolicies(ListQuery query) =>
      _client.getPaginated<StoragePolicyModel>(
        ApiPaths.storagePolicies, query, StoragePolicyModel.fromJson);

  @override
  Future<StoragePolicyModel> getPolicy(String id) async =>
      StoragePolicyModel.fromJson(
        await _client.getObject(ApiPaths.storagePolicy(id)));

  @override
  Future<StoragePolicyModel> createPolicy(Map<String, dynamic> payload) async =>
      StoragePolicyModel.fromJson(
        await _client.post(ApiPaths.storagePolicies, body: payload));

  @override
  Future<StoragePolicyModel> updatePolicy(
    String id, Map<String, dynamic> payload) async =>
      StoragePolicyModel.fromJson(
        await _client.patch(ApiPaths.storagePolicy(id), body: payload));

  @override
  Future<void> deletePolicy(String id) =>
      _client.delete(ApiPaths.storagePolicy(id));
}
