import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/advanced_finance_models.dart';

abstract class AdvancedFinanceRemoteDataSource {
  Future<Paginated<MultiCurrencyRateModel>> listMultiCurrencyRates(ListQuery query);
  Future<MultiCurrencyRateModel> getMultiCurrencyRate(String id);
  Future<MultiCurrencyRateModel> createMultiCurrencyRate(Map<String, dynamic> payload);
  Future<MultiCurrencyRateModel> updateMultiCurrencyRate(String id, Map<String, dynamic> payload);
  Future<void> deleteMultiCurrencyRate(String id);

  Future<Paginated<ConsolidationReportModel>> listConsolidationReports(ListQuery query);
  Future<ConsolidationReportModel> getConsolidationReport(String id);
  Future<ConsolidationReportModel> createConsolidationReport(Map<String, dynamic> payload);

  Future<Paginated<IntercompanyAgreementModel>> listIntercompanyAgreements(ListQuery query);
  Future<IntercompanyAgreementModel> getIntercompanyAgreement(String id);
  Future<IntercompanyAgreementModel> createIntercompanyAgreement(Map<String, dynamic> payload);

  Future<Paginated<CostAllocationModel>> listCostAllocations(ListQuery query);
  Future<CostAllocationModel> getCostAllocation(String id);
  Future<CostAllocationModel> createCostAllocation(Map<String, dynamic> payload);
  Future<CostAllocationModel> updateCostAllocation(String id, Map<String, dynamic> payload);

  Future<Paginated<RevenueRecognitionEntryModel>> listRevenueRecognitionEntries(ListQuery query);
  Future<RevenueRecognitionEntryModel> getRevenueRecognitionEntry(String id);
  Future<RevenueRecognitionEntryModel> createRevenueRecognitionEntry(Map<String, dynamic> payload);
  Future<RevenueRecognitionEntryModel> recognizeRevenue(String id);

  Future<Paginated<BudgetVersionModel>> listBudgetVersions(ListQuery query);
  Future<BudgetVersionModel> getBudgetVersion(String id);
  Future<BudgetVersionModel> createBudgetVersion(Map<String, dynamic> payload);

  Future<Paginated<FinancialCloseTaskModel>> listFinancialCloseTasks(ListQuery query);
  Future<FinancialCloseTaskModel> getFinancialCloseTask(String id);
  Future<FinancialCloseTaskModel> createFinancialCloseTask(Map<String, dynamic> payload);
  Future<FinancialCloseTaskModel> completeFinancialCloseTask(String id);

  Future<Paginated<AuditTrailEntryModel>> listAuditTrails(ListQuery query);
  Future<AuditTrailEntryModel> getAuditTrail(String id);
}

class AdvancedFinanceRemoteDataSourceImpl implements AdvancedFinanceRemoteDataSource {
  const AdvancedFinanceRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<MultiCurrencyRateModel>> listMultiCurrencyRates(ListQuery query) =>
      _client.getPaginated<MultiCurrencyRateModel>(
        ApiPaths.multiCurrencyRates, query, MultiCurrencyRateModel.fromJson);

  @override
  Future<MultiCurrencyRateModel> getMultiCurrencyRate(String id) async =>
      MultiCurrencyRateModel.fromJson(await _client.getObject(ApiPaths.multiCurrencyRates));

  @override
  Future<MultiCurrencyRateModel> createMultiCurrencyRate(Map<String, dynamic> payload) async =>
      MultiCurrencyRateModel.fromJson(
        await _client.post(ApiPaths.multiCurrencyRates, body: payload));

  @override
  Future<MultiCurrencyRateModel> updateMultiCurrencyRate(
    String id, Map<String, dynamic> payload) async =>
      MultiCurrencyRateModel.fromJson(
        await _client.patch(ApiPaths.multiCurrencyRates, body: payload));

  @override
  Future<void> deleteMultiCurrencyRate(String id) =>
      _client.delete(ApiPaths.multiCurrencyRates);

  @override
  Future<Paginated<ConsolidationReportModel>> listConsolidationReports(ListQuery query) =>
      _client.getPaginated<ConsolidationReportModel>(
        ApiPaths.consolidationReports, query, ConsolidationReportModel.fromJson);

  @override
  Future<ConsolidationReportModel> getConsolidationReport(String id) async =>
      ConsolidationReportModel.fromJson(
        await _client.getObject(ApiPaths.consolidationReports));

  @override
  Future<ConsolidationReportModel> createConsolidationReport(Map<String, dynamic> payload) async =>
      ConsolidationReportModel.fromJson(
        await _client.post(ApiPaths.consolidationReports, body: payload));

  @override
  Future<Paginated<IntercompanyAgreementModel>> listIntercompanyAgreements(ListQuery query) =>
      _client.getPaginated<IntercompanyAgreementModel>(
        ApiPaths.intercompanyAgreements, query, IntercompanyAgreementModel.fromJson);

  @override
  Future<IntercompanyAgreementModel> getIntercompanyAgreement(String id) async =>
      IntercompanyAgreementModel.fromJson(
        await _client.getObject(ApiPaths.intercompanyAgreements));

  @override
  Future<IntercompanyAgreementModel> createIntercompanyAgreement(Map<String, dynamic> payload) async =>
      IntercompanyAgreementModel.fromJson(
        await _client.post(ApiPaths.intercompanyAgreements, body: payload));

  @override
  Future<Paginated<CostAllocationModel>> listCostAllocations(ListQuery query) =>
      _client.getPaginated<CostAllocationModel>(
        ApiPaths.costAllocations, query, CostAllocationModel.fromJson);

  @override
  Future<CostAllocationModel> getCostAllocation(String id) async =>
      CostAllocationModel.fromJson(await _client.getObject(ApiPaths.costAllocations));

  @override
  Future<CostAllocationModel> createCostAllocation(Map<String, dynamic> payload) async =>
      CostAllocationModel.fromJson(
        await _client.post(ApiPaths.costAllocations, body: payload));

  @override
  Future<CostAllocationModel> updateCostAllocation(
    String id, Map<String, dynamic> payload) async =>
      CostAllocationModel.fromJson(
        await _client.patch(ApiPaths.costAllocations, body: payload));

  @override
  Future<Paginated<RevenueRecognitionEntryModel>> listRevenueRecognitionEntries(ListQuery query) =>
      _client.getPaginated<RevenueRecognitionEntryModel>(
        ApiPaths.revenueRecognition, query, RevenueRecognitionEntryModel.fromJson);

  @override
  Future<RevenueRecognitionEntryModel> getRevenueRecognitionEntry(String id) async =>
      RevenueRecognitionEntryModel.fromJson(
        await _client.getObject(ApiPaths.revenueRecognition));

  @override
  Future<RevenueRecognitionEntryModel> createRevenueRecognitionEntry(
    Map<String, dynamic> payload) async =>
      RevenueRecognitionEntryModel.fromJson(
        await _client.post(ApiPaths.revenueRecognition, body: payload));

  @override
  Future<RevenueRecognitionEntryModel> recognizeRevenue(String id) async =>
      RevenueRecognitionEntryModel.fromJson(
        await _client.post(ApiPaths.revenueRecognition));

  @override
  Future<Paginated<BudgetVersionModel>> listBudgetVersions(ListQuery query) =>
      _client.getPaginated<BudgetVersionModel>(
        ApiPaths.budgetVersions, query, BudgetVersionModel.fromJson);

  @override
  Future<BudgetVersionModel> getBudgetVersion(String id) async =>
      BudgetVersionModel.fromJson(await _client.getObject(ApiPaths.budgetVersions));

  @override
  Future<BudgetVersionModel> createBudgetVersion(Map<String, dynamic> payload) async =>
      BudgetVersionModel.fromJson(
        await _client.post(ApiPaths.budgetVersions, body: payload));

  @override
  Future<Paginated<FinancialCloseTaskModel>> listFinancialCloseTasks(ListQuery query) =>
      _client.getPaginated<FinancialCloseTaskModel>(
        ApiPaths.financialCloseTasks, query, FinancialCloseTaskModel.fromJson);

  @override
  Future<FinancialCloseTaskModel> getFinancialCloseTask(String id) async =>
      FinancialCloseTaskModel.fromJson(
        await _client.getObject(ApiPaths.financialCloseTasks));

  @override
  Future<FinancialCloseTaskModel> createFinancialCloseTask(Map<String, dynamic> payload) async =>
      FinancialCloseTaskModel.fromJson(
        await _client.post(ApiPaths.financialCloseTasks, body: payload));

  @override
  Future<FinancialCloseTaskModel> completeFinancialCloseTask(String id) async =>
      FinancialCloseTaskModel.fromJson(
        await _client.post(ApiPaths.financialCloseTasks));

  @override
  Future<Paginated<AuditTrailEntryModel>> listAuditTrails(ListQuery query) =>
      _client.getPaginated<AuditTrailEntryModel>(
        ApiPaths.auditTrails, query, AuditTrailEntryModel.fromJson);

  @override
  Future<AuditTrailEntryModel> getAuditTrail(String id) async =>
      AuditTrailEntryModel.fromJson(await _client.getObject(ApiPaths.auditTrails));
}
