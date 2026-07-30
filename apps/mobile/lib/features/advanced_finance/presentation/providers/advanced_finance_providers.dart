import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/advanced_finance_remote_data_source.dart';
import '../../data/repositories/advanced_finance_repository_impl.dart';
import '../../domain/entities/advanced_finance.dart';
import '../../domain/repositories/advanced_finance_repository.dart';
import '../../domain/usecases/advanced_finance_usecases.dart';

final Provider<AdvancedFinanceRemoteDataSource> advancedFinanceRemoteDataSourceProvider =
    Provider<AdvancedFinanceRemoteDataSource>(
  (Ref ref) => AdvancedFinanceRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<AdvancedFinanceRepository> advancedFinanceRepositoryProvider =
    Provider<AdvancedFinanceRepository>(
  (Ref ref) => AdvancedFinanceRepositoryImpl(
    remote: ref.watch(advancedFinanceRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class MultiCurrencyRateListState extends Equatable {
  const MultiCurrencyRateListState({
    this.items = const <MultiCurrencyRate>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<MultiCurrencyRate> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  MultiCurrencyRateListState copyWith({
    List<MultiCurrencyRate>? items,
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
      MultiCurrencyRateListState(
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

final NotifierProvider<MultiCurrencyRateListController, MultiCurrencyRateListState>
    multiCurrencyRateListControllerProvider =
    NotifierProvider<MultiCurrencyRateListController, MultiCurrencyRateListState>(
  MultiCurrencyRateListController.new,
);

class MultiCurrencyRateListController extends Notifier<MultiCurrencyRateListState> {
  Timer? _searchDebounce;

  @override
  MultiCurrencyRateListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const MultiCurrencyRateListState();
  }

  ListMultiCurrencyRatesUseCase get _listUseCase =>
      ListMultiCurrencyRatesUseCase(ref.read(advancedFinanceRepositoryProvider));

  Future<void> refresh() async {
    final query = state.query.copyWith(page: 1);
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
    final result = await DeleteMultiCurrencyRateUseCase(
      ref.read(advancedFinanceRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<MultiCurrencyRate>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveMultiCurrencyRateUseCase(
      ref.read(advancedFinanceRepositoryProvider))(
      SaveMultiCurrencyRateParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

class ConsolidationReportListState extends Equatable {
  const ConsolidationReportListState({
    this.items = const <ConsolidationReport>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ConsolidationReport> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ConsolidationReportListState copyWith({
    List<ConsolidationReport>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ConsolidationReportListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ConsolidationReportListController, ConsolidationReportListState>
    consolidationReportListControllerProvider =
    NotifierProvider<ConsolidationReportListController, ConsolidationReportListState>(
  ConsolidationReportListController.new,
);

class ConsolidationReportListController extends Notifier<ConsolidationReportListState> {
  Timer? _searchDebounce;

  @override
  ConsolidationReportListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ConsolidationReportListState();
  }

  ListConsolidationReportsUseCase get _listUseCase =>
      ListConsolidationReportsUseCase(ref.read(advancedFinanceRepositoryProvider));

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

final FutureProviderFamily<MultiCurrencyRate, String> multiCurrencyRateDetailProvider =
    FutureProvider.family<MultiCurrencyRate, String>((Ref ref, String id) async {
  final result = await GetMultiCurrencyRateUseCase(
    ref.watch(advancedFinanceRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── Financial Close Tasks ───────────────────────────────────────────────────

class FinancialCloseTaskListState extends Equatable {
  const FinancialCloseTaskListState({
    this.items = const <FinancialCloseTask>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<FinancialCloseTask> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  FinancialCloseTaskListState copyWith({
    List<FinancialCloseTask>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      FinancialCloseTaskListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<FinancialCloseTaskListController, FinancialCloseTaskListState>
    financialCloseTaskListControllerProvider =
    NotifierProvider<FinancialCloseTaskListController, FinancialCloseTaskListState>(
  FinancialCloseTaskListController.new,
);

class FinancialCloseTaskListController extends Notifier<FinancialCloseTaskListState> {
  Timer? _searchDebounce;

  @override
  FinancialCloseTaskListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const FinancialCloseTaskListState();
  }

  ListFinancialCloseTasksUseCase get _listUseCase =>
      ListFinancialCloseTasksUseCase(ref.read(advancedFinanceRepositoryProvider));

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
    final result = await DeleteFinancialCloseTaskUseCase(
      ref.read(advancedFinanceRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<FinancialCloseTask>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveFinancialCloseTaskUseCase(
      ref.read(advancedFinanceRepositoryProvider))(
      SaveFinancialCloseTaskParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<FinancialCloseTask, String> financialCloseTaskDetailProvider =
    FutureProvider.family<FinancialCloseTask, String>((Ref ref, String id) async {
  final result = await GetFinancialCloseTaskUseCase(
    ref.watch(advancedFinanceRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});
