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
import 'package:unerp_mobile/core/usecase/result.dart';
import 'package:unerp_mobile/features/auth/presentation/providers/auth_providers.dart';
import 'package:unerp_mobile/features/sales/domain/entities/sales.dart';
import 'package:unerp_mobile/features/sales/domain/repositories/sales_repository.dart';
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

const Quotation _quotationA = Quotation(
  id: 'q1',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  status: 'DRAFT',
  items: <QuotationItem>[_quotationItem],
  totalAmount: 1000,
);

const Quotation _quotationB = Quotation(
  id: 'q2',
  customerId: 'c2',
  customerName: 'Beta Inc',
  status: 'SUBMITTED',
  items: <QuotationItem>[_quotationItem],
  totalAmount: 2000,
);

const SalesOrderItem _salesOrderItem = SalesOrderItem(
  id: 'soi1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 5,
  rate: 100,
  amount: 500,
);

const SalesOrder _salesOrderA = SalesOrder(
  id: 'so1',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  status: 'DRAFT',
  items: <SalesOrderItem>[_salesOrderItem],
  totalAmount: 500,
);

const SalesOrder _salesOrderB = SalesOrder(
  id: 'so2',
  customerId: 'c2',
  customerName: 'Beta Inc',
  status: 'CONFIRMED',
  items: <SalesOrderItem>[_salesOrderItem],
  totalAmount: 1000,
);

const DeliveryNoteItem _dnItem = DeliveryNoteItem(
  id: 'dni1',
  productId: 'p1',
  productName: 'Widget',
  quantity: 5,
);

const DeliveryNote _deliveryNoteA = DeliveryNote(
  id: 'dn1',
  salesOrderId: 'so1',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  status: 'DRAFT',
  items: <DeliveryNoteItem>[_dnItem],
);

const DeliveryNote _deliveryNoteB = DeliveryNote(
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

const SalesReturn _salesReturnA = SalesReturn(
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

const SalesReturn _salesReturnB = SalesReturn(
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

const Opportunity _opportunityA = Opportunity(
  id: 'opp1',
  title: 'Big Deal',
  customerId: 'c1',
  customerName: 'Alpha Corp',
  stage: 'PROSPECTING',
  expectedRevenue: 50000,
  probability: 30,
);

const Opportunity _opportunityB = Opportunity(
  id: 'opp2',
  title: 'Enterprise License',
  customerId: 'c3',
  customerName: 'Gamma LLC',
  stage: 'NEGOTIATION',
  expectedRevenue: 100000,
  probability: 70,
);

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Fake SalesRepository ────────────────────────────────────────────────────

class FakeSalesRepository implements SalesRepository {
  // Quotations
  final List<ListQuery> receivedQueries = <ListQuery>[];
  Future<Result<Cacheable<Paginated<Quotation>>>> Function(ListQuery)?
      listQuotationsHandler;
  int deleteQuotationCalls = 0;
  Result<void> deleteQuotationResult = Result<void>.ok(null);
  int submitQuotationCalls = 0;
  Result<Quotation> submitQuotationResult = Result<Quotation>.ok(_quotationB);
  int acceptQuotationCalls = 0;
  Result<Quotation> acceptQuotationResult = Result<Quotation>.ok(_quotationA);

  // Sales Orders
  Future<Result<Cacheable<Paginated<SalesOrder>>>> Function(ListQuery)?
      listSalesOrdersHandler;
  int deleteSalesOrderCalls = 0;
  Result<void> deleteSalesOrderResult = Result<void>.ok(null);

  // Delivery Notes
  Future<Result<Paginated<DeliveryNote>>> Function(ListQuery)?
      listDeliveryNotesHandler;
  int submitDeliveryNoteCalls = 0;
  Result<DeliveryNote> submitDeliveryNoteResult =
      Result<DeliveryNote>.ok(_deliveryNoteB);

  // Sales Returns
  Future<Result<Paginated<SalesReturn>>> Function(ListQuery)?
      listSalesReturnsHandler;
  int approveSalesReturnCalls = 0;
  Result<SalesReturn> approveSalesReturnResult =
      Result<SalesReturn>.ok(_salesReturnB);
  int rejectSalesReturnCalls = 0;
  Result<SalesReturn> rejectSalesReturnResult =
      Result<SalesReturn>.ok(_salesReturnA);

  // Opportunities
  Future<Result<Paginated<Opportunity>>> Function(ListQuery)?
      listOpportunitiesHandler;
  int deleteOpportunityCalls = 0;
  Result<void> deleteOpportunityResult = Result<void>.ok(null);
  int updateOpportunityStageCalls = 0;
  Result<Opportunity> updateOpportunityStageResult =
      Result<Opportunity>.ok(_opportunityB);
  Future<Result<Opportunity>> Function(Map<String, dynamic>)?
      saveOpportunityHandler;

  // ── Quotations ──

  @override
  Future<Result<Cacheable<Paginated<Quotation>>>> listQuotations(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listQuotationsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<Quotation>>>.ok(
      _cachedPage(<Quotation>[_quotationA, _quotationB]),
    );
  }

  @override
  Future<Result<Quotation>> getQuotation(String id) async =>
      Result<Quotation>.ok(_quotationA);

  @override
  Future<Result<Quotation>> createQuotation(Map<String, dynamic> payload) async =>
      Result<Quotation>.ok(_quotationA);

  @override
  Future<Result<Quotation>> updateQuotation(
      String id, Map<String, dynamic> payload) async =>
      Result<Quotation>.ok(_quotationA);

  @override
  Future<Result<void>> deleteQuotation(String id) async {
    deleteQuotationCalls++;
    return deleteQuotationResult;
  }

  @override
  Future<Result<Quotation>> submitQuotation(String id) async {
    submitQuotationCalls++;
    return submitQuotationResult;
  }

  @override
  Future<Result<Quotation>> acceptQuotation(String id) async {
    acceptQuotationCalls++;
    return acceptQuotationResult;
  }

  @override
  Future<Result<SalesOrder>> convertQuotation(String id) async =>
      Result<SalesOrder>.ok(_salesOrderA);

  // ── Sales Orders ──

  @override
  Future<Result<Cacheable<Paginated<SalesOrder>>>> listSalesOrders(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listSalesOrdersHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<SalesOrder>>>.ok(
      _cachedPage(<SalesOrder>[_salesOrderA, _salesOrderB]),
    );
  }

  @override
  Future<Result<SalesOrder>> getSalesOrder(String id) async =>
      Result<SalesOrder>.ok(_salesOrderA);

  @override
  Future<Result<SalesOrder>> createSalesOrder(Map<String, dynamic> payload) async =>
      Result<SalesOrder>.ok(_salesOrderA);

  @override
  Future<Result<SalesOrder>> updateSalesOrder(
      String id, Map<String, dynamic> payload) async =>
      Result<SalesOrder>.ok(_salesOrderA);

  @override
  Future<Result<void>> deleteSalesOrder(String id) async {
    deleteSalesOrderCalls++;
    return deleteSalesOrderResult;
  }

  @override
  Future<Result<SalesOrder>> confirmSalesOrder(String id) async =>
      Result<SalesOrder>.ok(_salesOrderB);

  @override
  Future<Result<SalesOrder>> cancelSalesOrder(String id) async =>
      Result<SalesOrder>.ok(_salesOrderA);

  // ── Delivery Notes ──

  @override
  Future<Result<Paginated<DeliveryNote>>> listDeliveryNotes(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listDeliveryNotesHandler;
    if (handler != null) return handler(query);
    return Result<Paginated<DeliveryNote>>.ok(
      _page(<DeliveryNote>[_deliveryNoteA, _deliveryNoteB]),
    );
  }

  @override
  Future<Result<DeliveryNote>> getDeliveryNote(String id) async =>
      Result<DeliveryNote>.ok(_deliveryNoteA);

  @override
  Future<Result<DeliveryNote>> createDeliveryNote(
      Map<String, dynamic> payload) async =>
      Result<DeliveryNote>.ok(_deliveryNoteA);

  @override
  Future<Result<DeliveryNote>> updateDeliveryNote(
      String id, Map<String, dynamic> payload) async =>
      Result<DeliveryNote>.ok(_deliveryNoteA);

  @override
  Future<Result<void>> deleteDeliveryNote(String id) async {
    return Result<void>.ok(null);
  }

  @override
  Future<Result<DeliveryNote>> submitDeliveryNote(String id) async {
    submitDeliveryNoteCalls++;
    return submitDeliveryNoteResult;
  }

  // ── Sales Returns ──

  @override
  Future<Result<Paginated<SalesReturn>>> listSalesReturns(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listSalesReturnsHandler;
    if (handler != null) return handler(query);
    return Result<Paginated<SalesReturn>>.ok(
      _page(<SalesReturn>[_salesReturnA, _salesReturnB]),
    );
  }

  @override
  Future<Result<SalesReturn>> getSalesReturn(String id) async =>
      Result<SalesReturn>.ok(_salesReturnA);

  @override
  Future<Result<SalesReturn>> createSalesReturn(
      Map<String, dynamic> payload) async =>
      Result<SalesReturn>.ok(_salesReturnA);

  @override
  Future<Result<void>> deleteSalesReturn(String id) async {
    return Result<void>.ok(null);
  }

  @override
  Future<Result<SalesReturn>> approveSalesReturn(String id) async {
    approveSalesReturnCalls++;
    return approveSalesReturnResult;
  }

  @override
  Future<Result<SalesReturn>> rejectSalesReturn(String id) async {
    rejectSalesReturnCalls++;
    return rejectSalesReturnResult;
  }

  // ── Pipelines ──

  @override
  Future<Result<List<SalesPipeline>>> listPipelines() async =>
      Result<List<SalesPipeline>>.ok(<SalesPipeline>[]);

  @override
  Future<Result<SalesPipeline>> getSalesPipeline(String id) async =>
      Result<SalesPipeline>.ok(
        SalesPipeline(id: 'pl1', name: 'Default', stages: <PipelineStage>[]),
      );

  // ── Opportunities ──

  @override
  Future<Result<Paginated<Opportunity>>> listOpportunities(
      ListQuery query) async {
    receivedQueries.add(query);
    final handler = listOpportunitiesHandler;
    if (handler != null) return handler(query);
    return Result<Paginated<Opportunity>>.ok(
      _page(<Opportunity>[_opportunityA, _opportunityB]),
    );
  }

  @override
  Future<Result<Opportunity>> getOpportunity(String id) async =>
      Result<Opportunity>.ok(_opportunityA);

  @override
  Future<Result<Opportunity>> createOpportunity(
      Map<String, dynamic> payload) async =>
      Result<Opportunity>.ok(_opportunityA);

  @override
  Future<Result<Opportunity>> updateOpportunity(
      String id, Map<String, dynamic> payload) async {
    final handler = saveOpportunityHandler;
    if (handler != null) return handler(payload);
    return Result<Opportunity>.ok(_opportunityB);
  }

  @override
  Future<Result<void>> deleteOpportunity(String id) async {
    deleteOpportunityCalls++;
    return deleteOpportunityResult;
  }

  @override
  Future<Result<Opportunity>> updateOpportunityStage(
      String id, String stage) async {
    updateOpportunityStageCalls++;
    return updateOpportunityStageResult;
  }

  // ── Sales Activity ──

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

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late FakeSalesRepository fakeRepository;
  late ProviderContainer container;

  setUp(() {
    fakeRepository = FakeSalesRepository();
    container = ProviderContainer(
      overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
        salesRepositoryProvider.overrideWithValue(fakeRepository),
        activeTenantIdProvider.overrideWithValue('tenant-1'),
      ],
    );
    addTearDown(container.dispose);
  });

  // ── QuotationsController ──────────────────────────────────────────────────

  group('QuotationsController', () {
    test('build loads page 1', () async {
      container.read(quotationsProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(quotationsProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('search debounces and resets to page 1', () async {
      container.read(quotationsProvider);
      await Future<void>.delayed(Duration.zero);

      container.read(quotationsProvider.notifier).search('alpha');
      await Future<void>.delayed(const Duration(milliseconds: 400));

      final last = fakeRepository.receivedQueries.last;
      expect(last.search, 'alpha');
      expect(last.page, 1);
    });

    test('applySort resets to page 1', () async {
      container.read(quotationsProvider);
      await Future<void>.delayed(Duration.zero);

      container.read(quotationsProvider.notifier).applySort('-totalAmount');

      await Future<void>.delayed(Duration.zero);
      // refresh fires — two queries: initial + sort-triggered refresh
      expect(fakeRepository.receivedQueries.length, 2);
      expect(fakeRepository.receivedQueries.last.sort, '-totalAmount');
      expect(fakeRepository.receivedQueries.last.page, 1);
    });

    test('loadMore appends data and requests next page', () async {
      fakeRepository.listQuotationsHandler =
          (ListQuery q) async => Result<Cacheable<Paginated<Quotation>>>.ok(
                _cachedPage<Quotation>(
                  <Quotation>[if (q.page == 1) _quotationA else _quotationB],
                  page: q.page,
                  hasMore: q.page == 1,
                ),
              );
      container.read(quotationsProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(quotationsProvider.notifier).loadMore();

      final state = container.read(quotationsProvider);
      expect(state.items.map((Quotation q) => q.id), <String>['q1', 'q2']);
      expect(fakeRepository.receivedQueries.map((ListQuery q) => q.page),
          <int>[1, 2]);
    });

    test('loadMore is a no-op when hasMore is false', () async {
      container.read(quotationsProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(quotationsProvider.notifier).loadMore();

      expect(fakeRepository.receivedQueries, hasLength(1));
    });

    test('delete calls repository and refreshes', () async {
      container.read(quotationsProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(quotationsProvider.notifier).delete('q1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteQuotationCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('submit calls SubmitQuotationUseCase and refreshes', () async {
      container.read(quotationsProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(quotationsProvider.notifier).submit('q1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.submitQuotationCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('accept calls AcceptQuotationUseCase and refreshes', () async {
      container.read(quotationsProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(quotationsProvider.notifier).accept('q2');

      expect(result.isOk, isTrue);
      expect(fakeRepository.acceptQuotationCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── SalesOrdersController ─────────────────────────────────────────────────

  group('SalesOrdersController', () {
    test('build loads page 1', () async {
      container.read(salesOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(salesOrdersProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('search debounces and resets to page 1', () async {
      container.read(salesOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      container.read(salesOrdersProvider.notifier).search('alpha');
      await Future<void>.delayed(const Duration(milliseconds: 400));

      final last = fakeRepository.receivedQueries.last;
      expect(last.search, 'alpha');
      expect(last.page, 1);
    });

    test('applySort resets to page 1', () async {
      container.read(salesOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      container
          .read(salesOrdersProvider.notifier)
          .applySort('-totalAmount');

      await Future<void>.delayed(Duration.zero);
      expect(fakeRepository.receivedQueries.length, 2);
      expect(fakeRepository.receivedQueries.last.sort, '-totalAmount');
      expect(fakeRepository.receivedQueries.last.page, 1);
    });

    test('loadMore appends and requests next page', () async {
      fakeRepository.listSalesOrdersHandler =
          (ListQuery q) async =>
              Result<Cacheable<Paginated<SalesOrder>>>.ok(
                _cachedPage<SalesOrder>(
                  <SalesOrder>[
                    if (q.page == 1) _salesOrderA else _salesOrderB
                  ],
                  page: q.page,
                  hasMore: q.page == 1,
                ),
              );
      container.read(salesOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(salesOrdersProvider.notifier).loadMore();

      final state = container.read(salesOrdersProvider);
      expect(state.items.map((SalesOrder o) => o.id),
          <String>['so1', 'so2']);
      expect(fakeRepository.receivedQueries.map((ListQuery q) => q.page),
          <int>[1, 2]);
    });

    test('delete calls repository and refreshes', () async {
      container.read(salesOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(salesOrdersProvider.notifier).delete('so1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteSalesOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── DeliveryNotesController ───────────────────────────────────────────────

  group('DeliveryNotesController', () {
    test('build loads page 1', () async {
      container.read(deliveryNotesProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(deliveryNotesProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('submit calls SubmitDeliveryNoteUseCase and refreshes', () async {
      container.read(deliveryNotesProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(deliveryNotesProvider.notifier).submit('dn1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.submitDeliveryNoteCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── SalesReturnsController ────────────────────────────────────────────────

  group('SalesReturnsController', () {
    test('build loads page 1', () async {
      container.read(salesReturnsProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(salesReturnsProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('approve calls approve use case and refreshes', () async {
      container.read(salesReturnsProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(salesReturnsProvider.notifier).approve('sr1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.approveSalesReturnCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('reject calls reject use case and refreshes', () async {
      container.read(salesReturnsProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(salesReturnsProvider.notifier).reject('sr1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.rejectSalesReturnCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── OpportunitiesController ───────────────────────────────────────────────

  group('OpportunitiesController', () {
    test('build loads page 1', () async {
      container.read(opportunitiesProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(opportunitiesProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('updateStage calls UpdateOpportunityStageUseCase and refreshes',
        () async {
      container.read(opportunitiesProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(opportunitiesProvider.notifier)
          .updateStage('opp1', 'NEGOTIATION');

      expect(result.isOk, isTrue);
      expect(fakeRepository.updateOpportunityStageCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('save calls SaveOpportunityUseCase and refreshes', () async {
      container.read(opportunitiesProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(opportunitiesProvider.notifier)
          .save(<String, dynamic>{'title': 'New Deal'}, id: 'opp1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('delete calls DeleteOpportunityUseCase and refreshes', () async {
      container.read(opportunitiesProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(opportunitiesProvider.notifier).delete('opp1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deleteOpportunityCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
