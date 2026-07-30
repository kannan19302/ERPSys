import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/saved_views_remote_data_source.dart';
import '../../data/repositories/saved_views_repository_impl.dart';
import '../../domain/entities/saved_views.dart';
import '../../domain/repositories/saved_views_repository.dart';
import '../../domain/usecases/saved_views_usecases.dart';

final Provider<SavedViewsRemoteDataSource> savedViewsRemoteDataSourceProvider =
    Provider<SavedViewsRemoteDataSource>(
  (Ref ref) => SavedViewsRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<SavedViewsRepository> savedViewsRepositoryProvider =
    Provider<SavedViewsRepository>(
  (Ref ref) => SavedViewsRepositoryImpl(
    remote: ref.watch(savedViewsRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class SavedViewListState extends Equatable {
  const SavedViewListState({
    this.items = const <SavedView>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<SavedView> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  SavedViewListState copyWith({
    List<SavedView>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      SavedViewListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<SavedViewListController, SavedViewListState>
    savedViewListControllerProvider =
    NotifierProvider<SavedViewListController, SavedViewListState>(
  SavedViewListController.new,
);

class SavedViewListController extends Notifier<SavedViewListState> {
  Timer? _searchDebounce;

  @override
  SavedViewListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const SavedViewListState();
  }

  ListSavedViewsUseCase get _listUseCase =>
      ListSavedViewsUseCase(ref.read(savedViewsRepositoryProvider));

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
    final result = await DeleteSavedViewUseCase(
      ref.read(savedViewsRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<SavedView>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveSavedViewUseCase(
      ref.read(savedViewsRepositoryProvider))(
      SaveSavedViewParams(id: id, payload: payload));
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<SavedView, String> savedViewDetailProvider =
    FutureProvider.family<SavedView, String>((Ref ref, String id) async {
  final result = await GetSavedViewUseCase(
    ref.watch(savedViewsRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});
