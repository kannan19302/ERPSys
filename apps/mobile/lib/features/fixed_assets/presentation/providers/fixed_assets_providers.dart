import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/fixed_assets_remote_data_source.dart';
import '../../data/repositories/fixed_assets_repository_impl.dart';
import '../../domain/entities/fixed_assets.dart';
import '../../domain/repositories/fixed_assets_repository.dart';
import '../../domain/usecases/fixed_assets_usecases.dart';

final Provider<FixedAssetsRemoteDataSource> fixedAssetsRemoteDataSourceProvider =
    Provider<FixedAssetsRemoteDataSource>(
  (Ref ref) => FixedAssetsRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<FixedAssetsRepository> fixedAssetsRepositoryProvider =
    Provider<FixedAssetsRepository>(
  (Ref ref) => FixedAssetsRepositoryImpl(
    remote: ref.watch(fixedAssetsRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class FixedAssetListState extends Equatable {
  const FixedAssetListState({
    this.items = const <FixedAsset>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<FixedAsset> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  FixedAssetListState copyWith({
    List<FixedAsset>? items,
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
      FixedAssetListState(
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

final NotifierProvider<FixedAssetListController, FixedAssetListState>
    fixedAssetListControllerProvider =
    NotifierProvider<FixedAssetListController, FixedAssetListState>(
  FixedAssetListController.new,
);

class FixedAssetListController extends Notifier<FixedAssetListState> {
  Timer? _searchDebounce;

  @override
  FixedAssetListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const FixedAssetListState();
  }

  ListFixedAssetsUseCase get _listUseCase =>
      ListFixedAssetsUseCase(ref.read(fixedAssetsRepositoryProvider));

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

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(query: state.query.copyWith(filters: filters, page: 1));
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteFixedAssetUseCase(
      ref.read(fixedAssetsRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<FixedAsset>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveFixedAssetUseCase(
      ref.read(fixedAssetsRepositoryProvider),)(
      SaveFixedAssetParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<FixedAsset, String> fixedAssetDetailProvider =
    FutureProvider.family<FixedAsset, String>((Ref ref, String id) async {
  final result = await GetFixedAssetUseCase(
    ref.watch(fixedAssetsRepositoryProvider),)(id);
  return result.fold((f) => throw f, (a) => a);
});

final FutureProviderFamily<AssetMaintenanceSchedule, String> maintenanceScheduleDetailProvider =
    FutureProvider.family<AssetMaintenanceSchedule, String>((Ref ref, String id) async {
  final result = await GetMaintenanceScheduleUseCase(
    ref.watch(fixedAssetsRepositoryProvider),)(id);
  return result.fold((f) => throw f, (m) => m);
});

class MaintenanceScheduleListState extends Equatable {
  const MaintenanceScheduleListState({
    this.items = const <AssetMaintenanceSchedule>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AssetMaintenanceSchedule> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  MaintenanceScheduleListState copyWith({
    List<AssetMaintenanceSchedule>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      MaintenanceScheduleListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<MaintenanceScheduleListController, MaintenanceScheduleListState>
    maintenanceScheduleListControllerProvider =
    NotifierProvider<MaintenanceScheduleListController, MaintenanceScheduleListState>(
  MaintenanceScheduleListController.new,
);

class MaintenanceScheduleListController extends Notifier<MaintenanceScheduleListState> {
  Timer? _searchDebounce;

  @override
  MaintenanceScheduleListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const MaintenanceScheduleListState();
  }

  ListMaintenanceSchedulesUseCase get _listUseCase =>
      ListMaintenanceSchedulesUseCase(ref.read(fixedAssetsRepositoryProvider));

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

  Future<Result<AssetMaintenanceSchedule>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveMaintenanceScheduleUseCase(
      ref.read(fixedAssetsRepositoryProvider),)(
      SaveMaintenanceScheduleParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AssetDisposal, String> assetDisposalDetailProvider =
    FutureProvider.family<AssetDisposal, String>((Ref ref, String id) async {
  final result = await GetDisposalUseCase(
    ref.watch(fixedAssetsRepositoryProvider),)(id);
  return result.fold((f) => throw f, (d) => d);
});

class DisposalListState extends Equatable {
  const DisposalListState({
    this.items = const <AssetDisposal>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AssetDisposal> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  DisposalListState copyWith({
    List<AssetDisposal>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      DisposalListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<DisposalListController, DisposalListState>
    disposalListControllerProvider =
    NotifierProvider<DisposalListController, DisposalListState>(
  DisposalListController.new,
);

class DisposalListController extends Notifier<DisposalListState> {
  Timer? _searchDebounce;

  @override
  DisposalListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const DisposalListState();
  }

  ListDisposalsUseCase get _listUseCase =>
      ListDisposalsUseCase(ref.read(fixedAssetsRepositoryProvider));

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

  Future<Result<AssetDisposal>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveDisposalUseCase(
      ref.read(fixedAssetsRepositoryProvider),)(
      SaveDisposalParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}
