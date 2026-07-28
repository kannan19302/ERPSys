import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/storage.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class StorageRepository {
  Future<Result<Cacheable<Paginated<StorageBucket>>>> listBuckets(ListQuery query);
  Future<Result<StorageBucket>> getBucket(String id);
  Future<Result<StorageBucket>> createBucket(Map<String, dynamic> payload);
  Future<Result<StorageBucket>> updateBucket(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteBucket(String id);

  Future<Result<Cacheable<Paginated<StorageFile>>>> listFiles(ListQuery query);
  Future<Result<StorageFile>> getFile(String id);
  Future<Result<StorageFile>> createFile(Map<String, dynamic> payload);
  Future<Result<StorageFile>> updateFile(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteFile(String id);

  Future<Result<Cacheable<Paginated<StoragePolicy>>>> listPolicies(ListQuery query);
  Future<Result<StoragePolicy>> getPolicy(String id);
  Future<Result<StoragePolicy>> createPolicy(Map<String, dynamic> payload);
  Future<Result<StoragePolicy>> updatePolicy(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePolicy(String id);
}
