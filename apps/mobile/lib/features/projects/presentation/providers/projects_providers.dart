import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/projects_remote_data_source.dart';
import '../../data/repositories/projects_repository_impl.dart';
import '../../domain/entities/projects.dart';
import '../../domain/repositories/projects_repository.dart';
import '../../domain/usecases/projects_usecases.dart';

final Provider<ProjectsRemoteDataSource> projectsRemoteDataSourceProvider =
    Provider<ProjectsRemoteDataSource>(
  (Ref ref) => ProjectsRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<ProjectsRepository> projectsRepositoryProvider =
    Provider<ProjectsRepository>(
  (Ref ref) => ProjectsRepositoryImpl(
    remote: ref.watch(projectsRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Shared state ──

class ProjectListState extends Equatable {
  const ProjectListState({
    this.items = const <Project>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Project> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  ProjectListState copyWith({
    List<Project>? items,
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
      ProjectListState(
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

class GenericListState<T extends Equatable> extends Equatable {
  const GenericListState({
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

  GenericListState<T> copyWith({
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
      GenericListState<T>(
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

// ── Projects ──

final NotifierProvider<ProjectListController, ProjectListState>
    projectListControllerProvider =
    NotifierProvider<ProjectListController, ProjectListState>(
  ProjectListController.new,
);

class ProjectListController extends Notifier<ProjectListState> {
  Timer? _searchDebounce;

  @override
  ProjectListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ProjectListState();
  }

  ListProjectsUseCase get _listUseCase =>
      ListProjectsUseCase(ref.read(projectsRepositoryProvider));

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
    final result = await DeleteProjectUseCase(
      ref.read(projectsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Project>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveProjectUseCase(
      ref.read(projectsRepositoryProvider))(
      SaveProjectParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Project, String> projectDetailProvider =
    FutureProvider.family<Project, String>((Ref ref, String id) async {
  final result = await GetProjectUseCase(
    ref.watch(projectsRepositoryProvider))(id);
  return result.fold((f) => throw f, (p) => p);
});

// ── Tasks ──

class TaskListState extends Equatable {
  const TaskListState({
    this.items = const <Task>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Task> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  TaskListState copyWith({
    List<Task>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      TaskListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<TaskListController, TaskListState>
    taskListControllerProvider =
    NotifierProvider<TaskListController, TaskListState>(
  TaskListController.new,
);

class TaskListController extends Notifier<TaskListState> {
  Timer? _searchDebounce;

  @override
  TaskListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const TaskListState();
  }

  ListTasksUseCase get _listUseCase =>
      ListTasksUseCase(ref.read(projectsRepositoryProvider));

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
    final result = await DeleteTaskUseCase(
      ref.read(projectsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Task>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveTaskUseCase(
      ref.read(projectsRepositoryProvider))(
      SaveTaskParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Task, String> taskDetailProvider =
    FutureProvider.family<Task, String>((Ref ref, String id) async {
  final result = await GetTaskUseCase(
    ref.watch(projectsRepositoryProvider))(id);
  return result.fold((f) => throw f, (t) => t);
});

// ── Milestones ──

class MilestoneListState extends Equatable {
  const MilestoneListState({
    this.items = const <Milestone>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Milestone> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  MilestoneListState copyWith({
    List<Milestone>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      MilestoneListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<MilestoneListController, MilestoneListState>
    milestoneListControllerProvider =
    NotifierProvider<MilestoneListController, MilestoneListState>(
  MilestoneListController.new,
);

class MilestoneListController extends Notifier<MilestoneListState> {
  @override
  MilestoneListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const MilestoneListState();
  }

  ListMilestonesUseCase get _listUseCase =>
      ListMilestonesUseCase(ref.read(projectsRepositoryProvider));

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

  Future<Result<void>> delete(String id) async {
    final result = await DeleteMilestoneUseCase(
      ref.read(projectsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Milestone>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveMilestoneUseCase(
      ref.read(projectsRepositoryProvider))(
      SaveMilestoneParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Milestone, String> milestoneDetailProvider =
    FutureProvider.family<Milestone, String>((Ref ref, String id) async {
  final result = await GetMilestoneUseCase(
    ref.watch(projectsRepositoryProvider))(id);
  return result.fold((f) => throw f, (m) => m);
});

// ── Timesheets ──

class TimesheetListState extends Equatable {
  const TimesheetListState({
    this.items = const <Timesheet>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-date'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Timesheet> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  TimesheetListState copyWith({
    List<Timesheet>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) =>
      TimesheetListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure, cachedAt];
}

final NotifierProvider<TimesheetListController, TimesheetListState>
    timesheetListControllerProvider =
    NotifierProvider<TimesheetListController, TimesheetListState>(
  TimesheetListController.new,
);

class TimesheetListController extends Notifier<TimesheetListState> {
  Timer? _searchDebounce;

  @override
  TimesheetListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const TimesheetListState();
  }

  ListTimesheetsUseCase get _listUseCase =>
      ListTimesheetsUseCase(ref.read(projectsRepositoryProvider));

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

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(query: state.query.copyWith(filters: filters, page: 1));
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteTimesheetUseCase(
      ref.read(projectsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Timesheet>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveTimesheetUseCase(
      ref.read(projectsRepositoryProvider))(
      SaveTimesheetParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Timesheet>> approve(String id) async {
    final result = await ApproveTimesheetUseCase(
      ref.read(projectsRepositoryProvider))(id);
    return result;
  }
}

final FutureProviderFamily<Timesheet, String> timesheetDetailProvider =
    FutureProvider.family<Timesheet, String>((Ref ref, String id) async {
  final result = await GetTimesheetUseCase(
    ref.watch(projectsRepositoryProvider))(id);
  return result.fold((f) => throw f, (t) => t);
});

// ── Project Budgets ──

class ProjectBudgetListState extends Equatable {
  const ProjectBudgetListState({
    this.items = const <ProjectBudget>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-budgetedAmount'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ProjectBudget> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ProjectBudgetListState copyWith({
    List<ProjectBudget>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ProjectBudgetListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ProjectBudgetListController, ProjectBudgetListState>
    projectBudgetListControllerProvider =
    NotifierProvider<ProjectBudgetListController, ProjectBudgetListState>(
  ProjectBudgetListController.new,
);

class ProjectBudgetListController extends Notifier<ProjectBudgetListState> {
  String? _projectId;

  @override
  ProjectBudgetListState build() {
    ref.watch(activeTenantIdProvider);
    return const ProjectBudgetListState();
  }

  void setProjectId(String projectId) {
    _projectId = projectId;
    Future<void>.microtask(refresh);
  }

  Future<void> refresh() async {
    if (_projectId == null) return;
    state = state.copyWith(isLoading: true, clearFailures: true);
    final result = await ListProjectBudgetsUseCase(
      ref.read(projectsRepositoryProvider))(_projectId!);
    state = result.fold(
      (f) => state.copyWith(isLoading: false, failure: f, items: const []),
      (page) => state.copyWith(
        items: page.value.data, meta: page.value.meta,
        isLoading: false, clearFailures: true,
      ),
    );
  }

  Future<Result<ProjectBudget>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveProjectBudgetUseCase(
      ref.read(projectsRepositoryProvider))(
      SaveProjectBudgetParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteProjectBudgetUseCase(
      ref.read(projectsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ProjectBudget, String> projectBudgetDetailProvider =
    FutureProvider.family<ProjectBudget, String>((Ref ref, String id) async {
  final result = await GetProjectBudgetUseCase(
    ref.watch(projectsRepositoryProvider))(id);
  return result.fold((f) => throw f, (b) => b);
});

// ── Project Risks ──

class ProjectRiskListState extends Equatable {
  const ProjectRiskListState({
    this.items = const <ProjectRisk>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ProjectRisk> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ProjectRiskListState copyWith({
    List<ProjectRisk>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ProjectRiskListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ProjectRiskListController, ProjectRiskListState>
    projectRiskListControllerProvider =
    NotifierProvider<ProjectRiskListController, ProjectRiskListState>(
  ProjectRiskListController.new,
);

class ProjectRiskListController extends Notifier<ProjectRiskListState> {
  String? _projectId;

  @override
  ProjectRiskListState build() {
    ref.watch(activeTenantIdProvider);
    return const ProjectRiskListState();
  }

  void setProjectId(String projectId) {
    _projectId = projectId;
    Future<void>.microtask(refresh);
  }

  Future<void> refresh() async {
    if (_projectId == null) return;
    state = state.copyWith(isLoading: true, clearFailures: true);
    final result = await ListProjectRisksUseCase(
      ref.read(projectsRepositoryProvider))(_projectId!);
    state = result.fold(
      (f) => state.copyWith(isLoading: false, failure: f, items: const []),
      (page) => state.copyWith(
        items: page.value.data, meta: page.value.meta,
        isLoading: false, clearFailures: true,
      ),
    );
  }

  Future<Result<ProjectRisk>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveProjectRiskUseCase(
      ref.read(projectsRepositoryProvider))(
      SaveProjectRiskParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteProjectRiskUseCase(
      ref.read(projectsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ProjectRisk, String> projectRiskDetailProvider =
    FutureProvider.family<ProjectRisk, String>((Ref ref, String id) async {
  final result = await GetProjectRiskUseCase(
    ref.watch(projectsRepositoryProvider))(id);
  return result.fold((f) => throw f, (r) => r);
});

// ── Project Portfolios ──

class ProjectPortfolioListState extends Equatable {
  const ProjectPortfolioListState({
    this.items = const <ProjectPortfolio>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: 'name'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<ProjectPortfolio> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  ProjectPortfolioListState copyWith({
    List<ProjectPortfolio>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) =>
      ProjectPortfolioListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure, cachedAt];
}

final NotifierProvider<ProjectPortfolioListController, ProjectPortfolioListState>
    projectPortfolioListControllerProvider =
    NotifierProvider<ProjectPortfolioListController, ProjectPortfolioListState>(
  ProjectPortfolioListController.new,
);

class ProjectPortfolioListController extends Notifier<ProjectPortfolioListState> {
  Timer? _searchDebounce;

  @override
  ProjectPortfolioListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ProjectPortfolioListState();
  }

  ListProjectPortfoliosUseCase get _listUseCase =>
      ListProjectPortfoliosUseCase(ref.read(projectsRepositoryProvider));

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

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(query: state.query.copyWith(filters: filters, page: 1));
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteProjectPortfolioUseCase(
      ref.read(projectsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<ProjectPortfolio>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveProjectPortfolioUseCase(
      ref.read(projectsRepositoryProvider))(
      SaveProjectPortfolioParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ProjectPortfolio, String> projectPortfolioDetailProvider =
    FutureProvider.family<ProjectPortfolio, String>((Ref ref, String id) async {
  final result = await GetProjectPortfolioUseCase(
    ref.watch(projectsRepositoryProvider))(id);
  return result.fold((f) => throw f, (p) => p);
});