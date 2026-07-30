import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/workflow_remote_data_source.dart';
import '../../data/repositories/workflow_repository_impl.dart';
import '../../domain/entities/workflow.dart';
import '../../domain/repositories/workflow_repository.dart';
import '../../domain/usecases/workflow_usecases.dart';

final Provider<WorkflowRemoteDataSource> workflowRemoteDataSourceProvider =
    Provider<WorkflowRemoteDataSource>(
  (Ref ref) => WorkflowRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<WorkflowRepository> workflowRepositoryProvider =
    Provider<WorkflowRepository>(
  (Ref ref) => WorkflowRepositoryImpl(
    remote: ref.watch(workflowRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Workflow Definition List ───────────────────────────────────────────────

class WorkflowDefinitionListState extends Equatable {
  const WorkflowDefinitionListState({
    this.items = const <WorkflowDefinition>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<WorkflowDefinition> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  WorkflowDefinitionListState copyWith({
    List<WorkflowDefinition>? items,
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
      WorkflowDefinitionListState(
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

final NotifierProvider<WorkflowDefinitionListController, WorkflowDefinitionListState>
    workflowDefinitionListControllerProvider =
    NotifierProvider<WorkflowDefinitionListController, WorkflowDefinitionListState>(
  WorkflowDefinitionListController.new,
);

class WorkflowDefinitionListController extends Notifier<WorkflowDefinitionListState> {
  Timer? _searchDebounce;

  @override
  WorkflowDefinitionListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const WorkflowDefinitionListState();
  }

  ListWorkflowDefinitionsUseCase get _listUseCase =>
      ListWorkflowDefinitionsUseCase(ref.read(workflowRepositoryProvider));

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
    final result = await DeleteWorkflowDefinitionUseCase(
      ref.read(workflowRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<void> activate(String id) async {
    await ActivateWorkflowDefinitionUseCase(
      ref.read(workflowRepositoryProvider))(id);
    await refresh();
  }

  Future<void> deactivate(String id) async {
    await DeactivateWorkflowDefinitionUseCase(
      ref.read(workflowRepositoryProvider))(id);
    await refresh();
  }

  Future<Result<WorkflowDefinition>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveWorkflowDefinitionUseCase(
      ref.read(workflowRepositoryProvider))(
      SaveWorkflowDefinitionParams(id: id, payload: payload));
    if (result.isOk) await refresh();
    return result;
  }
}

// ── Workflow Instance List ─────────────────────────────────────────────────

class WorkflowInstanceListState extends Equatable {
  const WorkflowInstanceListState({
    this.items = const <WorkflowInstance>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<WorkflowInstance> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  WorkflowInstanceListState copyWith({
    List<WorkflowInstance>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      WorkflowInstanceListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure,
      ];
}

final NotifierProvider<WorkflowInstanceListController, WorkflowInstanceListState>
    workflowInstanceListControllerProvider =
    NotifierProvider<WorkflowInstanceListController, WorkflowInstanceListState>(
  WorkflowInstanceListController.new,
);

class WorkflowInstanceListController extends Notifier<WorkflowInstanceListState> {
  @override
  WorkflowInstanceListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const WorkflowInstanceListState();
  }

  ListWorkflowInstancesUseCase get _listUseCase =>
      ListWorkflowInstancesUseCase(ref.read(workflowRepositoryProvider));

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

  Future<void> cancel(String id) async {
    await CancelWorkflowInstanceUseCase(
      ref.read(workflowRepositoryProvider))(id);
    await refresh();
  }

  Future<void> advance(String id) async {
    await AdvanceWorkflowInstanceUseCase(
      ref.read(workflowRepositoryProvider))(id);
    await refresh();
  }
}

// ── Workflow Approval (Task) List ──────────────────────────────────────────

class WorkflowTaskListState extends Equatable {
  const WorkflowTaskListState({
    this.items = const <WorkflowTask>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt', filters: {'status': 'PENDING'}),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<WorkflowTask> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  WorkflowTaskListState copyWith({
    List<WorkflowTask>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
    bool clearCachedAt = false,
  }) =>
      WorkflowTaskListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure,
      ];
}

final NotifierProvider<WorkflowTaskListController, WorkflowTaskListState>
    workflowTaskListControllerProvider =
    NotifierProvider<WorkflowTaskListController, WorkflowTaskListState>(
  WorkflowTaskListController.new,
);

class WorkflowTaskListController extends Notifier<WorkflowTaskListState> {
  @override
  WorkflowTaskListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const WorkflowTaskListState();
  }

  ListWorkflowTasksUseCase get _listUseCase =>
      ListWorkflowTasksUseCase(ref.read(workflowRepositoryProvider));

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

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(query: state.query.copyWith(filters: filters, page: 1));
    refresh();
  }

  Future<void> approve(String id) async {
    await ApproveWorkflowTaskUseCase(ref.read(workflowRepositoryProvider))(id);
    await refresh();
  }

  Future<void> reject(String id) async {
    await RejectWorkflowTaskUseCase(ref.read(workflowRepositoryProvider))(id);
    await refresh();
  }

  Future<void> escalate(String id) async {
    await EscalateWorkflowTaskUseCase(ref.read(workflowRepositoryProvider))(id);
    await refresh();
  }

  Future<Result<WorkflowTask>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveWorkflowTaskUseCase(
      ref.read(workflowRepositoryProvider))(
      SaveWorkflowTaskParams(id: id, payload: payload));
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<WorkflowDefinition, String> workflowDefinitionDetailProvider =
    FutureProvider.family<WorkflowDefinition, String>((Ref ref, String id) async {
  final result = await GetWorkflowDefinitionUseCase(
    ref.watch(workflowRepositoryProvider))(id);
  return result.fold((f) => throw f, (w) => w);
});

final FutureProviderFamily<WorkflowInstance, String> workflowInstanceDetailProvider =
    FutureProvider.family<WorkflowInstance, String>((Ref ref, String id) async {
  final result = await GetWorkflowInstanceUseCase(
    ref.watch(workflowRepositoryProvider))(id);
  return result.fold((f) => throw f, (w) => w);
});

final FutureProviderFamily<WorkflowTask, String> workflowTaskDetailProvider =
    FutureProvider.family<WorkflowTask, String>((Ref ref, String id) async {
  final result = await GetWorkflowTaskUseCase(
    ref.watch(workflowRepositoryProvider))(id);
  return result.fold((f) => throw f, (t) => t);
});

