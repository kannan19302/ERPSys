import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/manufacturing_remote_data_source.dart';
import '../../data/repositories/manufacturing_repository_impl.dart';
import '../../domain/entities/manufacturing.dart';
import '../../domain/repositories/manufacturing_repository.dart';
import '../../domain/usecases/manufacturing_usecases.dart';

final Provider<ManufacturingRemoteDataSource> manufacturingRemoteDataSourceProvider =
    Provider<ManufacturingRemoteDataSource>(
  (Ref ref) => ManufacturingRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<ManufacturingRepository> manufacturingRepositoryProvider =
    Provider<ManufacturingRepository>(
  (Ref ref) => ManufacturingRepositoryImpl(
    remote: ref.watch(manufacturingRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Work Order List ──

class WorkOrderListState extends Equatable {
  const WorkOrderListState({
    this.items = const <WorkOrder>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<WorkOrder> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  WorkOrderListState copyWith({
    List<WorkOrder>? items,
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
      WorkOrderListState(
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

final NotifierProvider<WorkOrderListController, WorkOrderListState>
    workOrderListControllerProvider =
    NotifierProvider<WorkOrderListController, WorkOrderListState>(
  WorkOrderListController.new,
);

class WorkOrderListController extends Notifier<WorkOrderListState> {
  Timer? _searchDebounce;

  @override
  WorkOrderListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const WorkOrderListState();
  }

  ListWorkOrdersUseCase get _listUseCase =>
      ListWorkOrdersUseCase(ref.read(manufacturingRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);
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

  Future<Result<void>> delete(String id) async {
    final result = await DeleteWorkOrderUseCase(
      ref.read(manufacturingRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveWorkOrderUseCase(
      ref.read(manufacturingRepositoryProvider),)(SaveWorkOrderParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result.fold((f) => Result<void>.err(f), (_) => const Result<void>.ok(null));
  }
} FutureProviderFamily<WorkOrder, String> workOrderDetailProvider =
    FutureProvider.family<WorkOrder, String>((Ref ref, String id) async {
  final result = await GetWorkOrderUseCase(
    ref.watch(manufacturingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── BOM List ──

class BomListState extends Equatable {
  const BomListState({
    this.items = const <Bom>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Bom> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  BomListState copyWith({
    List<Bom>? items,
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
      BomListState(
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

final NotifierProvider<BomListController, BomListState>
    bomListControllerProvider =
    NotifierProvider<BomListController, BomListState>(
  BomListController.new,
);

class BomListController extends Notifier<BomListState> {
  Timer? _searchDebounce;

  @override
  BomListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const BomListState();
  }

  ListBomsUseCase get _listUseCase =>
      ListBomsUseCase(ref.read(manufacturingRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);
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

  Future<Result<void>> delete(String id) async {
    final result = await DeleteBomUseCase(
      ref.read(manufacturingRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveBomUseCase(
      ref.read(manufacturingRepositoryProvider),)(SaveBomParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result.fold((f) => Result<void>.err(f), (_) => const Result<void>.ok(null));
  }
}

final FutureProviderFamily<Bom, String> bomDetailProvider =
    FutureProvider.family<Bom, String>((Ref ref, String id) async {
  final result = await GetBomUseCase(
    ref.watch(manufacturingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── MRP Run List ──

class MrpRunListState extends Equatable {
  const MrpRunListState({
    this.items = const <MrpRun>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<MrpRun> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  MrpRunListState copyWith({
    List<MrpRun>? items,
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
      MrpRunListState(
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

final NotifierProvider<MrpRunListController, MrpRunListState>
    mrpRunListControllerProvider =
    NotifierProvider<MrpRunListController, MrpRunListState>(
  MrpRunListController.new,
);

class MrpRunListController extends Notifier<MrpRunListState> {
  @override
  MrpRunListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const MrpRunListState();
  }

  ListMrpRunsUseCase get _listUseCase =>
      ListMrpRunsUseCase(ref.read(manufacturingRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);
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

  Future<Result<void>> save(Map<String, dynamic> payload) async {
    final result = await CreateMrpRunUseCase(
      ref.read(manufacturingRepositoryProvider),)(payload);
    if (result.isOk) await refresh();
    return result.fold((f) => Result<void>.err(f), (_) => const Result<void>.ok(null));
  }
}

final FutureProviderFamily<MrpRun, String> mrpRunDetailProvider =
    FutureProvider.family<MrpRun, String>((Ref ref, String id) async {
  final result = await GetMrpRunUseCase(
    ref.watch(manufacturingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── Workstation List ──

class WorkstationListState extends Equatable {
  const WorkstationListState({
    this.items = const <Workstation>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: 'name'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Workstation> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  WorkstationListState copyWith({
    List<Workstation>? items,
    PaginationMeta? meta,
    ListQuery? query,
    bool? isLoading,
    bool? isLoadingMore,
    Failure? failure,
    Failure? loadMoreFailure,
    bool clearFailures = false,
  }) =>
      WorkstationListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure,
      ];
}

final NotifierProvider<WorkstationListController, WorkstationListState>
    workstationListControllerProvider =
    NotifierProvider<WorkstationListController, WorkstationListState>(
  WorkstationListController.new,
);

class WorkstationListController extends Notifier<WorkstationListState> {
  @override
  WorkstationListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const WorkstationListState();
  }

  ListWorkstationsUseCase get _listUseCase =>
      ListWorkstationsUseCase(ref.read(manufacturingRepositoryProvider));

  Future<void> refresh() async {
    final query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);
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
}

final FutureProviderFamily<Workstation, String> workstationDetailProvider =
    FutureProvider.family<Workstation, String>((Ref ref, String id) async {
  final result = await GetWorkstationUseCase(
    ref.watch(manufacturingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── Quality Inspection List ──

class QualityInspectionListState extends Equatable {
  const QualityInspectionListState({
    this.items = const <QualityInspection>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<QualityInspection> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  QualityInspectionListState copyWith({
    List<QualityInspection>? items,
    PaginationMeta? meta,
    ListQuery? query,
    bool? isLoading,
    bool? isLoadingMore,
    Failure? failure,
    Failure? loadMoreFailure,
    bool clearFailures = false,
  }) =>
      QualityInspectionListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure,
      ];
}

final NotifierProvider<QualityInspectionListController, QualityInspectionListState>
    qualityInspectionListControllerProvider =
    NotifierProvider<QualityInspectionListController, QualityInspectionListState>(
  QualityInspectionListController.new,
);

class QualityInspectionListController extends Notifier<QualityInspectionListState> {
  @override
  QualityInspectionListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const QualityInspectionListState();
  }

  ListQualityInspectionsUseCase get _listUseCase =>
      ListQualityInspectionsUseCase(ref.read(manufacturingRepositoryProvider));

  Future<void> refresh() async {
    final query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);
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

  Future<Result<void>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveQualityInspectionUseCase(
      ref.read(manufacturingRepositoryProvider),)(SaveQualityInspectionParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result.fold((f) => Result<void>.err(f), (_) => const Result<void>.ok(null));
  }
}

final FutureProviderFamily<QualityInspection, String> qualityInspectionDetailProvider =
    FutureProvider.family<QualityInspection, String>((Ref ref, String id) async {
  final result = await GetQualityInspectionUseCase(
    ref.watch(manufacturingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── Routing List ──

class RoutingListState extends Equatable {
  const RoutingListState({
    this.items = const <Routing>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Routing> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  RoutingListState copyWith({
    List<Routing>? items,
    PaginationMeta? meta,
    ListQuery? query,
    bool? isLoading,
    bool? isLoadingMore,
    Failure? failure,
    Failure? loadMoreFailure,
    bool clearFailures = false,
  }) =>
      RoutingListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure,
      ];
}

final NotifierProvider<RoutingListController, RoutingListState>
    routingListControllerProvider =
    NotifierProvider<RoutingListController, RoutingListState>(
  RoutingListController.new,
);

class RoutingListController extends Notifier<RoutingListState> {
  @override
  RoutingListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const RoutingListState();
  }

  ListRoutingsUseCase get _listUseCase =>
      ListRoutingsUseCase(ref.read(manufacturingRepositoryProvider));

  Future<void> refresh() async {
    final query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);
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

  Future<Result<void>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveRoutingUseCase(
      ref.read(manufacturingRepositoryProvider),)(SaveRoutingParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result.fold((f) => Result<void>.err(f), (_) => const Result<void>.ok(null));
  }
}

final FutureProviderFamily<Routing, String> routingDetailProvider =
    FutureProvider.family<Routing, String>((Ref ref, String id) async {
  final result = await GetRoutingUseCase(
    ref.watch(manufacturingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── Engineering Change Order List ──

class EngineeringChangeOrderListState extends Equatable {
  const EngineeringChangeOrderListState({
    this.items = const <EngineeringChangeOrder>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<EngineeringChangeOrder> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  EngineeringChangeOrderListState copyWith({
    List<EngineeringChangeOrder>? items,
    PaginationMeta? meta,
    ListQuery? query,
    bool? isLoading,
    bool? isLoadingMore,
    Failure? failure,
    Failure? loadMoreFailure,
    bool clearFailures = false,
  }) =>
      EngineeringChangeOrderListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure,
      ];
}

final NotifierProvider<EngineeringChangeOrderListController, EngineeringChangeOrderListState>
    engineeringChangeOrderListControllerProvider =
    NotifierProvider<EngineeringChangeOrderListController, EngineeringChangeOrderListState>(
  EngineeringChangeOrderListController.new,
);

class EngineeringChangeOrderListController extends Notifier<EngineeringChangeOrderListState> {
  @override
  EngineeringChangeOrderListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const EngineeringChangeOrderListState();
  }

  ListEngineeringChangeOrdersUseCase get _listUseCase =>
      ListEngineeringChangeOrdersUseCase(ref.read(manufacturingRepositoryProvider));

  Future<void> refresh() async {
    final query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);
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

  Future<Result<void>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveEngineeringChangeOrderUseCase(
      ref.read(manufacturingRepositoryProvider),)(SaveEngineeringChangeOrderParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result.fold((f) => Result<void>.err(f), (_) => const Result<void>.ok(null));
  }

  Future<Result<void>> approve(String id) async {
    final result = await ApproveEngineeringChangeOrderUseCase(
      ref.read(manufacturingRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result.fold((f) => Result<void>.err(f), (_) => const Result<void>.ok(null));
  }
}

final FutureProviderFamily<EngineeringChangeOrder, String> engineeringChangeOrderDetailProvider =
    FutureProvider.family<EngineeringChangeOrder, String>((Ref ref, String id) async {
  final result = await GetEngineeringChangeOrderUseCase(
    ref.watch(manufacturingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});
