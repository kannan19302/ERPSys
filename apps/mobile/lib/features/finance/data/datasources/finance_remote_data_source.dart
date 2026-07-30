import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/finance_models.dart';

abstract class FinanceRemoteDataSource {
  Future<Paginated<InvoiceModel>> listInvoices(ListQuery query);

  Future<InvoiceModel> getInvoice(String id);

  Future<InvoiceModel> createInvoice(Map<String, dynamic> payload);

  Future<InvoiceModel> updateInvoice(String id, Map<String, dynamic> payload);

  Future<void> deleteInvoice(String id);

  Future<InvoiceModel> submitInvoice(String id);

  Future<InvoiceModel> cancelInvoice(String id);

  Future<Paginated<PaymentModel>> listPayments(ListQuery query);

  Future<PaymentModel> getPayment(String id);

  Future<PaymentModel> createPayment(Map<String, dynamic> payload);

  Future<Paginated<CreditNoteModel>> listCreditNotes(ListQuery query);

  Future<CreditNoteModel> getCreditNote(String id);

  Future<Paginated<TaxRateModel>> listTaxRates(ListQuery query);

  Future<TaxRateModel> createTaxRate(Map<String, dynamic> payload);

  Future<TaxRateModel> updateTaxRate(String id, Map<String, dynamic> payload);

  Future<void> deleteTaxRate(String id);

  Future<Paginated<TaxFilingModel>> listTaxFilings(ListQuery query);

  Future<TaxFilingModel> getTaxFiling(String id);

  Future<TaxFilingModel> createTaxFiling(Map<String, dynamic> payload);

  Future<TaxFilingModel> updateTaxFiling(String id, Map<String, dynamic> payload);

  Future<void> deleteTaxFiling(String id);

  Future<TaxFilingModel> submitTaxFiling(String id);

  Future<Paginated<BudgetModel>> listBudgets(ListQuery query);

  Future<BudgetModel> getBudget(String id);

  Future<void> deleteBudget(String id);

  Future<Map<String, dynamic>> getBudgetVsActuals(String id);

  Future<Paginated<ChartOfAccountModel>> listChartOfAccounts(ListQuery query);

  Future<ChartOfAccountModel> getChartOfAccount(String id);

  Future<ChartOfAccountModel> createChartOfAccount(Map<String, dynamic> payload);

  Future<ChartOfAccountModel> updateChartOfAccount(String id, Map<String, dynamic> payload);

  Future<void> deleteChartOfAccount(String id);

  Future<Paginated<JournalEntryModel>> listJournalEntries(ListQuery query);

  Future<JournalEntryModel> getJournalEntry(String id);

  Future<JournalEntryModel> createJournalEntry(Map<String, dynamic> payload);

  Future<JournalEntryModel> updateJournalEntry(String id, Map<String, dynamic> payload);

  Future<void> deleteJournalEntry(String id);

  Future<JournalEntryModel> postJournalEntry(String id);

  Future<Paginated<BankAccountModel>> listBankAccounts(ListQuery query);

  Future<BankAccountModel> getBankAccount(String id);

  Future<BankAccountModel> createBankAccount(Map<String, dynamic> payload);

  Future<BankAccountModel> updateBankAccount(String id, Map<String, dynamic> payload);

  Future<void> deleteBankAccount(String id);

  Future<Map<String, dynamic>> getArAgingReport();

  Future<Map<String, dynamic>> getGlReport();

  Future<Map<String, dynamic>> getTrialBalance();

  Future<Map<String, dynamic>> getPnlReport();

  Future<Map<String, dynamic>> getBalanceSheet();
}

class FinanceRemoteDataSourceImpl implements FinanceRemoteDataSource {
  const FinanceRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<InvoiceModel>> listInvoices(ListQuery query) =>
      _client.getPaginated<InvoiceModel>(
        ApiPaths.invoices,
        query,
        InvoiceModel.fromJson,
      );

  @override
  Future<InvoiceModel> getInvoice(String id) async =>
      InvoiceModel.fromJson(await _client.getObject(ApiPaths.invoice(id)));

  @override
  Future<InvoiceModel> createInvoice(Map<String, dynamic> payload) async =>
      InvoiceModel.fromJson(
        await _client.post(ApiPaths.invoices, body: payload),
      );

  @override
  Future<InvoiceModel> updateInvoice(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      InvoiceModel.fromJson(
        await _client.patch(ApiPaths.invoice(id), body: payload),
      );

  @override
  Future<void> deleteInvoice(String id) => _client.delete(ApiPaths.invoice(id));

  @override
  Future<InvoiceModel> submitInvoice(String id) async =>
      InvoiceModel.fromJson(await _client.post(ApiPaths.invoiceSubmit(id)));

  @override
  Future<InvoiceModel> cancelInvoice(String id) async =>
      InvoiceModel.fromJson(await _client.post(ApiPaths.invoiceCancel(id)));

  @override
  Future<Paginated<PaymentModel>> listPayments(ListQuery query) =>
      _client.getPaginated<PaymentModel>(
        ApiPaths.payments,
        query,
        PaymentModel.fromJson,
      );

  @override
  Future<PaymentModel> getPayment(String id) async =>
      PaymentModel.fromJson(await _client.getObject(ApiPaths.payment(id)));

  @override
  Future<PaymentModel> createPayment(Map<String, dynamic> payload) async =>
      PaymentModel.fromJson(
        await _client.post(ApiPaths.payments, body: payload),
      );

  @override
  Future<Paginated<CreditNoteModel>> listCreditNotes(ListQuery query) =>
      _client.getPaginated<CreditNoteModel>(
        ApiPaths.creditNotes,
        query,
        CreditNoteModel.fromJson,
      );

  @override
  Future<CreditNoteModel> getCreditNote(String id) async =>
      CreditNoteModel.fromJson(await _client.getObject(ApiPaths.creditNote(id)));

  @override
  Future<Paginated<TaxRateModel>> listTaxRates(ListQuery query) =>
      _client.getPaginated<TaxRateModel>(
        ApiPaths.taxRates,
        query,
        TaxRateModel.fromJson,
      );

  @override
  Future<TaxRateModel> createTaxRate(Map<String, dynamic> payload) async =>
      TaxRateModel.fromJson(
        await _client.post(ApiPaths.taxRates, body: payload),
      );

  @override
  Future<TaxRateModel> updateTaxRate(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      TaxRateModel.fromJson(
        await _client.patch(ApiPaths.taxRate(id), body: payload),
      );

  @override
  Future<void> deleteTaxRate(String id) => _client.delete(ApiPaths.taxRate(id));

  @override
  Future<Paginated<BudgetModel>> listBudgets(ListQuery query) =>
      _client.getPaginated<BudgetModel>(
        ApiPaths.budgets,
        query,
        BudgetModel.fromJson,
      );

  @override
  Future<BudgetModel> getBudget(String id) async =>
      BudgetModel.fromJson(await _client.getObject(ApiPaths.budget(id)));

  @override
  Future<void> deleteBudget(String id) => _client.delete(ApiPaths.budget(id));

  @override
  Future<Map<String, dynamic>> getBudgetVsActuals(String id) async =>
      await _client.getObject(ApiPaths.budgetVsActuals(id));

  @override
  Future<Paginated<TaxFilingModel>> listTaxFilings(ListQuery query) =>
      _client.getPaginated<TaxFilingModel>(
        ApiPaths.taxFilings,
        query,
        TaxFilingModel.fromJson,
      );

  @override
  Future<TaxFilingModel> getTaxFiling(String id) async =>
      TaxFilingModel.fromJson(await _client.getObject(ApiPaths.taxFiling(id)));

  @override
  Future<TaxFilingModel> createTaxFiling(Map<String, dynamic> payload) async =>
      TaxFilingModel.fromJson(
        await _client.post(ApiPaths.taxFilings, body: payload),
      );

  @override
  Future<TaxFilingModel> updateTaxFiling(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      TaxFilingModel.fromJson(
        await _client.patch(ApiPaths.taxFiling(id), body: payload),
      );

  @override
  Future<void> deleteTaxFiling(String id) => _client.delete(ApiPaths.taxFiling(id));

  @override
  Future<TaxFilingModel> submitTaxFiling(String id) async =>
      TaxFilingModel.fromJson(await _client.post(ApiPaths.taxFilingSubmit(id)));

  @override
  Future<Paginated<ChartOfAccountModel>> listChartOfAccounts(ListQuery query) =>
      _client.getPaginated<ChartOfAccountModel>(
        ApiPaths.chartOfAccounts,
        query,
        ChartOfAccountModel.fromJson,
      );

  @override
  Future<ChartOfAccountModel> getChartOfAccount(String id) async =>
      ChartOfAccountModel.fromJson(
        await _client.getObject(ApiPaths.chartOfAccount(id)),
      );

  @override
  Future<ChartOfAccountModel> createChartOfAccount(
    Map<String, dynamic> payload,
  ) async =>
      ChartOfAccountModel.fromJson(
        await _client.post(ApiPaths.chartOfAccounts, body: payload),
      );

  @override
  Future<ChartOfAccountModel> updateChartOfAccount(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      ChartOfAccountModel.fromJson(
        await _client.patch(ApiPaths.chartOfAccount(id), body: payload),
      );

  @override
  Future<void> deleteChartOfAccount(String id) =>
      _client.delete(ApiPaths.chartOfAccount(id));

  @override
  Future<Paginated<JournalEntryModel>> listJournalEntries(ListQuery query) =>
      _client.getPaginated<JournalEntryModel>(
        ApiPaths.journalEntries,
        query,
        JournalEntryModel.fromJson,
      );

  @override
  Future<JournalEntryModel> getJournalEntry(String id) async =>
      JournalEntryModel.fromJson(
        await _client.getObject(ApiPaths.journalEntry(id)),
      );

  @override
  Future<JournalEntryModel> createJournalEntry(
    Map<String, dynamic> payload,
  ) async =>
      JournalEntryModel.fromJson(
        await _client.post(ApiPaths.journalEntries, body: payload),
      );

  @override
  Future<JournalEntryModel> updateJournalEntry(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      JournalEntryModel.fromJson(
        await _client.patch(ApiPaths.journalEntry(id), body: payload),
      );

  @override
  Future<void> deleteJournalEntry(String id) =>
      _client.delete(ApiPaths.journalEntry(id));

  @override
  Future<JournalEntryModel> postJournalEntry(String id) async =>
      JournalEntryModel.fromJson(
        await _client.post(ApiPaths.journalEntryPost(id)),
      );

  @override
  Future<Paginated<BankAccountModel>> listBankAccounts(ListQuery query) =>
      _client.getPaginated<BankAccountModel>(
        ApiPaths.bankAccounts,
        query,
        BankAccountModel.fromJson,
      );

  @override
  Future<BankAccountModel> getBankAccount(String id) async =>
      BankAccountModel.fromJson(
        await _client.getObject(ApiPaths.bankAccount(id)),
      );

  @override
  Future<BankAccountModel> createBankAccount(
    Map<String, dynamic> payload,
  ) async =>
      BankAccountModel.fromJson(
        await _client.post(ApiPaths.bankAccounts, body: payload),
      );

  @override
  Future<BankAccountModel> updateBankAccount(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      BankAccountModel.fromJson(
        await _client.patch(ApiPaths.bankAccount(id), body: payload),
      );

  @override
  Future<void> deleteBankAccount(String id) =>
      _client.delete(ApiPaths.bankAccount(id));

  @override
  Future<Map<String, dynamic>> getArAgingReport() async =>
      await _client.getObject(ApiPaths.arAging);

  @override
  Future<Map<String, dynamic>> getGlReport() async =>
      await _client.getObject(ApiPaths.glReport);

  @override
  Future<Map<String, dynamic>> getTrialBalance() async =>
      await _client.getObject(ApiPaths.trialBalance);

  @override
  Future<Map<String, dynamic>> getPnlReport() async =>
      await _client.getObject(ApiPaths.pnlReport);

  @override
  Future<Map<String, dynamic>> getBalanceSheet() async =>
      await _client.getObject(ApiPaths.balanceSheet);
}
