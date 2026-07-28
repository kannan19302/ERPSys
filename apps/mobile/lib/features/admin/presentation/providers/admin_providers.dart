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
      ref.read(adminRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

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
      ref.read(adminRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

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

final FutureProviderFamily<SystemHealth, void> systemHealthProvider =
    FutureProvider.family<SystemHealth, void>((Ref ref, _) async {
  final result = await GetSystemHealthUseCase(
    ref.watch(adminRepositoryProvider))(const NoParams());
  return result.fold((f) => throw f, (v) => v);
});
