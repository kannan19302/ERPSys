import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/di/providers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mocktail/mocktail.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:unerp_mobile/core/storage/cookie_store.dart';
import 'package:unerp_mobile/core/network/api_client.dart';
import 'package:dio/dio.dart';

import 'package:unerp_mobile/core/contracts/paginated.dart';
import 'package:unerp_mobile/core/error/failures.dart';
import 'package:unerp_mobile/core/usecase/result.dart';
import 'package:unerp_mobile/features/auth/presentation/providers/auth_providers.dart';
import 'package:unerp_mobile/features/procurement/domain/entities/procurement.dart';
import 'package:unerp_mobile/features/procurement/domain/repositories/procurement_repository.dart';
import 'package:unerp_mobile/features/procurement/presentation/providers/procurement_providers.dart';

// ── Entity constants ─────────────────────────────────────────────────────────

const PurchaseOrderItem _poItem = PurchaseOrderItem(
  id: 'poi1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 10,
  rate: 50,
  amount: 500,
);

const PurchaseOrder _poA = PurchaseOrder(
  id: 'po1',
  poNumber: 'PO-0001',
  vendorId: 'v1',
  vendorName: 'Alpha Supplies',
  status: 'DRAFT',
  items: <PurchaseOrderItem>[_poItem],
  totalAmount: 500,
);

const PurchaseOrder _poB = PurchaseOrder(
  id: 'po2',
  poNumber: 'PO-0002',
  vendorId: 'v2',
  vendorName: 'Beta Corp',
  status: 'SUBMITTED',
  items: <PurchaseOrderItem>[_poItem],
  totalAmount: 1000,
);

const Vendor _vendorA = Vendor(
  id: 'v1',
  name: 'Alpha Supplies',
  email: 'contact@alpha.com',
  status: 'ACTIVE',
  currency: 'USD',
);

const Vendor _vendorB = Vendor(
  id: 'v2',
  name: 'Beta Corp',
  email: 'info@beta.com',
  status: 'ACTIVE',
  currency: 'USD',
);

const RFQItem _rfqItem = RFQItem(
  id: 'rfi1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 10,
);

const RFQ _rfqA = RFQ(
  id: 'rfq1',
  rfqNumber: 'RFQ-0001',
  status: 'DRAFT',
  items: <RFQItem>[_rfqItem],
);

const RFQ _rfqB = RFQ(
  id: 'rfq2',
  rfqNumber: 'RFQ-0002',
  status: 'SUBMITTED',
  items: <RFQItem>[_rfqItem],
);

const SupplierQuotationItem _sqItem = SupplierQuotationItem(
  id: 'sqi1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 10,
  rate: 45,
  amount: 450,
);

const SupplierQuotation _sqA = SupplierQuotation(
  id: 'sq1',
  rfqId: 'rfq1',
  rfqNumber: 'RFQ-0001',
  vendorId: 'v1',
  vendorName: 'Alpha Supplies',
  status: 'DRAFT',
  items: <SupplierQuotationItem>[_sqItem],
  totalAmount: 450,
);

const SupplierQuotation _sqB = SupplierQuotation(
  id: 'sq2',
  rfqId: 'rfq2',
  rfqNumber: 'RFQ-0002',
  vendorId: 'v2',
  vendorName: 'Beta Corp',
  status: 'SUBMITTED',
  items: <SupplierQuotationItem>[_sqItem],
  totalAmount: 900,
);

const PurchaseRequisitionItem _prItem = PurchaseRequisitionItem(
  id: 'pri1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 5,
  estimatedRate: 50,
  estimatedAmount: 250,
);

const PurchaseRequisition _prA = PurchaseRequisition(
  id: 'pr1',
  title: 'Office Supplies',
  status: 'DRAFT',
  items: <PurchaseRequisitionItem>[_prItem],
  totalEstimated: 250,
);

const PurchaseRequisition _prB = PurchaseRequisition(
  id: 'pr2',
  title: 'Equipment',
  status: 'APPROVED',
  items: <PurchaseRequisitionItem>[_prItem],
  totalEstimated: 5000,
);

const PurchaseReceiptItem _precItem = PurchaseReceiptItem(
  id: 'preci1',
  productId: 'p1',
  productName: 'Widget',
  orderedQuantity: 10,
  receivedQuantity: 10,
  acceptedQuantity: 10,
);

const PurchaseReceipt _precA = PurchaseReceipt(
  id: 'prc1',
  receiptNumber: 'PREC-0001',
  purchaseOrderId: 'po1',
  poNumber: 'PO-0001',
  supplierId: 'v1',
  supplierName: 'Alpha Supplies',
  status: 'DRAFT',
  items: <PurchaseReceiptItem>[_precItem],
);

const PurchaseReceipt _precB = PurchaseReceipt(
  id: 'prc2',
  receiptNumber: 'PREC-0002',
  purchaseOrderId: 'po2',
  poNumber: 'PO-0002',
  supplierId: 'v2',
  supplierName: 'Beta Corp',
  status: 'SUBMITTED',
  items: <PurchaseReceiptItem>[_precItem],
);

const SupplierContract _scA = SupplierContract(
  id: 'sc1',
  contractNumber: 'CTR-0001',
  supplierId: 'v1',
  supplierName: 'Alpha Supplies',
  type: 'SERVICE',
  status: 'DRAFT',
  value: 10000,
);

const SupplierContract _scB = SupplierContract(
  id: 'sc2',
  contractNumber: 'CTR-0002',
  supplierId: 'v2',
  supplierName: 'Beta Corp',
  type: 'MATERIAL',
  status: 'ACTIVE',
  value: 50000,
);

// ── Pagination helpers ───────────────────────────────────────────────────────

Paginated<T> _page<T>(List<T> items, {int page = 1, bool hasMore = false}) =>
    Paginated<T>(
      data: items,
      meta: PaginationMeta(
        page: page,
        limit: 25,
        total: hasMore ? items.length + 1 : items.length,
        totalPages: hasMore ? page + 1 : page,
      ),
    );

Cacheable<Paginated<T>> _cachedPage<T>(List<T> items,
        {int page = 1, bool hasMore = false}) =>
    Cacheable<Paginated<T>>(
      value: _page<T>(items, page: page, hasMore: hasMore),
    );

// ── Fake ProcurementRepository ───────────────────────────────────────────────

class FakeProcurementRepository implements ProcurementRepository {
  // Purchase Orders
  final List<ListQuery> receivedQueries = <ListQuery>[];
  Future<Result<Cacheable<Paginated<PurchaseOrder>>>> Function(ListQuery)?
      listPurchaseOrdersHandler;
  int deletePurchaseOrderCalls = 0;
  Result<void> deletePurchaseOrderResult = Result<void>.ok(null);
  int submitPurchaseOrderCalls = 0;
  Result<PurchaseOrder> submitPurchaseOrderResult =
      Result<PurchaseOrder>.ok(_poB);
  Future<Result<PurchaseOrder>> Function(Map<String, dynamic>, {String? id})?
      savePurchaseOrderHandler;

  // Vendors
  Future<Result<Cacheable<Paginated<Vendor>>>> Function(ListQuery)?
      listVendorsHandler;
  int deleteVendorCalls = 0;
  Result<void> deleteVendorResult = Result<void>.ok(null);
  Future<Result<Vendor>> Function(Map<String, dynamic>, {String? id})?
      saveVendorHandler;

  // RFQs
  Future<Result<Cacheable<Paginated<RFQ>>>> Function(ListQuery)?
      listRFQsHandler;
  int submitRFQCalls = 0;
  Result<RFQ> submitRFQResult = Result<RFQ>.ok(_rfqB);
  Future<Result<RFQ>> Function(Map<String, dynamic>, {String? id})?
      saveRFQHandler;

  // Supplier Quotations
  Future<Result<Cacheable<Paginated<SupplierQuotation>>>> Function(ListQuery)?
      listSupplierQuotationsHandler;
  int approveSupplierQuotationCalls = 0;
  Result<SupplierQuotation> approveSupplierQuotationResult =
      Result<SupplierQuotation>.ok(_sqB);
  Future<Result<SupplierQuotation>> Function(Map<String, dynamic>, {String? id})?
      saveSupplierQuotationHandler;

  // Purchase Requisitions
  Future<Result<Cacheable<Paginated<PurchaseRequisition>>>> Function(ListQuery)?
      listPurchaseRequisitionsHandler;
  Future<Result<PurchaseRequisition>> Function(Map<String, dynamic>, {String? id})?
      savePurchaseRequisitionHandler;

  // Purchase Receipts
  Future<Result<Cacheable<Paginated<PurchaseReceipt>>>> Function(ListQuery)?
      listPurchaseReceiptsHandler;
  Future<Result<PurchaseReceipt>> Function(Map<String, dynamic>, {String? id})?
      savePurchaseReceiptHandler;

  // Supplier Contracts
  Future<Result<Cacheable<Paginated<SupplierContract>>>> Function(ListQuery)?
      listSupplierContractsHandler;
  int deleteSupplierContractCalls = 0;
  Result<void> deleteSupplierContractResult = Result<void>.ok(null);
  Future<Result<SupplierContract>> Function(Map<String, dynamic>, {String? id})?
      saveSupplierContractHandler;

  // ── Purchase Orders ──

  @override
  Future<Result<Cacheable<Paginated<PurchaseOrder>>>> listPurchaseOrders(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listPurchaseOrdersHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PurchaseOrder>>>.ok(
      _cachedPage(<PurchaseOrder>[_poA, _poB]),
    );
  }

  @override
  Future<Result<PurchaseOrder>> getPurchaseOrder(String id) async =>
      Result<PurchaseOrder>.ok(_poA);

  @override
  Future<Result<PurchaseOrder>> createPurchaseOrder(
          Map<String, dynamic> payload) async =>
      Result<PurchaseOrder>.ok(_poA);

  @override
  Future<Result<PurchaseOrder>> updatePurchaseOrder(
      String id, Map<String, dynamic> payload) async {
    final handler = savePurchaseOrderHandler;
    if (handler != null) return handler(payload, id: id);
    return Result<PurchaseOrder>.ok(_poA);
  }

  @override
  Future<Result<void>> deletePurchaseOrder(String id) async {
    deletePurchaseOrderCalls++;
    return deletePurchaseOrderResult;
  }

  @override
  Future<Result<PurchaseOrder>> submitPurchaseOrder(String id) async {
    submitPurchaseOrderCalls++;
    return submitPurchaseOrderResult;
  }

  @override
  Future<Result<PurchaseOrder>> approvePurchaseOrder(String id) async =>
      Result<PurchaseOrder>.ok(_poB);

  @override
  Future<Result<PurchaseOrder>> receivePurchaseOrder(String id) async =>
      Result<PurchaseOrder>.ok(_poB);

  @override
  Future<Result<PurchaseOrder>> cancelPurchaseOrder(String id) async =>
      Result<PurchaseOrder>.ok(_poA);

  // ── Vendors ──

  @override
  Future<Result<Cacheable<Paginated<Vendor>>>> listVendors(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listVendorsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<Vendor>>>.ok(
      _cachedPage(<Vendor>[_vendorA, _vendorB]),
    );
  }

  @override
  Future<Result<Vendor>> getVendor(String id) async =>
      Result<Vendor>.ok(_vendorA);

  @override
  Future<Result<Vendor>> createVendor(Map<String, dynamic> payload) async {
    final handler = saveVendorHandler;
    if (handler != null) return handler(payload);
    return Result<Vendor>.ok(_vendorA);
  }

  @override
  Future<Result<Vendor>> updateVendor(
      String id, Map<String, dynamic> payload) async {
    final handler = saveVendorHandler;
    if (handler != null) return handler(payload, id: id);
    return Result<Vendor>.ok(_vendorA);
  }

  @override
  Future<Result<void>> deleteVendor(String id) async {
    deleteVendorCalls++;
    return deleteVendorResult;
  }

  // ── RFQs ──

  @override
  Future<Result<Cacheable<Paginated<RFQ>>>> listRFQs(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listRFQsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<RFQ>>>.ok(
      _cachedPage(<RFQ>[_rfqA, _rfqB]),
    );
  }

  @override
  Future<Result<RFQ>> getRFQ(String id) async =>
      Result<RFQ>.ok(_rfqA);

  @override
  Future<Result<RFQ>> createRFQ(Map<String, dynamic> payload) async {
    final handler = saveRFQHandler;
    if (handler != null) return handler(payload);
    return Result<RFQ>.ok(_rfqA);
  }

  @override
  Future<Result<RFQ>> updateRFQ(
      String id, Map<String, dynamic> payload) async {
    final handler = saveRFQHandler;
    if (handler != null) return handler(payload, id: id);
    return Result<RFQ>.ok(_rfqA);
  }

  @override
  Future<Result<RFQ>> submitRFQ(String id) async {
    submitRFQCalls++;
    return submitRFQResult;
  }

  @override
  Future<Result<RFQ>> closeRFQ(String id) async =>
      Result<RFQ>.ok(_rfqB);

  // ── Supplier Quotations ──

  @override
  Future<Result<Cacheable<Paginated<SupplierQuotation>>>>
      listSupplierQuotations(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listSupplierQuotationsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<SupplierQuotation>>>.ok(
      _cachedPage(<SupplierQuotation>[_sqA, _sqB]),
    );
  }

  @override
  Future<Result<SupplierQuotation>> getSupplierQuotation(String id) async =>
      Result<SupplierQuotation>.ok(_sqA);

  @override
  Future<Result<SupplierQuotation>> createSupplierQuotation(
      Map<String, dynamic> payload) async {
    final handler = saveSupplierQuotationHandler;
    if (handler != null) return handler(payload);
    return Result<SupplierQuotation>.ok(_sqA);
  }

  @override
  Future<Result<SupplierQuotation>> updateSupplierQuotation(
      String id, Map<String, dynamic> payload) async {
    final handler = saveSupplierQuotationHandler;
    if (handler != null) return handler(payload, id: id);
    return Result<SupplierQuotation>.ok(_sqA);
  }

  @override
  Future<Result<SupplierQuotation>> approveSupplierQuotation(String id) async {
    approveSupplierQuotationCalls++;
    return approveSupplierQuotationResult;
  }

  @override
  Future<Result<SupplierQuotation>> rejectSupplierQuotation(String id) async =>
      Result<SupplierQuotation>.ok(_sqA);

  @override
  Future<Result<SupplierQuotation>> convertSupplierQuotation(
          String id) async =>
      Result<SupplierQuotation>.ok(_sqB);

  // ── Purchase Requisitions ──

  @override
  Future<Result<Cacheable<Paginated<PurchaseRequisition>>>>
      listPurchaseRequisitions(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listPurchaseRequisitionsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PurchaseRequisition>>>.ok(
      _cachedPage(<PurchaseRequisition>[_prA, _prB]),
    );
  }

  @override
  Future<Result<PurchaseRequisition>> getPurchaseRequisition(String id) async =>
      Result<PurchaseRequisition>.ok(_prA);

  @override
  Future<Result<PurchaseRequisition>> createPurchaseRequisition(
      Map<String, dynamic> payload) async {
    final handler = savePurchaseRequisitionHandler;
    if (handler != null) return handler(payload);
    return Result<PurchaseRequisition>.ok(_prA);
  }

  @override
  Future<Result<PurchaseRequisition>> updatePurchaseRequisition(
      String id, Map<String, dynamic> payload) async {
    final handler = savePurchaseRequisitionHandler;
    if (handler != null) return handler(payload, id: id);
    return Result<PurchaseRequisition>.ok(_prA);
  }

  @override
  Future<Result<PurchaseRequisition>> approvePurchaseRequisition(
          String id) async =>
      Result<PurchaseRequisition>.ok(_prB);

  // ── Purchase Receipts ──

  @override
  Future<Result<Cacheable<Paginated<PurchaseReceipt>>>>
      listPurchaseReceipts(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listPurchaseReceiptsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PurchaseReceipt>>>.ok(
      _cachedPage(<PurchaseReceipt>[_precA, _precB]),
    );
  }

  @override
  Future<Result<PurchaseReceipt>> getPurchaseReceipt(String id) async =>
      Result<PurchaseReceipt>.ok(_precA);

  @override
  Future<Result<PurchaseReceipt>> createPurchaseReceipt(
      Map<String, dynamic> payload) async {
    final handler = savePurchaseReceiptHandler;
    if (handler != null) return handler(payload);
    return Result<PurchaseReceipt>.ok(_precA);
  }

  @override
  Future<Result<PurchaseReceipt>> updatePurchaseReceipt(
      String id, Map<String, dynamic> payload) async {
    final handler = savePurchaseReceiptHandler;
    if (handler != null) return handler(payload, id: id);
    return Result<PurchaseReceipt>.ok(_precA);
  }

  // ── Supplier Contracts ──

  @override
  Future<Result<Cacheable<Paginated<SupplierContract>>>>
      listSupplierContracts(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listSupplierContractsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<SupplierContract>>>.ok(
      _cachedPage(<SupplierContract>[_scA, _scB]),
    );
  }

  @override
  Future<Result<SupplierContract>> getSupplierContract(String id) async =>
      Result<SupplierContract>.ok(_scA);

  @override
  Future<Result<SupplierContract>> createSupplierContract(
      Map<String, dynamic> payload) async {
    final handler = saveSupplierContractHandler;
    if (handler != null) return handler(payload);
    return Result<SupplierContract>.ok(_scA);
  }

  @override
  Future<Result<SupplierContract>> updateSupplierContract(
      String id, Map<String, dynamic> payload) async {
    final handler = saveSupplierContractHandler;
    if (handler != null) return handler(payload, id: id);
    return Result<SupplierContract>.ok(_scA);
  }

  @override
  Future<Result<void>> deleteSupplierContract(String id) async {
    deleteSupplierContractCalls++;
    return deleteSupplierContractResult;
  }

  // ── Dashboard ──

  @override
  Future<Result<ProcurementDashboardStats>> getProcurementDashboard() async =>
      Result<ProcurementDashboardStats>.ok(ProcurementDashboardStats());
}

// ── Tests ────────────────────────────────────────────────────────────────────

void main() {
  late FakeProcurementRepository fakeRepository;
  late ProviderContainer container;

  setUp(() {
    fakeRepository = FakeProcurementRepository();
    container = ProviderContainer(
      overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
        procurementRepositoryProvider.overrideWithValue(fakeRepository),
        activeTenantIdProvider.overrideWithValue('tenant-1'),
      ],
    );
    addTearDown(container.dispose);
  });

  // ── PurchaseOrdersController ───────────────────────────────────────────────

  group('PurchaseOrdersController', () {
    test('build loads page 1', () async {
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(purchaseOrderListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('search debounces and resets to page 1', () async {
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      container
          .read(purchaseOrderListControllerProvider.notifier)
          .search('alpha');
      await Future<void>.delayed(const Duration(milliseconds: 400));

      final last = fakeRepository.receivedQueries.last;
      expect(last.search, 'alpha');
      expect(last.page, 1);
    });

    test('applySort resets to page 1', () async {
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      container
          .read(purchaseOrderListControllerProvider.notifier)
          .applySort('-totalAmount');

      await Future<void>.delayed(Duration.zero);
      expect(fakeRepository.receivedQueries.length, 2);
      expect(fakeRepository.receivedQueries.last.sort, '-totalAmount');
      expect(fakeRepository.receivedQueries.last.page, 1);
    });

    test('loadMore appends data and requests next page', () async {
      fakeRepository.listPurchaseOrdersHandler =
          (ListQuery q) async =>
              Result<Cacheable<Paginated<PurchaseOrder>>>.ok(
                _cachedPage<PurchaseOrder>(
                  <PurchaseOrder>[
                    if (q.page == 1) _poA else _poB
                  ],
                  page: q.page,
                  hasMore: q.page == 1,
                ),
              );
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container
          .read(purchaseOrderListControllerProvider.notifier)
          .loadMore();

      final state = container.read(purchaseOrderListControllerProvider);
      expect(state.items.map((PurchaseOrder po) => po.id),
          <String>['po1', 'po2']);
      expect(fakeRepository.receivedQueries.map((ListQuery q) => q.page),
          <int>[1, 2]);
    });

    test('loadMore is a no-op when hasMore is false', () async {
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container
          .read(purchaseOrderListControllerProvider.notifier)
          .loadMore();

      expect(fakeRepository.receivedQueries, hasLength(1));
    });

    test('save creates/updates and refreshes', () async {
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(purchaseOrderListControllerProvider.notifier)
          .save(<String, dynamic>{'vendorId': 'v1', 'items': []}, id: 'po1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('save without id creates new PO', () async {
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(purchaseOrderListControllerProvider.notifier)
          .save(<String, dynamic>{'vendorId': 'v1', 'items': []});

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('delete calls repository and refreshes', () async {
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(purchaseOrderListControllerProvider.notifier)
          .delete('po1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deletePurchaseOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('failure surfaces correctly', () async {
      fakeRepository.listPurchaseOrdersHandler = (ListQuery q) async =>
          Result<Cacheable<Paginated<PurchaseOrder>>>.err(
              ServerFailure('Server error'));
      container.read(purchaseOrderListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(purchaseOrderListControllerProvider);
      expect(state.failure, isA<ServerFailure>());
      expect(state.items, isEmpty);
    });
  });

  // ── VendorListController ───────────────────────────────────────────────────

  group('VendorListController', () {
    test('build loads page 1', () async {
      container.read(vendorListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(vendorListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates and refreshes', () async {
      container.read(vendorListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(vendorListControllerProvider.notifier)
          .save(<String, dynamic>{'name': 'Gamma LLC'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('save with id updates and refreshes', () async {
      container.read(vendorListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(vendorListControllerProvider.notifier)
          .save(<String, dynamic>{'name': 'Gamma LLC'}, id: 'v1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('delete removes and refreshes', () async {
      container.read(vendorListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(vendorListControllerProvider.notifier)
          .delete('v1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteVendorCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── RFQListController ──────────────────────────────────────────────────────

  group('RFQListController', () {
    test('build loads page 1', () async {
      container.read(rfqListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(rfqListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates and refreshes', () async {
      container.read(rfqListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(rfqListControllerProvider.notifier)
          .save(<String, dynamic>{'vendorId': 'v1'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('submit submits and refreshes', () async {
      container.read(rfqListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(rfqListControllerProvider.notifier)
          .submit('rfq1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.submitRFQCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── SupplierQuotationListController ────────────────────────────────────────

  group('SupplierQuotationListController', () {
    test('build loads page 1', () async {
      container.read(supplierQuotationListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(supplierQuotationListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates and refreshes', () async {
      container.read(supplierQuotationListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(supplierQuotationListControllerProvider.notifier)
          .save(<String, dynamic>{'vendorId': 'v1', 'items': []});

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('approve calls approve and refreshes', () async {
      container.read(supplierQuotationListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(supplierQuotationListControllerProvider.notifier)
          .approve('sq1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.approveSupplierQuotationCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── PurchaseRequisitionListController ──────────────────────────────────────

  group('PurchaseRequisitionListController', () {
    test('build loads page 1', () async {
      container.read(purchaseRequisitionListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state =
          container.read(purchaseRequisitionListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates and refreshes', () async {
      container.read(purchaseRequisitionListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(purchaseRequisitionListControllerProvider.notifier)
          .save(<String, dynamic>{'title': 'New Req', 'items': []});

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── PurchaseReceiptListController ──────────────────────────────────────────

  group('PurchaseReceiptListController', () {
    test('build loads page 1', () async {
      container.read(purchaseReceiptListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(purchaseReceiptListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates and refreshes', () async {
      container.read(purchaseReceiptListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(purchaseReceiptListControllerProvider.notifier)
          .save(<String, dynamic>{
        'purchaseOrderId': 'po1',
        'items': [],
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── SupplierContractController ─────────────────────────────────────────────

  group('SupplierContractController', () {
    test('build loads page 1', () async {
      container.read(supplierContractListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(supplierContractListControllerProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save creates and refreshes', () async {
      container.read(supplierContractListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(supplierContractListControllerProvider.notifier)
          .save(<String, dynamic>{
        'supplierId': 'v1',
        'type': 'SERVICE',
        'value': 10000,
      });

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('delete removes and refreshes', () async {
      container.read(supplierContractListControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(supplierContractListControllerProvider.notifier)
          .delete('sc1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteSupplierContractCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
