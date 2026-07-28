import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/marketplace.dart';
import '../repositories/marketplace_repository.dart';

class ListMarketplaceAppsUseCase extends UseCase<Cacheable<Paginated<MarketplaceApp>>, ListQuery> {
  const ListMarketplaceAppsUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<MarketplaceApp>>>> call(ListQuery params) =>
      _repository.listApps(params);
}

class GetMarketplaceAppUseCase extends UseCase<MarketplaceApp, String> {
  const GetMarketplaceAppUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceApp>> call(String id) => _repository.getApp(id);
}

class SaveMarketplaceAppParams {
  const SaveMarketplaceAppParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveMarketplaceAppUseCase extends UseCase<MarketplaceApp, SaveMarketplaceAppParams> {
  const SaveMarketplaceAppUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceApp>> call(SaveMarketplaceAppParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createApp(params.payload)
        : _repository.updateApp(id, params.payload);
  }
}

class DeleteMarketplaceAppUseCase extends UseCase<void, String> {
  const DeleteMarketplaceAppUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteApp(id);
}

class PublishMarketplaceAppUseCase extends UseCase<MarketplaceApp, String> {
  const PublishMarketplaceAppUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceApp>> call(String id) => _repository.publishApp(id);
}

class UnpublishMarketplaceAppUseCase extends UseCase<MarketplaceApp, String> {
  const UnpublishMarketplaceAppUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceApp>> call(String id) => _repository.unpublishApp(id);
}

class ListMarketplaceReviewsUseCase extends UseCase<Cacheable<Paginated<MarketplaceReview>>, ListQuery> {
  const ListMarketplaceReviewsUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<MarketplaceReview>>>> call(ListQuery params) =>
      _repository.listReviews(params);
}

class CreateMarketplaceReviewUseCase extends UseCase<MarketplaceReview, Map<String, dynamic>> {
  const CreateMarketplaceReviewUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceReview>> call(Map<String, dynamic> params) =>
      _repository.createReview(params);
}

class DeleteMarketplaceReviewUseCase extends UseCase<void, String> {
  const DeleteMarketplaceReviewUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteReview(id);
}

class ListMarketplaceVersionsUseCase extends UseCase<Cacheable<Paginated<MarketplaceAppVersion>>, ListQuery> {
  const ListMarketplaceVersionsUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<MarketplaceAppVersion>>>> call(ListQuery params) =>
      _repository.listVersions(params);
}

class CreateMarketplaceVersionUseCase extends UseCase<MarketplaceAppVersion, Map<String, dynamic>> {
  const CreateMarketplaceVersionUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceAppVersion>> call(Map<String, dynamic> params) =>
      _repository.createVersion(params);
}

class ReleaseMarketplaceVersionUseCase extends UseCase<MarketplaceAppVersion, String> {
  const ReleaseMarketplaceVersionUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceAppVersion>> call(String id) => _repository.releaseVersion(id);
}

class ListMarketplaceSubmissionsUseCase extends UseCase<Cacheable<Paginated<MarketplaceSubmission>>, ListQuery> {
  const ListMarketplaceSubmissionsUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<MarketplaceSubmission>>>> call(ListQuery params) =>
      _repository.listSubmissions(params);
}

class GetMarketplaceSubmissionUseCase extends UseCase<MarketplaceSubmission, String> {
  const GetMarketplaceSubmissionUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceSubmission>> call(String id) => _repository.getSubmission(id);
}

class CreateMarketplaceSubmissionUseCase extends UseCase<MarketplaceSubmission, Map<String, dynamic>> {
  const CreateMarketplaceSubmissionUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceSubmission>> call(Map<String, dynamic> params) =>
      _repository.createSubmission(params);
}

class ReviewMarketplaceSubmissionParams {
  const ReviewMarketplaceSubmissionParams({required this.id, required this.decision, this.notes});
  final String id;
  final String decision;
  final String? notes;
}

class ReviewMarketplaceSubmissionUseCase extends UseCase<MarketplaceSubmission, ReviewMarketplaceSubmissionParams> {
  const ReviewMarketplaceSubmissionUseCase(this._repository);
  final MarketplaceRepository _repository;
  @override
  Future<Result<MarketplaceSubmission>> call(ReviewMarketplaceSubmissionParams params) =>
      _repository.reviewSubmission(params.id, params.decision, params.notes);
}