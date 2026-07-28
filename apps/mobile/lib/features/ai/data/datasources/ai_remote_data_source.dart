import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/ai_models.dart';

abstract class AiRemoteDataSource {
  Future<Paginated<AiModelModel>> listModels(ListQuery query);
  Future<AiModelModel> getModel(String id);
  Future<AiModelModel> createModel(Map<String, dynamic> payload);
  Future<AiModelModel> updateModel(String id, Map<String, dynamic> payload);
  Future<void> deleteModel(String id);

  Future<Paginated<AiPromptModel>> listPrompts(ListQuery query);
  Future<AiPromptModel> getPrompt(String id);
  Future<AiPromptModel> createPrompt(Map<String, dynamic> payload);
  Future<AiPromptModel> updatePrompt(String id, Map<String, dynamic> payload);
  Future<void> deletePrompt(String id);

  Future<Paginated<AiTrainingDataModel>> listTrainingData(ListQuery query);
  Future<AiTrainingDataModel> getTrainingData(String id);
  Future<AiTrainingDataModel> createTrainingData(Map<String, dynamic> payload);
  Future<void> deleteTrainingData(String id);

  Future<Paginated<AiPredictionModel>> listPredictions(ListQuery query);
  Future<AiPredictionModel> createPrediction(Map<String, dynamic> payload);
}

class AiRemoteDataSourceImpl implements AiRemoteDataSource {
  const AiRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<AiModelModel>> listModels(ListQuery query) =>
      _client.getPaginated<AiModelModel>(
        ApiPaths.aiModels, query, AiModelModel.fromJson);

  @override
  Future<AiModelModel> getModel(String id) async =>
      AiModelModel.fromJson(
        await _client.getObject(ApiPaths.aiModel(id)));

  @override
  Future<AiModelModel> createModel(Map<String, dynamic> payload) async =>
      AiModelModel.fromJson(
        await _client.post(ApiPaths.aiModels, body: payload));

  @override
  Future<AiModelModel> updateModel(
    String id, Map<String, dynamic> payload) async =>
      AiModelModel.fromJson(
        await _client.patch(ApiPaths.aiModel(id), body: payload));

  @override
  Future<void> deleteModel(String id) =>
      _client.delete(ApiPaths.aiModel(id));

  @override
  Future<Paginated<AiPromptModel>> listPrompts(ListQuery query) =>
      _client.getPaginated<AiPromptModel>(
        ApiPaths.aiPrompts, query, AiPromptModel.fromJson);

  @override
  Future<AiPromptModel> getPrompt(String id) async =>
      AiPromptModel.fromJson(
        await _client.getObject(ApiPaths.aiPrompt(id)));

  @override
  Future<AiPromptModel> createPrompt(Map<String, dynamic> payload) async =>
      AiPromptModel.fromJson(
        await _client.post(ApiPaths.aiPrompts, body: payload));

  @override
  Future<AiPromptModel> updatePrompt(
    String id, Map<String, dynamic> payload) async =>
      AiPromptModel.fromJson(
        await _client.patch(ApiPaths.aiPrompt(id), body: payload));

  @override
  Future<void> deletePrompt(String id) =>
      _client.delete(ApiPaths.aiPrompt(id));

  @override
  Future<Paginated<AiTrainingDataModel>> listTrainingData(ListQuery query) =>
      _client.getPaginated<AiTrainingDataModel>(
        ApiPaths.aiTrainingData, query, AiTrainingDataModel.fromJson);

  @override
  Future<AiTrainingDataModel> getTrainingData(String id) async =>
      AiTrainingDataModel.fromJson(
        await _client.getObject(ApiPaths.aiTrainingDataItem(id)));

  @override
  Future<AiTrainingDataModel> createTrainingData(Map<String, dynamic> payload) async =>
      AiTrainingDataModel.fromJson(
        await _client.post(ApiPaths.aiTrainingData, body: payload));

  @override
  Future<void> deleteTrainingData(String id) =>
      _client.delete(ApiPaths.aiTrainingDataItem(id));

  @override
  Future<Paginated<AiPredictionModel>> listPredictions(ListQuery query) =>
      _client.getPaginated<AiPredictionModel>(
        ApiPaths.aiPredict, query, AiPredictionModel.fromJson);

  @override
  Future<AiPredictionModel> createPrediction(Map<String, dynamic> payload) async =>
      AiPredictionModel.fromJson(
        await _client.post(ApiPaths.aiPredict, body: payload));
}
