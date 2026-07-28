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

  Future<Paginated<BudgetModel>> listBudgets(ListQuery query);

  Future<BudgetModel> getBudget(String id);

  Future<Map<String, dynamic>> getBudgetVsActuals(String id);

  Future<Map<String, dynamic>> getArAgingReport();

  Future<Map<String, dynamic>> getGlReport();

  Future<Map<String, dynamic>> getTrialBalance();

  Future<Map<String, dynamic>> getPnlReport();

  Future<Map<String, dynamic>> getBalanceSheet();

  Future<Paginated<Map<String, dynamic>>> listJournalEntries(ListQuery query);

  Future<Map<String, dynamic>> createJournalEntry(Map<String, dynamic> payload);

  Future<Map<String, dynamic>> getJournalEntry(String id);

  Future<Map<String, dynamic>> postJournalEntry(String id);

  Future<List<Map<String, dynamic>>> getChartOfAccounts();
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
  Future<Map<String, dynamic>> getBudgetVsActuals(String id) async =>
      await _client.getObject(ApiPaths.budgetVsActuals(id));

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

  @override
  Future<Paginated<Map<String, dynamic>>> listJournalEntries(ListQuery query) =>
      _client.getPaginated<Map<String, dynamic>>(
        ApiPaths.journalEntries,
        query,
        (Map<String, dynamic> json) => json,
      );

  @override
  Future<Map<String, dynamic>> createJournalEntry(
    Map<String, dynamic> payload,
  ) async =>
      await _client.post(ApiPaths.journalEntries, body: payload);

  @override
  Future<Map<String, dynamic>> getJournalEntry(String id) async =>
      await _client.getObject(ApiPaths.journalEntry(id));

  @override
  Future<Map<String, dynamic>> postJournalEntry(String id) async =>
      await _client.post(ApiPaths.journalEntryPost(id));

  @override
  Future<List<Map<String, dynamic>>> getChartOfAccounts() async =>
      await _client.getList(ApiPaths.chartOfAccounts);
}
