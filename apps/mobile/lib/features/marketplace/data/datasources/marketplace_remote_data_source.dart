import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/marketplace_models.dart';

abstract class MarketplaceRemoteDataSource {
  Future<Paginated<MarketplaceAppModel>> listApps(ListQuery query);
  Future<MarketplaceAppModel> getApp(String id);
  Future<MarketplaceAppModel> createApp(Map<String, dynamic> payload);
  Future<MarketplaceAppModel> updateApp(String id, Map<String, dynamic> payload);
  Future<void> deleteApp(String id);
  Future<MarketplaceAppModel> publishApp(String id);
  Future<MarketplaceAppModel> unpublishApp(String id);

  Future<Paginated<MarketplaceReviewModel>> listReviews(ListQuery query);
  Future<MarketplaceReviewModel> getReview(String id);
  Future<MarketplaceReviewModel> createReview(Map<String, dynamic> payload);
  Future<void> deleteReview(String id);

  Future<Paginated<MarketplaceAppVersionModel>> listVersions(ListQuery query);
  Future<MarketplaceAppVersionModel> createVersion(Map<String, dynamic> payload);
  Future<MarketplaceAppVersionModel> releaseVersion(String id);

  Future<Paginated<MarketplaceSubmissionModel>> listSubmissions(ListQuery query);
  Future<MarketplaceSubmissionModel> getSubmission(String id);
  Future<MarketplaceSubmissionModel> createSubmission(Map<String, dynamic> payload);
  Future<MarketplaceSubmissionModel> reviewSubmission(String id, String decision, String? notes);
}

class MarketplaceRemoteDataSourceImpl implements MarketplaceRemoteDataSource {
  const MarketplaceRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<MarketplaceAppModel>> listApps(ListQuery query) =>
      _client.getPaginated<MarketplaceAppModel>(
        ApiPaths.marketplaceApps, query, MarketplaceAppModel.fromJson);

  @override
  Future<MarketplaceAppModel> getApp(String id) async =>
      MarketplaceAppModel.fromJson(
        await _client.getObject(ApiPaths.marketplaceApp(id)));

  @override
  Future<MarketplaceAppModel> createApp(Map<String, dynamic> payload) async =>
      MarketplaceAppModel.fromJson(
        await _client.post(ApiPaths.marketplaceApps, body: payload));

  @override
  Future<MarketplaceAppModel> updateApp(String id, Map<String, dynamic> payload) async =>
      MarketplaceAppModel.fromJson(
        await _client.patch(ApiPaths.marketplaceApp(id), body: payload));

  @override
  Future<void> deleteApp(String id) =>
      _client.delete(ApiPaths.marketplaceApp(id));

  @override
  Future<MarketplaceAppModel> publishApp(String id) async =>
      MarketplaceAppModel.fromJson(
        await _client.post('${ApiPaths.marketplaceApp(id)}/publish'));

  @override
  Future<MarketplaceAppModel> unpublishApp(String id) async =>
      MarketplaceAppModel.fromJson(
        await _client.post('${ApiPaths.marketplaceApp(id)}/unpublish'));

  @override
  Future<Paginated<MarketplaceReviewModel>> listReviews(ListQuery query) =>
      _client.getPaginated<MarketplaceReviewModel>(
        ApiPaths.marketplaceReviews, query, MarketplaceReviewModel.fromJson);

  @override
  Future<MarketplaceReviewModel> getReview(String id) async =>
      MarketplaceReviewModel.fromJson(
        await _client.getObject(ApiPaths.marketplaceReview(id)));

  @override
  Future<MarketplaceReviewModel> createReview(Map<String, dynamic> payload) async =>
      MarketplaceReviewModel.fromJson(
        await _client.post(ApiPaths.marketplaceReviews, body: payload));

  @override
  Future<void> deleteReview(String id) =>
      _client.delete(ApiPaths.marketplaceReview(id));

  @override
  Future<Paginated<MarketplaceAppVersionModel>> listVersions(ListQuery query) =>
      _client.getPaginated<MarketplaceAppVersionModel>(
        ApiPaths.marketplaceVersions, query, MarketplaceAppVersionModel.fromJson);

  @override
  Future<MarketplaceAppVersionModel> createVersion(Map<String, dynamic> payload) async =>
      MarketplaceAppVersionModel.fromJson(
        await _client.post(ApiPaths.marketplaceVersions, body: payload));

  @override
  Future<MarketplaceAppVersionModel> releaseVersion(String id) async =>
      MarketplaceAppVersionModel.fromJson(
        await _client.post('${ApiPaths.marketplaceVersions}/$id/release'));

  @override
  Future<Paginated<MarketplaceSubmissionModel>> listSubmissions(ListQuery query) =>
      _client.getPaginated<MarketplaceSubmissionModel>(
        ApiPaths.marketplaceSubmissions, query, MarketplaceSubmissionModel.fromJson);

  @override
  Future<MarketplaceSubmissionModel> getSubmission(String id) async =>
      MarketplaceSubmissionModel.fromJson(
        await _client.getObject(ApiPaths.marketplaceSubmission(id)));

  @override
  Future<MarketplaceSubmissionModel> createSubmission(Map<String, dynamic> payload) async =>
      MarketplaceSubmissionModel.fromJson(
        await _client.post(ApiPaths.marketplaceSubmissions, body: payload));

  @override
  Future<MarketplaceSubmissionModel> reviewSubmission(String id, String decision, String? notes) async =>
      MarketplaceSubmissionModel.fromJson(
        await _client.post('${ApiPaths.marketplaceSubmission(id)}/review',
            body: <String, dynamic>{'decision': decision, 'notes': notes}));
}