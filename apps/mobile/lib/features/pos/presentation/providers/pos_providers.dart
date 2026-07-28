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
    Provider<PosRemoteDataSource>(
  (Ref ref) => PosRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<PosRepository> posRepositoryProvider =
    Provider<PosRepository>(
  (Ref ref) => PosRepositoryImpl(
    remote: ref.watch(posRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

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
    List<T>? items,
    PaginationMeta? meta,
    ListQuery? query,
    bool? isLoading,
    bool? isLoadingMore,
    Failure? failure,
    Failure? loadMoreFailure,
    DateTime? cachedAt,
    bool clearFailures = false,
    bool clearCachedAt = false,
  }) =>
      PosListState<T>(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure, cachedAt,
      ];
}

class _PosListController<T extends Equatable> {
  _PosListController(this._listUseCase);

  final UseCase<Cacheable<Paginated<T>>, ListQuery> _listUseCase;
  Timer? _searchDebounce;

  void dispose() => _searchDebounce?.cancel();

  Future<void> refresh(PosListState<T> state, void Function(PosListState<T>) emit) async {
    final ListQuery query = state.query.copyWith(page: 1);
    emit(state.copyWith(isLoading: true, clearFailures: true));
    final result = await _listUseCase(query);
    emit(result.fold(
      (f) => state.copyWith(isLoading: false, failure: f, items: const []),
      (page) => state.copyWith(
        items: page.value.data, meta: page.value.meta, query: query,
        isLoading: false, clearFailures: true, cachedAt: page.cachedAt,
        clearCachedAt: !page.isFromCache,
      ),
    ));
  }

  Future<void> loadMore(PosListState<T> state, void Function(PosListState<T>) emit) async {
    if (state.isLoadingMore || !state.meta.hasMore) return;
    emit(state.copyWith(isLoadingMore: true, clearFailures: true));
    final next = state.query.copyWith(page: state.meta.page + 1);
    final result = await _listUseCase(next);
    emit(result.fold(
      (f) => state.copyWith(isLoadingMore: false, loadMoreFailure: f),
      (page) => state.copyWith(
        items: [...state.items, ...page.value.data], meta: page.value.meta,
        query: next, isLoadingMore: false, clearFailures: true,
      ),
    ));
  }

  void search(PosListState<T> state, void Function(PosListState<T>) emit, String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      emit(state.copyWith(query: state.query.copyWith(search: term, page: 1)));
      refresh(state, emit);
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

final NotifierProvider<PosOrdersController, PosListState<PosOrder>>
    posOrdersProvider =
    NotifierProvider<PosOrdersController, PosListState<PosOrder>>(
  PosOrdersController.new,
);

class PosOrdersController extends Notifier<PosListState<PosOrder>> {
  _PosListController<PosOrder>? _helper;

  @override
  PosListState<PosOrder> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosOrder>(
      ListPosOrdersUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosOrder>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  Future<void> loadMore() => _helper!.loadMore(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applySort(String sort) => _helper!.applySort(state, (s) => state = s, sort);
  void applyFilters(Map<String, String> f) => _helper!.applyFilters(state, (s) => state = s, f);

  Future<Result<void>> delete(String id) async {
    final result = await DeletePosOrderUseCase(
      ref.read(posRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> voidOrder(String id) async {
    final result = await VoidPosOrderUseCase(
      ref.read(posRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<PosOrder, String> posOrderDetailProvider =
    FutureProvider.family<PosOrder, String>((Ref ref, String id) async {
  final result = await GetPosOrderUseCase(
    ref.watch(posRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── PosRegisters ───────────────────────────────────────────────────────────

final NotifierProvider<PosRegistersController, PosListState<PosRegister>>
    posRegistersProvider =
    NotifierProvider<PosRegistersController, PosListState<PosRegister>>(
  PosRegistersController.new,
);

class PosRegistersController extends Notifier<PosListState<PosRegister>> {
  _PosListController<PosRegister>? _helper;

  @override
  PosListState<PosRegister> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosRegister>(
      ListPosRegistersUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosRegister>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  Future<void> loadMore() => _helper!.loadMore(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applySort(String sort) => _helper!.applySort(state, (s) => state = s, sort);

  Future<Result<void>> delete(String id) async {
    final result = await DeletePosRegisterUseCase(
      ref.read(posRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> openRegister(String id) async {
    final result = await OpenPosRegisterUseCase(
      ref.read(posRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> closeRegister(String id) async {
    final result = await ClosePosRegisterUseCase(
      ref.read(posRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<PosRegister, String> posRegisterDetailProvider =
    FutureProvider.family<PosRegister, String>((Ref ref, String id) async {
  final result = await GetPosRegisterUseCase(
    ref.watch(posRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── PosShifts ──────────────────────────────────────────────────────────────

final NotifierProvider<PosShiftsController, PosListState<PosShift>>
    posShiftsProvider =
    NotifierProvider<PosShiftsController, PosListState<PosShift>>(
  PosShiftsController.new,
);

class PosShiftsController extends Notifier<PosListState<PosShift>> {
  _PosListController<PosShift>? _helper;

  @override
  PosListState<PosShift> build() {
    ref.watch(activeTenantIdProvider);
    _helper = _PosListController<PosShift>(
      ListPosShiftsUseCase(ref.read(posRepositoryProvider)));
    ref.onDispose(() => _helper?.dispose());
    Future<void>.microtask(refresh);
    return const PosListState<PosShift>();
  }

  Future<void> refresh() => _helper!.refresh(state, (s) => state = s);
  Future<void> loadMore() => _helper!.loadMore(state, (s) => state = s);
  void search(String term) => _helper!.search(state, (s) => state = s, term);
  void applySort(String sort) => _helper!.applySort(state, (s) => state = s, sort);

  Future<Result<void>> closeShift(String id) async {
    final result = await ClosePosShiftUseCase(
      ref.read(posRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}