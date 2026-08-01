import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/pwa.dart';
import '../../domain/repositories/pwa_repository.dart';
import '../datasources/pwa_remote_data_source.dart';
import '../models/pwa_models.dart';

class PwaRepositoryImpl implements PwaRepository {
  const PwaRepositoryImpl({
    required PwaRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _pushNamespace = 'pwa.push-subscriptions';
  static const String _offlineNamespace = 'pwa.offline-queue';

  final PwaRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<PwaPushSubscription>>>> listPushSubscriptions(ListQuery q) =>
      _paginated(_pushNamespace, q, () => _remote.listPushSubscriptions(q),
        PwaPushSubscriptionModel.fromJson,);

  @override
  Future<Result<void>> deletePushSubscription(String id) =>
      _delete(() => _remote.deletePushSubscription(id));

  @override
  Future<Result<PwaManifestConfig>> getManifestConfig() =>
      _single(() => _remote.getManifestConfig());

  @override
  Future<Result<PwaManifestConfig>> updateManifestConfig(Map<String, dynamic> p) =>
      _write(() => _remote.updateManifestConfig(p));

  @override
  Future<Result<Cacheable<Paginated<PwaOfflineQueueItem>>>> listOfflineQueue(ListQuery q) =>
      _paginated(_offlineNamespace, q, () => _remote.listOfflineQueue(q),
        PwaOfflineQueueItemModel.fromJson,);

  @override
  Future<Result<PwaOfflineQueueItem>> getOfflineQueueItem(String id) =>
      _single(() => _remote.getOfflineQueueItem(id));

  @override
  Future<Result<PwaOfflineQueueItem>> retryOfflineQueueItem(String id) =>
      _write(() => _remote.retryOfflineQueueItem(id));
}
