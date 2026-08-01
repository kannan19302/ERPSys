import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/finance.dart';
import '../../domain/repositories/finance_repository.dart';
import '../datasources/finance_remote_data_source.dart';
import '../models/finance_models.dart';

class FinanceRepositoryImpl implements FinanceRepository {
  const FinanceRepositoryImpl({
    required FinanceRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _invoicesNamespace = 'finance.invoices';
  static const String _paymentsNamespace = 'finance.payments';

  final FinanceRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  // ── Invoices ─────────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Invoice>>>> listInvoices(
    ListQuery query,
  ) async {
    try {
      final Paginated<InvoiceModel> page = await _remote.listInvoices(query);

      await _cache.write(
        _tenantId, _invoicesNamespace, query.cacheKey, <String, Object?>{
        'data': page.data.map((InvoiceModel p) => p.toJson()).toList(),
        'meta': page.meta.toJson(),
      });

      return Result<Cacheable<Paginated<Invoice>>>.ok(
        Cacheable<Paginated<Invoice>>(
          value: Paginated<Invoice>(data: page.data, meta: page.meta),
        ),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _invoicesNamespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<Invoice>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<Invoice>>>.ok(
        Cacheable<Paginated<Invoice>>(
          value: Paginated<Invoice>.fromJson(
            cached.value,
            InvoiceModel.fromJson,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<Invoice>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<Invoice>> getInvoice(String id) async {
    try {
      return Result<Invoice>.ok(await _remote.getInvoice(id));
    } on Object catch (error) {
      return Result<Invoice>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Invoice>> createInvoice(Map<String, dynamic> payload) async {
    try {
      final Invoice created = await _remote.createInvoice(payload);
      await _cache.clearTenant(_tenantId);
      return Result<Invoice>.ok(created);
    } on Object catch (error) {
      return Result<Invoice>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Invoice>> updateInvoice(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final Invoice updated = await _remote.updateInvoice(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<Invoice>.ok(updated);
    } on Object catch (error) {
      return Result<Invoice>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteInvoice(String id) async {
    try {
      await _remote.deleteInvoice(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Invoice>> submitInvoice(String id) async {
    try {
      final Invoice submitted = await _remote.submitInvoice(id);
      await _cache.clearTenant(_tenantId);
      return Result<Invoice>.ok(submitted);
    } on Object catch (error) {
      return Result<Invoice>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Invoice>> cancelInvoice(String id) async {
    try {
      final Invoice cancelled = await _remote.cancelInvoice(id);
      await _cache.clearTenant(_tenantId);
      return Result<Invoice>.ok(cancelled);
    } on Object catch (error) {
      return Result<Invoice>.err(mapExceptionToFailure(error));
    }
  }

  // ── Payments ─────────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Payment>>>> listPayments(
    ListQuery query,
  ) async {
    try {
      final Paginated<PaymentModel> page = await _remote.listPayments(query);

      await _cache.write(
        _tenantId, _paymentsNamespace, query.cacheKey, <String, Object?>{
        'data': page.data.map((PaymentModel p) => p.toJson()).toList(),
        'meta': page.meta.toJson(),
      });

      return Result<Cacheable<Paginated<Payment>>>.ok(
        Cacheable<Paginated<Payment>>(
          value: Paginated<Payment>(data: page.data, meta: page.meta),
        ),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _paymentsNamespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<Payment>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<Payment>>>.ok(
        Cacheable<Paginated<Payment>>(
          value: Paginated<Payment>.fromJson(
            cached.value,
            PaymentModel.fromJson,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<Payment>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<Payment>> getPayment(String id) async {
    try {
      return Result<Payment>.ok(await _remote.getPayment(id));
    } on Object catch (error) {
      return Result<Payment>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Payment>> createPayment(Map<String, dynamic> payload) async {
    try {
      final Payment created = await _remote.createPayment(payload);
      await _cache.clearTenant(_tenantId);
      return Result<Payment>.ok(created);
    } on Object catch (error) {
      return Result<Payment>.err(mapExceptionToFailure(error));
    }
  }

  // ── Credit Notes ─────────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<CreditNote>>> listCreditNotes(ListQuery query) async {
    try {
      final Paginated<CreditNoteModel> page = await _remote.listCreditNotes(query);
      return Result<Paginated<CreditNote>>.ok(
        Paginated<CreditNote>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<CreditNote>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<CreditNote>> getCreditNote(String id) async {
    try {
      return Result<CreditNote>.ok(await _remote.getCreditNote(id));
    } on Object catch (error) {
      return Result<CreditNote>.err(mapExceptionToFailure(error));
    }
  }

  // ── Tax Rates ────────────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<TaxRate>>> listTaxRates(ListQuery query) async {
    try {
      final Paginated<TaxRateModel> page = await _remote.listTaxRates(query);
      return Result<Paginated<TaxRate>>.ok(
        Paginated<TaxRate>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<TaxRate>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<TaxRate>> createTaxRate(Map<String, dynamic> payload) async {
    try {
      return Result<TaxRate>.ok(await _remote.createTaxRate(payload));
    } on Object catch (error) {
      return Result<TaxRate>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<TaxRate>> updateTaxRate(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final TaxRate updated = await _remote.updateTaxRate(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<TaxRate>.ok(updated);
    } on Object catch (error) {
      return Result<TaxRate>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteTaxRate(String id) async {
    try {
      await _remote.deleteTaxRate(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  // ── Budgets ──────────────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<Budget>>> listBudgets(ListQuery query) async {
    try {
      final Paginated<BudgetModel> page = await _remote.listBudgets(query);
      return Result<Paginated<Budget>>.ok(
        Paginated<Budget>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<Budget>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Budget>> getBudget(String id) async {
    try {
      return Result<Budget>.ok(await _remote.getBudget(id));
    } on Object catch (error) {
      return Result<Budget>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteBudget(String id) async {
    try {
      await _remote.deleteBudget(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Map<String, dynamic>>> getBudgetVsActuals(String id) async {
    try {
      return Result<Map<String, dynamic>>.ok(
        await _remote.getBudgetVsActuals(id),
      );
    } on Object catch (error) {
      return Result<Map<String, dynamic>>.err(mapExceptionToFailure(error));
    }
  }

  // ── Tax Filings ──────────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<TaxFiling>>> listTaxFilings(ListQuery query) async {
    try {
      final Paginated<TaxFilingModel> page = await _remote.listTaxFilings(query);
      return Result<Paginated<TaxFiling>>.ok(
        Paginated<TaxFiling>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<TaxFiling>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<TaxFiling>> getTaxFiling(String id) async {
    try {
      return Result<TaxFiling>.ok(await _remote.getTaxFiling(id));
    } on Object catch (error) {
      return Result<TaxFiling>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<TaxFiling>> createTaxFiling(Map<String, dynamic> payload) async {
    try {
      return Result<TaxFiling>.ok(await _remote.createTaxFiling(payload));
    } on Object catch (error) {
      return Result<TaxFiling>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<TaxFiling>> updateTaxFiling(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final TaxFiling updated = await _remote.updateTaxFiling(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<TaxFiling>.ok(updated);
    } on Object catch (error) {
      return Result<TaxFiling>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteTaxFiling(String id) async {
    try {
      await _remote.deleteTaxFiling(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<TaxFiling>> submitTaxFiling(String id) async {
    try {
      final TaxFiling submitted = await _remote.submitTaxFiling(id);
      await _cache.clearTenant(_tenantId);
      return Result<TaxFiling>.ok(submitted);
    } on Object catch (error) {
      return Result<TaxFiling>.err(mapExceptionToFailure(error));
    }
  }

  // ── Chart of Accounts ────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<ChartOfAccount>>> listChartOfAccounts(
    ListQuery query,
  ) async {
    try {
      final Paginated<ChartOfAccountModel> page =
          await _remote.listChartOfAccounts(query);
      return Result<Paginated<ChartOfAccount>>.ok(
        Paginated<ChartOfAccount>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<ChartOfAccount>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<ChartOfAccount>> getChartOfAccount(String id) async {
    try {
      return Result<ChartOfAccount>.ok(await _remote.getChartOfAccount(id));
    } on Object catch (error) {
      return Result<ChartOfAccount>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<ChartOfAccount>> createChartOfAccount(
    Map<String, dynamic> payload,
  ) async {
    try {
      return Result<ChartOfAccount>.ok(
        await _remote.createChartOfAccount(payload),
      );
    } on Object catch (error) {
      return Result<ChartOfAccount>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<ChartOfAccount>> updateChartOfAccount(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final ChartOfAccount updated =
          await _remote.updateChartOfAccount(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<ChartOfAccount>.ok(updated);
    } on Object catch (error) {
      return Result<ChartOfAccount>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteChartOfAccount(String id) async {
    try {
      await _remote.deleteChartOfAccount(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  // ── Journal Entries ──────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<JournalEntry>>> listJournalEntries(
    ListQuery query,
  ) async {
    try {
      final Paginated<JournalEntryModel> page =
          await _remote.listJournalEntries(query);
      return Result<Paginated<JournalEntry>>.ok(
        Paginated<JournalEntry>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<JournalEntry>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<JournalEntry>> getJournalEntry(String id) async {
    try {
      return Result<JournalEntry>.ok(await _remote.getJournalEntry(id));
    } on Object catch (error) {
      return Result<JournalEntry>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<JournalEntry>> createJournalEntry(
    Map<String, dynamic> payload,
  ) async {
    try {
      return Result<JournalEntry>.ok(
        await _remote.createJournalEntry(payload),
      );
    } on Object catch (error) {
      return Result<JournalEntry>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<JournalEntry>> updateJournalEntry(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final JournalEntry updated =
          await _remote.updateJournalEntry(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<JournalEntry>.ok(updated);
    } on Object catch (error) {
      return Result<JournalEntry>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteJournalEntry(String id) async {
    try {
      await _remote.deleteJournalEntry(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<JournalEntry>> postJournalEntry(String id) async {
    try {
      final JournalEntry posted = await _remote.postJournalEntry(id);
      await _cache.clearTenant(_tenantId);
      return Result<JournalEntry>.ok(posted);
    } on Object catch (error) {
      return Result<JournalEntry>.err(mapExceptionToFailure(error));
    }
  }

  // ── Bank Accounts ────────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<BankAccount>>> listBankAccounts(
    ListQuery query,
  ) async {
    try {
      final Paginated<BankAccountModel> page =
          await _remote.listBankAccounts(query);
      return Result<Paginated<BankAccount>>.ok(
        Paginated<BankAccount>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<BankAccount>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<BankAccount>> getBankAccount(String id) async {
    try {
      return Result<BankAccount>.ok(await _remote.getBankAccount(id));
    } on Object catch (error) {
      return Result<BankAccount>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<BankAccount>> createBankAccount(
    Map<String, dynamic> payload,
  ) async {
    try {
      return Result<BankAccount>.ok(
        await _remote.createBankAccount(payload),
      );
    } on Object catch (error) {
      return Result<BankAccount>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<BankAccount>> updateBankAccount(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final BankAccount updated =
          await _remote.updateBankAccount(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<BankAccount>.ok(updated);
    } on Object catch (error) {
      return Result<BankAccount>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteBankAccount(String id) async {
    try {
      await _remote.deleteBankAccount(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  // ── Reports ──────────────────────────────────────────────────────────────

  @override
  Future<Result<Map<String, dynamic>>> getArAgingReport() async {
    try {
      return Result<Map<String, dynamic>>.ok(await _remote.getArAgingReport());
    } on Object catch (error) {
      return Result<Map<String, dynamic>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Map<String, dynamic>>> getGlReport() async {
    try {
      return Result<Map<String, dynamic>>.ok(await _remote.getGlReport());
    } on Object catch (error) {
      return Result<Map<String, dynamic>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Map<String, dynamic>>> getTrialBalance() async {
    try {
      return Result<Map<String, dynamic>>.ok(await _remote.getTrialBalance());
    } on Object catch (error) {
      return Result<Map<String, dynamic>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Map<String, dynamic>>> getPnlReport() async {
    try {
      return Result<Map<String, dynamic>>.ok(await _remote.getPnlReport());
    } on Object catch (error) {
      return Result<Map<String, dynamic>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Map<String, dynamic>>> getBalanceSheet() async {
    try {
      return Result<Map<String, dynamic>>.ok(await _remote.getBalanceSheet());
    } on Object catch (error) {
      return Result<Map<String, dynamic>>.err(mapExceptionToFailure(error));
    }
  }

}
