import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/ai.dart';
import '../repositories/ai_repository.dart';

class ListAiModelsUseCase extends UseCase<Cacheable<Paginated<AiModel>>, ListQuery> {
  const ListAiModelsUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AiModel>>>> call(ListQuery params) =>
      _repository.listModels(params);
}

class GetAiModelUseCase extends UseCase<AiModel, String> {
  const GetAiModelUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<AiModel>> call(String id) => _repository.getModel(id);
}

class SaveAiModelParams {
  const SaveAiModelParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveAiModelUseCase extends UseCase<AiModel, SaveAiModelParams> {
  const SaveAiModelUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<AiModel>> call(SaveAiModelParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createModel(params.payload)
        : _repository.updateModel(id, params.payload);
  }
}

class DeleteAiModelUseCase extends UseCase<void, String> {
  const DeleteAiModelUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteModel(id);
}

class ListAiPromptsUseCase extends UseCase<Cacheable<Paginated<AiPrompt>>, ListQuery> {
  const ListAiPromptsUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AiPrompt>>>> call(ListQuery params) =>
      _repository.listPrompts(params);
}

class GetAiPromptUseCase extends UseCase<AiPrompt, String> {
  const GetAiPromptUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<AiPrompt>> call(String id) => _repository.getPrompt(id);
}

class SaveAiPromptParams {
  const SaveAiPromptParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveAiPromptUseCase extends UseCase<AiPrompt, SaveAiPromptParams> {
  const SaveAiPromptUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<AiPrompt>> call(SaveAiPromptParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPrompt(params.payload)
        : _repository.updatePrompt(id, params.payload);
  }
}

class DeleteAiPromptUseCase extends UseCase<void, String> {
  const DeleteAiPromptUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePrompt(id);
}

class ListAiTrainingDataUseCase extends UseCase<Cacheable<Paginated<AiTrainingData>>, ListQuery> {
  const ListAiTrainingDataUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AiTrainingData>>>> call(ListQuery params) =>
      _repository.listTrainingData(params);
}

class GetAiTrainingDataUseCase extends UseCase<AiTrainingData, String> {
  const GetAiTrainingDataUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<AiTrainingData>> call(String id) => _repository.getTrainingData(id);
}

class SaveAiTrainingDataUseCase extends UseCase<AiTrainingData, Map<String, dynamic>> {
  const SaveAiTrainingDataUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<AiTrainingData>> call(Map<String, dynamic> params) =>
      _repository.createTrainingData(params);
}

class DeleteAiTrainingDataUseCase extends UseCase<void, String> {
  const DeleteAiTrainingDataUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteTrainingData(id);
}

class ListAiPredictionsUseCase extends UseCase<Cacheable<Paginated<AiPrediction>>, ListQuery> {
  const ListAiPredictionsUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AiPrediction>>>> call(ListQuery params) =>
      _repository.listPredictions(params);
}

class CreateAiPredictionUseCase extends UseCase<AiPrediction, Map<String, dynamic>> {
  const CreateAiPredictionUseCase(this._repository);
  final AiRepository _repository;
  @override
  Future<Result<AiPrediction>> call(Map<String, dynamic> params) =>
      _repository.createPrediction(params);
}


class SaveAiTrainingDataParams {
  const SaveAiTrainingDataParams({this.id, required this.payload});
  final String? id;
  final Map<String, dynamic> payload;
}
class SaveAiPredictionParams {
  const SaveAiPredictionParams({this.id, required this.payload});
  final String? id;
  final Map<String, dynamic> payload;
}
class SaveAiPredictionUseCase extends UseCase<AiPrediction, Map<String, dynamic>> {
  SaveAiPredictionUseCase(this.repository);
  final AiRepository repository;
  @override
  Future<Result<AiPrediction>> call(Map<String, dynamic> params) async => throw UnimplementedError();
}
class GetAiPredictionUseCase extends UseCase<AiPrediction, String> {
  GetAiPredictionUseCase(this.repository);
  final AiRepository repository;
  @override
  Future<Result<AiPrediction>> call(String params) async => throw UnimplementedError();
}

