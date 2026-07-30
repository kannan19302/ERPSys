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
import 'package:unerp_mobile/features/pos/domain/entities/pos.dart';
import 'package:unerp_mobile/features/pos/domain/repositories/pos_repository.dart';
import 'package:unerp_mobile/features/pos/presentation/pages/pos_order_detail_page.dart';
import 'package:unerp_mobile/features/pos/presentation/pages/pos_register_detail_page.dart';
import 'package:unerp_mobile/features/pos/presentation/providers/pos_providers.dart';

// ── Entity constants ────────────────────────────────────────────────────────

const PosOrderItem _orderItem = PosOrderItem(
  id: 'poi1', productId: 'p1', productName: 'Widget', quantity: 2, rate: 50, amount: 100,
);

const PosPayment _payment = PosPayment(
  id: 'pay1', orderId: 'o1', amount: 50, method: 'CASH',
);

const PosOrder _completedOrder = PosOrder(
  id: 'o1', orderNumber: 'POS-001', status: 'COMPLETED',
  customerId: 'c1', customerName: 'Alpha Corp',
  items: <PosOrderItem>[_orderItem], payments: <PosPayment>[_payment],
  subtotal: 100, discountTotal: 0, taxTotal: 10, totalAmount: 110,
);

const PosOrder _walkinOrder = PosOrder(
  id: 'o2', orderNumber: 'POS-002', status: 'PENDING',
  subtotal: 50, discountTotal: 5, taxTotal: 5, totalAmount: 50,
);

const PosRegister _openRegister = PosRegister(
  id: 'r1', name: 'Main Register', status: 'OPEN',
  openingBalance: 500, location: 'Store Front',
);

const PosRegister _closedRegister = PosRegister(
  id: 'r2', name: 'Back Office', status: 'CLOSED',
  openingBalance: 200, closingBalance: 1800,
);

// ── Fake repository ─────────────────────────────────────────────────────────

class FakePosRepository implements PosRepository {
  PosOrder getPosOrderResult = _completedOrder;
  PosRegister getPosRegisterResult = _openRegister;

  @override
  Future<Result<Cacheable<Paginated<PosOrder>>>> listPosOrders(
          ListQuery query) async =>
      Result<Cacheable<Paginated<PosOrder>>>.ok(
        Cacheable<Paginated<PosOrder>>(
          value: Paginated<PosOrder>(
            data: <PosOrder>[_completedOrder],
            meta: const PaginationMeta(page: 1, limit: 25, total: 1, totalPages: 1),
          ),
        ),
      );

  @override
  Future<Result<PosOrder>> getPosOrder(String id) async =>
      Result<PosOrder>.ok(getPosOrderResult);

  @override
  Future<Result<PosOrder>> createPosOrder(Map<String, dynamic> payload) async =>
      Result<PosOrder>.ok(_completedOrder);

  @override
  Future<Result<PosOrder>> updatePosOrder(
          String id, Map<String, dynamic> payload) async =>
      Result<PosOrder>.ok(_completedOrder);

  @override
  Future<Result<void>> deletePosOrder(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<PosOrder>> voidPosOrder(String id) async =>
      Result<PosOrder>.ok(_completedOrder);

  @override
  Future<Result<PosOrder>> holdPosOrder(String id) async =>
      Result<PosOrder>.ok(_completedOrder);

  @override
  Future<Result<Cacheable<Paginated<PosRegister>>>> listPosRegisters(
          ListQuery query) async =>
      Result<Cacheable<Paginated<PosRegister>>>.ok(
        Cacheable<Paginated<PosRegister>>(
          value: Paginated<PosRegister>(
            data: <PosRegister>[_openRegister],
            meta: const PaginationMeta(page: 1, limit: 25, total: 1, totalPages: 1),
          ),
        ),
      );

  @override
  Future<Result<PosRegister>> getPosRegister(String id) async =>
      Result<PosRegister>.ok(getPosRegisterResult);

  @override
  Future<Result<PosRegister>> createPosRegister(
          Map<String, dynamic> payload) async =>
      Result<PosRegister>.ok(_openRegister);

  @override
  Future<Result<PosRegister>> updatePosRegister(
          String id, Map<String, dynamic> payload) async =>
      Result<PosRegister>.ok(_openRegister);

  @override
  Future<Result<void>> deletePosRegister(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<PosRegister>> openPosRegister(String id) async =>
      Result<PosRegister>.ok(_openRegister);

  @override
  Future<Result<PosRegister>> closePosRegister(String id) async =>
      Result<PosRegister>.ok(_openRegister);

  @override
  Future<Result<Cacheable<Paginated<PosShift>>>> listPosShifts(
          ListQuery query) async =>
      Result<Cacheable<Paginated<PosShift>>>.ok(
        Cacheable<Paginated<PosShift>>(
          value: Paginated<PosShift>(
            data: <PosShift>[],
            meta: const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosShift>> getPosShift(String id) async =>
      Result<PosShift>.ok(PosShift(
        id: 's1', registerId: 'r1', userId: 'u1',
        openedAt: DateTime(2026, 7, 29, 8, 0), status: 'OPEN',
      ));

  @override
  Future<Result<PosShift>> createPosShift(Map<String, dynamic> payload) async =>
      Result<PosShift>.ok(PosShift(
        id: 's1', registerId: 'r1', userId: 'u1',
        openedAt: DateTime(2026, 7, 29, 8, 0), status: 'OPEN',
      ));

  @override
  Future<Result<PosShift>> closePosShift(String id) async =>
      Result<PosShift>.ok(PosShift(
        id: 's1', registerId: 'r1', userId: 'u1',
        openedAt: DateTime(2026, 7, 29, 8, 0),
        closedAt: DateTime(2026, 7, 29, 18, 0), status: 'CLOSED',
      ));

  @override
  Future<Result<Cacheable<Paginated<PosTerminal>>>> listPosTerminals(
          ListQuery query) async =>
      Result<Cacheable<Paginated<PosTerminal>>>.ok(
        Cacheable<Paginated<PosTerminal>>(
          value: Paginated<PosTerminal>(
            data: <PosTerminal>[],
            meta: PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosTerminal>> getPosTerminal(String id) async =>
      Result<PosTerminal>.ok(PosTerminal(id: 't1', name: 'Terminal 1'));

  @override
  Future<Result<PosTerminal>> createPosTerminal(
          Map<String, dynamic> payload) async =>
      Result<PosTerminal>.ok(PosTerminal(id: 't1', name: 'Terminal 1'));

  @override
  Future<Result<PosTerminal>> updatePosTerminal(
          String id, Map<String, dynamic> payload) async =>
      Result<PosTerminal>.ok(PosTerminal(id: 't1', name: 'Terminal 1'));

  @override
  Future<Result<void>> deletePosTerminal(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<Cacheable<Paginated<PosDiscount>>>> listPosDiscounts(
          ListQuery query) async =>
      Result<Cacheable<Paginated<PosDiscount>>>.ok(
        Cacheable<Paginated<PosDiscount>>(
          value: Paginated<PosDiscount>(
            data: <PosDiscount>[],
            meta: const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosDiscount>> getPosDiscount(String id) async =>
      Result<PosDiscount>.ok(PosDiscount(id: 'd1', name: 'Sale', type: 'PERCENTAGE', value: 10));

  @override
  Future<Result<PosDiscount>> createPosDiscount(
          Map<String, dynamic> payload) async =>
      Result<PosDiscount>.ok(PosDiscount(id: 'd1', name: 'Sale', type: 'PERCENTAGE', value: 10));

  @override
  Future<Result<PosDiscount>> updatePosDiscount(
          String id, Map<String, dynamic> payload) async =>
      Result<PosDiscount>.ok(PosDiscount(id: 'd1', name: 'Sale', type: 'PERCENTAGE', value: 10));

  @override
  Future<Result<void>> deletePosDiscount(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyProgram>>>>
      listPosLoyaltyPrograms(ListQuery query) async =>
      Result<Cacheable<Paginated<PosLoyaltyProgram>>>.ok(
        Cacheable<Paginated<PosLoyaltyProgram>>(
          value: Paginated<PosLoyaltyProgram>(
            data: <PosLoyaltyProgram>[],
            meta: const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosLoyaltyProgram>> getPosLoyaltyProgram(String id) async =>
      Result<PosLoyaltyProgram>.ok(PosLoyaltyProgram(id: 'lp1', name: 'Gold Points'));

  @override
  Future<Result<PosLoyaltyProgram>> createPosLoyaltyProgram(
          Map<String, dynamic> payload) async =>
      Result<PosLoyaltyProgram>.ok(PosLoyaltyProgram(id: 'lp1', name: 'Gold Points'));

  @override
  Future<Result<PosLoyaltyProgram>> updatePosLoyaltyProgram(
          String id, Map<String, dynamic> payload) async =>
      Result<PosLoyaltyProgram>.ok(PosLoyaltyProgram(id: 'lp1', name: 'Gold Points'));

  @override
  Future<Result<void>> deletePosLoyaltyProgram(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyMember>>>>
      listPosLoyaltyMembers(ListQuery query) async =>
      Result<Cacheable<Paginated<PosLoyaltyMember>>>.ok(
        Cacheable<Paginated<PosLoyaltyMember>>(
          value: Paginated<PosLoyaltyMember>(
            data: <PosLoyaltyMember>[],
            meta: const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosLoyaltyMember>> getPosLoyaltyMember(String id) async =>
      Result<PosLoyaltyMember>.ok(PosLoyaltyMember(id: 'lm1', customerId: 'c1', customerName: 'Alpha Corp', programId: 'lp1'));

  @override
  Future<Result<PosLoyaltyMember>> createPosLoyaltyMember(
          Map<String, dynamic> payload) async =>
      Result<PosLoyaltyMember>.ok(PosLoyaltyMember(id: 'lm1', customerId: 'c1', customerName: 'Alpha Corp', programId: 'lp1'));

  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyTransaction>>>>
      listPosLoyaltyTransactions(ListQuery query) async =>
      Result<Cacheable<Paginated<PosLoyaltyTransaction>>>.ok(
        Cacheable<Paginated<PosLoyaltyTransaction>>(
          value: Paginated<PosLoyaltyTransaction>(
            data: <PosLoyaltyTransaction>[],
            meta: PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosLoyaltyTransaction>> createPosLoyaltyTransaction(
          Map<String, dynamic> payload) async =>
      Result<PosLoyaltyTransaction>.ok(PosLoyaltyTransaction(id: 'lt1', memberId: 'lm1'));

  @override
  Future<Result<Cacheable<Paginated<PosCoupon>>>> listPosCoupons(
          ListQuery query) async =>
      Result<Cacheable<Paginated<PosCoupon>>>.ok(
        Cacheable<Paginated<PosCoupon>>(
          value: Paginated<PosCoupon>(
            data: <PosCoupon>[],
            meta: const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosCoupon>> getPosCoupon(String id) async =>
      Result<PosCoupon>.ok(PosCoupon(id: 'cp1', code: 'SAVE10'));

  @override
  Future<Result<PosCoupon>> createPosCoupon(Map<String, dynamic> payload) async =>
      Result<PosCoupon>.ok(PosCoupon(id: 'cp1', code: 'SAVE10'));

  @override
  Future<Result<PosCoupon>> updatePosCoupon(String id, Map<String, dynamic> payload) async =>
      Result<PosCoupon>.ok(PosCoupon(id: 'cp1', code: 'SAVE10'));

  @override
  Future<Result<void>> deletePosCoupon(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<Cacheable<Paginated<PosGiftCard>>>> listPosGiftCards(
          ListQuery query) async =>
      Result<Cacheable<Paginated<PosGiftCard>>>.ok(
        Cacheable<Paginated<PosGiftCard>>(
          value: Paginated<PosGiftCard>(
            data: <PosGiftCard>[],
            meta: const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosGiftCard>> getPosGiftCard(String id) async =>
      Result<PosGiftCard>.ok(PosGiftCard(id: 'gc1', code: 'GIFT-001'));

  @override
  Future<Result<PosGiftCard>> createPosGiftCard(Map<String, dynamic> payload) async =>
      Result<PosGiftCard>.ok(PosGiftCard(id: 'gc1', code: 'GIFT-001'));

  @override
  Future<Result<void>> deletePosGiftCard(String id) async =>
      Result<void>.ok(null);

  @override
  Future<Result<Cacheable<Paginated<PosPriceList>>>> listPosPriceLists(
          ListQuery query) async =>
      Result<Cacheable<Paginated<PosPriceList>>>.ok(
        Cacheable<Paginated<PosPriceList>>(
          value: Paginated<PosPriceList>(
            data: <PosPriceList>[],
            meta: const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosPriceList>> getPosPriceList(String id) async =>
      Result<PosPriceList>.ok(PosPriceList(id: 'pl1', name: 'Standard'));

  @override
  Future<Result<PosPriceList>> createPosPriceList(Map<String, dynamic> payload) async =>
      Result<PosPriceList>.ok(PosPriceList(id: 'pl1', name: 'Standard'));

  @override
  Future<Result<PosPriceList>> updatePosPriceList(String id, Map<String, dynamic> payload) async =>
      Result<PosPriceList>.ok(PosPriceList(id: 'pl1', name: 'Standard'));

  @override
  Future<Result<void>> deletePosPriceList(String id) async =>
      Result<void>.ok(null);
}

// ── Pump helpers ────────────────────────────────────────────────────────────

/// Renders a [PosOrderDetailPage] with a fake repository returning [order].
Future<void> pumpPosOrderDetail(
  WidgetTester tester,
  PosOrder order, {
  PosRepository? repository,
}) async {
  final repo = repository ?? FakePosRepository();
  if (repo is FakePosRepository) {
    repo.getPosOrderResult = order;
  }
  await pumpWidget(
    tester,
    <Override>[
      posRepositoryProvider.overrideWithValue(repo),
    ],
    PosOrderDetailPage(id: order.id),
  );
}

/// Renders a [PosRegisterDetailPage] with a fake repository returning [register].
Future<void> pumpPosRegisterDetail(
  WidgetTester tester,
  PosRegister register, {
  PosRepository? repository,
}) async {
  final repo = repository ?? FakePosRepository();
  if (repo is FakePosRepository) {
    repo.getPosRegisterResult = register;
  }
  await pumpWidget(
    tester,
    <Override>[
      posRepositoryProvider.overrideWithValue(repo),
    ],
    PosRegisterDetailPage(id: register.id),
  );
}

/// Core pump: wraps the given [page] in a [MaterialApp] + [ProviderScope] with
/// [overrides] applied.
Future<void> pumpWidget(
  WidgetTester tester,
  List<Override> overrides,
  Widget page,
) async {
  final container = ProviderContainer(
    overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
      activeTenantIdProvider.overrideWithValue('tenant-1'),
      ...overrides,
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
  await tester.pump();
}

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  group('PosOrderDetailPage', () {
    testWidgets('renders order details with customer name', (
      WidgetTester tester,
    ) async {
      await pumpPosOrderDetail(tester, _completedOrder);
      await tester.pumpAndSettle();

      expect(find.text('Order'), findsOneWidget);
      expect(find.text('POS-001'), findsOneWidget);
      expect(find.text('Alpha Corp'), findsOneWidget);
      expect(find.text('COMPLETED'), findsOneWidget);
    });

    testWidgets('renders order items and totals section', (
      WidgetTester tester,
    ) async {
      await pumpPosOrderDetail(tester, _completedOrder);
      await tester.pumpAndSettle();

      expect(find.text('Items'), findsOneWidget);
      expect(find.text('Widget × 2'), findsOneWidget);
      expect(find.text('Totals'), findsOneWidget);
      expect(find.text('Subtotal'), findsOneWidget);
      expect(find.text('Discount'), findsOneWidget);
      expect(find.text('Tax'), findsOneWidget);
      expect(find.text('Total'), findsOneWidget);
    });

    testWidgets('renders payments section when payments exist', (
      WidgetTester tester,
    ) async {
      await pumpPosOrderDetail(tester, _completedOrder);
      await tester.pumpAndSettle();

      expect(find.text('Payments'), findsOneWidget);
      expect(find.text('CASH'), findsOneWidget);
    });

    testWidgets('renders walk-in customer when customerName is null', (
      WidgetTester tester,
    ) async {
      await pumpPosOrderDetail(tester, _walkinOrder);
      await tester.pumpAndSettle();

      expect(find.text('Walk-in customer'), findsOneWidget);
      expect(find.text('POS-002'), findsOneWidget);
    });
  });

  group('PosRegisterDetailPage', () {
    testWidgets('renders open register details', (
      WidgetTester tester,
    ) async {
      await pumpPosRegisterDetail(tester, _openRegister);
      await tester.pumpAndSettle();

      expect(find.text('Register'), findsOneWidget);
      expect(find.text('Main Register'), findsOneWidget);
      expect(find.text('OPEN'), findsOneWidget);
      expect(find.text('Balances'), findsOneWidget);
      expect(find.text('Opening balance'), findsOneWidget);
      expect(find.text('Location'), findsOneWidget);
      expect(find.text('Store Front'), findsOneWidget);
    });

    testWidgets('renders closed register with closing balance', (
      WidgetTester tester,
    ) async {
      await pumpPosRegisterDetail(tester, _closedRegister);
      await tester.pumpAndSettle();

      expect(find.text('Back Office'), findsOneWidget);
      expect(find.text('CLOSED'), findsOneWidget);
      expect(find.text('Opening balance'), findsOneWidget);
      expect(find.text('Closing balance'), findsOneWidget);
      expect(find.text('Location'), findsOneWidget);
      expect(find.text('—'), findsOneWidget);
    });

    testWidgets('shows dash for location when null', (
      WidgetTester tester,
    ) async {
      await pumpPosRegisterDetail(tester, _closedRegister);
      await tester.pumpAndSettle();

      expect(find.text('—'), findsOneWidget);
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
