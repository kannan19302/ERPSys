import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/advanced_hr_remote_data_source.dart';
import '../../data/repositories/advanced_hr_repository_impl.dart';
import '../../domain/entities/advanced_hr.dart';
import '../../domain/repositories/advanced_hr_repository.dart';
import '../../domain/usecases/advanced_hr_usecases.dart';

final Provider<AdvancedHrRemoteDataSource> advancedHrRemoteDataSourceProvider =
    Provider<AdvancedHrRemoteDataSource>(
  (Ref ref) => AdvancedHrRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<AdvancedHrRepository> advancedHrRepositoryProvider =
    Provider<AdvancedHrRepository>(
  (Ref ref) => AdvancedHrRepositoryImpl(
    remote: ref.watch(advancedHrRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class CompensationBandListState extends Equatable {
  const CompensationBandListState({
    this.items = const <CompensationBand>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<CompensationBand> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  CompensationBandListState copyWith({
    List<CompensationBand>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) =>
      CompensationBandListState(
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

final NotifierProvider<CompensationBandListController, CompensationBandListState>
    compensationBandListControllerProvider =
    NotifierProvider<CompensationBandListController, CompensationBandListState>(
  CompensationBandListController.new,
);

class CompensationBandListController extends Notifier<CompensationBandListState> {
  Timer? _searchDebounce;

  @override
  CompensationBandListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const CompensationBandListState();
  }

  ListCompensationBandsUseCase get _listUseCase =>
      ListCompensationBandsUseCase(ref.read(advancedHrRepositoryProvider));

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

  Future<Result<void>> delete(String id) async {
    final result = await DeleteCompensationBandUseCase(
      ref.read(advancedHrRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

class LearningPathListState extends Equatable {
  const LearningPathListState({
    this.items = const <LearningPath>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<LearningPath> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  LearningPathListState copyWith({
    List<LearningPath>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      LearningPathListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<LearningPathListController, LearningPathListState>
    learningPathListControllerProvider =
    NotifierProvider<LearningPathListController, LearningPathListState>(
  LearningPathListController.new,
);

class LearningPathListController extends Notifier<LearningPathListState> {
  Timer? _searchDebounce;

  @override
  LearningPathListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const LearningPathListState();
  }

  ListLearningPathsUseCase get _listUseCase =>
      ListLearningPathsUseCase(ref.read(advancedHrRepositoryProvider));

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
}

final FutureProviderFamily<CompensationBand, String> compensationBandDetailProvider =
    FutureProvider.family<CompensationBand, String>((Ref ref, String id) async {
  final result = await GetCompensationBandUseCase(
    ref.watch(advancedHrRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});
