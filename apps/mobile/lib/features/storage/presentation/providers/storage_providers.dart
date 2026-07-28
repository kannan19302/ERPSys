import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/storage_remote_data_source.dart';
import '../../data/repositories/storage_repository_impl.dart';
import '../../domain/entities/storage.dart';
import '../../domain/repositories/storage_repository.dart';
import '../../domain/usecases/storage_usecases.dart';

final Provider<StorageRemoteDataSource> storageRemoteDataSourceProvider =
    Provider<StorageRemoteDataSource>(
  (Ref ref) => StorageRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<StorageRepository> storageRepositoryProvider =
    Provider<StorageRepository>(
  (Ref ref) => StorageRepositoryImpl(
    remote: ref.watch(storageRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class BucketListState extends Equatable {
  const BucketListState({
    this.items = const <StorageBucket>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<StorageBucket> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  BucketListState copyWith({
    List<StorageBucket>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      BucketListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<BucketListController, BucketListState>
    bucketListControllerProvider =
    NotifierProvider<BucketListController, BucketListState>(
  BucketListController.new,
);

class BucketListController extends Notifier<BucketListState> {
  Timer? _searchDebounce;

  @override
  BucketListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const BucketListState();
  }

  ListBucketsUseCase get _listUseCase =>
      ListBucketsUseCase(ref.read(storageRepositoryProvider));

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
    final result = await DeleteBucketUseCase(
      ref.read(storageRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

class FileListState extends Equatable {
  const FileListState({
    this.items = const <StorageFile>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<StorageFile> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  FileListState copyWith({
    List<StorageFile>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      FileListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<FileListController, FileListState>
    fileListControllerProvider =
    NotifierProvider<FileListController, FileListState>(
  FileListController.new,
);

class FileListController extends Notifier<FileListState> {
  Timer? _searchDebounce;

  @override
  FileListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const FileListState();
  }

  ListFilesUseCase get _listUseCase =>
      ListFilesUseCase(ref.read(storageRepositoryProvider));

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
    final result = await DeleteFileUseCase(
      ref.read(storageRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<StorageBucket, String> storageBucketDetailProvider =
    FutureProvider.family<StorageBucket, String>((Ref ref, String id) async {
  final result = await GetBucketUseCase(
    ref.watch(storageRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

final FutureProviderFamily<StorageFile, String> storageFileDetailProvider =
    FutureProvider.family<StorageFile, String>((Ref ref, String id) async {
  final result = await GetFileUseCase(
    ref.watch(storageRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});
