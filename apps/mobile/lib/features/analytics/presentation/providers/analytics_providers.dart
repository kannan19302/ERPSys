import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/analytics_remote_data_source.dart';
import '../../data/repositories/analytics_repository_impl.dart';
import '../../domain/entities/analytics.dart';
import '../../domain/repositories/analytics_repository.dart';
import '../../domain/usecases/analytics_usecases.dart';

final Provider<AnalyticsRemoteDataSource> analyticsRemoteDataSourceProvider =
    Provider<AnalyticsRemoteDataSource>(
  (Ref ref) => AnalyticsRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<AnalyticsRepository> analyticsRepositoryProvider =
    Provider<AnalyticsRepository>(
  (Ref ref) => AnalyticsRepositoryImpl(
    remote: ref.watch(analyticsRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class KpiListState extends Equatable {
  const KpiListState({
    this.items = const <AnalyticsKpi>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<AnalyticsKpi> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  KpiListState copyWith({
    List<AnalyticsKpi>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) =>
      KpiListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
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

final NotifierProvider<KpiListController, KpiListState>
    kpiListControllerProvider =
    NotifierProvider<KpiListController, KpiListState>(
  KpiListController.new,
);

class KpiListController extends Notifier<KpiListState> {
  Timer? _searchDebounce;

  @override
  KpiListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const KpiListState();
  }

  ListKpisUseCase get _listUseCase =>
      ListKpisUseCase(ref.read(analyticsRepositoryProvider));

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
    final result = await DeleteKpiUseCase(
      ref.read(analyticsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<AnalyticsKpi>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveKpiUseCase(
      ref.read(analyticsRepositoryProvider))(
      SaveKpiParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AnalyticsKpi, String> analyticsKpiDetailProvider =
    FutureProvider.family<AnalyticsKpi, String>((Ref ref, String id) async {
  final result = await GetKpiUseCase(
    ref.watch(analyticsRepositoryProvider))(id);
  return result.fold((f) => throw f, (kpi) => kpi);
});

class DashboardListState extends Equatable {
  const DashboardListState({
    this.items = const <AnalyticsDashboard>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AnalyticsDashboard> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  DashboardListState copyWith({
    List<AnalyticsDashboard>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      DashboardListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<DashboardListController, DashboardListState>
    dashboardListControllerProvider =
    NotifierProvider<DashboardListController, DashboardListState>(
  DashboardListController.new,
);

class DashboardListController extends Notifier<DashboardListState> {
  Timer? _searchDebounce;

  @override
  DashboardListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const DashboardListState();
  }

  ListDashboardsUseCase get _listUseCase =>
      ListDashboardsUseCase(ref.read(analyticsRepositoryProvider));

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
    final result = await DeleteDashboardUseCase(
      ref.read(analyticsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<AnalyticsDashboard>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveDashboardUseCase(
      ref.read(analyticsRepositoryProvider))(
      SaveDashboardParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AnalyticsDashboard, String> analyticsDashboardDetailProvider =
    FutureProvider.family<AnalyticsDashboard, String>((Ref ref, String id) async {
  final result = await GetDashboardUseCase(
    ref.watch(analyticsRepositoryProvider))(id);
  return result.fold((f) => throw f, (d) => d);
});

class ReportListState extends Equatable {
  const ReportListState({
    this.items = const <AnalyticsReport>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AnalyticsReport> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ReportListState copyWith({
    List<AnalyticsReport>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ReportListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ReportListController, ReportListState>
    reportListControllerProvider =
    NotifierProvider<ReportListController, ReportListState>(
  ReportListController.new,
);

class ReportListController extends Notifier<ReportListState> {
  Timer? _searchDebounce;

  @override
  ReportListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ReportListState();
  }

  ListReportsUseCase get _listUseCase =>
      ListReportsUseCase(ref.read(analyticsRepositoryProvider));

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

  void applySort(String sort) {
    state = state.copyWith(query: state.query.copyWith(sort: sort, page: 1));
    refresh();
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteReportUseCase(
      ref.read(analyticsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<AnalyticsReport>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveReportUseCase(
      ref.read(analyticsRepositoryProvider))(
      SaveReportParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AnalyticsReport, String> analyticsReportDetailProvider =
    FutureProvider.family<AnalyticsReport, String>((Ref ref, String id) async {
  final result = await GetReportUseCase(
    ref.watch(analyticsRepositoryProvider))(id);
  return result.fold((f) => throw f, (r) => r);
});

class PipelineListState extends Equatable {
  const PipelineListState({
    this.items = const <AnalyticsPipeline>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AnalyticsPipeline> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  PipelineListState copyWith({
    List<AnalyticsPipeline>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      PipelineListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<PipelineListController, PipelineListState>
    pipelineListControllerProvider =
    NotifierProvider<PipelineListController, PipelineListState>(
  PipelineListController.new,
);

class PipelineListController extends Notifier<PipelineListState> {
  Timer? _searchDebounce;

  @override
  PipelineListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const PipelineListState();
  }

  ListPipelinesUseCase get _listUseCase =>
      ListPipelinesUseCase(ref.read(analyticsRepositoryProvider));

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

  void applySort(String sort) {
    state = state.copyWith(query: state.query.copyWith(sort: sort, page: 1));
    refresh();
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }
}

final FutureProviderFamily<AnalyticsPipeline, String> analyticsPipelineDetailProvider =
    FutureProvider.family<AnalyticsPipeline, String>((Ref ref, String id) async {
  final result = await GetPipelineUseCase(
    ref.watch(analyticsRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});
