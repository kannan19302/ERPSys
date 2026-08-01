import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/saved_views_models.dart';

abstract class SavedViewsRemoteDataSource {
  Future<Paginated<SavedViewModel>> listSavedViews(ListQuery query);
  Future<SavedViewModel> getSavedView(String id);
  Future<SavedViewModel> createSavedView(Map<String, dynamic> payload);
  Future<SavedViewModel> updateSavedView(String id, Map<String, dynamic> payload);
  Future<void> deleteSavedView(String id);

  Future<Paginated<SavedViewShareModel>> listShares(ListQuery query);
  Future<SavedViewShareModel> createShare(Map<String, dynamic> payload);
  Future<void> deleteShare(String id);
}

class SavedViewsRemoteDataSourceImpl implements SavedViewsRemoteDataSource {
  const SavedViewsRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<SavedViewModel>> listSavedViews(ListQuery query) =>
      _client.getPaginated<SavedViewModel>(
        ApiPaths.savedViews, query, SavedViewModel.fromJson,);

  @override
  Future<SavedViewModel> getSavedView(String id) async =>
      SavedViewModel.fromJson(
        await _client.getObject(ApiPaths.savedView(id)),);

  @override
  Future<SavedViewModel> createSavedView(Map<String, dynamic> payload) async =>
      SavedViewModel.fromJson(
        await _client.post(ApiPaths.savedViews, body: payload),);

  @override
  Future<SavedViewModel> updateSavedView(String id, Map<String, dynamic> payload) async =>
      SavedViewModel.fromJson(
        await _client.patch(ApiPaths.savedView(id), body: payload),);

  @override
  Future<void> deleteSavedView(String id) =>
      _client.delete(ApiPaths.savedView(id));

  @override
  Future<Paginated<SavedViewShareModel>> listShares(ListQuery query) =>
      _client.getPaginated<SavedViewShareModel>(
        ApiPaths.savedViewShares, query, SavedViewShareModel.fromJson,);

  @override
  Future<SavedViewShareModel> createShare(Map<String, dynamic> payload) async =>
      SavedViewShareModel.fromJson(
        await _client.post(ApiPaths.savedViewShares, body: payload),);

  @override
  Future<void> deleteShare(String id) =>
      _client.delete('${ApiPaths.savedViewShares}/$id');
}
