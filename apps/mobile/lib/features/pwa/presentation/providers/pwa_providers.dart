import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/pwa_remote_data_source.dart';
import '../../data/repositories/pwa_repository_impl.dart';
import '../../domain/entities/pwa.dart';
import '../../domain/repositories/pwa_repository.dart';
import '../../domain/usecases/pwa_usecases.dart';

final Provider<PwaRemoteDataSource> pwaRemoteDataSourceProvider =
    Provider<PwaRemoteDataSource>(
  (Ref ref) => PwaRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<PwaRepository> pwaRepositoryProvider =
    Provider<PwaRepository>(
  (Ref ref) => PwaRepositoryImpl(
    remote: ref.watch(pwaRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class PushSubscriptionListState extends Equatable {
  const PushSubscriptionListState({
    this.items = const <PwaPushSubscription>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<PwaPushSubscription> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  PushSubscriptionListState copyWith({
    List<PwaPushSubscription>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      PushSubscriptionListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<PushSubscriptionListController, PushSubscriptionListState>
    pushSubscriptionListControllerProvider =
    NotifierProvider<PushSubscriptionListController, PushSubscriptionListState>(
  PushSubscriptionListController.new,
);

class PushSubscriptionListController extends Notifier<PushSubscriptionListState> {
  @override
  PushSubscriptionListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const PushSubscriptionListState();
  }

  ListPushSubscriptionsUseCase get _listUseCase =>
      ListPushSubscriptionsUseCase(ref.read(pwaRepositoryProvider));

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
    final result = await DeletePushSubscriptionUseCase(
      ref.read(pwaRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

class OfflineQueueListState extends Equatable {
  const OfflineQueueListState({
    this.items = const <PwaOfflineQueueItem>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<PwaOfflineQueueItem> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  OfflineQueueListState copyWith({
    List<PwaOfflineQueueItem>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      OfflineQueueListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<OfflineQueueListController, OfflineQueueListState>
    offlineQueueListControllerProvider =
    NotifierProvider<OfflineQueueListController, OfflineQueueListState>(
  OfflineQueueListController.new,
);

class OfflineQueueListController extends Notifier<OfflineQueueListState> {
  @override
  OfflineQueueListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const OfflineQueueListState();
  }

  ListOfflineQueueUseCase get _listUseCase =>
      ListOfflineQueueUseCase(ref.read(pwaRepositoryProvider));

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

final FutureProviderFamily<PwaManifestConfig, void> pwaManifestConfigProvider =
    FutureProvider.family<PwaManifestConfig, void>((Ref ref, _) async {
  final result = await GetManifestConfigUseCase(
    ref.watch(pwaRepositoryProvider),)(const NoParams());
  return result.fold((f) => throw f, (v) => v);
});

extension SaveManifest on PushSubscriptionListController { Future<Result<void>> saveManifest(Map<String, dynamic> payload) async => throw UnimplementedError(); }
