import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/real_estate_remote_data_source.dart';
import '../../data/repositories/real_estate_repository_impl.dart';
import '../../domain/entities/real_estate.dart';
import '../../domain/repositories/real_estate_repository.dart';
import '../../domain/usecases/real_estate_usecases.dart';

final Provider<RealEstateRemoteDataSource> realEstateRemoteDataSourceProvider =
    Provider<RealEstateRemoteDataSource>(
  (Ref ref) => RealEstateRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<RealEstateRepository> realEstateRepositoryProvider =
    Provider<RealEstateRepository>(
  (Ref ref) => RealEstateRepositoryImpl(
    remote: ref.watch(realEstateRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class PropertyListState extends Equatable {
  const PropertyListState({
    this.items = const <Property>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Property> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  PropertyListState copyWith({
    List<Property>? items,
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
      PropertyListState(
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

final NotifierProvider<PropertyListController, PropertyListState>
    propertyListControllerProvider =
    NotifierProvider<PropertyListController, PropertyListState>(
  PropertyListController.new,
);

class PropertyListController extends Notifier<PropertyListState> {
  Timer? _searchDebounce;

  @override
  PropertyListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const PropertyListState();
  }

  ListPropertiesUseCase get _listUseCase =>
      ListPropertiesUseCase(ref.read(realEstateRepositoryProvider));

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
    final result = await DeletePropertyUseCase(
      ref.read(realEstateRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Lease>> saveLease(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveLeaseUseCase(
      ref.read(realEstateRepositoryProvider))(SaveLeaseParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> deleteLease(String id) async {
    final result = await DeleteLeaseUseCase(
      ref.read(realEstateRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<TenantDetail>> saveTenant(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveTenantUseCase(
      ref.read(realEstateRepositoryProvider))(SaveTenantParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> deleteTenant(String id) async {
    final result = await DeleteTenantUseCase(
      ref.read(realEstateRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Map<String, dynamic>>> saveUnit(Map<String, dynamic> payload, {String? id}) async {
    return const Result.ok(<String, dynamic>{});
  }
}

final FutureProviderFamily<Property, String> propertyDetailProvider =
    FutureProvider.family<Property, String>((Ref ref, String id) async {
  final result = await GetPropertyUseCase(
    ref.watch(realEstateRepositoryProvider))(id);
  return result.fold((f) => throw f, (p) => p);
});

final FutureProviderFamily<Lease, String> leaseDetailProvider =
    FutureProvider.family<Lease, String>((Ref ref, String id) async {
  final result = await GetLeaseUseCase(
    ref.watch(realEstateRepositoryProvider))(id);
  return result.fold((f) => throw f, (l) => l);
});

final FutureProviderFamily<TenantDetail, String> tenantDetailProvider =
    FutureProvider.family<TenantDetail, String>((Ref ref, String id) async {
  final result = await GetTenantUseCase(
    ref.watch(realEstateRepositoryProvider))(id);
  return result.fold((f) => throw f, (t) => t);
});

final FutureProviderFamily<MaintenanceOrder, String>
    maintenanceOrderDetailProvider =
    FutureProvider.family<MaintenanceOrder, String>(
        (Ref ref, String id) async {
  final result = await GetMaintenanceOrderUseCase(
    ref.watch(realEstateRepositoryProvider))(id);
  return result.fold((f) => throw f, (m) => m);
});


extension SaveProperty on PropertyListController { Future<Result<Property>> save(Map<String, dynamic> payload, {String? id}) async => throw UnimplementedError(); }
