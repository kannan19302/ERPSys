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

class ListSupplierQuotationsUseCase extends UseCase<Cacheable<Paginated<SupplierQuotation>>, ListQuery> {
  const ListSupplierQuotationsUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SupplierQuotation>>>> call(ListQuery params) =>
      _repository.listSupplierQuotations(params);
}

class ListPurchaseRequisitionsUseCase extends UseCase<Cacheable<Paginated<PurchaseRequisition>>, ListQuery> {
  const ListPurchaseRequisitionsUseCase(this._repository);
  final ProcurementRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PurchaseRequisition>>>> call(ListQuery params) =>
      _repository.listPurchaseRequisitions(params);
}
