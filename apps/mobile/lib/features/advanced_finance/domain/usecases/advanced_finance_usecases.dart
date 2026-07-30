import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/advanced_finance.dart';
import '../repositories/advanced_finance_repository.dart';

class ListMultiCurrencyRatesUseCase extends UseCase<Cacheable<Paginated<MultiCurrencyRate>>, ListQuery> {
  const ListMultiCurrencyRatesUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<MultiCurrencyRate>>>> call(ListQuery params) =>
      _repository.listMultiCurrencyRates(params);
}

class GetMultiCurrencyRateUseCase extends UseCase<MultiCurrencyRate, String> {
  const GetMultiCurrencyRateUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<MultiCurrencyRate>> call(String id) => _repository.getMultiCurrencyRate(id);
}

class SaveMultiCurrencyRateParams {
  const SaveMultiCurrencyRateParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveMultiCurrencyRateUseCase extends UseCase<MultiCurrencyRate, SaveMultiCurrencyRateParams> {
  const SaveMultiCurrencyRateUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<MultiCurrencyRate>> call(SaveMultiCurrencyRateParams params) {
    final id = params.id;
    return id == null
        ? _repository.createMultiCurrencyRate(params.payload)
        : _repository.updateMultiCurrencyRate(id, params.payload);
  }
}

class DeleteMultiCurrencyRateUseCase extends UseCase<void, String> {
  const DeleteMultiCurrencyRateUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteMultiCurrencyRate(id);
}

class ListConsolidationReportsUseCase extends UseCase<Cacheable<Paginated<ConsolidationReport>>, ListQuery> {
  const ListConsolidationReportsUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ConsolidationReport>>>> call(ListQuery params) =>
      _repository.listConsolidationReports(params);
}

class ListIntercompanyAgreementsUseCase extends UseCase<Cacheable<Paginated<IntercompanyAgreement>>, ListQuery> {
  const ListIntercompanyAgreementsUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<IntercompanyAgreement>>>> call(ListQuery params) =>
      _repository.listIntercompanyAgreements(params);
}

class ListCostAllocationsUseCase extends UseCase<Cacheable<Paginated<CostAllocation>>, ListQuery> {
  const ListCostAllocationsUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<CostAllocation>>>> call(ListQuery params) =>
      _repository.listCostAllocations(params);
}

class ListRevenueRecognitionEntriesUseCase extends UseCase<Cacheable<Paginated<RevenueRecognitionEntry>>, ListQuery> {
  const ListRevenueRecognitionEntriesUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<RevenueRecognitionEntry>>>> call(ListQuery params) =>
      _repository.listRevenueRecognitionEntries(params);
}

class ListBudgetVersionsUseCase extends UseCase<Cacheable<Paginated<BudgetVersion>>, ListQuery> {
  const ListBudgetVersionsUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BudgetVersion>>>> call(ListQuery params) =>
      _repository.listBudgetVersions(params);
}

class ListFinancialCloseTasksUseCase extends UseCase<Cacheable<Paginated<FinancialCloseTask>>, ListQuery> {
  const ListFinancialCloseTasksUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<FinancialCloseTask>>>> call(ListQuery params) =>
      _repository.listFinancialCloseTasks(params);
}

class ListAuditTrailsUseCase extends UseCase<Cacheable<Paginated<AuditTrailEntry>>, ListQuery> {
  const ListAuditTrailsUseCase(this._repository);
  final AdvancedFinanceRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AuditTrailEntry>>>> call(ListQuery params) =>
      _repository.listAuditTrails(params);
}


class SaveFinancialCloseTaskParams {
  const SaveFinancialCloseTaskParams({this.id, required this.payload});
  final String? id;
  final Map<String, dynamic> payload;
}
class SaveFinancialCloseTaskUseCase extends UseCase<FinancialCloseTask, SaveFinancialCloseTaskParams> {
  SaveFinancialCloseTaskUseCase(this.repository);
  final AdvancedFinanceRepository repository;
  @override
  Future<Result<FinancialCloseTask>> call(SaveFinancialCloseTaskParams params) async => throw UnimplementedError();
}
class GetFinancialCloseTaskUseCase extends UseCase<FinancialCloseTask, String> {
  GetFinancialCloseTaskUseCase(this.repository);
  final AdvancedFinanceRepository repository;
  @override
  Future<Result<FinancialCloseTask>> call(String params) async => throw UnimplementedError();
}



class DeleteFinancialCloseTaskUseCase extends UseCase<void, String> {
  DeleteFinancialCloseTaskUseCase(this.repository);
  final AdvancedFinanceRepository repository;
  @override
  Future<Result<void>> call(String params) async => throw UnimplementedError();
}

