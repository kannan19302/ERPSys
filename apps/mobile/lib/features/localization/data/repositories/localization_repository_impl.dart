import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/localization.dart';
import '../../domain/repositories/localization_repository.dart';
import '../datasources/localization_remote_data_source.dart';
import '../models/localization_models.dart';

class LocalizationRepositoryImpl implements LocalizationRepository {
  const LocalizationRepositoryImpl({
    required LocalizationRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _translationNamespace = 'localization.translations';
  static const String _languageNamespace = 'localization.languages';
  static const String _regionNamespace = 'localization.regions';

  final LocalizationRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<LocalizationTranslation>>>> listTranslations(ListQuery q) =>
      _paginated(_translationNamespace, q, () => _remote.listTranslations(q),
        LocalizationTranslationModel.fromJson,);

  @override
  Future<Result<LocalizationTranslation>> createTranslation(Map<String, dynamic> p) =>
      _write(() => _remote.createTranslation(p));

  @override
  Future<Result<LocalizationTranslation>> updateTranslation(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateTranslation(id, p));

  @override
  Future<Result<void>> deleteTranslation(String id) =>
      _delete(() => _remote.deleteTranslation(id));

  @override
  Future<Result<Cacheable<Paginated<LocalizationLanguage>>>> listLanguages(ListQuery q) =>
      _paginated(_languageNamespace, q, () => _remote.listLanguages(q),
        LocalizationLanguageModel.fromJson,);

  @override
  Future<Result<LocalizationLanguage>> createLanguage(Map<String, dynamic> p) =>
      _write(() => _remote.createLanguage(p));

  @override
  Future<Result<LocalizationLanguage>> updateLanguage(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateLanguage(id, p));

  @override
  Future<Result<void>> deleteLanguage(String id) =>
      _delete(() => _remote.deleteLanguage(id));

  @override
  Future<Result<Cacheable<Paginated<LocalizationRegion>>>> listRegions(ListQuery q) =>
      _paginated(_regionNamespace, q, () => _remote.listRegions(q),
        LocalizationRegionModel.fromJson,);

  @override
  Future<Result<LocalizationRegion>> createRegion(Map<String, dynamic> p) =>
      _write(() => _remote.createRegion(p));

  @override
  Future<Result<LocalizationRegion>> updateRegion(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateRegion(id, p));

  @override
  Future<Result<void>> deleteRegion(String id) =>
      _delete(() => _remote.deleteRegion(id));
}
