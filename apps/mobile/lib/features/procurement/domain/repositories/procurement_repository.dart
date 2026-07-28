import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/procurement.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class ProcurementRepository {
  Future<Result<Cacheable<Paginated<PurchaseOrder>>>> listPurchaseOrders(ListQuery query);
  Future<Result<PurchaseOrder>> getPurchaseOrder(String id);
  Future<Result<PurchaseOrder>> createPurchaseOrder(Map<String, dynamic> payload);
  Future<Result<PurchaseOrder>> updatePurchaseOrder(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePurchaseOrder(String id);
  Future<Result<PurchaseOrder>> submitPurchaseOrder(String id);
  Future<Result<PurchaseOrder>> approvePurchaseOrder(String id);
  Future<Result<PurchaseOrder>> receivePurchaseOrder(String id);
  Future<Result<PurchaseOrder>> cancelPurchaseOrder(String id);

  Future<Result<Cacheable<Paginated<Vendor>>>> listVendors(ListQuery query);
  Future<Result<Vendor>> getVendor(String id);
  Future<Result<Vendor>> createVendor(Map<String, dynamic> payload);
  Future<Result<Vendor>> updateVendor(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteVendor(String id);

  Future<Result<Cacheable<Paginated<RFQ>>>> listRFQs(ListQuery query);
  Future<Result<RFQ>> getRFQ(String id);
  Future<Result<RFQ>> createRFQ(Map<String, dynamic> payload);
  Future<Result<RFQ>> updateRFQ(String id, Map<String, dynamic> payload);
  Future<Result<RFQ>> submitRFQ(String id);
  Future<Result<RFQ>> closeRFQ(String id);

  Future<Result<Cacheable<Paginated<SupplierQuotation>>>> listSupplierQuotations(ListQuery query);
  Future<Result<SupplierQuotation>> getSupplierQuotation(String id);
  Future<Result<SupplierQuotation>> createSupplierQuotation(Map<String, dynamic> payload);
  Future<Result<SupplierQuotation>> approveSupplierQuotation(String id);
  Future<Result<SupplierQuotation>> rejectSupplierQuotation(String id);

  Future<Result<Cacheable<Paginated<PurchaseRequisition>>>> listPurchaseRequisitions(ListQuery query);
  Future<Result<PurchaseRequisition>> getPurchaseRequisition(String id);
  Future<Result<PurchaseRequisition>> createPurchaseRequisition(Map<String, dynamic> payload);
  Future<Result<PurchaseRequisition>> approvePurchaseRequisition(String id);
}
