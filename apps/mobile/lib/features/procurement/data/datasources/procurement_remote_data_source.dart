import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/procurement_models.dart';

abstract class ProcurementRemoteDataSource {
  Future<Paginated<PurchaseOrderModel>> listPurchaseOrders(ListQuery query);
  Future<PurchaseOrderModel> getPurchaseOrder(String id);
  Future<PurchaseOrderModel> createPurchaseOrder(Map<String, dynamic> payload);
  Future<PurchaseOrderModel> updatePurchaseOrder(String id, Map<String, dynamic> payload);
  Future<void> deletePurchaseOrder(String id);
  Future<PurchaseOrderModel> submitPurchaseOrder(String id);
  Future<PurchaseOrderModel> approvePurchaseOrder(String id);
  Future<PurchaseOrderModel> receivePurchaseOrder(String id);
  Future<PurchaseOrderModel> cancelPurchaseOrder(String id);

  Future<Paginated<VendorModel>> listVendors(ListQuery query);
  Future<VendorModel> getVendor(String id);
  Future<VendorModel> createVendor(Map<String, dynamic> payload);
  Future<VendorModel> updateVendor(String id, Map<String, dynamic> payload);
  Future<void> deleteVendor(String id);

  Future<Paginated<RFQModel>> listRFQs(ListQuery query);
  Future<RFQModel> getRFQ(String id);
  Future<RFQModel> createRFQ(Map<String, dynamic> payload);
  Future<RFQModel> updateRFQ(String id, Map<String, dynamic> payload);
  Future<RFQModel> submitRFQ(String id);
  Future<RFQModel> closeRFQ(String id);

  Future<Paginated<SupplierQuotationModel>> listSupplierQuotations(ListQuery query);
  Future<SupplierQuotationModel> getSupplierQuotation(String id);
  Future<SupplierQuotationModel> createSupplierQuotation(Map<String, dynamic> payload);
  Future<SupplierQuotationModel> updateSupplierQuotation(String id, Map<String, dynamic> payload);
  Future<SupplierQuotationModel> approveSupplierQuotation(String id);
  Future<SupplierQuotationModel> rejectSupplierQuotation(String id);
  Future<SupplierQuotationModel> convertSupplierQuotation(String id);

  Future<Paginated<PurchaseRequisitionModel>> listPurchaseRequisitions(ListQuery query);
  Future<PurchaseRequisitionModel> getPurchaseRequisition(String id);
  Future<PurchaseRequisitionModel> createPurchaseRequisition(Map<String, dynamic> payload);
  Future<PurchaseRequisitionModel> updatePurchaseRequisition(String id, Map<String, dynamic> payload);
  Future<PurchaseRequisitionModel> approvePurchaseRequisition(String id);

  Future<Paginated<PurchaseReceiptModel>> listPurchaseReceipts(ListQuery query);
  Future<PurchaseReceiptModel> getPurchaseReceipt(String id);
  Future<PurchaseReceiptModel> createPurchaseReceipt(Map<String, dynamic> payload);
  Future<PurchaseReceiptModel> updatePurchaseReceipt(String id, Map<String, dynamic> payload);

  Future<Paginated<SupplierContractModel>> listSupplierContracts(ListQuery query);
  Future<SupplierContractModel> getSupplierContract(String id);
  Future<SupplierContractModel> createSupplierContract(Map<String, dynamic> payload);
  Future<SupplierContractModel> updateSupplierContract(String id, Map<String, dynamic> payload);
  Future<void> deleteSupplierContract(String id);

  Future<ProcurementDashboardStatsModel> getProcurementDashboard();
}

class ProcurementRemoteDataSourceImpl implements ProcurementRemoteDataSource {
  const ProcurementRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<PurchaseOrderModel>> listPurchaseOrders(ListQuery query) =>
      _client.getPaginated<PurchaseOrderModel>(
        ApiPaths.purchaseOrders, query, PurchaseOrderModel.fromJson,);

  @override
  Future<PurchaseOrderModel> getPurchaseOrder(String id) async =>
      PurchaseOrderModel.fromJson(
        await _client.getObject(ApiPaths.purchaseOrder(id)),);

  @override
  Future<PurchaseOrderModel> createPurchaseOrder(Map<String, dynamic> payload) async =>
      PurchaseOrderModel.fromJson(
        await _client.post(ApiPaths.purchaseOrders, body: payload),);

  @override
  Future<PurchaseOrderModel> updatePurchaseOrder(
    String id, Map<String, dynamic> payload,) async =>
      PurchaseOrderModel.fromJson(
        await _client.patch(ApiPaths.purchaseOrder(id), body: payload),);

  @override
  Future<void> deletePurchaseOrder(String id) =>
      _client.delete(ApiPaths.purchaseOrder(id));

  @override
  Future<PurchaseOrderModel> submitPurchaseOrder(String id) async =>
      PurchaseOrderModel.fromJson(
        await _client.post(ApiPaths.purchaseOrderSubmit(id)),);

  @override
  Future<PurchaseOrderModel> approvePurchaseOrder(String id) async =>
      PurchaseOrderModel.fromJson(
        await _client.post(ApiPaths.purchaseOrderApprove(id)),);

  @override
  Future<PurchaseOrderModel> receivePurchaseOrder(String id) async =>
      PurchaseOrderModel.fromJson(
        await _client.post(ApiPaths.purchaseOrderReceive(id)),);

  @override
  Future<PurchaseOrderModel> cancelPurchaseOrder(String id) async =>
      PurchaseOrderModel.fromJson(
        await _client.post(ApiPaths.purchaseOrderCancel(id)),);

  @override
  Future<Paginated<VendorModel>> listVendors(ListQuery query) =>
      _client.getPaginated<VendorModel>(
        ApiPaths.vendors, query, VendorModel.fromJson,);

  @override
  Future<VendorModel> getVendor(String id) async =>
      VendorModel.fromJson(await _client.getObject(ApiPaths.vendor(id)));

  @override
  Future<VendorModel> createVendor(Map<String, dynamic> payload) async =>
      VendorModel.fromJson(await _client.post(ApiPaths.vendors, body: payload));

  @override
  Future<VendorModel> updateVendor(String id, Map<String, dynamic> payload) async =>
      VendorModel.fromJson(
        await _client.patch(ApiPaths.vendor(id), body: payload),);

  @override
  Future<void> deleteVendor(String id) => _client.delete(ApiPaths.vendor(id));

  @override
  Future<Paginated<RFQModel>> listRFQs(ListQuery query) =>
      _client.getPaginated<RFQModel>(ApiPaths.rfqs, query, RFQModel.fromJson);

  @override
  Future<RFQModel> getRFQ(String id) async =>
      RFQModel.fromJson(await _client.getObject(ApiPaths.rfq(id)));

  @override
  Future<RFQModel> createRFQ(Map<String, dynamic> payload) async =>
      RFQModel.fromJson(await _client.post(ApiPaths.rfqs, body: payload));

  @override
  Future<RFQModel> updateRFQ(String id, Map<String, dynamic> payload) async =>
      RFQModel.fromJson(await _client.patch(ApiPaths.rfq(id), body: payload));

  @override
  Future<RFQModel> submitRFQ(String id) async =>
      RFQModel.fromJson(await _client.post(ApiPaths.rfqSubmit(id)));

  @override
  Future<RFQModel> closeRFQ(String id) async =>
      RFQModel.fromJson(await _client.post(ApiPaths.rfqClose(id)));

  @override
  Future<Paginated<SupplierQuotationModel>> listSupplierQuotations(ListQuery query) =>
      _client.getPaginated<SupplierQuotationModel>(
        ApiPaths.supplierQuotations, query, SupplierQuotationModel.fromJson,);

  @override
  Future<SupplierQuotationModel> getSupplierQuotation(String id) async =>
      SupplierQuotationModel.fromJson(
        await _client.getObject(ApiPaths.supplierQuotation(id)),);

  @override
  Future<SupplierQuotationModel> createSupplierQuotation(
    Map<String, dynamic> payload,) async =>
      SupplierQuotationModel.fromJson(
        await _client.post(ApiPaths.supplierQuotations, body: payload),);

  @override
  Future<SupplierQuotationModel> updateSupplierQuotation(
    String id, Map<String, dynamic> payload,) async =>
      SupplierQuotationModel.fromJson(
        await _client.patch(ApiPaths.supplierQuotation(id), body: payload),);

  @override
  Future<SupplierQuotationModel> approveSupplierQuotation(String id) async =>
      SupplierQuotationModel.fromJson(
        await _client.post(ApiPaths.supplierQuotationApprove(id)),);

  @override
  Future<SupplierQuotationModel> rejectSupplierQuotation(String id) async =>
      SupplierQuotationModel.fromJson(
        await _client.post(ApiPaths.supplierQuotationReject(id)),);

  @override
  Future<SupplierQuotationModel> convertSupplierQuotation(String id) async =>
      SupplierQuotationModel.fromJson(
        await _client.post(ApiPaths.supplierQuotationConvert(id)),);

  @override
  Future<Paginated<PurchaseRequisitionModel>> listPurchaseRequisitions(
    ListQuery query,) =>
      _client.getPaginated<PurchaseRequisitionModel>(
        ApiPaths.purchaseRequisitions, query, PurchaseRequisitionModel.fromJson,);

  @override
  Future<PurchaseRequisitionModel> getPurchaseRequisition(String id) async =>
      PurchaseRequisitionModel.fromJson(
        await _client.getObject(ApiPaths.purchaseRequisition(id)),);

  @override
  Future<PurchaseRequisitionModel> createPurchaseRequisition(
    Map<String, dynamic> payload,) async =>
      PurchaseRequisitionModel.fromJson(
        await _client.post(ApiPaths.purchaseRequisitions, body: payload),);

  @override
  Future<PurchaseRequisitionModel> updatePurchaseRequisition(
    String id, Map<String, dynamic> payload,) async =>
      PurchaseRequisitionModel.fromJson(
        await _client.patch(ApiPaths.purchaseRequisition(id), body: payload),);

  @override
  Future<PurchaseRequisitionModel> approvePurchaseRequisition(String id) async =>
      PurchaseRequisitionModel.fromJson(
        await _client.post(ApiPaths.purchaseRequisitionApprove(id)),);

  @override
  Future<Paginated<PurchaseReceiptModel>> listPurchaseReceipts(ListQuery query) =>
      _client.getPaginated<PurchaseReceiptModel>(
        ApiPaths.purchaseReceipts, query, PurchaseReceiptModel.fromJson,);

  @override
  Future<PurchaseReceiptModel> getPurchaseReceipt(String id) async =>
      PurchaseReceiptModel.fromJson(
        await _client.getObject(ApiPaths.purchaseReceipt(id)),);

  @override
  Future<PurchaseReceiptModel> createPurchaseReceipt(
    Map<String, dynamic> payload,) async =>
      PurchaseReceiptModel.fromJson(
        await _client.post(ApiPaths.purchaseReceipts, body: payload),);

  @override
  Future<PurchaseReceiptModel> updatePurchaseReceipt(
    String id, Map<String, dynamic> payload,) async =>
      PurchaseReceiptModel.fromJson(
        await _client.patch(ApiPaths.purchaseReceipt(id), body: payload),);

  @override
  Future<Paginated<SupplierContractModel>> listSupplierContracts(ListQuery query) =>
      _client.getPaginated<SupplierContractModel>(
        ApiPaths.supplierContracts, query, SupplierContractModel.fromJson,);

  @override
  Future<SupplierContractModel> getSupplierContract(String id) async =>
      SupplierContractModel.fromJson(
        await _client.getObject(ApiPaths.supplierContract(id)),);

  @override
  Future<SupplierContractModel> createSupplierContract(
    Map<String, dynamic> payload,) async =>
      SupplierContractModel.fromJson(
        await _client.post(ApiPaths.supplierContracts, body: payload),);

  @override
  Future<SupplierContractModel> updateSupplierContract(
    String id, Map<String, dynamic> payload,) async =>
      SupplierContractModel.fromJson(
        await _client.patch(ApiPaths.supplierContract(id), body: payload),);

  @override
  Future<void> deleteSupplierContract(String id) =>
      _client.delete(ApiPaths.supplierContract(id));

  @override
  Future<ProcurementDashboardStatsModel> getProcurementDashboard() async =>
      ProcurementDashboardStatsModel.fromJson(
        await _client.getObject('${ApiPaths.purchaseOrders}/dashboard'),);
}