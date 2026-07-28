import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/procurement.dart';
import '../../domain/repositories/procurement_repository.dart';
import '../datasources/procurement_remote_data_source.dart';
import '../models/procurement_models.dart';

class ProcurementRepositoryImpl implements ProcurementRepository {
  const ProcurementRepositoryImpl({
    required ProcurementRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _poNamespace = 'procurement.purchase-orders';
  static const String _vendorNamespace = 'procurement.vendors';
  static const String _rfqNamespace = 'procurement.rfqs';

  final ProcurementRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final List<Map<String, dynamic>> jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<PurchaseOrder>>>> listPurchaseOrders(
    ListQuery query) =>
      _paginated(_poNamespace, query, () => _remote.listPurchaseOrders(query),
        PurchaseOrderModel.fromJson);

  @override
  Future<Result<PurchaseOrder>> getPurchaseOrder(String id) =>
      _single(() => _remote.getPurchaseOrder(id));

  @override
  Future<Result<PurchaseOrder>> createPurchaseOrder(Map<String, dynamic> p) =>
      _write(() => _remote.createPurchaseOrder(p));

  @override
  Future<Result<PurchaseOrder>> updatePurchaseOrder(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePurchaseOrder(id, p));

  @override
  Future<Result<void>> deletePurchaseOrder(String id) =>
      _delete(() => _remote.deletePurchaseOrder(id));

  @override
  Future<Result<PurchaseOrder>> submitPurchaseOrder(String id) =>
      _single(() => _remote.submitPurchaseOrder(id));

  @override
  Future<Result<PurchaseOrder>> approvePurchaseOrder(String id) =>
      _single(() => _remote.approvePurchaseOrder(id));

  @override
  Future<Result<PurchaseOrder>> receivePurchaseOrder(String id) =>
      _single(() => _remote.receivePurchaseOrder(id));

  @override
  Future<Result<PurchaseOrder>> cancelPurchaseOrder(String id) =>
      _single(() => _remote.cancelPurchaseOrder(id));

  @override
  Future<Result<Cacheable<Paginated<Vendor>>>> listVendors(ListQuery q) =>
      _paginated(_vendorNamespace, q, () => _remote.listVendors(q),
        VendorModel.fromJson);

  @override
  Future<Result<Vendor>> getVendor(String id) =>
      _single(() => _remote.getVendor(id));

  @override
  Future<Result<Vendor>> createVendor(Map<String, dynamic> p) =>
      _write(() => _remote.createVendor(p));

  @override
  Future<Result<Vendor>> updateVendor(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateVendor(id, p));

  @override
  Future<Result<void>> deleteVendor(String id) =>
      _delete(() => _remote.deleteVendor(id));

  @override
  Future<Result<Cacheable<Paginated<RFQ>>>> listRFQs(ListQuery q) =>
      _paginated(_rfqNamespace, q, () => _remote.listRFQs(q),
        RFQModel.fromJson);

  @override
  Future<Result<RFQ>> getRFQ(String id) => _single(() => _remote.getRFQ(id));

  @override
  Future<Result<RFQ>> createRFQ(Map<String, dynamic> p) => _write(() => _remote.createRFQ(p));

  @override
  Future<Result<RFQ>> updateRFQ(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateRFQ(id, p));

  @override
  Future<Result<RFQ>> submitRFQ(String id) =>
      _single(() => _remote.submitRFQ(id));

  @override
  Future<Result<RFQ>> closeRFQ(String id) =>
      _single(() => _remote.closeRFQ(id));

  @override
  Future<Result<Cacheable<Paginated<SupplierQuotation>>>> listSupplierQuotations(
    ListQuery q) =>
      _paginated('procurement.supplier-quotations', q,
        () => _remote.listSupplierQuotations(q),
        SupplierQuotationModel.fromJson);

  @override
  Future<Result<SupplierQuotation>> getSupplierQuotation(String id) =>
      _single(() => _remote.getSupplierQuotation(id));

  @override
  Future<Result<SupplierQuotation>> createSupplierQuotation(Map<String, dynamic> p) =>
      _write(() => _remote.createSupplierQuotation(p));

  @override
  Future<Result<SupplierQuotation>> approveSupplierQuotation(String id) =>
      _single(() => _remote.approveSupplierQuotation(id));

  @override
  Future<Result<SupplierQuotation>> rejectSupplierQuotation(String id) =>
      _single(() => _remote.rejectSupplierQuotation(id));

  @override
  Future<Result<Cacheable<Paginated<PurchaseRequisition>>>> listPurchaseRequisitions(
    ListQuery q) =>
      _paginated('procurement.requisitions', q,
        () => _remote.listPurchaseRequisitions(q),
        PurchaseRequisitionModel.fromJson);

  @override
  Future<Result<PurchaseRequisition>> getPurchaseRequisition(String id) =>
      _single(() => _remote.getPurchaseRequisition(id));

  @override
  Future<Result<PurchaseRequisition>> createPurchaseRequisition(Map<String, dynamic> p) =>
      _write(() => _remote.createPurchaseRequisition(p));

  @override
  Future<Result<PurchaseRequisition>> approvePurchaseRequisition(String id) =>
      _single(() => _remote.approvePurchaseRequisition(id));
}
