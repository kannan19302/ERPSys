import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/saved_views.dart';
import '../../domain/repositories/saved_views_repository.dart';
import '../datasources/saved_views_remote_data_source.dart';
import '../models/saved_views_models.dart';

class SavedViewsRepositoryImpl implements SavedViewsRepository {
  const SavedViewsRepositoryImpl({
    required SavedViewsRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _viewNamespace = 'saved-views.views';
  static const String _shareNamespace = 'saved-views.shares';

  final SavedViewsRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<SavedView>>>> listSavedViews(ListQuery query) =>
      _paginated(_viewNamespace, query, () => _remote.listSavedViews(query), SavedViewModel.fromJson);

  @override
  Future<Result<SavedView>> getSavedView(String id) =>
      _single(() => _remote.getSavedView(id));

  @override
  Future<Result<SavedView>> createSavedView(Map<String, dynamic> payload) =>
      _write(() => _remote.createSavedView(payload));

  @override
  Future<Result<SavedView>> updateSavedView(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateSavedView(id, payload));

  @override
  Future<Result<void>> deleteSavedView(String id) =>
      _delete(() => _remote.deleteSavedView(id));

  @override
  Future<Result<Cacheable<Paginated<SavedViewShare>>>> listShares(ListQuery query) =>
      _paginated(_shareNamespace, query, () => _remote.listShares(query), SavedViewShareModel.fromJson);

  @override
  Future<Result<SavedViewShare>> createShare(Map<String, dynamic> payload) =>
      _write(() => _remote.createShare(payload));

  @override
  Future<Result<void>> deleteShare(String id) =>
      _delete(() => _remote.deleteShare(id));
}
