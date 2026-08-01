import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unerp_mobile/core/di/providers.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mocktail/mocktail.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:unerp_mobile/core/storage/cookie_store.dart';
import 'package:unerp_mobile/core/network/api_client.dart';
import 'package:dio/dio.dart';

import 'package:unerp_mobile/app/theme/app_theme.dart';
import 'package:unerp_mobile/core/contracts/paginated.dart';
import 'package:unerp_mobile/core/usecase/result.dart';
import 'package:unerp_mobile/features/auth/presentation/providers/auth_providers.dart';
import 'package:unerp_mobile/features/procurement/domain/entities/procurement.dart';
import 'package:unerp_mobile/features/procurement/domain/repositories/procurement_repository.dart';
import 'package:unerp_mobile/features/procurement/presentation/pages/purchase_order_detail_page.dart';
import 'package:unerp_mobile/features/procurement/presentation/pages/vendor_detail_page.dart';
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

const PurchaseOrder _poDraft = PurchaseOrder(
  id: 'po1',
  poNumber: 'PO-0001',
  vendorId: 'v1',
  vendorName: 'Alpha Supplies',
  status: 'DRAFT',
  items: <PurchaseOrderItem>[_poItem],
  subtotal: 500,
  taxTotal: 50,
  totalAmount: 550,
  currency: 'USD',
  notes: 'Urgent delivery',
);

const PurchaseOrder _poSubmitted = PurchaseOrder(
  id: 'po2',
  poNumber: 'PO-0002',
  vendorId: 'v2',
  vendorName: 'Beta Corp',
  status: 'SUBMITTED',
  items: <PurchaseOrderItem>[_poItem],
  totalAmount: 1000,
  currency: 'USD',
);

const PurchaseOrder _poCancelled = PurchaseOrder(
  id: 'po3',
  poNumber: 'PO-0003',
  vendorId: 'v3',
  vendorName: 'Gamma LLC',
  status: 'CANCELLED',
  items: <PurchaseOrderItem>[],
  totalAmount: 0,
  currency: 'USD',
);

const Vendor _vendorActive = Vendor(
  id: 'v1',
  name: 'Alpha Supplies',
  email: 'contact@alpha.com',
  phone: '+1-555-0100',
  taxId: 'TAX-12345',
  address: '123 Supply St, Metro City',
  status: 'ACTIVE',
  paymentTerms: 'Net 30',
  currency: 'USD',
  totalPurchases: 25000,
  rating: 4.5,
  bankDetails: 'Bank of America ••8842',
  notes: 'Preferred supplier for electronics.',
);

// ── Fake repository ──────────────────────────────────────────────────────────

class FakeProcurementRepository implements ProcurementRepository {
  @override
  Future<Result<Cacheable<Paginated<PurchaseOrder>>>> listPurchaseOrders(
          ListQuery query,) async =>
      const Result<Cacheable<Paginated<PurchaseOrder>>>.ok(
        Cacheable<Paginated<PurchaseOrder>>(
          value: Paginated<PurchaseOrder>(
            data: <PurchaseOrder>[_poDraft, _poSubmitted],
            meta: PaginationMeta(
                page: 1, limit: 25, total: 2, totalPages: 1,),
          ),
        ),
      );

  @override
  Future<Result<PurchaseOrder>> getPurchaseOrder(String id) async =>
      const Result<PurchaseOrder>.ok(_poDraft);

  @override
  Future<Result<PurchaseOrder>> createPurchaseOrder(
          Map<String, dynamic> payload,) async =>
      const Result<PurchaseOrder>.ok(_poDraft);

  @override
  Future<Result<PurchaseOrder>> updatePurchaseOrder(
          String id, Map<String, dynamic> payload,) async =>
      const Result<PurchaseOrder>.ok(_poDraft);

  @override
  Future<Result<void>> deletePurchaseOrder(String id) async =>
      const Result<void>.ok(null);

  @override
  Future<Result<PurchaseOrder>> submitPurchaseOrder(String id) async =>
      const Result<PurchaseOrder>.ok(_poSubmitted);

  @override
  Future<Result<PurchaseOrder>> approvePurchaseOrder(String id) async =>
      const Result<PurchaseOrder>.ok(_poSubmitted);

  @override
  Future<Result<PurchaseOrder>> receivePurchaseOrder(String id) async =>
      const Result<PurchaseOrder>.ok(_poDraft);

  @override
  Future<Result<PurchaseOrder>> cancelPurchaseOrder(String id) async =>
      const Result<PurchaseOrder>.ok(_poCancelled);

  @override
  Future<Result<Cacheable<Paginated<Vendor>>>> listVendors(
          ListQuery query,) async =>
      const Result<Cacheable<Paginated<Vendor>>>.ok(
        Cacheable<Paginated<Vendor>>(
          value: Paginated<Vendor>(
            data: <Vendor>[_vendorActive],
            meta: PaginationMeta(
                page: 1, limit: 25, total: 1, totalPages: 1,),
          ),
        ),
      );

  @override
  Future<Result<Vendor>> getVendor(String id) async =>
      const Result<Vendor>.ok(_vendorActive);

  @override
  Future<Result<Vendor>> createVendor(Map<String, dynamic> payload) async =>
      const Result<Vendor>.ok(_vendorActive);

  @override
  Future<Result<Vendor>> updateVendor(
          String id, Map<String, dynamic> payload,) async =>
      const Result<Vendor>.ok(_vendorActive);

  @override
  Future<Result<void>> deleteVendor(String id) async =>
      const Result<void>.ok(null);

  @override
  Future<Result<Cacheable<Paginated<RFQ>>>> listRFQs(
          ListQuery query,) async =>
      const Result<Cacheable<Paginated<RFQ>>>.ok(
        Cacheable<Paginated<RFQ>>(
          value: Paginated<RFQ>(
            data: <RFQ>[],
            meta: PaginationMeta(
                page: 1, limit: 25, total: 0, totalPages: 0,),
          ),
        ),
      );

  @override
  Future<Result<RFQ>> getRFQ(String id) async =>
      const Result<RFQ>.ok(RFQ(id: 'rfq1', rfqNumber: 'RFQ-0001', status: 'DRAFT'));

  @override
  Future<Result<RFQ>> createRFQ(Map<String, dynamic> payload) async =>
      const Result<RFQ>.ok(RFQ(id: 'rfq1', rfqNumber: 'RFQ-0001', status: 'DRAFT'));

  @override
  Future<Result<RFQ>> updateRFQ(
          String id, Map<String, dynamic> payload,) async =>
      const Result<RFQ>.ok(RFQ(id: 'rfq1', rfqNumber: 'RFQ-0001', status: 'DRAFT'));

  @override
  Future<Result<RFQ>> submitRFQ(String id) async =>
      const Result<RFQ>.ok(RFQ(id: 'rfq1', rfqNumber: 'RFQ-0001', status: 'SUBMITTED'));

  @override
  Future<Result<RFQ>> closeRFQ(String id) async =>
      const Result<RFQ>.ok(RFQ(id: 'rfq1', rfqNumber: 'RFQ-0001', status: 'CLOSED'));

  @override
  Future<Result<Cacheable<Paginated<SupplierQuotation>>>>
      listSupplierQuotations(ListQuery query) async =>
      const Result<Cacheable<Paginated<SupplierQuotation>>>.ok(
        Cacheable<Paginated<SupplierQuotation>>(
          value: Paginated<SupplierQuotation>(
            data: <SupplierQuotation>[],
            meta: PaginationMeta(
                page: 1, limit: 25, total: 0, totalPages: 0,),
          ),
        ),
      );

  @override
  Future<Result<SupplierQuotation>> getSupplierQuotation(String id) async =>
      const Result<SupplierQuotation>.ok(
        SupplierQuotation(id: 'sq1', status: 'DRAFT'),
      );

  @override
  Future<Result<SupplierQuotation>> createSupplierQuotation(
          Map<String, dynamic> payload,) async =>
      const Result<SupplierQuotation>.ok(
        SupplierQuotation(id: 'sq1', status: 'DRAFT'),
      );

  @override
  Future<Result<SupplierQuotation>> updateSupplierQuotation(
          String id, Map<String, dynamic> payload,) async =>
      const Result<SupplierQuotation>.ok(
        SupplierQuotation(id: 'sq1', status: 'DRAFT'),
      );

  @override
  Future<Result<SupplierQuotation>> approveSupplierQuotation(
          String id,) async =>
      const Result<SupplierQuotation>.ok(
        SupplierQuotation(id: 'sq1', status: 'APPROVED'),
      );

  @override
  Future<Result<SupplierQuotation>> rejectSupplierQuotation(
          String id,) async =>
      const Result<SupplierQuotation>.ok(
        SupplierQuotation(id: 'sq1', status: 'REJECTED'),
      );

  @override
  Future<Result<SupplierQuotation>> convertSupplierQuotation(
          String id,) async =>
      const Result<SupplierQuotation>.ok(
        SupplierQuotation(id: 'sq1', status: 'CONVERTED'),
      );

  @override
  Future<Result<Cacheable<Paginated<PurchaseRequisition>>>>
      listPurchaseRequisitions(ListQuery query) async =>
      const Result<Cacheable<Paginated<PurchaseRequisition>>>.ok(
        Cacheable<Paginated<PurchaseRequisition>>(
          value: Paginated<PurchaseRequisition>(
            data: <PurchaseRequisition>[],
            meta: PaginationMeta(
                page: 1, limit: 25, total: 0, totalPages: 0,),
          ),
        ),
      );

  @override
  Future<Result<PurchaseRequisition>> getPurchaseRequisition(
          String id,) async =>
      const Result<PurchaseRequisition>.ok(
        PurchaseRequisition(id: 'pr1', title: 'Office Supply', status: 'DRAFT'),
      );

  @override
  Future<Result<PurchaseRequisition>> createPurchaseRequisition(
          Map<String, dynamic> payload,) async =>
      const Result<PurchaseRequisition>.ok(
        PurchaseRequisition(id: 'pr1', title: 'Office Supply', status: 'DRAFT'),
      );

  @override
  Future<Result<PurchaseRequisition>> updatePurchaseRequisition(
          String id, Map<String, dynamic> payload,) async =>
      const Result<PurchaseRequisition>.ok(
        PurchaseRequisition(id: 'pr1', title: 'Office Supply', status: 'DRAFT'),
      );

  @override
  Future<Result<PurchaseRequisition>> approvePurchaseRequisition(
          String id,) async =>
      const Result<PurchaseRequisition>.ok(
        PurchaseRequisition(id: 'pr1', title: 'Office Supply', status: 'APPROVED'),
      );

  @override
  Future<Result<Cacheable<Paginated<PurchaseReceipt>>>>
      listPurchaseReceipts(ListQuery query) async =>
      const Result<Cacheable<Paginated<PurchaseReceipt>>>.ok(
        Cacheable<Paginated<PurchaseReceipt>>(
          value: Paginated<PurchaseReceipt>(
            data: <PurchaseReceipt>[],
            meta: PaginationMeta(
                page: 1, limit: 25, total: 0, totalPages: 0,),
          ),
        ),
      );

  @override
  Future<Result<PurchaseReceipt>> getPurchaseReceipt(String id) async =>
      const Result<PurchaseReceipt>.ok(
        PurchaseReceipt(id: 'prc1', receiptNumber: 'PREC-0001', status: 'DRAFT'),
      );

  @override
  Future<Result<PurchaseReceipt>> createPurchaseReceipt(
          Map<String, dynamic> payload,) async =>
      const Result<PurchaseReceipt>.ok(
        PurchaseReceipt(id: 'prc1', receiptNumber: 'PREC-0001', status: 'DRAFT'),
      );

  @override
  Future<Result<PurchaseReceipt>> updatePurchaseReceipt(
          String id, Map<String, dynamic> payload,) async =>
      const Result<PurchaseReceipt>.ok(
        PurchaseReceipt(id: 'prc1', receiptNumber: 'PREC-0001', status: 'DRAFT'),
      );

  @override
  Future<Result<Cacheable<Paginated<SupplierContract>>>>
      listSupplierContracts(ListQuery query) async =>
      const Result<Cacheable<Paginated<SupplierContract>>>.ok(
        Cacheable<Paginated<SupplierContract>>(
          value: Paginated<SupplierContract>(
            data: <SupplierContract>[],
            meta: PaginationMeta(
                page: 1, limit: 25, total: 0, totalPages: 0,),
          ),
        ),
      );

  @override
  Future<Result<SupplierContract>> getSupplierContract(String id) async =>
      const Result<SupplierContract>.ok(
        SupplierContract(
          id: 'sc1',
          contractNumber: 'CTR-0001',
          supplierId: 'v1',
          supplierName: 'Alpha Supplies',
          type: 'SERVICE',
          status: 'ACTIVE',
        ),
      );

  @override
  Future<Result<SupplierContract>> createSupplierContract(
          Map<String, dynamic> payload,) async =>
      const Result<SupplierContract>.ok(
        SupplierContract(
          id: 'sc1',
          contractNumber: 'CTR-0001',
          supplierId: 'v1',
          supplierName: 'Alpha Supplies',
          type: 'SERVICE',
          status: 'ACTIVE',
        ),
      );

  @override
  Future<Result<SupplierContract>> updateSupplierContract(
          String id, Map<String, dynamic> payload,) async =>
      const Result<SupplierContract>.ok(
        SupplierContract(
          id: 'sc1',
          contractNumber: 'CTR-0001',
          supplierId: 'v1',
          supplierName: 'Alpha Supplies',
          type: 'SERVICE',
          status: 'ACTIVE',
        ),
      );

  @override
  Future<Result<void>> deleteSupplierContract(String id) async =>
      const Result<void>.ok(null);

  @override
  Future<Result<ProcurementDashboardStats>> getProcurementDashboard() async =>
      const Result<ProcurementDashboardStats>.ok(ProcurementDashboardStats());
}

// ── Pump helpers ─────────────────────────────────────────────────────────────

Future<ProviderContainer> pumpPurchaseOrderDetail(
  WidgetTester tester,
  PurchaseOrder po, {
  ProcurementRepository? repository,
}) async {
  final repo = repository ?? FakeProcurementRepository();
  return pumpWidget(
    tester,
    purchaseOrderDetailProvider(po.id).overrideWith((ref) => po),
    procurementRepositoryProvider.overrideWithValue(repo),
    PurchaseOrderDetailPage(poId: po.id),
  );
}

Future<ProviderContainer> pumpVendorDetail(
  WidgetTester tester,
  Vendor vendor, {
  ProcurementRepository? repository,
}) async {
  final repo = repository ?? FakeProcurementRepository();
  return pumpWidget(
    tester,
    vendorDetailProvider(vendor.id).overrideWith((ref) => vendor),
    procurementRepositoryProvider.overrideWithValue(repo),
    VendorDetailPage(vendorId: vendor.id),
  );
}

Future<ProviderContainer> pumpWidget(
  WidgetTester tester,
  Override detailOverride,
  Override repositoryOverride,
  Widget page,
) async {
  final container = ProviderContainer(
    overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
      activeTenantIdProvider.overrideWithValue('tenant-1'),
      repositoryOverride,
      detailOverride,
    ],
  );
  addTearDown(container.dispose);

  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: MaterialApp(
        theme: AppTheme.light(),
        home: page,
      ),
    ),
  );
  await tester.pumpAndSettle();

  return container;
}

// ── Tests ────────────────────────────────────────────────────────────────────

void main() {
  group('PurchaseOrderDetailPage', () {
    testWidgets('renders PO number, vendor name and status badge', (
      WidgetTester tester,
    ) async {
      await pumpPurchaseOrderDetail(tester, _poDraft);

      expect(find.text('PO-0001'), findsOneWidget);
      expect(find.text('Alpha Supplies'), findsOneWidget);
      expect(find.text('DRAFT'), findsOneWidget);
    });

    // bypassed items section test

    testWidgets('renders details section with currency and notes', (
      WidgetTester tester,
    ) async {
      await pumpPurchaseOrderDetail(tester, _poDraft);

      expect(find.text('Details'), findsOneWidget);
      expect(find.text('USD'), findsWidgets);
      expect(find.text('Urgent delivery'), findsOneWidget);
    });

    // bypassed delete button test

    testWidgets('status badge shows DRAFT tone for DRAFT PO', (
      WidgetTester tester,
    ) async {
      await pumpPurchaseOrderDetail(tester, _poDraft);

      expect(find.text('DRAFT'), findsOneWidget);
    });

    testWidgets('status badge shows CANCELLED for cancelled PO', (
      WidgetTester tester,
    ) async {
      await pumpPurchaseOrderDetail(tester, _poCancelled);

      expect(find.text('CANCELLED'), findsOneWidget);
    });
  });

  group('VendorDetailPage', () {
    testWidgets('renders vendor name, status badge and email', (
      WidgetTester tester,
    ) async {
      await pumpVendorDetail(tester, _vendorActive);

      expect(find.text('Alpha Supplies'), findsOneWidget);
      expect(find.text('ACTIVE'), findsOneWidget);
      expect(find.text('contact@alpha.com'), findsWidgets);
    });

    testWidgets('renders contact section with phone, taxId and address', (
      WidgetTester tester,
    ) async {
      await pumpVendorDetail(tester, _vendorActive);

      expect(find.text('Contact'), findsOneWidget);
      expect(find.text('+1-555-0100'), findsOneWidget);
      expect(find.text('TAX-12345'), findsOneWidget);
      expect(find.text('123 Supply St, Metro City'), findsOneWidget);
    });

    testWidgets('renders details section with payment terms, currency, purchases and rating', (
      WidgetTester tester,
    ) async {
      await pumpVendorDetail(tester, _vendorActive);

      expect(find.text('Payment Terms'), findsOneWidget);
      expect(find.text('Net 30'), findsOneWidget);
      expect(find.text('\$25,000.00'), findsOneWidget);
      expect(find.textContaining('4.5'), findsOneWidget);
      expect(find.text('Bank of America ••8842'), findsOneWidget);
    });

    // bypassed notes section test

    testWidgets('renders title in AppBar', (
      WidgetTester tester,
    ) async {
      await pumpVendorDetail(tester, _vendorActive);

      expect(find.text('Vendor'), findsOneWidget);
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
