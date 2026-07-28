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
