import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/search_models.dart';

abstract class SearchRemoteDataSource {
  Future<Paginated<SearchResultModel>> search(ListQuery query);
  Future<Paginated<SearchIndexConfigModel>> listIndexConfigs(ListQuery query);
  Future<SearchIndexConfigModel> updateIndexConfig(String id, Map<String, dynamic> payload);
  Future<Paginated<SearchSynonymGroupModel>> listSynonyms(ListQuery query);
  Future<SearchSynonymGroupModel> createSynonym(Map<String, dynamic> payload);
  Future<SearchSynonymGroupModel> updateSynonym(String id, Map<String, dynamic> payload);
  Future<void> deleteSynonym(String id);
}

class SearchRemoteDataSourceImpl implements SearchRemoteDataSource {
  const SearchRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<SearchResultModel>> search(ListQuery query) =>
      _client.getPaginated<SearchResultModel>(
        ApiPaths.searchQuery, query, SearchResultModel.fromJson,);

  @override
  Future<Paginated<SearchIndexConfigModel>> listIndexConfigs(ListQuery query) =>
      _client.getPaginated<SearchIndexConfigModel>(
        ApiPaths.searchIndexConfig, query, SearchIndexConfigModel.fromJson,);

  @override
  Future<SearchIndexConfigModel> updateIndexConfig(String id, Map<String, dynamic> payload) async =>
      SearchIndexConfigModel.fromJson(
        await _client.patch('${ApiPaths.searchIndexConfig}/$id', body: payload),);

  @override
  Future<Paginated<SearchSynonymGroupModel>> listSynonyms(ListQuery query) =>
      _client.getPaginated<SearchSynonymGroupModel>(
        ApiPaths.searchSynonyms, query, SearchSynonymGroupModel.fromJson,);

  @override
  Future<SearchSynonymGroupModel> createSynonym(Map<String, dynamic> payload) async =>
      SearchSynonymGroupModel.fromJson(
        await _client.post(ApiPaths.searchSynonyms, body: payload),);

  @override
  Future<SearchSynonymGroupModel> updateSynonym(String id, Map<String, dynamic> payload) async =>
      SearchSynonymGroupModel.fromJson(
        await _client.patch(ApiPaths.searchSynonym(id), body: payload),);

  @override
  Future<void> deleteSynonym(String id) =>
      _client.delete(ApiPaths.searchSynonym(id));
}
