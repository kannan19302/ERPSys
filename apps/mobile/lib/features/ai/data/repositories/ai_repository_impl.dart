import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/ai.dart';
import '../../domain/repositories/ai_repository.dart';
import '../datasources/ai_remote_data_source.dart';
import '../models/ai_models.dart';

class AiRepositoryImpl implements AiRepository {
  const AiRepositoryImpl({
    required AiRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _modelNamespace = 'ai.models';
  static const String _promptNamespace = 'ai.prompts';
  static const String _trainingNamespace = 'ai.training';
  static const String _predictionNamespace = 'ai.predictions';

  final AiRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<AiModel>>>> listModels(ListQuery query) =>
      _paginated(_modelNamespace, query, () => _remote.listModels(query),
        AiModelModel.fromJson);

  @override
  Future<Result<AiModel>> getModel(String id) =>
      _single(() => _remote.getModel(id));

  @override
  Future<Result<AiModel>> createModel(Map<String, dynamic> p) =>
      _write(() => _remote.createModel(p));

  @override
  Future<Result<AiModel>> updateModel(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateModel(id, p));

  @override
  Future<Result<void>> deleteModel(String id) =>
      _delete(() => _remote.deleteModel(id));

  @override
  Future<Result<Cacheable<Paginated<AiPrompt>>>> listPrompts(ListQuery query) =>
      _paginated(_promptNamespace, query, () => _remote.listPrompts(query),
        AiPromptModel.fromJson);

  @override
  Future<Result<AiPrompt>> getPrompt(String id) =>
      _single(() => _remote.getPrompt(id));

  @override
  Future<Result<AiPrompt>> createPrompt(Map<String, dynamic> p) =>
      _write(() => _remote.createPrompt(p));

  @override
  Future<Result<AiPrompt>> updatePrompt(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePrompt(id, p));

  @override
  Future<Result<void>> deletePrompt(String id) =>
      _delete(() => _remote.deletePrompt(id));

  @override
  Future<Result<Cacheable<Paginated<AiTrainingData>>>> listTrainingData(
    ListQuery query) =>
      _paginated(_trainingNamespace, query, () => _remote.listTrainingData(query),
        AiTrainingDataModel.fromJson);

  @override
  Future<Result<AiTrainingData>> getTrainingData(String id) =>
      _single(() => _remote.getTrainingData(id));

  @override
  Future<Result<AiTrainingData>> createTrainingData(Map<String, dynamic> p) =>
      _write(() => _remote.createTrainingData(p));

  @override
  Future<Result<void>> deleteTrainingData(String id) =>
      _delete(() => _remote.deleteTrainingData(id));

  @override
  Future<Result<Cacheable<Paginated<AiPrediction>>>> listPredictions(
    ListQuery query) =>
      _paginated(_predictionNamespace, query, () => _remote.listPredictions(query),
        AiPredictionModel.fromJson);

  @override
  Future<Result<AiPrediction>> createPrediction(Map<String, dynamic> p) =>
      _write(() => _remote.createPrediction(p));
}
