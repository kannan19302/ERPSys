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
import 'package:unerp_mobile/features/pos/domain/entities/pos.dart';
import 'package:unerp_mobile/features/pos/domain/repositories/pos_repository.dart';
import 'package:unerp_mobile/features/pos/presentation/providers/pos_providers.dart';

// ── Entity constants ────────────────────────────────────────────────────────

const PosOrderItem _orderItem = PosOrderItem(
  id: 'poi1', productId: 'p1', productName: 'Widget', quantity: 2, rate: 50, amount: 100,
);

const PosPayment _payment = PosPayment(
  id: 'pay1', orderId: 'o1', amount: 100, method: 'CASH',
);

const PosOrder _posOrderA = PosOrder(
  id: 'o1', orderNumber: 'POS-001', status: 'COMPLETED',
  customerId: 'c1', customerName: 'Alpha Corp',
  items: <PosOrderItem>[_orderItem], payments: <PosPayment>[_payment],
  subtotal: 100, discountTotal: 0, taxTotal: 0, totalAmount: 100,
);

const PosOrder _posOrderB = PosOrder(
  id: 'o2', orderNumber: 'POS-002', status: 'PENDING',
  customerId: 'c2', customerName: 'Beta Inc',
  items: <PosOrderItem>[_orderItem],
  subtotal: 200, discountTotal: 10, taxTotal: 20, totalAmount: 210,
);

const PosRegister _posRegisterA = PosRegister(
  id: 'r1', name: 'Main Register', status: 'OPEN', openingBalance: 500,
  location: 'Store Front',
);

const PosRegister _posRegisterB = PosRegister(
  id: 'r2', name: 'Back Office', status: 'CLOSED', openingBalance: 200,
  location: 'Office',
);

final PosShift _posShiftA = PosShift(
  id: 's1', registerId: 'r1', userId: 'u1',
  openedAt: DateTime(2026, 7, 29, 8, 0),
  status: 'OPEN', openingBalance: 500, cashSales: 1200, cardSales: 800, totalSales: 2000,
);

final PosShift _posShiftB = PosShift(
  id: 's2', registerId: 'r2', userId: 'u2',
  openedAt: DateTime(2026, 7, 28, 8, 0),
  closedAt: DateTime(2026, 7, 28, 18, 0),
  status: 'CLOSED', openingBalance: 200, closingBalance: 1800,
  cashSales: 1000, cardSales: 600, totalSales: 1600,
);

const PosDiscount _posDiscountA = PosDiscount(
  id: 'd1', name: 'Summer Sale', type: 'PERCENTAGE', value: 10,
  isActive: true, applicableOn: 'ALL', minAmount: 50, maxDiscount: 500,
);

const PosDiscount _posDiscountB = PosDiscount(
  id: 'd2', name: 'Loyalty Discount', type: 'FIXED', value: 25,
  isActive: true,
);

const PosLoyaltyProgram _loyaltyProgramA = PosLoyaltyProgram(
  id: 'lp1', name: 'Gold Points', type: 'points',
  pointsPerAmount: 10, rewardValue: 1, isActive: true, memberCount: 50,
);

const PosLoyaltyProgram _loyaltyProgramB = PosLoyaltyProgram(
  id: 'lp2', name: 'Silver Points', type: 'points',
  pointsPerAmount: 5, rewardValue: 0.5, isActive: true, memberCount: 120,
);

const PosLoyaltyMember _loyaltyMemberA = PosLoyaltyMember(
  id: 'lm1', customerId: 'c1', customerName: 'Alpha Corp',
  programId: 'lp1', programName: 'Gold Points', points: 500,
);

const PosLoyaltyMember _loyaltyMemberB = PosLoyaltyMember(
  id: 'lm2', customerId: 'c3', customerName: 'Gamma LLC',
  programId: 'lp2', programName: 'Silver Points', points: 120,
);

const PosCoupon _posCouponA = PosCoupon(
  id: 'cp1', code: 'SAVE10', discountType: 'percentage', discountValue: 10,
  minOrder: 50, maxUses: 100, currentUses: 5, isActive: true,
);

const PosCoupon _posCouponB = PosCoupon(
  id: 'cp2', code: 'FLAT25', discountType: 'fixed', discountValue: 25,
  minOrder: 100, isActive: true,
);

const PosGiftCard _giftCardA = PosGiftCard(
  id: 'gc1', code: 'GIFT-001', initialBalance: 100, currentBalance: 75,
  customerId: 'c1', customerName: 'Alpha Corp', isActive: true,
);

const PosGiftCard _giftCardB = PosGiftCard(
  id: 'gc2', code: 'GIFT-002', initialBalance: 50, currentBalance: 50,
  isActive: true,
);

const PosPriceListItem _priceListItem = PosPriceListItem(
  productId: 'p1', productName: 'Widget', price: 100,
);

const PosPriceList _priceListA = PosPriceList(
  id: 'pl1', name: 'Standard Retail', currency: 'USD',
  isDefault: true, isActive: true,
  items: <PosPriceListItem>[_priceListItem],
);

const PosPriceList _priceListB = PosPriceList(
  id: 'pl2', name: 'Wholesale', currency: 'USD',
  isDefault: false, isActive: true,
  items: <PosPriceListItem>[_priceListItem],
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
        {int page = 1, bool hasMore = false,}) =>
    Cacheable<Paginated<T>>(
      value: _page<T>(items, page: page, hasMore: hasMore),
    );

// ── Fake PosRepository ──────────────────────────────────────────────────────

class FakePosRepository implements PosRepository {
  final List<ListQuery> receivedQueries = <ListQuery>[];

  Future<Result<Cacheable<Paginated<PosOrder>>>> Function(ListQuery)?
      listPosOrdersHandler;
  Future<Result<Cacheable<Paginated<PosRegister>>>> Function(ListQuery)?
      listPosRegistersHandler;
  Future<Result<Cacheable<Paginated<PosShift>>>> Function(ListQuery)?
      listPosShiftsHandler;
  Future<Result<Cacheable<Paginated<PosDiscount>>>> Function(ListQuery)?
      listPosDiscountsHandler;
  Future<Result<Cacheable<Paginated<PosLoyaltyProgram>>>> Function(ListQuery)?
      listPosLoyaltyProgramsHandler;
  Future<Result<Cacheable<Paginated<PosLoyaltyMember>>>> Function(ListQuery)?
      listPosLoyaltyMembersHandler;
  Future<Result<Cacheable<Paginated<PosCoupon>>>> Function(ListQuery)?
      listPosCouponsHandler;
  Future<Result<Cacheable<Paginated<PosGiftCard>>>> Function(ListQuery)?
      listPosGiftCardsHandler;
  Future<Result<Cacheable<Paginated<PosPriceList>>>> Function(ListQuery)?
      listPosPriceListsHandler;

  int createPosOrderCalls = 0;
  Result<PosOrder> createPosOrderResult = const Result<PosOrder>.ok(_posOrderA);
  int updatePosOrderCalls = 0;
  Result<PosOrder> updatePosOrderResult = const Result<PosOrder>.ok(_posOrderA);
  int deletePosOrderCalls = 0;
  Result<void> deletePosOrderResult = const Result<void>.ok(null);
  int voidPosOrderCalls = 0;
  Result<PosOrder> voidPosOrderResult = const Result<PosOrder>.ok(_posOrderA);

  int createPosRegisterCalls = 0;
  Result<PosRegister> createPosRegisterResult =
      const Result<PosRegister>.ok(_posRegisterA);
  int updatePosRegisterCalls = 0;
  int deletePosRegisterCalls = 0;
  Result<void> deletePosRegisterResult = const Result<void>.ok(null);

  int createPosShiftCalls = 0;
  final Result<PosShift> createPosShiftResult = Result<PosShift>.ok(_posShiftA);
  int closePosShiftCalls = 0;
  final Result<PosShift> closePosShiftResult = Result<PosShift>.ok(_posShiftA);

  int createPosDiscountCalls = 0;
  Result<PosDiscount> createPosDiscountResult =
      const Result<PosDiscount>.ok(_posDiscountA);
  int updatePosDiscountCalls = 0;
  int deletePosDiscountCalls = 0;
  Result<void> deletePosDiscountResult = const Result<void>.ok(null);

  int createPosLoyaltyProgramCalls = 0;
  int updatePosLoyaltyProgramCalls = 0;
  int deletePosLoyaltyProgramCalls = 0;
  Result<void> deletePosLoyaltyProgramResult = const Result<void>.ok(null);

  int createPosLoyaltyMemberCalls = 0;
  int createPosCouponCalls = 0;
  int updatePosCouponCalls = 0;
  int deletePosCouponCalls = 0;
  Result<void> deletePosCouponResult = const Result<void>.ok(null);

  int createPosGiftCardCalls = 0;
  int deletePosGiftCardCalls = 0;
  Result<void> deletePosGiftCardResult = const Result<void>.ok(null);

  int createPosPriceListCalls = 0;
  int updatePosPriceListCalls = 0;
  int deletePosPriceListCalls = 0;
  Result<void> deletePosPriceListResult = const Result<void>.ok(null);

  // ── Orders ──

  @override
  Future<Result<Cacheable<Paginated<PosOrder>>>> listPosOrders(
      ListQuery query,) async {
    receivedQueries.add(query);
    final handler = listPosOrdersHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosOrder>>>.ok(
      _cachedPage(<PosOrder>[_posOrderA, _posOrderB]),
    );
  }

  @override
  Future<Result<PosOrder>> getPosOrder(String id) async =>
      const Result<PosOrder>.ok(_posOrderA);

  @override
  Future<Result<PosOrder>> createPosOrder(Map<String, dynamic> payload) async {
    createPosOrderCalls++;
    return createPosOrderResult;
  }

  @override
  Future<Result<PosOrder>> updatePosOrder(
      String id, Map<String, dynamic> payload,) async {
    updatePosOrderCalls++;
    return updatePosOrderResult;
  }

  @override
  Future<Result<void>> deletePosOrder(String id) async {
    deletePosOrderCalls++;
    return deletePosOrderResult;
  }

  @override
  Future<Result<PosOrder>> voidPosOrder(String id) async {
    voidPosOrderCalls++;
    return voidPosOrderResult;
  }

  @override
  Future<Result<PosOrder>> holdPosOrder(String id) async =>
      const Result<PosOrder>.ok(_posOrderA);

  // ── Registers ──

  @override
  Future<Result<Cacheable<Paginated<PosRegister>>>> listPosRegisters(
      ListQuery query,) async {
    receivedQueries.add(query);
    final handler = listPosRegistersHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosRegister>>>.ok(
      _cachedPage(<PosRegister>[_posRegisterA, _posRegisterB]),
    );
  }

  @override
  Future<Result<PosRegister>> getPosRegister(String id) async =>
      const Result<PosRegister>.ok(_posRegisterA);

  @override
  Future<Result<PosRegister>> createPosRegister(
      Map<String, dynamic> payload,) async {
    createPosRegisterCalls++;
    return createPosRegisterResult;
  }

  @override
  Future<Result<PosRegister>> updatePosRegister(
      String id, Map<String, dynamic> payload,) async {
    updatePosRegisterCalls++;
    return createPosRegisterResult;
  }

  @override
  Future<Result<void>> deletePosRegister(String id) async {
    deletePosRegisterCalls++;
    return deletePosRegisterResult;
  }

  @override
  Future<Result<PosRegister>> openPosRegister(String id) async =>
      createPosRegisterResult;

  @override
  Future<Result<PosRegister>> closePosRegister(String id) async =>
      createPosRegisterResult;

  // ── Shifts ──

  @override
  Future<Result<Cacheable<Paginated<PosShift>>>> listPosShifts(
      ListQuery query,) async {
    receivedQueries.add(query);
    final handler = listPosShiftsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosShift>>>.ok(
      _cachedPage(<PosShift>[_posShiftA, _posShiftB]),
    );
  }

  @override
  Future<Result<PosShift>> getPosShift(String id) async =>
      Result<PosShift>.ok(_posShiftA);

  @override
  Future<Result<PosShift>> createPosShift(Map<String, dynamic> payload) async {
    createPosShiftCalls++;
    return createPosShiftResult;
  }

  @override
  Future<Result<PosShift>> closePosShift(String id) async {
    closePosShiftCalls++;
    return closePosShiftResult;
  }

  // ── Terminals (minimal) ──

  @override
  Future<Result<Cacheable<Paginated<PosTerminal>>>> listPosTerminals(
          ListQuery query,) async =>
      const Result<Cacheable<Paginated<PosTerminal>>>.ok(
        Cacheable<Paginated<PosTerminal>>(
          value: Paginated<PosTerminal>(
            data: <PosTerminal>[],
            meta: PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosTerminal>> getPosTerminal(String id) async =>
      const Result<PosTerminal>.ok(
        PosTerminal(id: 't1', name: 'Terminal 1'),
      );

  @override
  Future<Result<PosTerminal>> createPosTerminal(
          Map<String, dynamic> payload,) async =>
      const Result<PosTerminal>.ok(
        PosTerminal(id: 't1', name: 'Terminal 1'),
      );

  @override
  Future<Result<PosTerminal>> updatePosTerminal(
          String id, Map<String, dynamic> payload,) async =>
      const Result<PosTerminal>.ok(
        PosTerminal(id: 't1', name: 'Terminal 1'),
      );

  @override
  Future<Result<void>> deletePosTerminal(String id) async =>
      const Result<void>.ok(null);

  // ── Discounts ──

  @override
  Future<Result<Cacheable<Paginated<PosDiscount>>>> listPosDiscounts(
      ListQuery query,) async {
    receivedQueries.add(query);
    final handler = listPosDiscountsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosDiscount>>>.ok(
      _cachedPage(<PosDiscount>[_posDiscountA, _posDiscountB]),
    );
  }

  @override
  Future<Result<PosDiscount>> getPosDiscount(String id) async =>
      const Result<PosDiscount>.ok(_posDiscountA);

  @override
  Future<Result<PosDiscount>> createPosDiscount(
      Map<String, dynamic> payload,) async {
    createPosDiscountCalls++;
    return createPosDiscountResult;
  }

  @override
  Future<Result<PosDiscount>> updatePosDiscount(
      String id, Map<String, dynamic> payload,) async {
    updatePosDiscountCalls++;
    return createPosDiscountResult;
  }

  @override
  Future<Result<void>> deletePosDiscount(String id) async {
    deletePosDiscountCalls++;
    return deletePosDiscountResult;
  }

  // ── Loyalty Programs ──

  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyProgram>>>>
      listPosLoyaltyPrograms(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listPosLoyaltyProgramsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosLoyaltyProgram>>>.ok(
      _cachedPage(<PosLoyaltyProgram>[_loyaltyProgramA, _loyaltyProgramB]),
    );
  }

  @override
  Future<Result<PosLoyaltyProgram>> getPosLoyaltyProgram(String id) async =>
      const Result<PosLoyaltyProgram>.ok(_loyaltyProgramA);

  @override
  Future<Result<PosLoyaltyProgram>> createPosLoyaltyProgram(
      Map<String, dynamic> payload,) async {
    createPosLoyaltyProgramCalls++;
    return const Result<PosLoyaltyProgram>.ok(_loyaltyProgramA);
  }

  @override
  Future<Result<PosLoyaltyProgram>> updatePosLoyaltyProgram(
      String id, Map<String, dynamic> payload,) async {
    updatePosLoyaltyProgramCalls++;
    return const Result<PosLoyaltyProgram>.ok(_loyaltyProgramA);
  }

  @override
  Future<Result<void>> deletePosLoyaltyProgram(String id) async {
    deletePosLoyaltyProgramCalls++;
    return deletePosLoyaltyProgramResult;
  }

  // ── Loyalty Members ──

  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyMember>>>>
      listPosLoyaltyMembers(ListQuery query) async {
    receivedQueries.add(query);
    final handler = listPosLoyaltyMembersHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosLoyaltyMember>>>.ok(
      _cachedPage(<PosLoyaltyMember>[_loyaltyMemberA, _loyaltyMemberB]),
    );
  }

  @override
  Future<Result<PosLoyaltyMember>> getPosLoyaltyMember(String id) async =>
      const Result<PosLoyaltyMember>.ok(_loyaltyMemberA);

  @override
  Future<Result<PosLoyaltyMember>> createPosLoyaltyMember(
      Map<String, dynamic> payload,) async {
    createPosLoyaltyMemberCalls++;
    return const Result<PosLoyaltyMember>.ok(_loyaltyMemberA);
  }

  // ── Loyalty Transactions ──

  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyTransaction>>>>
      listPosLoyaltyTransactions(ListQuery query) async =>
      const Result<Cacheable<Paginated<PosLoyaltyTransaction>>>.ok(
        Cacheable<Paginated<PosLoyaltyTransaction>>(
          value: Paginated<PosLoyaltyTransaction>(
            data: <PosLoyaltyTransaction>[],
            meta: PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
          ),
        ),
      );

  @override
  Future<Result<PosLoyaltyTransaction>> createPosLoyaltyTransaction(
          Map<String, dynamic> payload,) async =>
      const Result<PosLoyaltyTransaction>.ok(
        PosLoyaltyTransaction(id: 'lt1', memberId: 'lm1', points: 50, type: 'earn'),
      );

  // ── Coupons ──

  @override
  Future<Result<Cacheable<Paginated<PosCoupon>>>> listPosCoupons(
      ListQuery query,) async {
    receivedQueries.add(query);
    final handler = listPosCouponsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosCoupon>>>.ok(
      _cachedPage(<PosCoupon>[_posCouponA, _posCouponB]),
    );
  }

  @override
  Future<Result<PosCoupon>> getPosCoupon(String id) async =>
      const Result<PosCoupon>.ok(_posCouponA);

  @override
  Future<Result<PosCoupon>> createPosCoupon(
      Map<String, dynamic> payload,) async {
    createPosCouponCalls++;
    return const Result<PosCoupon>.ok(_posCouponA);
  }

  @override
  Future<Result<PosCoupon>> updatePosCoupon(
      String id, Map<String, dynamic> payload,) async {
    updatePosCouponCalls++;
    return const Result<PosCoupon>.ok(_posCouponA);
  }

  @override
  Future<Result<void>> deletePosCoupon(String id) async {
    deletePosCouponCalls++;
    return deletePosCouponResult;
  }

  // ── Gift Cards ──

  @override
  Future<Result<Cacheable<Paginated<PosGiftCard>>>> listPosGiftCards(
      ListQuery query,) async {
    receivedQueries.add(query);
    final handler = listPosGiftCardsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosGiftCard>>>.ok(
      _cachedPage(<PosGiftCard>[_giftCardA, _giftCardB]),
    );
  }

  @override
  Future<Result<PosGiftCard>> getPosGiftCard(String id) async =>
      const Result<PosGiftCard>.ok(_giftCardA);

  @override
  Future<Result<PosGiftCard>> createPosGiftCard(
      Map<String, dynamic> payload,) async {
    createPosGiftCardCalls++;
    return const Result<PosGiftCard>.ok(_giftCardA);
  }

  @override
  Future<Result<void>> deletePosGiftCard(String id) async {
    deletePosGiftCardCalls++;
    return deletePosGiftCardResult;
  }

  // ── Price Lists ──

  @override
  Future<Result<Cacheable<Paginated<PosPriceList>>>> listPosPriceLists(
      ListQuery query,) async {
    receivedQueries.add(query);
    final handler = listPosPriceListsHandler;
    if (handler != null) return handler(query);
    return Result<Cacheable<Paginated<PosPriceList>>>.ok(
      _cachedPage(<PosPriceList>[_priceListA, _priceListB]),
    );
  }

  @override
  Future<Result<PosPriceList>> getPosPriceList(String id) async =>
      const Result<PosPriceList>.ok(_priceListA);

  @override
  Future<Result<PosPriceList>> createPosPriceList(
      Map<String, dynamic> payload,) async {
    createPosPriceListCalls++;
    return const Result<PosPriceList>.ok(_priceListA);
  }

  @override
  Future<Result<PosPriceList>> updatePosPriceList(
      String id, Map<String, dynamic> payload,) async {
    updatePosPriceListCalls++;
    return const Result<PosPriceList>.ok(_priceListA);
  }

  @override
  Future<Result<void>> deletePosPriceList(String id) async {
    deletePosPriceListCalls++;
    return deletePosPriceListResult;
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

void main() {
  late FakePosRepository fakeRepository;
  late ProviderContainer container;

  setUp(() {
    fakeRepository = FakePosRepository();
    container = ProviderContainer(
      overrides: <Override>[
      sharedPreferencesProvider.overrideWithValue(MockSharedPreferences()),
      cookieStoreProvider.overrideWithValue(CookieStore(CookieJar(), Uri.parse('http://localhost'))),
      apiClientProvider.overrideWithValue(ApiClient.forTesting(Dio())),
        posRepositoryProvider.overrideWithValue(fakeRepository),
        activeTenantIdProvider.overrideWithValue('tenant-1'),
      ],
    );
    addTearDown(container.dispose);
  });

  // ── PosOrdersController ──────────────────────────────────────────────────

  group('PosOrdersController', () {
    test('build loads page 1', () async {
      container.read(posOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posOrdersProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('search debounces and resets to page 1', () async {
      container.read(posOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      container.read(posOrdersProvider.notifier).search('alpha');
      await Future<void>.delayed(const Duration(milliseconds: 400));

      final last = fakeRepository.receivedQueries.last;
      expect(last.search, 'alpha');
      expect(last.page, 1);
    });

    test('loadMore appends data and requests next page', () async {
      fakeRepository.listPosOrdersHandler =
          (ListQuery q) async => Result<Cacheable<Paginated<PosOrder>>>.ok(
                _cachedPage<PosOrder>(
                  <PosOrder>[if (q.page == 1) _posOrderA else _posOrderB],
                  page: q.page,
                  hasMore: q.page == 1,
                ),
              );
      container.read(posOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(posOrdersProvider.notifier).loadMore();

      final state = container.read(posOrdersProvider);
      expect(state.items.map((PosOrder o) => o.id), <String>['o1', 'o2']);
      expect(
        fakeRepository.receivedQueries.map((ListQuery q) => q.page),
        <int>[1, 2],
      );
    });

    test('loadMore is a no-op when hasMore is false', () async {
      container.read(posOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(posOrdersProvider.notifier).loadMore();

      expect(fakeRepository.receivedQueries, hasLength(1));
    });

    test('save calls SavePosOrderUseCase and refreshes', () async {
      container.read(posOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posOrdersProvider.notifier)
          .save(<String, dynamic>{'customerId': 'c1'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createPosOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('save with id calls update and refreshes', () async {
      container.read(posOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posOrdersProvider.notifier)
          .save(<String, dynamic>{'customerId': 'c1'}, id: 'o1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.updatePosOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('delete calls repository and refreshes', () async {
      container.read(posOrdersProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(posOrdersProvider.notifier).delete('o1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deletePosOrderCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── PosRegistersController ───────────────────────────────────────────────

  group('PosRegistersController', () {
    test('build loads page 1', () async {
      container.read(posRegistersProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posRegistersProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save calls SavePosRegisterUseCase and refreshes', () async {
      container.read(posRegistersProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posRegistersProvider.notifier)
          .save(<String, dynamic>{'name': 'New Register'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createPosRegisterCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('delete calls repository and refreshes', () async {
      container.read(posRegistersProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(posRegistersProvider.notifier).delete('r1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deletePosRegisterCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── PosShiftsController ──────────────────────────────────────────────────

  group('PosShiftsController', () {
    test('build loads page 1', () async {
      container.read(posShiftsProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posShiftsProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('create calls ClosePosShiftUseCase', () async {
      container.read(posShiftsProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posShiftsProvider.notifier)
          .create(<String, dynamic>{'registerId': 'r1'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.closePosShiftCalls, 1);
    });

    test('closeShift calls use case and refreshes', () async {
      container.read(posShiftsProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(posShiftsProvider.notifier).closeShift('s1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.closePosShiftCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── PosDiscountsController ───────────────────────────────────────────────

  group('PosDiscountsController', () {
    test('build loads page 1', () async {
      container.read(posDiscountsProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posDiscountsProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save calls SavePosDiscountUseCase and refreshes', () async {
      container.read(posDiscountsProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posDiscountsProvider.notifier)
          .save(<String, dynamic>{'name': 'New Discount', 'type': 'PERCENTAGE', 'value': 15});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createPosDiscountCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });

    test('delete calls repository and refreshes', () async {
      container.read(posDiscountsProvider);
      await Future<void>.delayed(Duration.zero);

      final result =
          await container.read(posDiscountsProvider.notifier).delete('d1');

      expect(result.isOk, isTrue);
      expect(fakeRepository.deletePosDiscountCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── PosLoyaltyProgramsController ─────────────────────────────────────────

  group('PosLoyaltyProgramsController', () {
    test('build loads page 1', () async {
      container.read(posLoyaltyProgramsProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posLoyaltyProgramsProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save calls SavePosLoyaltyProgramUseCase and refreshes', () async {
      container.read(posLoyaltyProgramsProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posLoyaltyProgramsProvider.notifier)
          .save(<String, dynamic>{'name': 'VIP Program'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createPosLoyaltyProgramCalls, 1);
      expect(fakeRepository.receivedQueries, hasLength(2));
    });
  });

  // ── PosLoyaltyMembersController ──────────────────────────────────────────

  group('PosLoyaltyMembersController', () {
    test('build loads page 1', () async {
      container.read(posLoyaltyMembersProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posLoyaltyMembersProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });
  });

  // ── PosCouponsController ─────────────────────────────────────────────────

  group('PosCouponsController', () {
    test('build loads page 1', () async {
      container.read(posCouponsProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posCouponsProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save calls SavePosCouponUseCase', () async {
      container.read(posCouponsProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posCouponsProvider.notifier)
          .save(<String, dynamic>{'code': 'NEW20', 'discountValue': 20});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createPosCouponCalls, 1);
    });
  });

  // ── PosGiftCardsController ───────────────────────────────────────────────

  group('PosGiftCardsController', () {
    test('build loads page 1', () async {
      container.read(posGiftCardsProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posGiftCardsProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('create calls SavePosGiftCardUseCase', () async {
      container.read(posGiftCardsProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posGiftCardsProvider.notifier)
          .create(<String, dynamic>{'code': 'GIFT-003', 'initialBalance': 200});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createPosGiftCardCalls, 1);
    });
  });

  // ── PosPriceListsController ──────────────────────────────────────────────

  group('PosPriceListsController', () {
    test('build loads page 1', () async {
      container.read(posPriceListsProvider);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(posPriceListsProvider);
      expect(state.items, hasLength(2));
      expect(state.isLoading, isFalse);
      expect(fakeRepository.receivedQueries.single.page, 1);
    });

    test('save calls SavePosPriceListUseCase', () async {
      container.read(posPriceListsProvider);
      await Future<void>.delayed(Duration.zero);

      final result = await container
          .read(posPriceListsProvider.notifier)
          .save(<String, dynamic>{'name': 'Premium Pricing', 'currency': 'USD'});

      expect(result.isOk, isTrue);
      expect(fakeRepository.createPosPriceListCalls, 1);
    });
  });
}

class MockSharedPreferences extends Mock implements SharedPreferences {}
