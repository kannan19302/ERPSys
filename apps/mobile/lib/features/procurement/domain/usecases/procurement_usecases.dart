import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/procurement.dart';
import '../repositories/procurement_repository.dart';

class ListPurchaseOrdersUseCase extends UseCase<Cacheable<Paginated<PurchaseOrder>>, ListQuery> {
  const ListPurchaseOrdersUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PurchaseOrder>>>> call(ListQuery params) =>
      _repository.listPurchaseOrders(params);
}

class GetPurchaseOrderUseCase extends UseCase<PurchaseOrder, String> {
  const GetPurchaseOrderUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseOrder>> call(String id) => _repository.getPurchaseOrder(id);
}

class SavePurchaseOrderParams {
  const SavePurchaseOrderParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePurchaseOrderUseCase extends UseCase<PurchaseOrder, SavePurchaseOrderParams> {
  const SavePurchaseOrderUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseOrder>> call(SavePurchaseOrderParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPurchaseOrder(params.payload)
        : _repository.updatePurchaseOrder(id, params.payload);
  }
}

class SubmitPurchaseOrderUseCase extends UseCase<PurchaseOrder, String> {
  const SubmitPurchaseOrderUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseOrder>> call(String id) => _repository.submitPurchaseOrder(id);
}

class ApprovePurchaseOrderUseCase extends UseCase<PurchaseOrder, String> {
  const ApprovePurchaseOrderUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseOrder>> call(String id) => _repository.approvePurchaseOrder(id);
}

class ReceivePurchaseOrderUseCase extends UseCase<PurchaseOrder, String> {
  const ReceivePurchaseOrderUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseOrder>> call(String id) => _repository.receivePurchaseOrder(id);
}

class CancelPurchaseOrderUseCase extends UseCase<PurchaseOrder, String> {
  const CancelPurchaseOrderUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseOrder>> call(String id) => _repository.cancelPurchaseOrder(id);
}

class DeletePurchaseOrderUseCase extends UseCase<void, String> {
  const DeletePurchaseOrderUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePurchaseOrder(id);
}

class ListVendorsUseCase extends UseCase<Cacheable<Paginated<Vendor>>, ListQuery> {
  const ListVendorsUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Vendor>>>> call(ListQuery params) =>
      _repository.listVendors(params);
}

class GetVendorUseCase extends UseCase<Vendor, String> {
  const GetVendorUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Vendor>> call(String id) => _repository.getVendor(id);
}

class SaveVendorParams {
  const SaveVendorParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveVendorUseCase extends UseCase<Vendor, SaveVendorParams> {
  const SaveVendorUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Vendor>> call(SaveVendorParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createVendor(params.payload)
        : _repository.updateVendor(id, params.payload);
  }
}

class DeleteVendorUseCase extends UseCase<void, String> {
  const DeleteVendorUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteVendor(id);
}

class ListRFQsUseCase extends UseCase<Cacheable<Paginated<RFQ>>, ListQuery> {
  const ListRFQsUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<RFQ>>>> call(ListQuery params) =>
      _repository.listRFQs(params);
}

class GetRFQUseCase extends UseCase<RFQ, String> {
  const GetRFQUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<RFQ>> call(String id) => _repository.getRFQ(id);
}

class SaveRFQParams {
  const SaveRFQParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveRFQUseCase extends UseCase<RFQ, SaveRFQParams> {
  const SaveRFQUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<RFQ>> call(SaveRFQParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createRFQ(params.payload)
        : _repository.updateRFQ(id, params.payload);
  }
}

class SubmitRFQUseCase extends UseCase<RFQ, String> {
  const SubmitRFQUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<RFQ>> call(String id) => _repository.submitRFQ(id);
}

class CloseRFQUseCase extends UseCase<RFQ, String> {
  const CloseRFQUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<RFQ>> call(String id) => _repository.closeRFQ(id);
}

class ListSupplierQuotationsUseCase extends UseCase<Cacheable<Paginated<SupplierQuotation>>, ListQuery> {
  const ListSupplierQuotationsUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SupplierQuotation>>>> call(ListQuery params) =>
      _repository.listSupplierQuotations(params);
}

class GetSupplierQuotationUseCase extends UseCase<SupplierQuotation, String> {
  const GetSupplierQuotationUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<SupplierQuotation>> call(String id) => _repository.getSupplierQuotation(id);
}

class SaveSupplierQuotationParams {
  const SaveSupplierQuotationParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSupplierQuotationUseCase extends UseCase<SupplierQuotation, SaveSupplierQuotationParams> {
  const SaveSupplierQuotationUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<SupplierQuotation>> call(SaveSupplierQuotationParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSupplierQuotation(params.payload)
        : _repository.updateSupplierQuotation(id, params.payload);
  }
}

class ApproveSupplierQuotationUseCase extends UseCase<SupplierQuotation, String> {
  const ApproveSupplierQuotationUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<SupplierQuotation>> call(String id) => _repository.approveSupplierQuotation(id);
}

class RejectSupplierQuotationUseCase extends UseCase<SupplierQuotation, String> {
  const RejectSupplierQuotationUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<SupplierQuotation>> call(String id) => _repository.rejectSupplierQuotation(id);
}

class ConvertSupplierQuotationUseCase extends UseCase<SupplierQuotation, String> {
  const ConvertSupplierQuotationUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<SupplierQuotation>> call(String id) => _repository.convertSupplierQuotation(id);
}

class ListPurchaseRequisitionsUseCase extends UseCase<Cacheable<Paginated<PurchaseRequisition>>, ListQuery> {
  const ListPurchaseRequisitionsUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PurchaseRequisition>>>> call(ListQuery params) =>
      _repository.listPurchaseRequisitions(params);
}

class GetPurchaseRequisitionUseCase extends UseCase<PurchaseRequisition, String> {
  const GetPurchaseRequisitionUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseRequisition>> call(String id) => _repository.getPurchaseRequisition(id);
}

class SavePurchaseRequisitionParams {
  const SavePurchaseRequisitionParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePurchaseRequisitionUseCase extends UseCase<PurchaseRequisition, SavePurchaseRequisitionParams> {
  const SavePurchaseRequisitionUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseRequisition>> call(SavePurchaseRequisitionParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPurchaseRequisition(params.payload)
        : _repository.updatePurchaseRequisition(id, params.payload);
  }
}

class ApprovePurchaseRequisitionUseCase extends UseCase<PurchaseRequisition, String> {
  const ApprovePurchaseRequisitionUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseRequisition>> call(String id) => _repository.approvePurchaseRequisition(id);
}

class ListPurchaseReceiptsUseCase extends UseCase<Cacheable<Paginated<PurchaseReceipt>>, ListQuery> {
  const ListPurchaseReceiptsUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PurchaseReceipt>>>> call(ListQuery params) =>
      _repository.listPurchaseReceipts(params);
}

class GetPurchaseReceiptUseCase extends UseCase<PurchaseReceipt, String> {
  const GetPurchaseReceiptUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseReceipt>> call(String id) => _repository.getPurchaseReceipt(id);
}

class SavePurchaseReceiptParams {
  const SavePurchaseReceiptParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePurchaseReceiptUseCase extends UseCase<PurchaseReceipt, SavePurchaseReceiptParams> {
  const SavePurchaseReceiptUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<PurchaseReceipt>> call(SavePurchaseReceiptParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPurchaseReceipt(params.payload)
        : _repository.updatePurchaseReceipt(id, params.payload);
  }
}

class ListSupplierContractsUseCase extends UseCase<Cacheable<Paginated<SupplierContract>>, ListQuery> {
  const ListSupplierContractsUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SupplierContract>>>> call(ListQuery params) =>
      _repository.listSupplierContracts(params);
}

class GetSupplierContractUseCase extends UseCase<SupplierContract, String> {
  const GetSupplierContractUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<SupplierContract>> call(String id) => _repository.getSupplierContract(id);
}

class SaveSupplierContractParams {
  const SaveSupplierContractParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSupplierContractUseCase extends UseCase<SupplierContract, SaveSupplierContractParams> {
  const SaveSupplierContractUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<SupplierContract>> call(SaveSupplierContractParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSupplierContract(params.payload)
        : _repository.updateSupplierContract(id, params.payload);
  }
}

class DeleteSupplierContractUseCase extends UseCase<void, String> {
  const DeleteSupplierContractUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteSupplierContract(id);
}

class GetProcurementDashboardUseCase extends UseCase<ProcurementDashboardStats, void> {
  const GetProcurementDashboardUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<ProcurementDashboardStats>> call(void params) =>
      _repository.getProcurementDashboard();
}