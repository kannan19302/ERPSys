import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/advanced_hr.dart';
import '../repositories/advanced_hr_repository.dart';

class ListCompensationBandsUseCase extends UseCase<Cacheable<Paginated<CompensationBand>>, ListQuery> {
  const ListCompensationBandsUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<CompensationBand>>>> call(ListQuery params) =>
      _repository.listCompensationBands(params);
}

class GetCompensationBandUseCase extends UseCase<CompensationBand, String> {
  const GetCompensationBandUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<CompensationBand>> call(String id) => _repository.getCompensationBand(id);
}

class SaveCompensationBandParams {
  const SaveCompensationBandParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveCompensationBandUseCase extends UseCase<CompensationBand, SaveCompensationBandParams> {
  const SaveCompensationBandUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<CompensationBand>> call(SaveCompensationBandParams params) {
    final id = params.id;
    return id == null
        ? _repository.createCompensationBand(params.payload)
        : _repository.updateCompensationBand(id, params.payload);
  }
}

class DeleteCompensationBandUseCase extends UseCase<void, String> {
  const DeleteCompensationBandUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteCompensationBand(id);
}

class ListBenefitPlansUseCase extends UseCase<Cacheable<Paginated<BenefitPlan>>, ListQuery> {
  const ListBenefitPlansUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BenefitPlan>>>> call(ListQuery params) =>
      _repository.listBenefitPlans(params);
}

class SaveBenefitPlanParams {
  const SaveBenefitPlanParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveBenefitPlanUseCase extends UseCase<BenefitPlan, SaveBenefitPlanParams> {
  const SaveBenefitPlanUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<BenefitPlan>> call(SaveBenefitPlanParams params) {
    final id = params.id;
    return id == null
        ? _repository.createBenefitPlan(params.payload)
        : _repository.updateBenefitPlan(id, params.payload);
  }
}

class DeleteBenefitPlanUseCase extends UseCase<void, String> {
  const DeleteBenefitPlanUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteBenefitPlan(id);
}

class ListSuccessionPlansUseCase extends UseCase<Cacheable<Paginated<SuccessionPlan>>, ListQuery> {
  const ListSuccessionPlansUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SuccessionPlan>>>> call(ListQuery params) =>
      _repository.listSuccessionPlans(params);
}

class ListWorkforceAnalyticsUseCase extends UseCase<Cacheable<Paginated<WorkforceAnalytic>>, ListQuery> {
  const ListWorkforceAnalyticsUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<WorkforceAnalytic>>>> call(ListQuery params) =>
      _repository.listWorkforceAnalytics(params);
}

class ListLearningPathsUseCase extends UseCase<Cacheable<Paginated<LearningPath>>, ListQuery> {
  const ListLearningPathsUseCase(this._repository);
  final AdvancedHrRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<LearningPath>>>> call(ListQuery params) =>
      _repository.listLearningPaths(params);
}
