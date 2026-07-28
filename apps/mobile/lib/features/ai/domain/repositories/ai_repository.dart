import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/ai.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class AiRepository {
  Future<Result<Cacheable<Paginated<AiModel>>>> listModels(ListQuery query);
  Future<Result<AiModel>> getModel(String id);
  Future<Result<AiModel>> createModel(Map<String, dynamic> payload);
  Future<Result<AiModel>> updateModel(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteModel(String id);

  Future<Result<Cacheable<Paginated<AiPrompt>>>> listPrompts(ListQuery query);
  Future<Result<AiPrompt>> getPrompt(String id);
  Future<Result<AiPrompt>> createPrompt(Map<String, dynamic> payload);
  Future<Result<AiPrompt>> updatePrompt(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePrompt(String id);

  Future<Result<Cacheable<Paginated<AiTrainingData>>>> listTrainingData(ListQuery query);
  Future<Result<AiTrainingData>> getTrainingData(String id);
  Future<Result<AiTrainingData>> createTrainingData(Map<String, dynamic> payload);
  Future<Result<void>> deleteTrainingData(String id);

  Future<Result<Cacheable<Paginated<AiPrediction>>>> listPredictions(ListQuery query);
  Future<Result<AiPrediction>> createPrediction(Map<String, dynamic> payload);
}
