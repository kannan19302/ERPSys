import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/admin_remote_data_source.dart';
import '../../data/repositories/admin_repository_impl.dart';
import '../../domain/entities/admin.dart';
import '../../domain/repositories/admin_repository.dart';
import '../../domain/usecases/admin_usecases.dart';

final Provider<AdminRemoteDataSource> adminRemoteDataSourceProvider =
    Provider<AdminRemoteDataSource>(
  (Ref ref) => AdminRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<AdminRepository> adminRepositoryProvider =
    Provider<AdminRepository>(
  (Ref ref) => AdminRepositoryImpl(
    remote: ref.watch(adminRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Shared list state ─────────────────────────────────────────────────────

class AdminListState<T extends Equatable> extends Equatable {
  const AdminListState({
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

  AdminListState<T> copyWith({
    List<T>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) =>
      AdminListState<T>(
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

// ── Users ─────────────────────────────────────────────────────────────────

class AdminUserListState extends Equatable {
  const AdminUserListState({
    this.items = const <AdminUser>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AdminUser> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AdminUserListState copyWith({
    List<AdminUser>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AdminUserListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AdminUserListController, AdminUserListState>
    adminUserListControllerProvider =
    NotifierProvider<AdminUserListController, AdminUserListState>(
  AdminUserListController.new,
);

class AdminUserListController extends Notifier<AdminUserListState> {
  Timer? _searchDebounce;

  @override
  AdminUserListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AdminUserListState();
  }

  ListAdminUsersUseCase get _listUseCase =>
      ListAdminUsersUseCase(ref.read(adminRepositoryProvider));

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
    final result = await DeleteAdminUserUseCase(
      ref.read(adminRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<AdminUser>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveAdminUserUseCase(
      ref.read(adminRepositoryProvider),)(
      SaveAdminUserParams(id: id, payload: payload),);
    if (result.isOk) await refresh();
    return result;
  }
}

// ── Roles ─────────────────────────────────────────────────────────────────

class AdminRoleListState extends Equatable {
  const AdminRoleListState({
    this.items = const <AdminRole>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: 'name'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AdminRole> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AdminRoleListState copyWith({
    List<AdminRole>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AdminRoleListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AdminRoleListController, AdminRoleListState>
    adminRoleListControllerProvider =
    NotifierProvider<AdminRoleListController, AdminRoleListState>(
  AdminRoleListController.new,
);

class AdminRoleListController extends Notifier<AdminRoleListState> {
  @override
  AdminRoleListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const AdminRoleListState();
  }

  ListAdminRolesUseCase get _listUseCase =>
      ListAdminRolesUseCase(ref.read(adminRepositoryProvider));

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

  Future<Result<void>> delete(String id) async {
    final result = await DeleteAdminRoleUseCase(
      ref.read(adminRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<AdminRole>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveAdminRoleUseCase(
      ref.read(adminRepositoryProvider),)(
      SaveAdminRoleParams(id: id, payload: payload),);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AdminRole, String> adminRoleDetailProvider =
    FutureProvider.family<AdminRole, String>((Ref ref, String id) async {
  final result = await GetAdminRoleUseCase(
    ref.watch(adminRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

FutureProvider<AdminRole?> getAdminRoleProvider(String id) =>
    FutureProvider<AdminRole?>((ref) async {
      final result = await GetAdminRoleUseCase(
        ref.watch(adminRepositoryProvider),)(id);
      return result.fold((f) => null, (v) => v);
    });

// ── Settings ──────────────────────────────────────────────────────────────

class AdminSettingListState extends Equatable {
  const AdminSettingListState({
    this.items = const <AdminSetting>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: 'key'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AdminSetting> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AdminSettingListState copyWith({
    List<AdminSetting>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AdminSettingListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AdminSettingListController, AdminSettingListState>
    adminSettingListControllerProvider =
    NotifierProvider<AdminSettingListController, AdminSettingListState>(
  AdminSettingListController.new,
);

class AdminSettingListController extends Notifier<AdminSettingListState> {
  Timer? _searchDebounce;

  @override
  AdminSettingListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AdminSettingListState();
  }

  ListAdminSettingsUseCase get _listUseCase =>
      ListAdminSettingsUseCase(ref.read(adminRepositoryProvider));

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

  Future<Result<AdminSetting>> updateValue(String key, Object value) async {
    final result = await UpdateAdminSettingUseCase(
      ref.read(adminRepositoryProvider),)(
      <String, dynamic>{'key': key, 'value': {'value': value}},);
    if (result.isOk) await refresh();
    return result;
  }
}

// ── Audit Logs ────────────────────────────────────────────────────────────

class AuditLogListState extends Equatable {
  const AuditLogListState({
    this.items = const <AdminAuditLog>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AdminAuditLog> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AuditLogListState copyWith({
    List<AdminAuditLog>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AuditLogListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AuditLogListController, AuditLogListState>
    auditLogListControllerProvider =
    NotifierProvider<AuditLogListController, AuditLogListState>(
  AuditLogListController.new,
);

class AuditLogListController extends Notifier<AuditLogListState> {
  @override
  AuditLogListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const AuditLogListState();
  }

  ListAdminAuditLogsUseCase get _listUseCase =>
      ListAdminAuditLogsUseCase(ref.read(adminRepositoryProvider));

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
}

// ── System Health ─────────────────────────────────────────────────────────

final FutureProviderFamily<SystemHealth, void> systemHealthProvider =
    FutureProvider.family<SystemHealth, void>((Ref ref, _) async {
  final result = await GetSystemHealthUseCase(
    ref.watch(adminRepositoryProvider),)(const NoParams());
  return result.fold((f) => throw f, (v) => v);
});

// ── API Keys ──────────────────────────────────────────────────────────────

class AdminApiKeyListState extends Equatable {
  const AdminApiKeyListState({
    this.items = const <AdminApiKey>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AdminApiKey> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AdminApiKeyListState copyWith({
    List<AdminApiKey>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AdminApiKeyListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AdminApiKeyListController, AdminApiKeyListState>
    adminApiKeyListControllerProvider =
    NotifierProvider<AdminApiKeyListController, AdminApiKeyListState>(
  AdminApiKeyListController.new,
);

class AdminApiKeyListController extends Notifier<AdminApiKeyListState> {
  Timer? _searchDebounce;

  @override
  AdminApiKeyListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AdminApiKeyListState();
  }

  ListAdminApiKeysUseCase get _listUseCase =>
      ListAdminApiKeysUseCase(ref.read(adminRepositoryProvider));

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
    final result = await DeleteAdminApiKeyUseCase(
      ref.read(adminRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AdminApiKey, String> adminApiKeyDetailProvider =
    FutureProvider.family<AdminApiKey, String>((Ref ref, String id) async {
  final result = await GetAdminApiKeyUseCase(
    ref.watch(adminRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── Tenants ───────────────────────────────────────────────────────────────

class AdminTenantListState extends Equatable {
  const AdminTenantListState({
    this.items = const <AdminTenant>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AdminTenant> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AdminTenantListState copyWith({
    List<AdminTenant>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AdminTenantListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AdminTenantListController, AdminTenantListState>
    adminTenantListControllerProvider =
    NotifierProvider<AdminTenantListController, AdminTenantListState>(
  AdminTenantListController.new,
);

class AdminTenantListController extends Notifier<AdminTenantListState> {
  Timer? _searchDebounce;

  @override
  AdminTenantListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AdminTenantListState();
  }

  ListAdminTenantsUseCase get _listUseCase =>
      ListAdminTenantsUseCase(ref.read(adminRepositoryProvider));

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

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(query: state.query.copyWith(filters: filters, page: 1));
    refresh();
  }
}

final FutureProviderFamily<AdminTenant, String> adminTenantDetailProvider =
    FutureProvider.family<AdminTenant, String>((Ref ref, String id) async {
  final result = await GetAdminTenantUseCase(
    ref.watch(adminRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

// ── Dashboard ─────────────────────────────────────────────────────────────

class AdminDashboardState extends Equatable {
  const AdminDashboardState({
    this.userCount = 0,
    this.activeSessions = 0,
    this.apiCalls = 0,
    this.storageUsedMb = 0,
    this.health,
    this.recentAuditLogs = const <AdminAuditLog>[],
    this.isLoading = true,
    this.failure,
  });

  final int userCount;
  final int activeSessions;
  final int apiCalls;
  final int storageUsedMb;
  final SystemHealth? health;
  final List<AdminAuditLog> recentAuditLogs;
  final bool isLoading;
  final Failure? failure;

  AdminDashboardState copyWith({
    int? userCount, int? activeSessions, int? apiCalls, int? storageUsedMb,
    SystemHealth? health, List<AdminAuditLog>? recentAuditLogs,
    bool? isLoading, Failure? failure, bool clearFailures = false,
  }) =>
      AdminDashboardState(
        userCount: userCount ?? this.userCount,
        activeSessions: activeSessions ?? this.activeSessions,
        apiCalls: apiCalls ?? this.apiCalls,
        storageUsedMb: storageUsedMb ?? this.storageUsedMb,
        health: health ?? this.health,
        recentAuditLogs: recentAuditLogs ?? this.recentAuditLogs,
        isLoading: isLoading ?? this.isLoading,
        failure: clearFailures ? null : (failure ?? this.failure),
      );

  @override
  List<Object?> get props => <Object?>[
        userCount, activeSessions, apiCalls, storageUsedMb,
        health, recentAuditLogs, isLoading, failure,
      ];
}

final NotifierProvider<AdminDashboardController, AdminDashboardState>
    adminDashboardProvider =
    NotifierProvider<AdminDashboardController, AdminDashboardState>(
  AdminDashboardController.new,
);

class AdminDashboardController extends Notifier<AdminDashboardState> {
  @override
  AdminDashboardState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(load);
    return const AdminDashboardState();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearFailures: true);
    try {
      final healthResult = await GetSystemHealthUseCase(
        ref.read(adminRepositoryProvider),)(const NoParams());
      SystemHealth? health;
      if (healthResult.isOk) health = healthResult.valueOrNull;

      state = state.copyWith(
        health: health,
        userCount: health?.activeUsers ?? 0,
        storageUsedMb: health?.storageUsedMb ?? 0,
        isLoading: false,
        clearFailures: true,
      );
    } on Object catch (e) {
      state = state.copyWith(
        isLoading: false,
        failure: e is Failure ? e : const ServerFailure('Could not load dashboard.'),
      );
    }
  }
}

// ── Auth Session list ─────────────────────────────────────────────────────

class AuthSessionListState extends Equatable {
  const AuthSessionListState({
    this.items = const [],
    this.isLoading = true,
    this.failure,
  });

  final List<dynamic> items;
  final bool isLoading;
  final Failure? failure;

  AuthSessionListState copyWith({
    List<dynamic>? items, bool? isLoading, Failure? failure, bool clearFailures = false,
  }) =>
      AuthSessionListState(
        items: items ?? this.items,
        isLoading: isLoading ?? this.isLoading,
        failure: clearFailures ? null : (failure ?? this.failure),
      );

  @override
  List<Object?> get props => [items, isLoading, failure];
}
