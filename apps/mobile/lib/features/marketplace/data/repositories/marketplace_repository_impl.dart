import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/marketplace.dart';
import '../../domain/repositories/marketplace_repository.dart';
import '../datasources/marketplace_remote_data_source.dart';
import '../models/marketplace_models.dart';

class MarketplaceRepositoryImpl implements MarketplaceRepository {
  const MarketplaceRepositoryImpl({
    required MarketplaceRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _appNamespace = 'marketplace.apps';
  static const String _reviewNamespace = 'marketplace.reviews';
  static const String _versionNamespace = 'marketplace.versions';
  static const String _submissionNamespace = 'marketplace.submissions';

  final MarketplaceRemoteDataSource _remote;
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
      final jsonItems = page.data
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
  Future<Result<Cacheable<Paginated<MarketplaceApp>>>> listApps(ListQuery q) =>
      _paginated(_appNamespace, q, () => _remote.listApps(q), MarketplaceAppModel.fromJson);

  @override
  Future<Result<MarketplaceApp>> getApp(String id) => _single(() => _remote.getApp(id));

  @override
  Future<Result<MarketplaceApp>> createApp(Map<String, dynamic> p) =>
      _write(() => _remote.createApp(p));

  @override
  Future<Result<MarketplaceApp>> updateApp(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateApp(id, p));

  @override
  Future<Result<void>> deleteApp(String id) => _delete(() => _remote.deleteApp(id));

  @override
  Future<Result<MarketplaceApp>> publishApp(String id) =>
      _write(() => _remote.publishApp(id));

  @override
  Future<Result<MarketplaceApp>> unpublishApp(String id) =>
      _write(() => _remote.unpublishApp(id));

  @override
  Future<Result<Cacheable<Paginated<MarketplaceReview>>>> listReviews(ListQuery q) =>
      _paginated(_reviewNamespace, q, () => _remote.listReviews(q), MarketplaceReviewModel.fromJson);

  @override
  Future<Result<MarketplaceReview>> getReview(String id) => _single(() => _remote.getReview(id));

  @override
  Future<Result<MarketplaceReview>> createReview(Map<String, dynamic> p) =>
      _write(() => _remote.createReview(p));

  @override
  Future<Result<void>> deleteReview(String id) => _delete(() => _remote.deleteReview(id));

  @override
  Future<Result<Cacheable<Paginated<MarketplaceAppVersion>>>> listVersions(ListQuery q) =>
      _paginated(_versionNamespace, q, () => _remote.listVersions(q), MarketplaceAppVersionModel.fromJson);

  @override
  Future<Result<MarketplaceAppVersion>> createVersion(Map<String, dynamic> p) =>
      _write(() => _remote.createVersion(p));

  @override
  Future<Result<MarketplaceAppVersion>> releaseVersion(String id) =>
      _write(() => _remote.releaseVersion(id));

  @override
  Future<Result<Cacheable<Paginated<MarketplaceSubmission>>>> listSubmissions(ListQuery q) =>
      _paginated(_submissionNamespace, q, () => _remote.listSubmissions(q), MarketplaceSubmissionModel.fromJson);

  @override
  Future<Result<MarketplaceSubmission>> getSubmission(String id) =>
      _single(() => _remote.getSubmission(id));

  @override
  Future<Result<MarketplaceSubmission>> createSubmission(Map<String, dynamic> p) =>
      _write(() => _remote.createSubmission(p));

  @override
  Future<Result<MarketplaceSubmission>> reviewSubmission(String id, String decision, String? notes) =>
      _write(() => _remote.reviewSubmission(id, decision, notes));
}