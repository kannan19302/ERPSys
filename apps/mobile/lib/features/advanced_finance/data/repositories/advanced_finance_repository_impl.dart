import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/advanced_finance.dart';
import '../../domain/repositories/advanced_finance_repository.dart';
import '../datasources/advanced_finance_remote_data_source.dart';
import '../models/advanced_finance_models.dart';

class AdvancedFinanceRepositoryImpl implements AdvancedFinanceRepository {
  const AdvancedFinanceRepositoryImpl({
    required AdvancedFinanceRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _mcRateNamespace = 'advanced-finance.currency-rates';
  static const String _consolidationNamespace = 'advanced-finance.consolidation';
  static const String _intercompanyNamespace = 'advanced-finance.intercompany';
  static const String _costAllocNamespace = 'advanced-finance.cost-allocations';
  static const String _revenueRecogNamespace = 'advanced-finance.revenue-recognition';
  static const String _budgetVersionNamespace = 'advanced-finance.budget-versions';
  static const String _closeTaskNamespace = 'advanced-finance.close-tasks';
  static const String _auditTrailNamespace = 'advanced-finance.audit-trails';

  final AdvancedFinanceRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<MultiCurrencyRate>>>> listMultiCurrencyRates(
    ListQuery query,) =>
      _paginated(_mcRateNamespace, query, () => _remote.listMultiCurrencyRates(query),
        MultiCurrencyRateModel.fromJson,);

  @override
  Future<Result<MultiCurrencyRate>> getMultiCurrencyRate(String id) =>
      _single(() => _remote.getMultiCurrencyRate(id));

  @override
  Future<Result<MultiCurrencyRate>> createMultiCurrencyRate(Map<String, dynamic> p) =>
      _write(() => _remote.createMultiCurrencyRate(p));

  @override
  Future<Result<MultiCurrencyRate>> updateMultiCurrencyRate(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateMultiCurrencyRate(id, p));

  @override
  Future<Result<void>> deleteMultiCurrencyRate(String id) =>
      _delete(() => _remote.deleteMultiCurrencyRate(id));

  @override
  Future<Result<Cacheable<Paginated<ConsolidationReport>>>> listConsolidationReports(
    ListQuery query,) =>
      _paginated(_consolidationNamespace, query,
        () => _remote.listConsolidationReports(query),
        ConsolidationReportModel.fromJson,);

  @override
  Future<Result<ConsolidationReport>> getConsolidationReport(String id) =>
      _single(() => _remote.getConsolidationReport(id));

  @override
  Future<Result<ConsolidationReport>> createConsolidationReport(Map<String, dynamic> p) =>
      _write(() => _remote.createConsolidationReport(p));

  @override
  Future<Result<Cacheable<Paginated<IntercompanyAgreement>>>> listIntercompanyAgreements(
    ListQuery query,) =>
      _paginated(_intercompanyNamespace, query,
        () => _remote.listIntercompanyAgreements(query),
        IntercompanyAgreementModel.fromJson,);

  @override
  Future<Result<IntercompanyAgreement>> getIntercompanyAgreement(String id) =>
      _single(() => _remote.getIntercompanyAgreement(id));

  @override
  Future<Result<IntercompanyAgreement>> createIntercompanyAgreement(Map<String, dynamic> p) =>
      _write(() => _remote.createIntercompanyAgreement(p));

  @override
  Future<Result<Cacheable<Paginated<CostAllocation>>>> listCostAllocations(
    ListQuery query,) =>
      _paginated(_costAllocNamespace, query, () => _remote.listCostAllocations(query),
        CostAllocationModel.fromJson,);

  @override
  Future<Result<CostAllocation>> getCostAllocation(String id) =>
      _single(() => _remote.getCostAllocation(id));

  @override
  Future<Result<CostAllocation>> createCostAllocation(Map<String, dynamic> p) =>
      _write(() => _remote.createCostAllocation(p));

  @override
  Future<Result<CostAllocation>> updateCostAllocation(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateCostAllocation(id, p));

  @override
  Future<Result<Cacheable<Paginated<RevenueRecognitionEntry>>>> listRevenueRecognitionEntries(
    ListQuery query,) =>
      _paginated(_revenueRecogNamespace, query,
        () => _remote.listRevenueRecognitionEntries(query),
        RevenueRecognitionEntryModel.fromJson,);

  @override
  Future<Result<RevenueRecognitionEntry>> getRevenueRecognitionEntry(String id) =>
      _single(() => _remote.getRevenueRecognitionEntry(id));

  @override
  Future<Result<RevenueRecognitionEntry>> createRevenueRecognitionEntry(Map<String, dynamic> p) =>
      _write(() => _remote.createRevenueRecognitionEntry(p));

  @override
  Future<Result<RevenueRecognitionEntry>> recognizeRevenue(String id) =>
      _single(() => _remote.recognizeRevenue(id));

  @override
  Future<Result<Cacheable<Paginated<BudgetVersion>>>> listBudgetVersions(
    ListQuery query,) =>
      _paginated(_budgetVersionNamespace, query, () => _remote.listBudgetVersions(query),
        BudgetVersionModel.fromJson,);

  @override
  Future<Result<BudgetVersion>> getBudgetVersion(String id) =>
      _single(() => _remote.getBudgetVersion(id));

  @override
  Future<Result<BudgetVersion>> createBudgetVersion(Map<String, dynamic> p) =>
      _write(() => _remote.createBudgetVersion(p));

  @override
  Future<Result<Cacheable<Paginated<FinancialCloseTask>>>> listFinancialCloseTasks(
    ListQuery query,) =>
      _paginated(_closeTaskNamespace, query, () => _remote.listFinancialCloseTasks(query),
        FinancialCloseTaskModel.fromJson,);

  @override
  Future<Result<FinancialCloseTask>> getFinancialCloseTask(String id) =>
      _single(() => _remote.getFinancialCloseTask(id));

  @override
  Future<Result<FinancialCloseTask>> createFinancialCloseTask(Map<String, dynamic> p) =>
      _write(() => _remote.createFinancialCloseTask(p));

  @override
  Future<Result<FinancialCloseTask>> completeFinancialCloseTask(String id) =>
      _single(() => _remote.completeFinancialCloseTask(id));

  @override
  Future<Result<Cacheable<Paginated<AuditTrailEntry>>>> listAuditTrails(
    ListQuery query,) =>
      _paginated(_auditTrailNamespace, query, () => _remote.listAuditTrails(query),
        AuditTrailEntryModel.fromJson,);

  @override
  Future<Result<AuditTrailEntry>> getAuditTrail(String id) =>
      _single(() => _remote.getAuditTrail(id));
}
