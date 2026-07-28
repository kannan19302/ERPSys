import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/advanced_hr.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class AdvancedHrRepository {
  Future<Result<Cacheable<Paginated<CompensationBand>>>> listCompensationBands(ListQuery query);
  Future<Result<CompensationBand>> getCompensationBand(String id);
  Future<Result<CompensationBand>> createCompensationBand(Map<String, dynamic> payload);
  Future<Result<CompensationBand>> updateCompensationBand(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteCompensationBand(String id);

  Future<Result<Cacheable<Paginated<BenefitPlan>>>> listBenefitPlans(ListQuery query);
  Future<Result<BenefitPlan>> getBenefitPlan(String id);
  Future<Result<BenefitPlan>> createBenefitPlan(Map<String, dynamic> payload);
  Future<Result<BenefitPlan>> updateBenefitPlan(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteBenefitPlan(String id);

  Future<Result<Cacheable<Paginated<SuccessionPlan>>>> listSuccessionPlans(ListQuery query);
  Future<Result<SuccessionPlan>> getSuccessionPlan(String id);
  Future<Result<SuccessionPlan>> createSuccessionPlan(Map<String, dynamic> payload);
  Future<Result<SuccessionPlan>> updateSuccessionPlan(String id, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<WorkforceAnalytic>>>> listWorkforceAnalytics(ListQuery query);
  Future<Result<WorkforceAnalytic>> getWorkforceAnalytic(String id);

  Future<Result<Cacheable<Paginated<LearningPath>>>> listLearningPaths(ListQuery query);
  Future<Result<LearningPath>> getLearningPath(String id);
  Future<Result<LearningPath>> createLearningPath(Map<String, dynamic> payload);
  Future<Result<LearningPath>> updateLearningPath(String id, Map<String, dynamic> payload);
}
