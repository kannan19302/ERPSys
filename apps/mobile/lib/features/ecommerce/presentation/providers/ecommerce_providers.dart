import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/ecommerce_remote_data_source.dart';
import '../../data/repositories/ecommerce_repository_impl.dart';
import '../../domain/entities/ecommerce.dart';
import '../../domain/repositories/ecommerce_repository.dart';
import '../../domain/usecases/ecommerce_usecases.dart';

final Provider<EcommerceRemoteDataSource> ecommerceRemoteDataSourceProvider =
    Provider<EcommerceRemoteDataSource>(
  (Ref ref) => EcommerceRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<EcommerceRepository> ecommerceRepositoryProvider =
    Provider<EcommerceRepository>(
  (Ref ref) => EcommerceRepositoryImpl(
    remote: ref.watch(ecommerceRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class EcommerceProductListState extends Equatable {
  const EcommerceProductListState({
    this.items = const <EcommerceProduct>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<EcommerceProduct> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  EcommerceProductListState copyWith({
    List<EcommerceProduct>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      EcommerceProductListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<EcommerceProductListController, EcommerceProductListState>
    ecommerceProductListControllerProvider =
    NotifierProvider<EcommerceProductListController, EcommerceProductListState>(
  EcommerceProductListController.new,
);

class EcommerceProductListController extends Notifier<EcommerceProductListState> {
  Timer? _searchDebounce;

  @override
  EcommerceProductListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const EcommerceProductListState();
  }

  ListEcommerceProductsUseCase get _listUseCase =>
      ListEcommerceProductsUseCase(ref.read(ecommerceRepositoryProvider));

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
    final result = await DeleteEcommerceProductUseCase(
      ref.read(ecommerceRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<EcommerceProduct, String> ecommerceProductDetailProvider =
    FutureProvider.family<EcommerceProduct, String>((Ref ref, String id) async {
  final result = await GetEcommerceProductUseCase(
    ref.watch(ecommerceRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

class EcommerceOrderListState extends Equatable {
  const EcommerceOrderListState({
    this.items = const <EcommerceOrder>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<EcommerceOrder> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  EcommerceOrderListState copyWith({
    List<EcommerceOrder>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      EcommerceOrderListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<EcommerceOrderListController, EcommerceOrderListState>
    ecommerceOrderListControllerProvider =
    NotifierProvider<EcommerceOrderListController, EcommerceOrderListState>(
  EcommerceOrderListController.new,
);

class EcommerceOrderListController extends Notifier<EcommerceOrderListState> {
  Timer? _searchDebounce;

  @override
  EcommerceOrderListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const EcommerceOrderListState();
  }

  ListEcommerceOrdersUseCase get _listUseCase =>
      ListEcommerceOrdersUseCase(ref.read(ecommerceRepositoryProvider));

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

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }
}

final FutureProviderFamily<EcommerceOrder, String> ecommerceOrderDetailProvider =
    FutureProvider.family<EcommerceOrder, String>((Ref ref, String id) async {
  final result = await GetEcommerceOrderUseCase(
    ref.watch(ecommerceRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

class EcommerceCategoryListState extends Equatable {
  const EcommerceCategoryListState({
    this.items = const <EcommerceCategory>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<EcommerceCategory> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  EcommerceCategoryListState copyWith({
    List<EcommerceCategory>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      EcommerceCategoryListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<EcommerceCategoryListController, EcommerceCategoryListState>
    ecommerceCategoryListControllerProvider =
    NotifierProvider<EcommerceCategoryListController, EcommerceCategoryListState>(
  EcommerceCategoryListController.new,
);

class EcommerceCategoryListController extends Notifier<EcommerceCategoryListState> {
  Timer? _searchDebounce;

  @override
  EcommerceCategoryListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const EcommerceCategoryListState();
  }

  ListEcommerceCategoriesUseCase get _listUseCase =>
      ListEcommerceCategoriesUseCase(ref.read(ecommerceRepositoryProvider));

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

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteEcommerceCategoryUseCase(
      ref.read(ecommerceRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}