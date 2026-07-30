import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/saas_portal_remote_data_source.dart';
import '../../data/repositories/saas_portal_repository_impl.dart';
import '../../domain/entities/saas_portal.dart';
import '../../domain/repositories/saas_portal_repository.dart';
import '../../domain/usecases/saas_portal_usecases.dart';

final Provider<SaasPortalRemoteDataSource> saasPortalRemoteDataSourceProvider =
    Provider<SaasPortalRemoteDataSource>(
  (Ref ref) => SaasPortalRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<SaasPortalRepository> saasPortalRepositoryProvider =
    Provider<SaasPortalRepository>(
  (Ref ref) => SaasPortalRepositoryImpl(
    remote: ref.watch(saasPortalRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

final FutureProvider<PortalBillingInfo> portalBillingInfoProvider =
    FutureProvider<PortalBillingInfo>((Ref ref) async {
  final result = await GetPortalBillingInfoUseCase(
    ref.watch(saasPortalRepositoryProvider))(const NoParams());
  return result.fold((f) => throw f, (v) => v);
});

class PortalPlanListState extends Equatable {
  const PortalPlanListState({
    this.items = const <PortalPlan>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: 'price'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<PortalPlan> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  PortalPlanListState copyWith({
    List<PortalPlan>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      PortalPlanListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<PortalPlanListController, PortalPlanListState>
    portalPlanListControllerProvider =
    NotifierProvider<PortalPlanListController, PortalPlanListState>(
  PortalPlanListController.new,
);

class PortalPlanListController extends Notifier<PortalPlanListState> {
  @override
  PortalPlanListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const PortalPlanListState();
  }

  ListPortalPlansUseCase get _listUseCase =>
      ListPortalPlansUseCase(ref.read(saasPortalRepositoryProvider));

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

class PortalSupportTicketListState extends Equatable {
  const PortalSupportTicketListState({
    this.items = const <PortalSupportTicket>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<PortalSupportTicket> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  PortalSupportTicketListState copyWith({
    List<PortalSupportTicket>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      PortalSupportTicketListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<PortalSupportTicketListController, PortalSupportTicketListState>
    portalSupportTicketListControllerProvider =
    NotifierProvider<PortalSupportTicketListController, PortalSupportTicketListState>(
  PortalSupportTicketListController.new,
);

class PortalSupportTicketListController extends Notifier<PortalSupportTicketListState> {
  Timer? _searchDebounce;

  @override
  PortalSupportTicketListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const PortalSupportTicketListState();
  }

  ListPortalSupportTicketsUseCase get _listUseCase =>
      ListPortalSupportTicketsUseCase(ref.read(saasPortalRepositoryProvider));

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

  Future<Result<PortalSupportTicket>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SavePortalSupportTicketUseCase(
      ref.read(saasPortalRepositoryProvider))(
      SavePortalSupportTicketParams(id: id, payload: payload));
    if (result.isOk) await refresh();
    return result;
  }
}

