import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/sales.dart';
import '../repositories/sales_repository.dart';

class ListQuotationsUseCase
    extends UseCase<Cacheable<Paginated<Quotation>>, ListQuery> {
  const ListQuotationsUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Quotation>>>> call(ListQuery params) =>
      _repository.listQuotations(params);
}

class GetQuotationUseCase extends UseCase<Quotation, String> {
  const GetQuotationUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Quotation>> call(String id) => _repository.getQuotation(id);
}

class SaveSalesParams {
  const SaveSalesParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveQuotationUseCase extends UseCase<Quotation, SaveSalesParams> {
  const SaveQuotationUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Quotation>> call(SaveSalesParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createQuotation(params.payload)
        : _repository.updateQuotation(id, params.payload);
  }
}

class DeleteQuotationUseCase extends UseCase<void, String> {
  const DeleteQuotationUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteQuotation(id);
}

class SubmitQuotationUseCase extends UseCase<Quotation, String> {
  const SubmitQuotationUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Quotation>> call(String id) => _repository.submitQuotation(id);
}

class AcceptQuotationUseCase extends UseCase<Quotation, String> {
  const AcceptQuotationUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Quotation>> call(String id) => _repository.acceptQuotation(id);
}

class ConvertQuotationUseCase extends UseCase<SalesOrder, String> {
  const ConvertQuotationUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<SalesOrder>> call(String id) => _repository.convertQuotation(id);
}

class ListSalesOrdersUseCase
    extends UseCase<Cacheable<Paginated<SalesOrder>>, ListQuery> {
  const ListSalesOrdersUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<SalesOrder>>>> call(ListQuery params) =>
      _repository.listSalesOrders(params);
}

class GetSalesOrderUseCase extends UseCase<SalesOrder, String> {
  const GetSalesOrderUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<SalesOrder>> call(String id) => _repository.getSalesOrder(id);
}

class SaveSalesOrderUseCase extends UseCase<SalesOrder, SaveSalesParams> {
  const SaveSalesOrderUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<SalesOrder>> call(SaveSalesParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSalesOrder(params.payload)
        : _repository.updateSalesOrder(id, params.payload);
  }
}

class DeleteSalesOrderUseCase extends UseCase<void, String> {
  const DeleteSalesOrderUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteSalesOrder(id);
}

class ConfirmSalesOrderUseCase extends UseCase<SalesOrder, String> {
  const ConfirmSalesOrderUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<SalesOrder>> call(String id) => _repository.confirmSalesOrder(id);
}

class CancelSalesOrderUseCase extends UseCase<SalesOrder, String> {
  const CancelSalesOrderUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<SalesOrder>> call(String id) => _repository.cancelSalesOrder(id);
}

class ListDeliveryNotesUseCase
    extends UseCase<Paginated<DeliveryNote>, ListQuery> {
  const ListDeliveryNotesUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Paginated<DeliveryNote>>> call(ListQuery params) =>
      _repository.listDeliveryNotes(params);
}

class GetDeliveryNoteUseCase extends UseCase<DeliveryNote, String> {
  const GetDeliveryNoteUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<DeliveryNote>> call(String id) => _repository.getDeliveryNote(id);
}

class ListSalesReturnsUseCase
    extends UseCase<Paginated<SalesReturn>, ListQuery> {
  const ListSalesReturnsUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Paginated<SalesReturn>>> call(ListQuery params) =>
      _repository.listSalesReturns(params);
}

class GetSalesReturnUseCase extends UseCase<SalesReturn, String> {
  const GetSalesReturnUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<SalesReturn>> call(String id) => _repository.getSalesReturn(id);
}

class ListOpportunitiesUseCase
    extends UseCase<Paginated<Opportunity>, ListQuery> {
  const ListOpportunitiesUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<Paginated<Opportunity>>> call(ListQuery params) =>
      _repository.listOpportunities(params);
}

class GetSalesPipelineUseCase
    extends UseCase<List<SalesPipeline>, NoParams> {
  const GetSalesPipelineUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<List<SalesPipeline>>> call(NoParams params) =>
      _repository.listPipelines();
}

class ListSalesActivityUseCase
    extends UseCase<List<SalesActivity>, NoParams> {
  const ListSalesActivityUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<List<SalesActivity>>> call(NoParams params) =>
      _repository.listSalesActivity();
}

class SaveSalesActivityUseCase
    extends UseCase<SalesActivity, Map<String, dynamic>> {
  const SaveSalesActivityUseCase(this._repository);

  final SalesRepository _repository;

  @override
  Future<Result<SalesActivity>> call(Map<String, dynamic> params) =>
      _repository.logSalesActivity(params);
}
