import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/advanced_finance.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class AdvancedFinanceRepository {
  Future<Result<Cacheable<Paginated<MultiCurrencyRate>>>> listMultiCurrencyRates(ListQuery query);
  Future<Result<MultiCurrencyRate>> getMultiCurrencyRate(String id);
  Future<Result<MultiCurrencyRate>> createMultiCurrencyRate(Map<String, dynamic> payload);
  Future<Result<MultiCurrencyRate>> updateMultiCurrencyRate(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteMultiCurrencyRate(String id);

  Future<Result<Cacheable<Paginated<ConsolidationReport>>>> listConsolidationReports(ListQuery query);
  Future<Result<ConsolidationReport>> getConsolidationReport(String id);
  Future<Result<ConsolidationReport>> createConsolidationReport(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<IntercompanyAgreement>>>> listIntercompanyAgreements(ListQuery query);
  Future<Result<IntercompanyAgreement>> getIntercompanyAgreement(String id);
  Future<Result<IntercompanyAgreement>> createIntercompanyAgreement(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<CostAllocation>>>> listCostAllocations(ListQuery query);
  Future<Result<CostAllocation>> getCostAllocation(String id);
  Future<Result<CostAllocation>> createCostAllocation(Map<String, dynamic> payload);
  Future<Result<CostAllocation>> updateCostAllocation(String id, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<RevenueRecognitionEntry>>>> listRevenueRecognitionEntries(ListQuery query);
  Future<Result<RevenueRecognitionEntry>> getRevenueRecognitionEntry(String id);
  Future<Result<RevenueRecognitionEntry>> createRevenueRecognitionEntry(Map<String, dynamic> payload);
  Future<Result<RevenueRecognitionEntry>> recognizeRevenue(String id);

  Future<Result<Cacheable<Paginated<BudgetVersion>>>> listBudgetVersions(ListQuery query);
  Future<Result<BudgetVersion>> getBudgetVersion(String id);
  Future<Result<BudgetVersion>> createBudgetVersion(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<FinancialCloseTask>>>> listFinancialCloseTasks(ListQuery query);
  Future<Result<FinancialCloseTask>> getFinancialCloseTask(String id);
  Future<Result<FinancialCloseTask>> createFinancialCloseTask(Map<String, dynamic> payload);
  Future<Result<FinancialCloseTask>> completeFinancialCloseTask(String id);

  Future<Result<Cacheable<Paginated<AuditTrailEntry>>>> listAuditTrails(ListQuery query);
  Future<Result<AuditTrailEntry>> getAuditTrail(String id);
}
