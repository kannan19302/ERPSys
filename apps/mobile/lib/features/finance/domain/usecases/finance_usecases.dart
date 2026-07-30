import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/finance.dart';
import '../repositories/finance_repository.dart';

// ── Invoices ────────────────────────────────────────────────────────────────

class ListInvoicesUseCase
    extends UseCase<Cacheable<Paginated<Invoice>>, ListQuery> {
  const ListInvoicesUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Invoice>>>> call(ListQuery params) =>
      _repository.listInvoices(params);
}

class GetInvoiceUseCase extends UseCase<Invoice, String> {
  const GetInvoiceUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Invoice>> call(String id) => _repository.getInvoice(id);
}

class SaveInvoiceParams {
  const SaveInvoiceParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveInvoiceUseCase extends UseCase<Invoice, SaveInvoiceParams> {
  const SaveInvoiceUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Invoice>> call(SaveInvoiceParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createInvoice(params.payload)
        : _repository.updateInvoice(id, params.payload);
  }
}

class DeleteInvoiceUseCase extends UseCase<void, String> {
  const DeleteInvoiceUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteInvoice(id);
}

class SubmitInvoiceUseCase extends UseCase<Invoice, String> {
  const SubmitInvoiceUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Invoice>> call(String id) => _repository.submitInvoice(id);
}

class CancelInvoiceUseCase extends UseCase<Invoice, String> {
  const CancelInvoiceUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Invoice>> call(String id) => _repository.cancelInvoice(id);
}

// ── Payments ────────────────────────────────────────────────────────────────

class ListPaymentsUseCase
    extends UseCase<Cacheable<Paginated<Payment>>, ListQuery> {
  const ListPaymentsUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Payment>>>> call(ListQuery params) =>
      _repository.listPayments(params);
}

class GetPaymentUseCase extends UseCase<Payment, String> {
  const GetPaymentUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Payment>> call(String id) => _repository.getPayment(id);
}

class CreatePaymentUseCase
    extends UseCase<Payment, Map<String, dynamic>> {
  const CreatePaymentUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Payment>> call(Map<String, dynamic> params) =>
      _repository.createPayment(params);
}

// ── Credit Notes ────────────────────────────────────────────────────────────

class ListCreditNotesUseCase
    extends UseCase<Paginated<CreditNote>, ListQuery> {
  const ListCreditNotesUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Paginated<CreditNote>>> call(ListQuery params) =>
      _repository.listCreditNotes(params);
}

class GetCreditNoteUseCase extends UseCase<CreditNote, String> {
  const GetCreditNoteUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<CreditNote>> call(String id) => _repository.getCreditNote(id);
}

// ── Budgets ─────────────────────────────────────────────────────────────────

class ListBudgetsUseCase
    extends UseCase<Paginated<Budget>, ListQuery> {
  const ListBudgetsUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Paginated<Budget>>> call(ListQuery params) =>
      _repository.listBudgets(params);
}

class GetBudgetVsActualsUseCase
    extends UseCase<Map<String, dynamic>, String> {
  const GetBudgetVsActualsUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Map<String, dynamic>>> call(String id) =>
      _repository.getBudgetVsActuals(id);
}

class DeleteBudgetUseCase extends UseCase<void, String> {
  const DeleteBudgetUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteBudget(id);
}

// ── Tax Filings ──────────────────────────────────────────────────────────────

class ListTaxFilingsUseCase
    extends UseCase<Paginated<TaxFiling>, ListQuery> {
  const ListTaxFilingsUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Paginated<TaxFiling>>> call(ListQuery params) =>
      _repository.listTaxFilings(params);
}

class DeleteTaxRateUseCase extends UseCase<void, String> {
  const DeleteTaxRateUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteTaxRate(id);
}

// ── Tax Filings

class GetTaxFilingUseCase extends UseCase<TaxFiling, String> {
  const GetTaxFilingUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<TaxFiling>> call(String id) => _repository.getTaxFiling(id);
}

class SaveTaxFilingParams {
  const SaveTaxFilingParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveTaxFilingUseCase extends UseCase<TaxFiling, SaveTaxFilingParams> {
  const SaveTaxFilingUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<TaxFiling>> call(SaveTaxFilingParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTaxFiling(params.payload)
        : _repository.updateTaxFiling(id, params.payload);
  }
}

class DeleteTaxFilingUseCase extends UseCase<void, String> {
  const DeleteTaxFilingUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteTaxFiling(id);
}

class SubmitTaxFilingUseCase extends UseCase<TaxFiling, String> {
  const SubmitTaxFilingUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<TaxFiling>> call(String id) => _repository.submitTaxFiling(id);
}

// ── Chart of Accounts ────────────────────────────────────────────────────────

class ListChartOfAccountsUseCase
    extends UseCase<Paginated<ChartOfAccount>, ListQuery> {
  const ListChartOfAccountsUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Paginated<ChartOfAccount>>> call(ListQuery params) =>
      _repository.listChartOfAccounts(params);
}

class GetChartOfAccountUseCase extends UseCase<ChartOfAccount, String> {
  const GetChartOfAccountUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<ChartOfAccount>> call(String id) =>
      _repository.getChartOfAccount(id);
}

class SaveChartOfAccountParams {
  const SaveChartOfAccountParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveChartOfAccountUseCase
    extends UseCase<ChartOfAccount, SaveChartOfAccountParams> {
  const SaveChartOfAccountUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<ChartOfAccount>> call(SaveChartOfAccountParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createChartOfAccount(params.payload)
        : _repository.updateChartOfAccount(id, params.payload);
  }
}

class DeleteChartOfAccountUseCase extends UseCase<void, String> {
  const DeleteChartOfAccountUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<void>> call(String id) =>
      _repository.deleteChartOfAccount(id);
}

// ── Journal Entries ──────────────────────────────────────────────────────────

class ListJournalEntriesUseCase
    extends UseCase<Paginated<JournalEntry>, ListQuery> {
  const ListJournalEntriesUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Paginated<JournalEntry>>> call(ListQuery params) =>
      _repository.listJournalEntries(params);
}

class GetJournalEntryUseCase extends UseCase<JournalEntry, String> {
  const GetJournalEntryUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<JournalEntry>> call(String id) =>
      _repository.getJournalEntry(id);
}

class SaveJournalEntryParams {
  const SaveJournalEntryParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveJournalEntryUseCase
    extends UseCase<JournalEntry, SaveJournalEntryParams> {
  const SaveJournalEntryUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<JournalEntry>> call(SaveJournalEntryParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createJournalEntry(params.payload)
        : _repository.updateJournalEntry(id, params.payload);
  }
}

class DeleteJournalEntryUseCase extends UseCase<void, String> {
  const DeleteJournalEntryUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<void>> call(String id) =>
      _repository.deleteJournalEntry(id);
}

class PostJournalEntryUseCase extends UseCase<JournalEntry, String> {
  const PostJournalEntryUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<JournalEntry>> call(String id) =>
      _repository.postJournalEntry(id);
}

// ── Bank Accounts ────────────────────────────────────────────────────────────

class ListBankAccountsUseCase
    extends UseCase<Paginated<BankAccount>, ListQuery> {
  const ListBankAccountsUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<Paginated<BankAccount>>> call(ListQuery params) =>
      _repository.listBankAccounts(params);
}

class GetBankAccountUseCase extends UseCase<BankAccount, String> {
  const GetBankAccountUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<BankAccount>> call(String id) =>
      _repository.getBankAccount(id);
}

class SaveBankAccountParams {
  const SaveBankAccountParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveBankAccountUseCase
    extends UseCase<BankAccount, SaveBankAccountParams> {
  const SaveBankAccountUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<BankAccount>> call(SaveBankAccountParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createBankAccount(params.payload)
        : _repository.updateBankAccount(id, params.payload);
  }
}

class DeleteBankAccountUseCase extends UseCase<void, String> {
  const DeleteBankAccountUseCase(this._repository);

  final FinanceRepository _repository;

  @override
  Future<Result<void>> call(String id) =>
      _repository.deleteBankAccount(id);
}


class GetBudgetUseCase extends UseCase<Budget, String> {
  GetBudgetUseCase(this.repository);
  final FinanceRepository repository;
  @override
  Future<Result<Budget>> call(String params) async => throw UnimplementedError();
}


class ListTaxRatesUseCase extends UseCase<Paginated<TaxRate>, ListQuery> {
  ListTaxRatesUseCase(this.repository);
  final FinanceRepository repository;
  @override
  Future<Result<Paginated<TaxRate>>> call(ListQuery params) async => Result.ok(Paginated(data: [], meta: PaginationMeta(page: 1, limit: 10, total: 0, totalPages: 0)));
}
