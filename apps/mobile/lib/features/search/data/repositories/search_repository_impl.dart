import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/search.dart';
import '../../domain/repositories/search_repository.dart';
import '../datasources/search_remote_data_source.dart';
import '../models/search_models.dart';

class SearchRepositoryImpl implements SearchRepository {
  const SearchRepositoryImpl({
    required SearchRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _resultNamespace = 'search.results';
  static const String _configNamespace = 'search.configs';
  static const String _synonymNamespace = 'search.synonyms';

  final SearchRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<SearchResult>>>> search(ListQuery query) =>
      _paginated(_resultNamespace, query, () => _remote.search(query), SearchResultModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<SearchIndexConfig>>>> listIndexConfigs(ListQuery query) =>
      _paginated(_configNamespace, query, () => _remote.listIndexConfigs(query), SearchIndexConfigModel.fromJson);

  @override
  Future<Result<SearchIndexConfig>> updateIndexConfig(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateIndexConfig(id, payload));

  @override
  Future<Result<Cacheable<Paginated<SearchSynonymGroup>>>> listSynonyms(ListQuery query) =>
      _paginated(_synonymNamespace, query, () => _remote.listSynonyms(query), SearchSynonymGroupModel.fromJson);

  @override
  Future<Result<SearchSynonymGroup>> createSynonym(Map<String, dynamic> payload) =>
      _write(() => _remote.createSynonym(payload));

  @override
  Future<Result<SearchSynonymGroup>> updateSynonym(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateSynonym(id, payload));

  @override
  Future<Result<void>> deleteSynonym(String id) =>
      _delete(() => _remote.deleteSynonym(id));
}
