import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/marketplace.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class MarketplaceRepository {
  Future<Result<Cacheable<Paginated<MarketplaceApp>>>> listApps(ListQuery query);
  Future<Result<MarketplaceApp>> getApp(String id);
  Future<Result<MarketplaceApp>> createApp(Map<String, dynamic> payload);
  Future<Result<MarketplaceApp>> updateApp(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteApp(String id);
  Future<Result<MarketplaceApp>> publishApp(String id);
  Future<Result<MarketplaceApp>> unpublishApp(String id);

  Future<Result<Cacheable<Paginated<MarketplaceReview>>>> listReviews(ListQuery query);
  Future<Result<MarketplaceReview>> getReview(String id);
  Future<Result<MarketplaceReview>> createReview(Map<String, dynamic> payload);
  Future<Result<void>> deleteReview(String id);

  Future<Result<Cacheable<Paginated<MarketplaceAppVersion>>>> listVersions(ListQuery query);
  Future<Result<MarketplaceAppVersion>> createVersion(Map<String, dynamic> payload);
  Future<Result<MarketplaceAppVersion>> releaseVersion(String id);

  Future<Result<Cacheable<Paginated<MarketplaceSubmission>>>> listSubmissions(ListQuery query);
  Future<Result<MarketplaceSubmission>> getSubmission(String id);
  Future<Result<MarketplaceSubmission>> createSubmission(Map<String, dynamic> payload);
  Future<Result<MarketplaceSubmission>> reviewSubmission(String id, String decision, String? notes);
}