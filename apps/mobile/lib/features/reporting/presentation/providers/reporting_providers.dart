import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/reporting_remote_data_source.dart';
import '../../data/repositories/reporting_repository_impl.dart';
import '../../domain/entities/reporting.dart';
import '../../domain/repositories/reporting_repository.dart';
import '../../domain/usecases/reporting_usecases.dart';

final Provider<ReportingRemoteDataSource> reportingRemoteDataSourceProvider =
    Provider<ReportingRemoteDataSource>(
  (Ref ref) => ReportingRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<ReportingRepository> reportingRepositoryProvider =
    Provider<ReportingRepository>(
  (Ref ref) => ReportingRepositoryImpl(
    remote: ref.watch(reportingRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class ReportTemplateListState extends Equatable {
  const ReportTemplateListState({
    this.items = const <ReportTemplate>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<ReportTemplate> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  ReportTemplateListState copyWith({
    List<ReportTemplate>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) =>
      ReportTemplateListState(
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

final NotifierProvider<ReportTemplateListController, ReportTemplateListState>
    reportTemplateListControllerProvider =
    NotifierProvider<ReportTemplateListController, ReportTemplateListState>(
  ReportTemplateListController.new,
);

class ReportTemplateListController extends Notifier<ReportTemplateListState> {
  Timer? _searchDebounce;

  @override
  ReportTemplateListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ReportTemplateListState();
  }

  ListReportTemplatesUseCase get _listUseCase =>
      ListReportTemplatesUseCase(ref.read(reportingRepositoryProvider));

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
    final result = await DeleteReportTemplateUseCase(
      ref.read(reportingRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<ReportTemplate>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveReportTemplateUseCase(
      ref.read(reportingRepositoryProvider),)(
      SaveReportTemplateParams(id: id, payload: payload),);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ReportTemplate, String> reportTemplateDetailProvider =
    FutureProvider.family<ReportTemplate, String>((Ref ref, String id) async {
  final result = await GetReportTemplateUseCase(
    ref.watch(reportingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (t) => t);
});

class ReportJobListState extends Equatable {
  const ReportJobListState({
    this.items = const <ReportJob>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ReportJob> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ReportJobListState copyWith({
    List<ReportJob>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ReportJobListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ReportJobListController, ReportJobListState>
    reportJobListControllerProvider =
    NotifierProvider<ReportJobListController, ReportJobListState>(
  ReportJobListController.new,
);

class ReportJobListController extends Notifier<ReportJobListState> {
  Timer? _searchDebounce;

  @override
  ReportJobListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ReportJobListState();
  }

  ListReportJobsUseCase get _listUseCase =>
      ListReportJobsUseCase(ref.read(reportingRepositoryProvider));

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

  Future<Result<ReportJob>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveReportJobUseCase(
      ref.read(reportingRepositoryProvider),)(
      SaveReportJobUseCaseParams(id: id, payload: payload),);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ReportJob, String> reportJobDetailProvider =
    FutureProvider.family<ReportJob, String>((Ref ref, String id) async {
  final result = await GetReportJobUseCase(
    ref.watch(reportingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (j) => j);
});

class ReportExportListState extends Equatable {
  const ReportExportListState({
    this.items = const <ReportExport>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ReportExport> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ReportExportListState copyWith({
    List<ReportExport>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ReportExportListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ReportExportListController, ReportExportListState>
    reportExportListControllerProvider =
    NotifierProvider<ReportExportListController, ReportExportListState>(
  ReportExportListController.new,
);

class ReportExportListController extends Notifier<ReportExportListState> {
  Timer? _searchDebounce;

  @override
  ReportExportListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ReportExportListState();
  }

  ListReportExportsUseCase get _listUseCase =>
      ListReportExportsUseCase(ref.read(reportingRepositoryProvider));

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

  Future<Result<ReportExport>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveExportUseCase(
      ref.read(reportingRepositoryProvider),)(
      SaveExportParams(id: id, payload: payload),);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ReportExport, String> reportExportDetailProvider =
    FutureProvider.family<ReportExport, String>((Ref ref, String id) async {
  final result = await GetReportExportUseCase(
    ref.watch(reportingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (e) => e);
});

class ReportComplianceListState extends Equatable {
  const ReportComplianceListState({
    this.items = const <ReportCompliance>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ReportCompliance> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ReportComplianceListState copyWith({
    List<ReportCompliance>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ReportComplianceListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ReportComplianceListController, ReportComplianceListState>
    reportComplianceListControllerProvider =
    NotifierProvider<ReportComplianceListController, ReportComplianceListState>(
  ReportComplianceListController.new,
);

class ReportComplianceListController extends Notifier<ReportComplianceListState> {
  Timer? _searchDebounce;

  @override
  ReportComplianceListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ReportComplianceListState();
  }

  ListReportComplianceUseCase get _listUseCase =>
      ListReportComplianceUseCase(ref.read(reportingRepositoryProvider));

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

  Future<Result<ReportCompliance>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveComplianceUseCase(
      ref.read(reportingRepositoryProvider),)(
      SaveComplianceParams(id: id, payload: payload),);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ReportCompliance, String> reportComplianceDetailProvider =
    FutureProvider.family<ReportCompliance, String>((Ref ref, String id) async {
  final result = await GetReportComplianceUseCase(
    ref.watch(reportingRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

