import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/sales_remote_data_source.dart';
import '../../data/repositories/sales_repository_impl.dart';
import '../../domain/entities/sales.dart';
import '../../domain/repositories/sales_repository.dart';
import '../../domain/usecases/sales_usecases.dart';

// ── Wiring ────────────────────────────────────────────────────────────────

final Provider<SalesRemoteDataSource> salesRemoteDataSourceProvider =
    Provider<SalesRemoteDataSource>(
  (Ref ref) => SalesRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<SalesRepository> salesRepositoryProvider =
    Provider<SalesRepository>(
  (Ref ref) => SalesRepositoryImpl(
    remote: ref.watch(salesRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Shared state ──────────────────────────────────────────────────────────

class SalesListState<T extends Equatable> extends Equatable {
  const SalesListState({
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

  SalesListState<T> copyWith({
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
      SalesListState<T>(
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

// ── Quotations ────────────────────────────────────────────────────────────

final NotifierProvider<QuotationsController, SalesListState<Quotation>>
    quotationsProvider =
    NotifierProvider<QuotationsController, SalesListState<Quotation>>(
  QuotationsController.new,
);

class QuotationsController extends Notifier<SalesListState<Quotation>> {
  Timer? _searchDebounce;

  @override
  SalesListState<Quotation> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const SalesListState<Quotation>();
  }

  ListQuotationsUseCase get _list =>
      ListQuotationsUseCase(ref.read(salesRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Quotation>>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <Quotation>[],
      ),
      (Cacheable<Paginated<Quotation>> page) => state.copyWith(
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

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Cacheable<Paginated<Quotation>>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Quotation>> page) => state.copyWith(
        items: <Quotation>[...state.items, ...page.value.data],
        meta: page.value.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

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

  Future<Result<Quotation>> create(Map<String, dynamic> payload) async {
    final Result<Quotation> result =
        await SaveQuotationUseCase(ref.read(salesRepositoryProvider))(
      SaveSalesParams(payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Quotation>> update(String id, Map<String, dynamic> payload) async {
    final Result<Quotation> result =
        await SaveQuotationUseCase(ref.read(salesRepositoryProvider))(
      SaveSalesParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteQuotationUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Quotation>> submit(String id) async {
    final Result<Quotation> result =
        await SubmitQuotationUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Quotation>> accept(String id) async {
    final Result<Quotation> result =
        await AcceptQuotationUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Quotation, String> quotationDetailProvider =
    FutureProvider.family<Quotation, String>((Ref ref, String id) async {
  final Result<Quotation> result =
      await GetQuotationUseCase(ref.watch(salesRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Quotation q) => q,
  );
});

// ── Sales Orders ──────────────────────────────────────────────────────────

final NotifierProvider<SalesOrdersController, SalesListState<SalesOrder>>
    salesOrdersProvider =
    NotifierProvider<SalesOrdersController, SalesListState<SalesOrder>>(
  SalesOrdersController.new,
);

class SalesOrdersController extends Notifier<SalesListState<SalesOrder>> {
  Timer? _searchDebounce;

  @override
  SalesListState<SalesOrder> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const SalesListState<SalesOrder>();
  }

  ListSalesOrdersUseCase get _list =>
      ListSalesOrdersUseCase(ref.read(salesRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<SalesOrder>>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <SalesOrder>[],
      ),
      (Cacheable<Paginated<SalesOrder>> page) => state.copyWith(
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

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Cacheable<Paginated<SalesOrder>>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<SalesOrder>> page) => state.copyWith(
        items: <SalesOrder>[...state.items, ...page.value.data],
        meta: page.value.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

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

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteSalesOrderUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<SalesOrder>> save(Map<String, dynamic> payload, {String? id}) async {
    final Result<SalesOrder> result =
        await SaveSalesOrderUseCase(ref.read(salesRepositoryProvider))(
      SaveSalesParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<SalesOrder, String> salesOrderDetailProvider =
    FutureProvider.family<SalesOrder, String>((Ref ref, String id) async {
  final Result<SalesOrder> result =
      await GetSalesOrderUseCase(ref.watch(salesRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (SalesOrder o) => o,
  );
});

// ── Delivery Notes ────────────────────────────────────────────────────────

final NotifierProvider<DeliveryNotesController, SalesListState<DeliveryNote>>
    deliveryNotesProvider =
    NotifierProvider<DeliveryNotesController, SalesListState<DeliveryNote>>(
  DeliveryNotesController.new,
);

class DeliveryNotesController extends Notifier<SalesListState<DeliveryNote>> {
  Timer? _searchDebounce;

  @override
  SalesListState<DeliveryNote> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const SalesListState<DeliveryNote>();
  }

  ListDeliveryNotesUseCase get _list =>
      ListDeliveryNotesUseCase(ref.read(salesRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Paginated<DeliveryNote>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <DeliveryNote>[],
      ),
      (Paginated<DeliveryNote> page) => state.copyWith(
        items: page.data,
        meta: page.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Paginated<DeliveryNote>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Paginated<DeliveryNote> page) => state.copyWith(
        items: <DeliveryNote>[...state.items, ...page.data],
        meta: page.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

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
        await DeleteDeliveryNoteUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<DeliveryNote>> create(Map<String, dynamic> payload) async {
    final Result<DeliveryNote> result =
        await SaveDeliveryNoteUseCase(ref.read(salesRepositoryProvider))(
      SaveSalesParams(payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<DeliveryNote>> submit(String id) async {
    final Result<DeliveryNote> result =
        await SubmitDeliveryNoteUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<DeliveryNote, String> deliveryNoteDetailProvider =
    FutureProvider.family<DeliveryNote, String>((Ref ref, String id) async {
  final Result<DeliveryNote> result =
      await GetDeliveryNoteUseCase(ref.watch(salesRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (DeliveryNote dn) => dn,
  );
});

// ── Sales Returns ─────────────────────────────────────────────────────────

final NotifierProvider<SalesReturnsController, SalesListState<SalesReturn>>
    salesReturnsProvider =
    NotifierProvider<SalesReturnsController, SalesListState<SalesReturn>>(
  SalesReturnsController.new,
);

class SalesReturnsController extends Notifier<SalesListState<SalesReturn>> {
  Timer? _searchDebounce;

  @override
  SalesListState<SalesReturn> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const SalesListState<SalesReturn>();
  }

  ListSalesReturnsUseCase get _list =>
      ListSalesReturnsUseCase(ref.read(salesRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Paginated<SalesReturn>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <SalesReturn>[],
      ),
      (Paginated<SalesReturn> page) => state.copyWith(
        items: page.data,
        meta: page.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Paginated<SalesReturn>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Paginated<SalesReturn> page) => state.copyWith(
        items: <SalesReturn>[...state.items, ...page.data],
        meta: page.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

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

  Future<Result<SalesReturn>> create(Map<String, dynamic> payload) async {
    final Result<SalesReturn> result =
        await SaveSalesReturnUseCase(ref.read(salesRepositoryProvider))(
      SaveSalesParams(payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteSalesReturnUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<SalesReturn>> approve(String id) async {
    final Result<SalesReturn> result =
        await SalesReturnApproveUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<SalesReturn>> reject(String id) async {
    final Result<SalesReturn> result =
        await SalesReturnRejectUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<SalesReturn, String> salesReturnDetailProvider =
    FutureProvider.family<SalesReturn, String>((Ref ref, String id) async {
  final Result<SalesReturn> result =
      await GetSalesReturnUseCase(ref.watch(salesRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (SalesReturn sr) => sr,
  );
});

// ── Opportunities ─────────────────────────────────────────────────────────

final NotifierProvider<OpportunitiesController, SalesListState<Opportunity>>
    opportunitiesProvider =
    NotifierProvider<OpportunitiesController, SalesListState<Opportunity>>(
  OpportunitiesController.new,
);

class OpportunitiesController extends Notifier<SalesListState<Opportunity>> {
  Timer? _searchDebounce;

  @override
  SalesListState<Opportunity> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const SalesListState<Opportunity>();
  }

  ListOpportunitiesUseCase get _list =>
      ListOpportunitiesUseCase(ref.read(salesRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Paginated<Opportunity>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <Opportunity>[],
      ),
      (Paginated<Opportunity> page) => state.copyWith(
        items: page.data,
        meta: page.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Paginated<Opportunity>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Paginated<Opportunity> page) => state.copyWith(
        items: <Opportunity>[...state.items, ...page.data],
        meta: page.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

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

  Future<Result<Opportunity>> save(Map<String, dynamic> payload, {String? id}) async {
    final Result<Opportunity> result =
        await SaveOpportunityUseCase(ref.read(salesRepositoryProvider))(
      SaveSalesParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteOpportunityUseCase(ref.read(salesRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Opportunity>> updateStage(String id, String stage) async {
    final Result<Opportunity> result =
        await UpdateOpportunityStageUseCase(ref.read(salesRepositoryProvider))(
      <String, dynamic>{'id': id, 'stage': stage},
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Opportunity, String> opportunityDetailProvider =
    FutureProvider.family<Opportunity, String>((Ref ref, String id) async {
  final Result<Opportunity> result =
      await GetOpportunityUseCase(ref.watch(salesRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Opportunity o) => o,
  );
});

// ── Pipelines ─────────────────────────────────────────────────────────────

final FutureProvider<List<SalesPipeline>> salesPipelinesProvider =
    FutureProvider<List<SalesPipeline>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<List<SalesPipeline>> result =
      await GetSalesPipelineUseCase(ref.watch(salesRepositoryProvider))(
    const NoParams(),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (List<SalesPipeline> pipelines) => pipelines,
  );
});

final FutureProviderFamily<SalesPipeline, String> salesPipelineDetailProvider =
    FutureProvider.family<SalesPipeline, String>((Ref ref, String id) async {
  final Result<SalesPipeline> result =
      await GetSalesPipelineDetailUseCase(ref.watch(salesRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (SalesPipeline p) => p,
  );
});
