import '../../../../core/error/exceptions.dart';
import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/pos_remote_data_source.dart';
import '../../data/repositories/pos_repository_impl.dart';
import '../../domain/entities/pos.dart';
import '../../domain/repositories/pos_repository.dart';
import '../../domain/usecases/pos_usecases.dart';

final Provider<PosRemoteDataSource> posRemoteDataSourceProvider =
    Provider<PosRemoteDataSource>((Ref ref) => PosRemoteDataSourceImpl(ref.watch(apiClientProvider)));

final Provider<PosRepository> posRepositoryProvider =
    Provider<PosRepository>((Ref ref) => PosRepositoryImpl(
      remote: ref.watch(posRemoteDataSourceProvider),
      cache: ref.watch(responseCacheProvider),
      tenantId: ref.watch(activeTenantIdProvider),
    ));

class PosListState<T extends Equatable> extends Equatable {
  const PosListState({
    this.items = const <Never>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<T> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  PosListState<T> copyWith({
    List<T>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) => PosListState<T>(
    items: items ?? this.items, meta: meta ?? this.meta, query: query ?? this.query,
    isLoading: isLoading ?? this.isLoading, isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    failure: clearFailures ? null : (failure ?? this.failure),
    loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
    cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
  );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure, cachedAt];
}

class _PosListController<T extends Equatable> {
  _PosListController(this._listUseCase);

  final UseCase<Cacheable<Paginated<T>>, ListQuery> _listUseCase;
  Timer? _searchDebounce;

  void dispose() => _searchDebounce?.cancel();

  Future<void> refresh(PosListState<T> state, void Function(PosListState<T>) emit) async {
    final q = state.query.copyWith(page: 1);
    emit(state.copyWith(isLoading: true, clearFailures: true));
    final r = await _listUseCase(q);
    emit(r.fold(
      (f) => state.copyWith(isLoading: false, failure: f, items: const []),
      (p) => state.copyWith(items: p.value.data, meta: p.value.meta, query: q,
          isLoading: false, clearFailures: true, cachedAt: p.cachedAt, clearCachedAt: !p.isFromCache),
    ));
  }

  Future<void> loadMore(PosListState<T> state, void Function(PosListState<T>) emit) async {
    if (state.isLoadingMore || !state.meta.hasMore) return;
    emit(state.copyWith(isLoadingMore: true, clearFailures: true));
    final next = state.query.copyWith(page: state.meta.page + 1);
    final r = await _listUseCase(next);
    emit(r.fold(
      (f) => state.copyWith(isLoadingMore: false, loadMoreFailure: f),
      (p) => state.copyWith(items: [...state.items, ...p.value.data], meta: p.value.meta,
          query: next, isLoadingMore: false, clearFailures: true),
    ));
  }

  void search(PosListState<T> state, void Function(PosListState<T>) emit, String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      final updated = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      emit(updated);
      refresh(updated, emit);
    });
  }

  void applySort(PosListState<T> state, void Function(PosListState<T>) emit, String sort) {
    emit(state.copyWith(query: state.query.copyWith(sort: sort, page: 1)));
    refresh(state, emit);
  }

  void applyFilters(PosListState<T> state, void Function(PosListState<T>) emit, Map<String, String> filters) {
    emit(state.copyWith(query: state.query.copyWith(filters: filters, page: 1)));
    refresh(state, emit);
  }
}

// ── PosOrders ─────────────────────────────────────────────────────────────

final NotifierProvider<PosOrdersController, PosListState<PosOrder>> posOrdersProvider =
    NotifierProvider<PosOrdersController, PosListState<PosOrder>>(PosOrdersController.new);

class PosOrdersController extends Notifier<PosListState<PosOrder>> {
  _PosListController<PosOrder>? _helper;
  @override
  PosListState<PosOrder> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosOrder>(ListPosOrdersUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosOrder>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  Future<void> loadMore() => _helper!.loadMore(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applySort(String sort) => _helper!.applySort(state, (s) => state = s, sort);
  void applyFilters(Map<String, String> f) => _helper!.applyFilters(state, (s) => state = s, f);

  Future<Result<PosOrder>> save(Map<String, dynamic> payload, {String? id}) async {
    final r = await SavePosOrderUseCase(ref.read(posRepositoryProvider))(SavePosOrderParams(id: id, payload: payload));
    if (r.isOk) await refresh();
    return r;
  }

  Future<Result<void>> delete(String id) async {
    final r = await DeletePosOrderUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
  Future<Result<void>> voidOrder(String id) async {
    final r = await VoidPosOrderUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosOrder, String> posOrderDetailProvider =
    FutureProvider.family<PosOrder, String>((Ref ref, String id) async {
  final r = await GetPosOrderUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── PosRegisters ───────────────────────────────────────────────────────────

final NotifierProvider<PosRegistersController, PosListState<PosRegister>> posRegistersProvider =
    NotifierProvider<PosRegistersController, PosListState<PosRegister>>(PosRegistersController.new);

class PosRegistersController extends Notifier<PosListState<PosRegister>> {
  _PosListController<PosRegister>? _helper;
  @override
  PosListState<PosRegister> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosRegister>(ListPosRegistersUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosRegister>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);

  Future<Result<PosRegister>> save(Map<String, dynamic> payload, {String? id}) async {
    final r = await SavePosRegisterUseCase(ref.read(posRepositoryProvider))(SavePosRegisterParams(id: id, payload: payload));
    if (r.isOk) await refresh();
    return r;
  }

  Future<Result<void>> openRegister(String id) async {
    final r = await OpenPosRegisterUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
  Future<Result<void>> closeRegister(String id) async {
    final r = await ClosePosRegisterUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
  Future<Result<void>> delete(String id) async {
    final r = await DeletePosRegisterUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosRegister, String> posRegisterDetailProvider =
    FutureProvider.family<PosRegister, String>((Ref ref, String id) async {
  final r = await GetPosRegisterUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── PosShifts ──────────────────────────────────────────────────────────────

final NotifierProvider<PosShiftsController, PosListState<PosShift>> posShiftsProvider =
    NotifierProvider<PosShiftsController, PosListState<PosShift>>(PosShiftsController.new);

class PosShiftsController extends Notifier<PosListState<PosShift>> {
  _PosListController<PosShift>? _helper;
  @override
  PosListState<PosShift> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosShift>(ListPosShiftsUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosShift>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);

  Future<Result<PosShift>> create(Map<String, dynamic> payload) async {
    final r = await ClosePosShiftUseCase(ref.read(posRepositoryProvider))('');
    return r;
  }
  Future<Result<void>> closeShift(String id) async {
    final r = await ClosePosShiftUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosShift, String> posShiftDetailProvider =
    FutureProvider.family<PosShift, String>((Ref ref, String id) async {
  final r = await GetPosShiftUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── PosDiscounts ───────────────────────────────────────────────────────────

final NotifierProvider<PosDiscountsController, PosListState<PosDiscount>> posDiscountsProvider =
    NotifierProvider<PosDiscountsController, PosListState<PosDiscount>>(PosDiscountsController.new);

class PosDiscountsController extends Notifier<PosListState<PosDiscount>> {
  _PosListController<PosDiscount>? _helper;
  @override
  PosListState<PosDiscount> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosDiscount>(ListPosDiscountsUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosDiscount>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  Future<void> loadMore() => _helper!.loadMore(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applySort(String sort) => _helper!.applySort(state, (s) => state = s, sort);
  void applyFilters(Map<String, String> f) => _helper!.applyFilters(state, (s) => state = s, f);

  Future<Result<PosDiscount>> save(Map<String, dynamic> payload, {String? id}) async {
    final r = await SavePosDiscountUseCase(ref.read(posRepositoryProvider))(SavePosDiscountParams(id: id, payload: payload));
    if (r.isOk) await refresh();
    return r;
  }
  Future<Result<void>> delete(String id) async {
    final r = await DeletePosDiscountUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosDiscount, String> posDiscountDetailProvider =
    FutureProvider.family<PosDiscount, String>((Ref ref, String id) async {
  final r = await GetPosDiscountUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── PosLoyaltyPrograms ─────────────────────────────────────────────────────

final NotifierProvider<PosLoyaltyProgramsController, PosListState<PosLoyaltyProgram>> posLoyaltyProgramsProvider =
    NotifierProvider<PosLoyaltyProgramsController, PosListState<PosLoyaltyProgram>>(PosLoyaltyProgramsController.new);

class PosLoyaltyProgramsController extends Notifier<PosListState<PosLoyaltyProgram>> {
  _PosListController<PosLoyaltyProgram>? _helper;
  @override
  PosListState<PosLoyaltyProgram> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosLoyaltyProgram>(ListPosLoyaltyProgramsUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosLoyaltyProgram>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applyFilters(Map<String, String> f) => _helper!.applyFilters(state, (s) => state = s, f);

  Future<Result<PosLoyaltyProgram>> save(Map<String, dynamic> payload, {String? id}) async {
    final r = await SavePosLoyaltyProgramUseCase(ref.read(posRepositoryProvider))(SavePosLoyaltyProgramParams(id: id, payload: payload));
    if (r.isOk) await refresh();
    return r;
  }
  Future<Result<void>> delete(String id) async {
    final r = await DeletePosLoyaltyProgramUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosLoyaltyProgram, String> posLoyaltyProgramDetailProvider =
    FutureProvider.family<PosLoyaltyProgram, String>((Ref ref, String id) async {
  final r = await GetPosLoyaltyProgramUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── PosLoyaltyMembers ──────────────────────────────────────────────────────

final NotifierProvider<PosLoyaltyMembersController, PosListState<PosLoyaltyMember>> posLoyaltyMembersProvider =
    NotifierProvider<PosLoyaltyMembersController, PosListState<PosLoyaltyMember>>(PosLoyaltyMembersController.new);

class PosLoyaltyMembersController extends Notifier<PosListState<PosLoyaltyMember>> {
  _PosListController<PosLoyaltyMember>? _helper;
  @override
  PosListState<PosLoyaltyMember> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosLoyaltyMember>(ListPosLoyaltyMembersUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosLoyaltyMember>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applyFilters(Map<String, String> f) => _helper!.applyFilters(state, (s) => state = s, f);

  Future<Result<PosLoyaltyMember>> create(Map<String, dynamic> payload) async {
    final r = await SavePosLoyaltyMemberUseCase(ref.read(posRepositoryProvider))(payload);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosLoyaltyMember, String> posLoyaltyMemberDetailProvider =
    FutureProvider.family<PosLoyaltyMember, String>((Ref ref, String id) async {
  final r = await GetPosLoyaltyMemberUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── PosCoupons ─────────────────────────────────────────────────────────────

final NotifierProvider<PosCouponsController, PosListState<PosCoupon>> posCouponsProvider =
    NotifierProvider<PosCouponsController, PosListState<PosCoupon>>(PosCouponsController.new);

class PosCouponsController extends Notifier<PosListState<PosCoupon>> {
  _PosListController<PosCoupon>? _helper;
  @override
  PosListState<PosCoupon> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosCoupon>(ListPosCouponsUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosCoupon>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applyFilters(Map<String, String> f) => _helper!.applyFilters(state, (s) => state = s, f);

  Future<Result<PosCoupon>> save(Map<String, dynamic> payload, {String? id}) async {
    final r = await SavePosCouponUseCase(ref.read(posRepositoryProvider))(SavePosCouponParams(id: id, payload: payload));
    if (r.isOk) await refresh();
    return r;
  }
  Future<Result<void>> delete(String id) async {
    final r = await DeletePosCouponUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosCoupon, String> posCouponDetailProvider =
    FutureProvider.family<PosCoupon, String>((Ref ref, String id) async {
  final r = await GetPosCouponUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── PosGiftCards ───────────────────────────────────────────────────────────

final NotifierProvider<PosGiftCardsController, PosListState<PosGiftCard>> posGiftCardsProvider =
    NotifierProvider<PosGiftCardsController, PosListState<PosGiftCard>>(PosGiftCardsController.new);

class PosGiftCardsController extends Notifier<PosListState<PosGiftCard>> {
  _PosListController<PosGiftCard>? _helper;
  @override
  PosListState<PosGiftCard> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosGiftCard>(ListPosGiftCardsUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosGiftCard>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applyFilters(Map<String, String> f) => _helper!.applyFilters(state, (s) => state = s, f);

  Future<Result<PosGiftCard>> create(Map<String, dynamic> payload) async {
    final r = await SavePosGiftCardUseCase(ref.read(posRepositoryProvider))(payload);
    if (r.isOk) await refresh();
    return r;
  }
  Future<Result<void>> delete(String id) async {
    final r = await DeletePosGiftCardUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosGiftCard, String> posGiftCardDetailProvider =
    FutureProvider.family<PosGiftCard, String>((Ref ref, String id) async {
  final r = await GetPosGiftCardUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── PosPriceLists ──────────────────────────────────────────────────────────

final NotifierProvider<PosPriceListsController, PosListState<PosPriceList>> posPriceListsProvider =
    NotifierProvider<PosPriceListsController, PosListState<PosPriceList>>(PosPriceListsController.new);

class PosPriceListsController extends Notifier<PosListState<PosPriceList>> {
  _PosListController<PosPriceList>? _helper;
  @override
  PosListState<PosPriceList> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosPriceList>(ListPosPriceListsUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosPriceList>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);

  Future<Result<PosPriceList>> save(Map<String, dynamic> payload, {String? id}) async {
    final r = await SavePosPriceListUseCase(ref.read(posRepositoryProvider))(SavePosPriceListParams(id: id, payload: payload));
    if (r.isOk) await refresh();
    return r;
  }
  Future<Result<void>> delete(String id) async {
    final r = await DeletePosPriceListUseCase(ref.read(posRepositoryProvider))(id);
    if (r.isOk) await refresh();
    return r;
  }
}

final FutureProviderFamily<PosPriceList, String> posPriceListDetailProvider =
    FutureProvider.family<PosPriceList, String>((Ref ref, String id) async {
  final r = await GetPosPriceListUseCase(ref.watch(posRepositoryProvider))(id);
  return r.fold((f) => throw f, (v) => v);
});

// ── Dashboard ──────────────────────────────────────────────────────────────

class PosDashboardState extends Equatable {
  const PosDashboardState({
    this.ordersToday = 0, this.revenueToday = 0.0, this.avgOrderValue = 0.0,
    this.openShifts = 0, this.hourlySales = const <int, double>{},
    this.paymentMethods = const <String, double>{}, this.isLoading = true, this.failure,
  });

  final int ordersToday;
  final double revenueToday;
  final double avgOrderValue;
  final int openShifts;
  final Map<int, double> hourlySales;
  final Map<String, double> paymentMethods;
  final bool isLoading;
  final Failure? failure;

  PosDashboardState copyWith({
    int? ordersToday, double? revenueToday, double? avgOrderValue,
    int? openShifts, Map<int, double>? hourlySales,
    Map<String, double>? paymentMethods, bool? isLoading, Failure? failure,
  }) => PosDashboardState(
    ordersToday: ordersToday ?? this.ordersToday,
    revenueToday: revenueToday ?? this.revenueToday,
    avgOrderValue: avgOrderValue ?? this.avgOrderValue,
    openShifts: openShifts ?? this.openShifts,
    hourlySales: hourlySales ?? this.hourlySales,
    paymentMethods: paymentMethods ?? this.paymentMethods,
    isLoading: isLoading ?? this.isLoading, failure: failure ?? this.failure,
  );

  @override
  List<Object?> get props => <Object?>[ordersToday, revenueToday, avgOrderValue, openShifts, hourlySales, paymentMethods, isLoading, failure!];
}

final NotifierProvider<PosDashboardController, PosDashboardState> posDashboardProvider =
    NotifierProvider<PosDashboardController, PosDashboardState>(PosDashboardController.new);

class PosDashboardController extends Notifier<PosDashboardState> {
  @override
  PosDashboardState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(_load);
    return const PosDashboardState();
  }

  Future<void> _load() async {
    state = state.copyWith(isLoading: true);
    try {
      final repo = ref.read(posRepositoryProvider);
      final orders = await repo.listPosOrders(const ListQuery(limit: 100, sort: '-createdAt'));
      final shifts = await repo.listPosShifts(const ListQuery(limit: 1, filters: {'status': 'OPEN'}));

      int count = 0; double rev = 0; double avg = 0;
      final Map<int, double> hourly = {};
      final Map<String, double> methods = {};

      if (orders.isOk) {
        final now = DateTime.now();
        final ordersData = orders.valueOrNull?.value.data ?? <PosOrder>[];
        for (final o in ordersData) {
          if (o.createdAt != null && o.createdAt!.year == now.year && o.createdAt!.month == now.month && o.createdAt!.day == now.day) {
            count++;
            rev += o.totalAmount;
            if (o.createdAt != null) {
              hourly.update(o.createdAt!.hour, (v) => v + o.totalAmount, ifAbsent: () => o.totalAmount);
            }
          }
        }
        avg = count > 0 ? rev / count : 0;

        for (final o in ordersData) {
          for (final p in o.payments) {
            methods.update(p.method, (v) => v + p.amount, ifAbsent: () => p.amount);
          }
        }
      }

      state = state.copyWith(
        ordersToday: count, revenueToday: rev, avgOrderValue: avg,
        openShifts: shifts.isOk ? (shifts.valueOrNull?.value.meta.total ?? 0) : 0,
        hourlySales: hourly, paymentMethods: methods, isLoading: false,
      );
    } on Object catch (e) {
      state = state.copyWith(isLoading: false, failure: ServerFailure('Failed to load dashboard: $e'));
    }
  }
}