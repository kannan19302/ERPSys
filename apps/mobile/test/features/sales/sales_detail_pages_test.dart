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
import 'package:unerp_mobile/features/sales/domain/entities/sales.dart';
import 'package:unerp_mobile/features/sales/domain/repositories/sales_repository.dart';
import 'package:unerp_mobile/features/sales/presentation/pages/delivery_note_detail_page.dart';
import 'package:unerp_mobile/features/sales/presentation/pages/opportunity_detail_page.dart';
import 'package:unerp_mobile/features/sales/presentation/pages/quotation_detail_page.dart';
import 'package:unerp_mobile/features/sales/presentation/pages/sales_return_detail_page.dart';
import 'package:unerp_mobile/features/sales/presentation/providers/sales_providers.dart';

// ── Entity constants ────────────────────────────────────────────────────────

const QuotationItem _quotationItem = QuotationItem(
  id: 'qi1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 10,
  rate: 100,
  amount: 1000,
);

const Quotation _quotationDraft = Quotation(
  id: 'q1',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  status: 'DRAFT',
  items: <QuotationItem>[_quotationItem],
  totalAmount: 1000,
);

const Quotation _quotationSubmitted = Quotation(
  id: 'q2',
  customerId: 'c2',
  customerName: 'Beta Inc',
  status: 'SUBMITTED',
  items: <QuotationItem>[_quotationItem],
  totalAmount: 2000,
);

const Quotation _quotationAccepted = Quotation(
  id: 'q3',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  status: 'ACCEPTED',
  items: <QuotationItem>[_quotationItem],
  totalAmount: 1000,
);

const Opportunity _opportunity = Opportunity(
  id: 'opp1',
  title: 'Big Deal',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  stage: 'PROSPECTING',
  expectedRevenue: 50000,
  probability: 30,
);

const DeliveryNoteItem _dnItem = DeliveryNoteItem(
  id: 'dni1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 5,
);

const DeliveryNote _deliveryNoteDraft = DeliveryNote(
  id: 'dn1',
  salesOrderId: 'so1',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  status: 'DRAFT',
  items: <DeliveryNoteItem>[_dnItem],
);

const DeliveryNote _deliveryNoteSubmitted = DeliveryNote(
  id: 'dn2',
  salesOrderId: 'so2',
  customerId: 'c2',
  customerName: 'Beta Inc',
  status: 'SUBMITTED',
  items: <DeliveryNoteItem>[_dnItem],
);

const SalesReturnItem _srItem = SalesReturnItem(
  id: 'sri1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 2,
  rate: 100,
  amount: 200,
);

const SalesReturn _salesReturnPending = SalesReturn(
  id: 'sr1',
  salesOrderId: 'so1',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  status: 'PENDING',
  reason: 'Defective',
  reasonType: 'QUALITY',
  items: <SalesReturnItem>[_srItem],
  totalAmount: 200,
);

const SalesReturn _salesReturnApproved = SalesReturn(
  id: 'sr2',
  salesOrderId: 'so2',
  customerId: 'c2',
  customerName: 'Beta Inc',
  status: 'APPROVED',
  reason: 'Wrong item',
  reasonType: 'INCORRECT',
  items: <SalesReturnItem>[_srItem],
  totalAmount: 400,
);

// ── Fake repository ─────────────────────────────────────────────────────────

class FakeSalesRepository implements SalesRepository {
  @override
  Future<Result<Cacheable<Paginated<Quotation>>>> listQuotations(
          ListQuery query) async =>
      Result<Cacheable<Paginated<Quotation>>>.ok(
        Cacheable<Paginated<Quotation>>(
          value: Paginated<Quotation>(
            data: <Quotation>[_quotationDraft, _quotationSubmitted],
            meta: const PaginationMeta(page: 1, limit: 25, total: 2, totalPages: 1),
          ),
        ),
      );

  @override
  Future<Result<Quotation>> getQuotation(String id) async =>
      Result<Quotation>.ok(_quotationDraft);

  @override
  Future<Result<Quotation>> createQuotation(Map<String, dynamic> payload) async =>
      Result<Quotation>.ok(_quotationDraft);

  @override
  Future<Result<Quotation>> updateQuotation(
          String id, Map<String, dynamic> payload) async =>
      Result<Quotation>.ok(_quotationDraft);

  @override
  Future<Result<void>> deleteQuotation(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<Quotation>> submitQuotation(String id) async =>
      Result<Quotation>.ok(_quotationSubmitted);

  @override
  Future<Result<Quotation>> acceptQuotation(String id) async =>
      Result<Quotation>.ok(_quotationAccepted);

  @override
  Future<Result<SalesOrder>> convertQuotation(String id) async =>
      Result<SalesOrder>.ok(
        SalesOrder(
          id: 'so1',
          customerId: 'c1',
          customerName: 'Alpha Corp',
          status: 'DRAFT',
          items: <SalesOrderItem>[],
          totalAmount: 0,
        ),
      );

  @override
  Future<Result<Cacheable<Paginated<SalesOrder>>>> listSalesOrders(
          ListQuery query) async =>
      Result<Cacheable<Paginated<SalesOrder>>>.ok(
        Cacheable<Paginated<SalesOrder>>(
          value: Paginated<SalesOrder>(
            data: <SalesOrder>[],
            meta: const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<SalesOrder>> getSalesOrder(String id) async =>
      Result<SalesOrder>.ok(
        SalesOrder(
          id: 'so1',
          customerId: 'c1',
          customerName: 'Alpha Corp',
          status: 'DRAFT',
          items: <SalesOrderItem>[],
          totalAmount: 0,
        ),
      );

  @override
  Future<Result<SalesOrder>> createSalesOrder(
          Map<String, dynamic> payload) async =>
      Result<SalesOrder>.ok(
        SalesOrder(
          id: 'so1',
          customerId: 'c1',
          customerName: 'Alpha Corp',
          status: 'DRAFT',
          items: <SalesOrderItem>[],
          totalAmount: 0,
        ),
      );

  @override
  Future<Result<SalesOrder>> updateSalesOrder(
          String id, Map<String, dynamic> payload) async =>
      Result<SalesOrder>.ok(
        SalesOrder(
          id: 'so1',
          customerId: 'c1',
          customerName: 'Alpha Corp',
          status: 'DRAFT',
          items: <SalesOrderItem>[],
          totalAmount: 0,
        ),
      );

  @override
  Future<Result<void>> deleteSalesOrder(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<SalesOrder>> confirmSalesOrder(String id) async =>
      Result<SalesOrder>.ok(
        SalesOrder(
          id: 'so1',
          customerId: 'c1',
          customerName: 'Alpha Corp',
          status: 'CONFIRMED',
          items: <SalesOrderItem>[],
          totalAmount: 0,
        ),
      );

  @override
  Future<Result<SalesOrder>> cancelSalesOrder(String id) async =>
      Result<SalesOrder>.ok(
        SalesOrder(
          id: 'so1',
          customerId: 'c1',
          customerName: 'Alpha Corp',
          status: 'CANCELLED',
          items: <SalesOrderItem>[],
          totalAmount: 0,
        ),
      );

  @override
  Future<Result<Paginated<DeliveryNote>>> listDeliveryNotes(
          ListQuery query) async =>
      Result<Paginated<DeliveryNote>>.ok(
        Paginated<DeliveryNote>(
          data: <DeliveryNote>[_deliveryNoteDraft],
          meta: const PaginationMeta(page: 1, limit: 25, total: 1, totalPages: 1),
        ),
      );

  @override
  Future<Result<DeliveryNote>> getDeliveryNote(String id) async =>
      Result<DeliveryNote>.ok(_deliveryNoteDraft);

  @override
  Future<Result<DeliveryNote>> createDeliveryNote(
          Map<String, dynamic> payload) async =>
      Result<DeliveryNote>.ok(_deliveryNoteDraft);

  @override
  Future<Result<DeliveryNote>> updateDeliveryNote(
          String id, Map<String, dynamic> payload) async =>
      Result<DeliveryNote>.ok(_deliveryNoteDraft);

  @override
  Future<Result<void>> deleteDeliveryNote(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<DeliveryNote>> submitDeliveryNote(String id) async =>
      Result<DeliveryNote>.ok(_deliveryNoteSubmitted);

  @override
  Future<Result<Paginated<SalesReturn>>> listSalesReturns(
          ListQuery query) async =>
      Result<Paginated<SalesReturn>>.ok(
        Paginated<SalesReturn>(
          data: <SalesReturn>[_salesReturnPending],
          meta: const PaginationMeta(page: 1, limit: 25, total: 1, totalPages: 1),
        ),
      );

  @override
  Future<Result<SalesReturn>> getSalesReturn(String id) async =>
      Result<SalesReturn>.ok(_salesReturnPending);

  @override
  Future<Result<SalesReturn>> createSalesReturn(
          Map<String, dynamic> payload) async =>
      Result<SalesReturn>.ok(_salesReturnPending);

  @override
  Future<Result<void>> deleteSalesReturn(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<SalesReturn>> approveSalesReturn(String id) async =>
      Result<SalesReturn>.ok(_salesReturnApproved);

  @override
  Future<Result<SalesReturn>> rejectSalesReturn(String id) async =>
      Result<SalesReturn>.ok(_salesReturnPending);

  @override
  Future<Result<List<SalesPipeline>>> listPipelines() async =>
      Result<List<SalesPipeline>>.ok(<SalesPipeline>[]);

  @override
  Future<Result<SalesPipeline>> getSalesPipeline(String id) async =>
      Result<SalesPipeline>.ok(
        SalesPipeline(id: 'pl1', name: 'Default', stages: <PipelineStage>[]),
      );

  @override
  Future<Result<Paginated<Opportunity>>> listOpportunities(
          ListQuery query) async =>
      Result<Paginated<Opportunity>>.ok(
        Paginated<Opportunity>(
          data: <Opportunity>[_opportunity],
          meta: const PaginationMeta(page: 1, limit: 25, total: 1, totalPages: 1),
        ),
      );

  @override
  Future<Result<Opportunity>> getOpportunity(String id) async =>
      Result<Opportunity>.ok(_opportunity);

  @override
  Future<Result<Opportunity>> createOpportunity(
          Map<String, dynamic> payload) async =>
      Result<Opportunity>.ok(_opportunity);

  @override
  Future<Result<Opportunity>> updateOpportunity(
          String id, Map<String, dynamic> payload) async =>
      Result<Opportunity>.ok(_opportunity);

  @override
  Future<Result<void>> deleteOpportunity(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<Opportunity>> updateOpportunityStage(
      String id, String stage) async =>
      Result<Opportunity>.ok(_opportunity);

  @override
  Future<Result<List<SalesActivity>>> listSalesActivity() async =>
      Result<List<SalesActivity>>.ok(<SalesActivity>[]);

  @override
  Future<Result<SalesActivity>> logSalesActivity(
          Map<String, dynamic> payload) async =>
      Result<SalesActivity>.ok(
        SalesActivity(id: 'sa1', type: 'NOTE', subject: 'Call log'),
      );
}

// ── Pump helpers ────────────────────────────────────────────────────────────

/// Renders a [QuotationDetailPage] inside a MaterialApp + ProviderScope with
/// the given quotation injected as the detail provider value.
Future<ProviderContainer> pumpQuotationDetail(
  WidgetTester tester,
  Quotation quotation, {
  SalesRepository? repository,
}) async {
  final repo = repository ?? FakeSalesRepository();
  return pumpWidget(
    tester,
    quotationDetailProvider(quotation.id).overrideWith((ref) => quotation,
    ),
    salesRepositoryProvider.overrideWith((ref) => repo),
    QuotationDetailPage(quotationId: quotation.id),
  );
}

/// Renders an [OpportunityDetailPage].
Future<ProviderContainer> pumpOpportunityDetail(
  WidgetTester tester,
  Opportunity opportunity, {
  SalesRepository? repository,
}) async {
  final repo = repository ?? FakeSalesRepository();
  return pumpWidget(
    tester,
    opportunityDetailProvider(opportunity.id).overrideWith((ref) => opportunity,
    ),
    salesRepositoryProvider.overrideWith((ref) => repo),
    OpportunityDetailPage(opportunityId: opportunity.id),
  );
}

/// Renders a [DeliveryNoteDetailPage].
Future<ProviderContainer> pumpDeliveryNoteDetail(
  WidgetTester tester,
  DeliveryNote note, {
  SalesRepository? repository,
}) async {
  final repo = repository ?? FakeSalesRepository();
  return pumpWidget(
    tester,
    deliveryNoteDetailProvider(note.id).overrideWith((ref) => note,
    ),
    salesRepositoryProvider.overrideWith((ref) => repo),
    DeliveryNoteDetailPage(deliveryNoteId: note.id),
  );
}

/// Renders a [SalesReturnDetailPage].
Future<ProviderContainer> pumpSalesReturnDetail(
  WidgetTester tester,
  SalesReturn ret, {
  SalesRepository? repository,
}) async {
  final repo = repository ?? FakeSalesRepository();
  return pumpWidget(
    tester,
    salesReturnDetailProvider(ret.id).overrideWith((ref) => ret,
    ),
    salesRepositoryProvider.overrideWith((ref) => repo),
    SalesReturnDetailPage(salesReturnId: ret.id),
  );
}

/// Core pump: wraps the given [page] in a [MaterialApp] + [ProviderScope] with
/// [extraOverrides] applied on top of the defaults.
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
      activeTenantIdProvider.overrideWith((ref) => 'tenant-1'),
      repositoryOverride,
      detailOverride,
    ],
    // Dispose after the test via addTearDown — but since we create it here,
    // the caller must track it through the returned ProviderScope.
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

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  group('QuotationDetailPage', () {
    testWidgets('renders Submit button when status is DRAFT', (
      WidgetTester tester,
    ) async {
      await pumpQuotationDetail(tester, _quotationDraft);

      expect(find.text('Submit'), findsOneWidget);
      expect(find.text('Accept'), findsNothing);
    });

    testWidgets('renders Accept button when status is SUBMITTED', (
      WidgetTester tester,
    ) async {
      await pumpQuotationDetail(tester, _quotationSubmitted);

      expect(find.text('Accept'), findsOneWidget);
      expect(find.text('Submit'), findsNothing);
    });

    testWidgets('renders neither Submit nor Accept when status is ACCEPTED', (
      WidgetTester tester,
    ) async {
      await pumpQuotationDetail(tester, _quotationAccepted);

      expect(find.text('Submit'), findsNothing);
      expect(find.text('Accept'), findsNothing);
    });
  });

  group('OpportunityDetailPage', () {
    testWidgets('renders Move Stage button', (WidgetTester tester) async {
      await pumpOpportunityDetail(tester, _opportunity);

      expect(find.text('Move Stage'), findsOneWidget);
    });
  });

  group('DeliveryNoteDetailPage', () {
    testWidgets('renders Submit button when status is DRAFT', (
      WidgetTester tester,
    ) async {
      await pumpDeliveryNoteDetail(tester, _deliveryNoteDraft);

      expect(find.text('Submit'), findsOneWidget);
    });

    testWidgets('does not render Submit button when status is SUBMITTED', (
      WidgetTester tester,
    ) async {
      await pumpDeliveryNoteDetail(tester, _deliveryNoteSubmitted);

      expect(find.text('Submit'), findsNothing);
    });
  });

  group('SalesReturnDetailPage', () {
    testWidgets('renders Approve and Reject buttons when status is PENDING', (
      WidgetTester tester,
    ) async {
      await pumpSalesReturnDetail(tester, _salesReturnPending);

      expect(find.text('Approve'), findsOneWidget);
      expect(find.text('Reject'), findsOneWidget);
    });

    testWidgets('does not render Approve/Reject when status is APPROVED', (
      WidgetTester tester,
    ) async {
      await pumpSalesReturnDetail(tester, _salesReturnApproved);

      expect(find.text('Approve'), findsNothing);
      expect(find.text('Reject'), findsNothing);
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
