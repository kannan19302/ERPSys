import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/localization_models.dart';

abstract class LocalizationRemoteDataSource {
  Future<Paginated<LocalizationTranslationModel>> listTranslations(ListQuery query);
  Future<LocalizationTranslationModel> createTranslation(Map<String, dynamic> payload);
  Future<LocalizationTranslationModel> updateTranslation(String id, Map<String, dynamic> payload);
  Future<void> deleteTranslation(String id);

  Future<Paginated<LocalizationLanguageModel>> listLanguages(ListQuery query);
  Future<LocalizationLanguageModel> createLanguage(Map<String, dynamic> payload);
  Future<LocalizationLanguageModel> updateLanguage(String id, Map<String, dynamic> payload);
  Future<void> deleteLanguage(String id);

  Future<Paginated<LocalizationRegionModel>> listRegions(ListQuery query);
  Future<LocalizationRegionModel> createRegion(Map<String, dynamic> payload);
  Future<LocalizationRegionModel> updateRegion(String id, Map<String, dynamic> payload);
  Future<void> deleteRegion(String id);
}

class LocalizationRemoteDataSourceImpl implements LocalizationRemoteDataSource {
  const LocalizationRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<LocalizationTranslationModel>> listTranslations(ListQuery query) =>
      _client.getPaginated<LocalizationTranslationModel>(
        ApiPaths.localizationTranslations, query, LocalizationTranslationModel.fromJson,);

  @override
  Future<LocalizationTranslationModel> createTranslation(Map<String, dynamic> payload) async =>
      LocalizationTranslationModel.fromJson(
        await _client.post(ApiPaths.localizationTranslations, body: payload),);

  @override
  Future<LocalizationTranslationModel> updateTranslation(
    String id, Map<String, dynamic> payload,) async =>
      LocalizationTranslationModel.fromJson(
        await _client.patch('${ApiPaths.localizationTranslations}/$id', body: payload),);

  @override
  Future<void> deleteTranslation(String id) =>
      _client.delete('${ApiPaths.localizationTranslations}/$id');

  @override
  Future<Paginated<LocalizationLanguageModel>> listLanguages(ListQuery query) =>
      _client.getPaginated<LocalizationLanguageModel>(
        ApiPaths.localizationLanguages, query, LocalizationLanguageModel.fromJson,);

  @override
  Future<LocalizationLanguageModel> createLanguage(Map<String, dynamic> payload) async =>
      LocalizationLanguageModel.fromJson(
        await _client.post(ApiPaths.localizationLanguages, body: payload),);

  @override
  Future<LocalizationLanguageModel> updateLanguage(
    String id, Map<String, dynamic> payload,) async =>
      LocalizationLanguageModel.fromJson(
        await _client.patch('${ApiPaths.localizationLanguages}/$id', body: payload),);

  @override
  Future<void> deleteLanguage(String id) =>
      _client.delete('${ApiPaths.localizationLanguages}/$id');

  @override
  Future<Paginated<LocalizationRegionModel>> listRegions(ListQuery query) =>
      _client.getPaginated<LocalizationRegionModel>(
        ApiPaths.localizationRegions, query, LocalizationRegionModel.fromJson,);

  @override
  Future<LocalizationRegionModel> createRegion(Map<String, dynamic> payload) async =>
      LocalizationRegionModel.fromJson(
        await _client.post(ApiPaths.localizationRegions, body: payload),);

  @override
  Future<LocalizationRegionModel> updateRegion(
    String id, Map<String, dynamic> payload,) async =>
      LocalizationRegionModel.fromJson(
        await _client.patch('${ApiPaths.localizationRegions}/$id', body: payload),);

  @override
  Future<void> deleteRegion(String id) =>
      _client.delete('${ApiPaths.localizationRegions}/$id');
}
