import '../../../../core/error/exceptions.dart';
import '../../../../core/usecase/result.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/subscriptions_remote_data_source.dart';
import '../../data/repositories/subscriptions_repository_impl.dart';
import '../../domain/entities/subscriptions.dart';
import '../../domain/repositories/subscriptions_repository.dart';
import '../../domain/usecases/subscriptions_usecases.dart';

final Provider<SubscriptionsRemoteDataSource> subscriptionsRemoteDataSourceProvider =
    Provider<SubscriptionsRemoteDataSource>(
  (Ref ref) => SubscriptionsRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<SubscriptionsRepository> subscriptionsRepositoryProvider =
    Provider<SubscriptionsRepository>(
  (Ref ref) => SubscriptionsRepositoryImpl(
    remote: ref.watch(subscriptionsRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class SubscriptionPlanListState extends Equatable {
  const SubscriptionPlanListState({
    this.items = const <SubscriptionPlan>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: 'sortOrder'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<SubscriptionPlan> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  SubscriptionPlanListState copyWith({
    List<SubscriptionPlan>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      SubscriptionPlanListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<SubscriptionPlanListController, SubscriptionPlanListState>
    subscriptionPlanListControllerProvider =
    NotifierProvider<SubscriptionPlanListController, SubscriptionPlanListState>(
  SubscriptionPlanListController.new,
);

class SubscriptionPlanListController extends Notifier<SubscriptionPlanListState> {
  @override
  SubscriptionPlanListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const SubscriptionPlanListState();
  }

  ListSubscriptionPlansUseCase get _listUseCase =>
      ListSubscriptionPlansUseCase(ref.read(subscriptionsRepositoryProvider));

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

  Future<Result<SubscriptionPlan>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveSubscriptionPlanUseCase(
      ref.read(subscriptionsRepositoryProvider))(
      SaveSubscriptionPlanParams(id: id, payload: payload));
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<ChurnSurveyResponse>> saveChurn(Map<String, dynamic> payload) async {
    final result = await SubmitChurnSurveyUseCase(
      ref.read(subscriptionsRepositoryProvider))(payload);
    return result;
  }
}

final FutureProviderFamily<SubscriptionPlan, String> subscriptionPlanDetailProvider =
    FutureProvider.family<SubscriptionPlan, String>((Ref ref, String id) async {
  final result = await GetSubscriptionPlanUseCase(
    ref.watch(subscriptionsRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

class SubscriptionBillingCycleListState extends Equatable {
  const SubscriptionBillingCycleListState({
    this.items = const <SubscriptionBillingCycle>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-periodStart'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<SubscriptionBillingCycle> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  SubscriptionBillingCycleListState copyWith({
    List<SubscriptionBillingCycle>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      SubscriptionBillingCycleListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<SubscriptionBillingCycleListController, SubscriptionBillingCycleListState>
    subscriptionBillingCycleListControllerProvider =
    NotifierProvider<SubscriptionBillingCycleListController, SubscriptionBillingCycleListState>(
  SubscriptionBillingCycleListController.new,
);

class SubscriptionBillingCycleListController extends Notifier<SubscriptionBillingCycleListState> {
  @override
  SubscriptionBillingCycleListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const SubscriptionBillingCycleListState();
  }

  ListSubscriptionBillingCyclesUseCase get _listUseCase =>
      ListSubscriptionBillingCyclesUseCase(ref.read(subscriptionsRepositoryProvider));

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

  Future<Result<SubscriptionBillingCycle>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveSubscriptionBillingCycleUseCase(
      ref.read(subscriptionsRepositoryProvider))(
      SaveBillingCycleParams(id: id, payload: payload));
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<SubscriptionBillingCycle, String> subscriptionBillingCycleDetailProvider =
    FutureProvider.family<SubscriptionBillingCycle, String>((Ref ref, String id) async {
  final result = await GetSubscriptionBillingCycleUseCase(
    ref.watch(subscriptionsRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

