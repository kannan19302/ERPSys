import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/inventory_remote_datasource.dart';
import '../../data/repositories/inventory_repository_impl.dart';
import '../../domain/entities/product.dart';
import '../../domain/entities/inventory.dart';
import '../../domain/repositories/inventory_repository.dart';
import '../../domain/usecases/inventory_usecases.dart';

final Provider<InventoryRemoteDataSource> inventoryRemoteDataSourceProvider =
    Provider<InventoryRemoteDataSource>(
  (Ref ref) => InventoryRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

/// Rebuilt whenever the active tenant changes, so a tenant switch swaps the
/// cache scope with it.
final Provider<InventoryRepository> inventoryRepositoryProvider =
    Provider<InventoryRepository>(
  (Ref ref) => InventoryRepositoryImpl(
    remote: ref.watch(inventoryRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

/// Dashboard tile data.
final FutureProvider<InventoryStats> inventoryStatsProvider =
    FutureProvider<InventoryStats>((Ref ref) async {
  // Re-runs on tenant switch.
  ref.watch(activeTenantIdProvider);
  final Result<InventoryStats> result =
      await GetInventoryStatsUseCase(ref.watch(inventoryRepositoryProvider))(
    const NoParams(),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (InventoryStats stats) => stats,
  );
});

final FutureProviderFamily<Product, String> productDetailProvider =
    FutureProvider.family<Product, String>((Ref ref, String id) async {
  final Result<Product> result =
      await GetProductUseCase(ref.watch(inventoryRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Product product) => product,
  );
});

/// Paged, filtered product list.
class ProductListState extends Equatable {
  const ProductListState({
    this.items = const <Product>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-updatedAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Product> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;

  /// Failure for the first page — replaces the whole screen.
  final Failure? failure;

  /// Failure for a subsequent page — shown inline under the list.
  final Failure? loadMoreFailure;

  /// Set when the list is being served from the offline cache.
  final DateTime? cachedAt;

  ProductListState copyWith({
    List<Product>? items,
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
      ProductListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure:
            clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => <Object?>[
        items,
        meta,
        query.cacheKey,
        isLoading,
        isLoadingMore,
        failure,
        loadMoreFailure,
        cachedAt,
      ];
}

final NotifierProvider<ProductListController, ProductListState>
    productListControllerProvider =
    NotifierProvider<ProductListController, ProductListState>(
  ProductListController.new,
);

class ProductListController extends Notifier<ProductListState> {
  Timer? _searchDebounce;

  @override
  ProductListState build() {
    // A tenant switch rebuilds this controller and refetches page 1.
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ProductListState();
  }

  ListProductsUseCase get _listProducts =>
      ListProductsUseCase(ref.read(inventoryRepositoryProvider));

  /// Loads page 1, replacing whatever is on screen.
  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Product>>> result =
        await _listProducts(query);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoading: false, failure: failure, items: const <Product>[]),
      (Cacheable<Paginated<Product>> page) => state.copyWith(
        items: page.value.data,
        meta: page.value.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
        cachedAt: page.cachedAt,
        clearCachedAt: !page.isFromCache,
      ),
    );
  }

  /// Appends the next server page. Never slices client-side (Rule 25).
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Cacheable<Paginated<Product>>> result =
        await _listProducts(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Product>> page) => state.copyWith(
        items: <Product>[...state.items, ...page.value.data],
        meta: page.value.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

  /// Debounced server-side search — the backend does the filtering.
  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(
        query: state.query.copyWith(search: term, page: 1),
      );
      refresh();
    });
  }

  void applySort(String sort) {
    state = state.copyWith(query: state.query.copyWith(sort: sort, page: 1));
    refresh();
  }

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(
      query: state.query.copyWith(filters: filters, page: 1),
    );
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteProductUseCase(ref.read(inventoryRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}























final FutureProviderFamily<ReorderRule, String> reorderRuleDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<ProductCategory, String> productCategoryDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<StockMovement, String> stockMovementDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<StockLevel, String> stockLevelDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<InventoryAdjustment, String> inventoryAdjustmentDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<Warehouse, String> warehouseDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());

class InventoryAdjustmentListState extends Equatable {
  const InventoryAdjustmentListState({
    this.items = const <InventoryAdjustment>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<InventoryAdjustment> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  InventoryAdjustmentListState copyWith({
    List<InventoryAdjustment>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      InventoryAdjustmentListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<InventoryAdjustmentListController, InventoryAdjustmentListState> inventoryAdjustmentListControllerProvider =
    NotifierProvider<InventoryAdjustmentListController, InventoryAdjustmentListState>(InventoryAdjustmentListController.new);

class InventoryAdjustmentListController extends Notifier<InventoryAdjustmentListState> {
  void search(String s) {}
  void applyFilters(Map<String, String> f) {}
  void applySort(String s) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async => throw UnimplementedError();
  
  @override
  InventoryAdjustmentListState build() {
    Future<void>.microtask(refresh);
    return const InventoryAdjustmentListState();
  }
}

class ProductCategoryListState extends Equatable {
  const ProductCategoryListState({
    this.items = const <ProductCategory>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<ProductCategory> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  ProductCategoryListState copyWith({
    List<ProductCategory>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ProductCategoryListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ProductCategoryListController, ProductCategoryListState> productCategoryListControllerProvider =
    NotifierProvider<ProductCategoryListController, ProductCategoryListState>(ProductCategoryListController.new);

class ProductCategoryListController extends Notifier<ProductCategoryListState> {
  void search(String s) {}
  void applyFilters(Map<String, String> f) {}
  void applySort(String s) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async => throw UnimplementedError();
  
  @override
  ProductCategoryListState build() {
    Future<void>.microtask(refresh);
    return const ProductCategoryListState();
  }
}

class ReorderRuleListState extends Equatable {
  const ReorderRuleListState({
    this.items = const <ReorderRule>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<ReorderRule> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  ReorderRuleListState copyWith({
    List<ReorderRule>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ReorderRuleListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ReorderRuleListController, ReorderRuleListState> reorderRuleListControllerProvider =
    NotifierProvider<ReorderRuleListController, ReorderRuleListState>(ReorderRuleListController.new);

class ReorderRuleListController extends Notifier<ReorderRuleListState> {
  void search(String s) {}
  void applyFilters(Map<String, String> f) {}
  void applySort(String s) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async => throw UnimplementedError();
  
  @override
  ReorderRuleListState build() {
    Future<void>.microtask(refresh);
    return const ReorderRuleListState();
  }
}

class StockLevelListState extends Equatable {
  const StockLevelListState({
    this.items = const <StockLevel>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<StockLevel> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  StockLevelListState copyWith({
    List<StockLevel>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      StockLevelListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<StockLevelListController, StockLevelListState> stockLevelListControllerProvider =
    NotifierProvider<StockLevelListController, StockLevelListState>(StockLevelListController.new);

class StockLevelListController extends Notifier<StockLevelListState> {
  void search(String s) {}
  void applyFilters(Map<String, String> f) {}
  void applySort(String s) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async => throw UnimplementedError();
  
  @override
  StockLevelListState build() {
    Future<void>.microtask(refresh);
    return const StockLevelListState();
  }
}

class StockMovementListState extends Equatable {
  const StockMovementListState({
    this.items = const <StockMovement>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<StockMovement> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  StockMovementListState copyWith({
    List<StockMovement>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      StockMovementListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<StockMovementListController, StockMovementListState> stockMovementListControllerProvider =
    NotifierProvider<StockMovementListController, StockMovementListState>(StockMovementListController.new);

class StockMovementListController extends Notifier<StockMovementListState> {
  void search(String s) {}
  void applyFilters(Map<String, String> f) {}
  void applySort(String s) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async => throw UnimplementedError();
  
  @override
  StockMovementListState build() {
    Future<void>.microtask(refresh);
    return const StockMovementListState();
  }
}

class WarehouseListState extends Equatable {
  const WarehouseListState({
    this.items = const <Warehouse>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Warehouse> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  WarehouseListState copyWith({
    List<Warehouse>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      WarehouseListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<WarehouseListController, WarehouseListState> warehouseListControllerProvider =
    NotifierProvider<WarehouseListController, WarehouseListState>(WarehouseListController.new);

class WarehouseListController extends Notifier<WarehouseListState> {
  void search(String s) {}
  void applyFilters(Map<String, String> f) {}
  void applySort(String s) {}
  Future<void> refresh() async {}
  Future<void> loadMore() async {}
  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async => throw UnimplementedError();
  
  @override
  WarehouseListState build() {
    Future<void>.microtask(refresh);
    return const WarehouseListState();
  }
}
