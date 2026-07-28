import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/hr_remote_data_source.dart';
import '../../data/repositories/hr_repository_impl.dart';
import '../../domain/entities/hr.dart';
import '../../domain/repositories/hr_repository.dart';
import '../../domain/usecases/hr_usecases.dart';

// ── Wiring ─────────────────────────────────────────────────────────────────

final Provider<HrRemoteDataSource> hrRemoteDataSourceProvider =
    Provider<HrRemoteDataSource>(
  (Ref ref) => HrRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<HrRepository> hrRepositoryProvider = Provider<HrRepository>(
  (Ref ref) => HrRepositoryImpl(
    remote: ref.watch(hrRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Dashboard ──────────────────────────────────────────────────────────────

final FutureProvider<HrDashboardStats> hrDashboardProvider =
    FutureProvider<HrDashboardStats>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<HrDashboardStats> result =
      await GetHrDashboardUseCase(ref.watch(hrRepositoryProvider))(
    const NoParams(),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (HrDashboardStats stats) => stats,
  );
});

// ── Departments ────────────────────────────────────────────────────────────

final FutureProvider<List<Department>> departmentsProvider =
    FutureProvider<List<Department>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<Cacheable<Paginated<Department>>> result =
      await ListDepartmentsUseCase(ref.watch(hrRepositoryProvider))(
    const ListQuery(limit: 100),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (Cacheable<Paginated<Department>> page) => page.value.data,
  );
});

// ── Employee detail ────────────────────────────────────────────────────────

final FutureProviderFamily<Employee, String> employeeDetailProvider =
    FutureProvider.family<Employee, String>((Ref ref, String id) async {
  final Result<Employee> result =
      await GetEmployeeUseCase(ref.watch(hrRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Employee employee) => employee,
  );
});

// ── Employee list ──────────────────────────────────────────────────────────

class EmployeeListState extends Equatable {
  const EmployeeListState({
    this.items = const <Employee>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-updatedAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Employee> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  EmployeeListState copyWith({
    List<Employee>? items,
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
      EmployeeListState(
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

final NotifierProvider<EmployeeListController, EmployeeListState>
    employeeListControllerProvider =
    NotifierProvider<EmployeeListController, EmployeeListState>(
  EmployeeListController.new,
);

class EmployeeListController extends Notifier<EmployeeListState> {
  Timer? _searchDebounce;

  @override
  EmployeeListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const EmployeeListState();
  }

  ListEmployeesUseCase get _listEmployees =>
      ListEmployeesUseCase(ref.read(hrRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Employee>>> result =
        await _listEmployees(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false,
        failure: failure,
        items: const <Employee>[],
      ),
      (Cacheable<Paginated<Employee>> page) => state.copyWith(
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
    final Result<Cacheable<Paginated<Employee>>> result =
        await _listEmployees(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Employee>> page) => state.copyWith(
        items: <Employee>[...state.items, ...page.value.data],
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

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(
      query: state.query.copyWith(filters: filters, page: 1),
    );
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteEmployeeUseCase(ref.read(hrRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

// ── Leave requests ─────────────────────────────────────────────────────────

class LeaveRequestListState extends Equatable {
  const LeaveRequestListState({
    this.items = const <LeaveRequest>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.statusFilter,
    this.cachedAt,
  });

  final List<LeaveRequest> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final String? statusFilter;
  final DateTime? cachedAt;

  LeaveRequestListState copyWith({
    List<LeaveRequest>? items,
    PaginationMeta? meta,
    ListQuery? query,
    bool? isLoading,
    bool? isLoadingMore,
    Failure? failure,
    Failure? loadMoreFailure,
    String? statusFilter,
    DateTime? cachedAt,
    bool clearFailures = false,
    bool clearCachedAt = false,
    bool clearStatusFilter = false,
  }) =>
      LeaveRequestListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure:
            clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        statusFilter:
            clearStatusFilter ? null : (statusFilter ?? this.statusFilter),
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
        statusFilter,
        cachedAt,
      ];
}

final NotifierProvider<LeaveRequestListController, LeaveRequestListState>
    leaveRequestListControllerProvider =
    NotifierProvider<LeaveRequestListController, LeaveRequestListState>(
  LeaveRequestListController.new,
);

class LeaveRequestListController extends Notifier<LeaveRequestListState> {
  @override
  LeaveRequestListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const LeaveRequestListState();
  }

  ListLeaveRequestsUseCase get _listLeaveRequests =>
      ListLeaveRequestsUseCase(ref.read(hrRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<LeaveRequest>>> result =
        await _listLeaveRequests(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false,
        failure: failure,
        items: const <LeaveRequest>[],
      ),
      (Cacheable<Paginated<LeaveRequest>> page) => state.copyWith(
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
    final Result<Cacheable<Paginated<LeaveRequest>>> result =
        await _listLeaveRequests(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<LeaveRequest>> page) => state.copyWith(
        items: <LeaveRequest>[...state.items, ...page.value.data],
        meta: page.value.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

  void applyStatusFilter(String? status) {
    final Map<String, String> filters = <String, String>{};
    if (status != null && status.isNotEmpty) {
      filters['status'] = status;
    }
    state = state.copyWith(
      query: state.query.copyWith(filters: filters, page: 1),
      statusFilter: status,
    );
    refresh();
  }

  Future<Result<LeaveRequest>> approve(String id) async {
    final Result<LeaveRequest> result =
        await ApproveLeaveUseCase(ref.read(hrRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<LeaveRequest>> reject(String id) async {
    final Result<LeaveRequest> result =
        await RejectLeaveUseCase(ref.read(hrRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

// ── Timesheets ─────────────────────────────────────────────────────────────

class TimesheetListState extends Equatable {
  const TimesheetListState({
    this.items = const <Timesheet>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
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
    List<Timesheet>? items,
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
      TimesheetListState(
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

final NotifierProvider<TimesheetListController, TimesheetListState>
    timesheetListControllerProvider =
    NotifierProvider<TimesheetListController, TimesheetListState>(
  TimesheetListController.new,
);

class TimesheetListController extends Notifier<TimesheetListState> {
  @override
  TimesheetListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const TimesheetListState();
  }

  ListTimesheetsUseCase get _listTimesheets =>
      ListTimesheetsUseCase(ref.read(hrRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Timesheet>>> result =
        await _listTimesheets(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false,
        failure: failure,
        items: const <Timesheet>[],
      ),
      (Cacheable<Paginated<Timesheet>> page) => state.copyWith(
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
    final Result<Cacheable<Paginated<Timesheet>>> result =
        await _listTimesheets(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Timesheet>> page) => state.copyWith(
        items: <Timesheet>[...state.items, ...page.value.data],
        meta: page.value.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

  Future<Result<Timesheet>> approve(String id) async {
    final Result<Timesheet> result =
        await ApproveTimesheetUseCase(ref.read(hrRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Timesheet>> submit(String id) async {
    final Result<Timesheet> result =
        await SubmitTimesheetUseCase(ref.read(hrRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

// ── Org Chart ──────────────────────────────────────────────────────────────

final FutureProvider<List<OrgChartNode>> orgChartProvider =
    FutureProvider<List<OrgChartNode>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<List<OrgChartNode>> result =
      await GetOrgChartUseCase(ref.watch(hrRepositoryProvider))(
    const NoParams(),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (List<OrgChartNode> nodes) => nodes,
  );
});

// ── Payslips ───────────────────────────────────────────────────────────────

final FutureProvider<Paginated<Payslip>> payslipsProvider =
    FutureProvider<Paginated<Payslip>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<Cacheable<Paginated<Payslip>>> result =
      await ListPayslipsUseCase(ref.watch(hrRepositoryProvider))(
    const ListQuery(),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (Cacheable<Paginated<Payslip>> page) => page.value,
  );
});

// ── Salary Structures ──────────────────────────────────────────────────────

final FutureProvider<Paginated<SalaryStructure>> salaryStructuresProvider =
    FutureProvider<Paginated<SalaryStructure>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<Cacheable<Paginated<SalaryStructure>>> result =
      await ListSalaryStructuresUseCase(ref.watch(hrRepositoryProvider))(
    const ListQuery(),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (Cacheable<Paginated<SalaryStructure>> page) => page.value,
  );
});
