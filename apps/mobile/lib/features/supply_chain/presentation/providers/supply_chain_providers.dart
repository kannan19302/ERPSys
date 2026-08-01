import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/supply_chain_remote_data_source.dart';
import '../../data/repositories/supply_chain_repository_impl.dart';
import '../../domain/entities/supply_chain.dart';
import '../../domain/repositories/supply_chain_repository.dart';
import '../../domain/usecases/supply_chain_usecases.dart';

final Provider<SupplyChainRemoteDataSource> supplyChainRemoteDataSourceProvider =
    Provider<SupplyChainRemoteDataSource>(
  (Ref ref) => SupplyChainRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<SupplyChainRepository> supplyChainRepositoryProvider =
    Provider<SupplyChainRepository>(
  (Ref ref) => SupplyChainRepositoryImpl(
    remote: ref.watch(supplyChainRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class ShipmentListState extends Equatable {
  const ShipmentListState({
    this.items = const <Shipment>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Shipment> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  ShipmentListState copyWith({
    List<Shipment>? items,
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
      ShipmentListState(
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

final NotifierProvider<ShipmentListController, ShipmentListState>
    shipmentListControllerProvider =
    NotifierProvider<ShipmentListController, ShipmentListState>(
  ShipmentListController.new,
);

class ShipmentListController extends Notifier<ShipmentListState> {
  Timer? _searchDebounce;

  @override
  ShipmentListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ShipmentListState();
  }

  ListShipmentsUseCase get _listUseCase =>
      ListShipmentsUseCase(ref.read(supplyChainRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true);
    final result = await _listUseCase(query);
    state = result.fold(
      (f) => state.copyWith(isLoading: false, failure: f, items: const []),
      (page) => state.copyWith(
        items: page.value.data, meta: page.value.meta, query: query,
        isLoading: false, clearFailures: true, cachedAt: page.cachedAt,
        clearCachedAt: !page.isFromCache,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;
    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final next = state.query.copyWith(page: state.meta.page + 1);
    final result = await _listUseCase(next);
    state = result.fold(
      (f) => state.copyWith(isLoadingMore: false, loadMoreFailure: f),
      (page) => state.copyWith(
        items: [...state.items, ...page.value.data], meta: page.value.meta,
        query: next, isLoadingMore: false, clearFailures: true,
      ),
    );
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }

  void applySort(String sort) {
    state = state.copyWith(query: state.query.copyWith(sort: sort, page: 1));
    refresh();
  }

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(query: state.query.copyWith(filters: filters, page: 1));
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteShipmentUseCase(
      ref.read(supplyChainRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Shipment, String> shipmentDetailProvider =
    FutureProvider.family<Shipment, String>((Ref ref, String id) async {
  final result = await GetShipmentUseCase(
    ref.watch(supplyChainRepositoryProvider),)(id);
  return result.fold((f) => throw f, (s) => s);
});

class CarrierListState extends Equatable {
  const CarrierListState({
    this.items = const <Carrier>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Carrier> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  CarrierListState copyWith({
    List<Carrier>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      CarrierListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<CarrierListController, CarrierListState>
    carrierListControllerProvider =
    NotifierProvider<CarrierListController, CarrierListState>(
  CarrierListController.new,
);

class CarrierListController extends Notifier<CarrierListState> {
  Timer? _searchDebounce;

  @override
  CarrierListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const CarrierListState();
  }

  ListCarriersUseCase get _listUseCase =>
      ListCarriersUseCase(ref.read(supplyChainRepositoryProvider));

  Future<void> refresh() async {
    final query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true);
    final result = await _listUseCase(query);
    state = result.fold(
      (f) => state.copyWith(isLoading: false, failure: f, items: const []),
      (page) => state.copyWith(
        items: page.value.data, meta: page.value.meta, query: query,
        isLoading: false, clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;
    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final next = state.query.copyWith(page: state.meta.page + 1);
    final result = await _listUseCase(next);
    state = result.fold(
      (f) => state.copyWith(isLoadingMore: false, loadMoreFailure: f),
      (page) => state.copyWith(
        items: [...state.items, ...page.value.data], meta: page.value.meta,
        query: next, isLoadingMore: false, clearFailures: true,
      ),
    );
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteShipmentUseCase(
      ref.read(supplyChainRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Carrier, String> carrierDetailProvider =
    FutureProvider.family<Carrier, String>((Ref ref, String id) async {
  final result = await GetCarrierUseCase(
    ref.watch(supplyChainRepositoryProvider),)(id);
  return result.fold((f) => throw f, (c) => c);
});

class DemandForecastListState extends Equatable {
  const DemandForecastListState({
    this.items = const <DemandForecast>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<DemandForecast> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  DemandForecastListState copyWith({
    List<DemandForecast>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      DemandForecastListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<DemandForecastListController, DemandForecastListState>
    demandForecastListControllerProvider =
    NotifierProvider<DemandForecastListController, DemandForecastListState>(
  DemandForecastListController.new,
);

class DemandForecastListController extends Notifier<DemandForecastListState> {
  Timer? _searchDebounce;

  @override
  DemandForecastListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const DemandForecastListState();
  }

  ListDemandForecastsUseCase get _listUseCase =>
      ListDemandForecastsUseCase(ref.read(supplyChainRepositoryProvider));

  Future<void> refresh() async {
    final query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true);
    final result = await _listUseCase(query);
    state = result.fold(
      (f) => state.copyWith(isLoading: false, failure: f, items: const []),
      (page) => state.copyWith(
        items: page.value.data, meta: page.value.meta, query: query,
        isLoading: false, clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;
    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final next = state.query.copyWith(page: state.meta.page + 1);
    final result = await _listUseCase(next);
    state = result.fold(
      (f) => state.copyWith(isLoadingMore: false, loadMoreFailure: f),
      (page) => state.copyWith(
        items: [...state.items, ...page.value.data], meta: page.value.meta,
        query: next, isLoadingMore: false, clearFailures: true,
      ),
    );
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }
}

class ReorderSuggestionListState extends Equatable {
  const ReorderSuggestionListState({
    this.items = const <ReorderSuggestion>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ReorderSuggestion> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ReorderSuggestionListState copyWith({
    List<ReorderSuggestion>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ReorderSuggestionListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ReorderSuggestionListController, ReorderSuggestionListState>
    reorderSuggestionListControllerProvider =
    NotifierProvider<ReorderSuggestionListController, ReorderSuggestionListState>(
  ReorderSuggestionListController.new,
);

class ReorderSuggestionListController extends Notifier<ReorderSuggestionListState> {
  Timer? _searchDebounce;

  @override
  ReorderSuggestionListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ReorderSuggestionListState();
  }

  ListReorderSuggestionsUseCase get _listUseCase =>
      ListReorderSuggestionsUseCase(ref.read(supplyChainRepositoryProvider));

  Future<void> refresh() async {
    final query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true);
    final result = await _listUseCase(query);
    state = result.fold(
      (f) => state.copyWith(isLoading: false, failure: f, items: const []),
      (page) => state.copyWith(
        items: page.value.data, meta: page.value.meta, query: query,
        isLoading: false, clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;
    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final next = state.query.copyWith(page: state.meta.page + 1);
    final result = await _listUseCase(next);
    state = result.fold(
      (f) => state.copyWith(isLoadingMore: false, loadMoreFailure: f),
      (page) => state.copyWith(
        items: [...state.items, ...page.value.data], meta: page.value.meta,
        query: next, isLoadingMore: false, clearFailures: true,
      ),
    );
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }

  Future<Result<void>> approve(String id) async {
    final result = await ApproveReorderSuggestionUseCase(
      ref.read(supplyChainRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<SupplyChainRoute, String> routeDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<DockAppointment, String> dockAppointmentDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<WarehouseTransfer, String> warehouseTransferDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());

final NotifierProvider<RouteListController, RouteListState> routeListControllerProvider = NotifierProvider(() => throw UnimplementedError());
final NotifierProvider<DockAppointmentListController, DockAppointmentListState> dockAppointmentListControllerProvider = NotifierProvider(() => throw UnimplementedError());
final NotifierProvider<WarehouseTransferListController, WarehouseTransferListState> warehouseTransferListControllerProvider = NotifierProvider(() => throw UnimplementedError());
final NotifierProvider<TrackingEventListController, TrackingEventListState> trackingEventListControllerProvider = NotifierProvider(() => throw UnimplementedError());

class SupplyChainDashboardState {
  final bool isLoading = false;
  final Failure? failure = null;
  final int activeShipments = 0;
  final int pendingAppointments = 0;
  final int pendingTransfers = 0;
  final Map<String, int> shipmentsByStatus = {};
  final List<TrackingEvent> recentEvents = [];
}
final Provider<SupplyChainDashboardState> supplyChainDashboardProvider = Provider((ref) => throw UnimplementedError());

class DockAppointmentListState {
  final bool isLoading = false;
  final List<DockAppointment> items = [];
  final PaginationMeta meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0);
  final ListQuery query = const ListQuery();
  final bool isLoadingMore = false;
  final Failure? failure = null;
  final Failure? loadMoreFailure = null;
}
class DockAppointmentListController extends Notifier<DockAppointmentListState> {
  @override
  DockAppointmentListState build() => DockAppointmentListState();
  void search(String term) {}
  Future<Result<void>> save(Map<String, dynamic> data) async => throw UnimplementedError();
  void applySort(String sort) {}
  void applyFilters(Map<String, String> filters) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
}

class WarehouseTransferListState {
  final bool isLoading = false;
  final List<WarehouseTransfer> items = [];
  final PaginationMeta meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0);
  final ListQuery query = const ListQuery();
  final bool isLoadingMore = false;
  final Failure? failure = null;
  final Failure? loadMoreFailure = null;
}
class WarehouseTransferListController extends Notifier<WarehouseTransferListState> {
  @override
  WarehouseTransferListState build() => WarehouseTransferListState();
  void search(String term) {}
  Future<Result<void>> save(Map<String, dynamic> data) async => throw UnimplementedError();
  void applySort(String sort) {}
  void applyFilters(Map<String, String> filters) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
}

class TrackingEventListState {
  final bool isLoading = false;
  final List<TrackingEvent> items = [];
  final PaginationMeta meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0);
  final ListQuery query = const ListQuery();
  final bool isLoadingMore = false;
  final Failure? failure = null;
  final Failure? loadMoreFailure = null;
}
class TrackingEventListController extends Notifier<TrackingEventListState> {
  @override
  TrackingEventListState build() => TrackingEventListState();
  void search(String term) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
}

class RouteListState {
  final bool isLoading = false;
  final List<SupplyChainRoute> items = [];
  final PaginationMeta meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0);
  final ListQuery query = const ListQuery();
  final bool isLoadingMore = false;
  final Failure? failure = null;
  final Failure? loadMoreFailure = null;
}
class RouteListController extends Notifier<RouteListState> {
  @override
  RouteListState build() => RouteListState();
  void search(String term) {}
  void applySort(String sort) {}
  void applyFilters(Map<String, String> filters) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
  Future<Result<void>> save(Map<String, dynamic> payload, {String? id}) async => throw UnimplementedError();
}
