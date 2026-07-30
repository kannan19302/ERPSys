import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/finance.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});

  final T value;

  final DateTime? cachedAt;

  bool get isFromCache => cachedAt != null;
}

abstract class FinanceRepository {
  Future<Result<Cacheable<Paginated<Invoice>>>> listInvoices(ListQuery query);

  Future<Result<Invoice>> getInvoice(String id);

  Future<Result<Invoice>> createInvoice(Map<String, dynamic> payload);

  Future<Result<Invoice>> updateInvoice(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteInvoice(String id);

  Future<Result<Invoice>> submitInvoice(String id);

  Future<Result<Invoice>> cancelInvoice(String id);

  Future<Result<Cacheable<Paginated<Payment>>>> listPayments(ListQuery query);

  Future<Result<Payment>> getPayment(String id);

  Future<Result<Payment>> createPayment(Map<String, dynamic> payload);

  Future<Result<Paginated<CreditNote>>> listCreditNotes(ListQuery query);

  Future<Result<CreditNote>> getCreditNote(String id);

  Future<Result<Paginated<TaxRate>>> listTaxRates(ListQuery query);

  Future<Result<TaxRate>> createTaxRate(Map<String, dynamic> payload);

  Future<Result<TaxRate>> updateTaxRate(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteTaxRate(String id);

  Future<Result<Paginated<TaxFiling>>> listTaxFilings(ListQuery query);

  Future<Result<TaxFiling>> getTaxFiling(String id);

  Future<Result<TaxFiling>> createTaxFiling(Map<String, dynamic> payload);

  Future<Result<TaxFiling>> updateTaxFiling(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteTaxFiling(String id);

  Future<Result<TaxFiling>> submitTaxFiling(String id);

  Future<Result<Paginated<Budget>>> listBudgets(ListQuery query);

  Future<Result<Budget>> getBudget(String id);

  Future<Result<void>> deleteBudget(String id);

  Future<Result<Map<String, dynamic>>> getBudgetVsActuals(String id);

  Future<Result<Paginated<ChartOfAccount>>> listChartOfAccounts(ListQuery query);

  Future<Result<ChartOfAccount>> getChartOfAccount(String id);

  Future<Result<ChartOfAccount>> createChartOfAccount(Map<String, dynamic> payload);

  Future<Result<ChartOfAccount>> updateChartOfAccount(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteChartOfAccount(String id);

  Future<Result<Paginated<JournalEntry>>> listJournalEntries(ListQuery query);

  Future<Result<JournalEntry>> getJournalEntry(String id);

  Future<Result<JournalEntry>> createJournalEntry(Map<String, dynamic> payload);

  Future<Result<JournalEntry>> updateJournalEntry(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteJournalEntry(String id);

  Future<Result<JournalEntry>> postJournalEntry(String id);

  Future<Result<Paginated<BankAccount>>> listBankAccounts(ListQuery query);

  Future<Result<BankAccount>> getBankAccount(String id);

  Future<Result<BankAccount>> createBankAccount(Map<String, dynamic> payload);

  Future<Result<BankAccount>> updateBankAccount(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteBankAccount(String id);

  Future<Result<Map<String, dynamic>>> getArAgingReport();

  Future<Result<Map<String, dynamic>>> getGlReport();

  Future<Result<Map<String, dynamic>>> getTrialBalance();

  Future<Result<Map<String, dynamic>>> getPnlReport();

  Future<Result<Map<String, dynamic>>> getBalanceSheet();
}
