import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/advanced_hr.dart';
import '../../domain/repositories/advanced_hr_repository.dart';
import '../datasources/advanced_hr_remote_data_source.dart';
import '../models/advanced_hr_models.dart';

class AdvancedHrRepositoryImpl implements AdvancedHrRepository {
  const AdvancedHrRepositoryImpl({
    required AdvancedHrRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _compBandsNamespace = 'advanced-hr.compensation-bands';
  static const String _benefitsNamespace = 'advanced-hr.benefits';
  static const String _successionNamespace = 'advanced-hr.succession';
  static const String _analyticsNamespace = 'advanced-hr.workforce-analytics';
  static const String _learningNamespace = 'advanced-hr.learning-paths';

  final AdvancedHrRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final page = await fetch();
      final jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<CompensationBand>>>> listCompensationBands(
    ListQuery query,) =>
      _paginated(_compBandsNamespace, query, () => _remote.listCompensationBands(query),
        CompensationBandModel.fromJson,);

  @override
  Future<Result<CompensationBand>> getCompensationBand(String id) =>
      _single(() => _remote.getCompensationBand(id));

  @override
  Future<Result<CompensationBand>> createCompensationBand(Map<String, dynamic> p) =>
      _write(() => _remote.createCompensationBand(p));

  @override
  Future<Result<CompensationBand>> updateCompensationBand(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateCompensationBand(id, p));

  @override
  Future<Result<void>> deleteCompensationBand(String id) =>
      _delete(() => _remote.deleteCompensationBand(id));

  @override
  Future<Result<Cacheable<Paginated<BenefitPlan>>>> listBenefitPlans(
    ListQuery query,) =>
      _paginated(_benefitsNamespace, query, () => _remote.listBenefitPlans(query),
        BenefitPlanModel.fromJson,);

  @override
  Future<Result<BenefitPlan>> getBenefitPlan(String id) =>
      _single(() => _remote.getBenefitPlan(id));

  @override
  Future<Result<BenefitPlan>> createBenefitPlan(Map<String, dynamic> p) =>
      _write(() => _remote.createBenefitPlan(p));

  @override
  Future<Result<BenefitPlan>> updateBenefitPlan(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateBenefitPlan(id, p));

  @override
  Future<Result<void>> deleteBenefitPlan(String id) =>
      _delete(() => _remote.deleteBenefitPlan(id));

  @override
  Future<Result<Cacheable<Paginated<SuccessionPlan>>>> listSuccessionPlans(
    ListQuery query,) =>
      _paginated(_successionNamespace, query, () => _remote.listSuccessionPlans(query),
        SuccessionPlanModel.fromJson,);

  @override
  Future<Result<SuccessionPlan>> getSuccessionPlan(String id) =>
      _single(() => _remote.getSuccessionPlan(id));

  @override
  Future<Result<SuccessionPlan>> createSuccessionPlan(Map<String, dynamic> p) =>
      _write(() => _remote.createSuccessionPlan(p));

  @override
  Future<Result<SuccessionPlan>> updateSuccessionPlan(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateSuccessionPlan(id, p));

  @override
  Future<Result<Cacheable<Paginated<WorkforceAnalytic>>>> listWorkforceAnalytics(
    ListQuery query,) =>
      _paginated(_analyticsNamespace, query, () => _remote.listWorkforceAnalytics(query),
        WorkforceAnalyticModel.fromJson,);

  @override
  Future<Result<WorkforceAnalytic>> getWorkforceAnalytic(String id) =>
      _single(() => _remote.getWorkforceAnalytic(id));

  @override
  Future<Result<Cacheable<Paginated<LearningPath>>>> listLearningPaths(
    ListQuery query,) =>
      _paginated(_learningNamespace, query, () => _remote.listLearningPaths(query),
        LearningPathModel.fromJson,);

  @override
  Future<Result<LearningPath>> getLearningPath(String id) =>
      _single(() => _remote.getLearningPath(id));

  @override
  Future<Result<LearningPath>> createLearningPath(Map<String, dynamic> p) =>
      _write(() => _remote.createLearningPath(p));

  @override
  Future<Result<LearningPath>> updateLearningPath(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateLearningPath(id, p));
}
