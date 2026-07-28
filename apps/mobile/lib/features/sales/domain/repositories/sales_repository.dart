import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/sales.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});

  final T value;

  final DateTime? cachedAt;

  bool get isFromCache => cachedAt != null;
}

abstract class SalesRepository {
  Future<Result<Cacheable<Paginated<Quotation>>>> listQuotations(ListQuery query);

  Future<Result<Quotation>> getQuotation(String id);

  Future<Result<Quotation>> createQuotation(Map<String, dynamic> payload);

  Future<Result<Quotation>> updateQuotation(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteQuotation(String id);

  Future<Result<Quotation>> submitQuotation(String id);

  Future<Result<Quotation>> acceptQuotation(String id);

  Future<Result<SalesOrder>> convertQuotation(String id);

  Future<Result<Cacheable<Paginated<SalesOrder>>>> listSalesOrders(ListQuery query);

  Future<Result<SalesOrder>> getSalesOrder(String id);

  Future<Result<SalesOrder>> createSalesOrder(Map<String, dynamic> payload);

  Future<Result<SalesOrder>> updateSalesOrder(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteSalesOrder(String id);

  Future<Result<SalesOrder>> confirmSalesOrder(String id);

  Future<Result<SalesOrder>> cancelSalesOrder(String id);

  Future<Result<Paginated<DeliveryNote>>> listDeliveryNotes(ListQuery query);

  Future<Result<DeliveryNote>> getDeliveryNote(String id);

  Future<Result<Paginated<SalesReturn>>> listSalesReturns(ListQuery query);

  Future<Result<SalesReturn>> getSalesReturn(String id);

  Future<Result<List<SalesPipeline>>> listPipelines();

  Future<Result<Paginated<Opportunity>>> listOpportunities(ListQuery query);

  Future<Result<List<SalesActivity>>> listSalesActivity();

  Future<Result<SalesActivity>> logSalesActivity(Map<String, dynamic> payload);
}
