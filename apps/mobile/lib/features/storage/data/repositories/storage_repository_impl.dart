import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/storage.dart';
import '../../domain/repositories/storage_repository.dart';
import '../datasources/storage_remote_data_source.dart';
import '../models/storage_models.dart';

class StorageRepositoryImpl implements StorageRepository {
  const StorageRepositoryImpl({
    required StorageRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _bucketNamespace = 'storage.buckets';
  static const String _fileNamespace = 'storage.files';
  static const String _policyNamespace = 'storage.policies';

  final StorageRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<StorageBucket>>>> listBuckets(ListQuery q) =>
      _paginated(_bucketNamespace, q, () => _remote.listBuckets(q),
        StorageBucketModel.fromJson);

  @override
  Future<Result<StorageBucket>> getBucket(String id) =>
      _single(() => _remote.getBucket(id));

  @override
  Future<Result<StorageBucket>> createBucket(Map<String, dynamic> p) =>
      _write(() => _remote.createBucket(p));

  @override
  Future<Result<StorageBucket>> updateBucket(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateBucket(id, p));

  @override
  Future<Result<void>> deleteBucket(String id) =>
      _delete(() => _remote.deleteBucket(id));

  @override
  Future<Result<Cacheable<Paginated<StorageFile>>>> listFiles(ListQuery q) =>
      _paginated(_fileNamespace, q, () => _remote.listFiles(q),
        StorageFileModel.fromJson);

  @override
  Future<Result<StorageFile>> getFile(String id) =>
      _single(() => _remote.getFile(id));

  @override
  Future<Result<StorageFile>> createFile(Map<String, dynamic> p) =>
      _write(() => _remote.createFile(p));

  @override
  Future<Result<StorageFile>> updateFile(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateFile(id, p));

  @override
  Future<Result<void>> deleteFile(String id) =>
      _delete(() => _remote.deleteFile(id));

  @override
  Future<Result<Cacheable<Paginated<StoragePolicy>>>> listPolicies(ListQuery q) =>
      _paginated(_policyNamespace, q, () => _remote.listPolicies(q),
        StoragePolicyModel.fromJson);

  @override
  Future<Result<StoragePolicy>> getPolicy(String id) =>
      _single(() => _remote.getPolicy(id));

  @override
  Future<Result<StoragePolicy>> createPolicy(Map<String, dynamic> p) =>
      _write(() => _remote.createPolicy(p));

  @override
  Future<Result<StoragePolicy>> updatePolicy(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePolicy(id, p));

  @override
  Future<Result<void>> deletePolicy(String id) =>
      _delete(() => _remote.deletePolicy(id));
}
