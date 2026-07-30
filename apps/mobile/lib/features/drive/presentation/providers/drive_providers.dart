import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/drive_remote_data_source.dart';
import '../../data/repositories/drive_repository_impl.dart';
import '../../domain/entities/drive.dart';
import '../../domain/repositories/drive_repository.dart';
import '../../domain/usecases/drive_usecases.dart';

final Provider<DriveRemoteDataSource> driveRemoteDataSourceProvider =
    Provider<DriveRemoteDataSource>(
  (Ref ref) => DriveRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<DriveRepository> driveRepositoryProvider =
    Provider<DriveRepository>(
  (Ref ref) => DriveRepositoryImpl(
    remote: ref.watch(driveRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class DriveFileListState extends Equatable {
  const DriveFileListState({
    this.items = const <DriveFile>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<DriveFile> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  DriveFileListState copyWith({
    List<DriveFile>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      DriveFileListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<DriveFileListController, DriveFileListState>
    driveFileListControllerProvider =
    NotifierProvider<DriveFileListController, DriveFileListState>(
  DriveFileListController.new,
);

final FutureProviderFamily<DriveFile, String> driveFileDetailProvider =
    FutureProvider.family<DriveFile, String>((Ref ref, String id) async {
  final result = await GetDriveFileUseCase(
    ref.watch(driveRepositoryProvider))(id);
  return result.fold((f) => throw f, (f) => f);
});

final FutureProviderFamily<DriveFolder, String> driveFolderDetailProvider =
    FutureProvider.family<DriveFolder, String>((Ref ref, String id) async {
  final result = await GetDriveFolderUseCase(
    ref.watch(driveRepositoryProvider))(id);
  return result.fold((f) => throw f, (f) => f);
});

class DriveFileListController extends Notifier<DriveFileListState> {
  Timer? _searchDebounce;

  @override
  DriveFileListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const DriveFileListState();
  }

  ListDriveFilesUseCase get _listUseCase =>
      ListDriveFilesUseCase(ref.read(driveRepositoryProvider));

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
    final result = await DeleteDriveFileUseCase(
      ref.read(driveRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<DriveFile>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveDriveFileUseCase(
      ref.read(driveRepositoryProvider))(SaveDriveFileParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }
}

class DriveFolderListState extends Equatable {
  const DriveFolderListState({
    this.items = const <DriveFolder>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: 'name'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<DriveFolder> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  DriveFolderListState copyWith({
    List<DriveFolder>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      DriveFolderListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<DriveFolderListController, DriveFolderListState>
    driveFolderListControllerProvider =
    NotifierProvider<DriveFolderListController, DriveFolderListState>(
  DriveFolderListController.new,
);

class DriveFolderListController extends Notifier<DriveFolderListState> {
  @override
  DriveFolderListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const DriveFolderListState();
  }

  ListDriveFoldersUseCase get _listUseCase =>
      ListDriveFoldersUseCase(ref.read(driveRepositoryProvider));

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

  Future<Result<DriveFolder>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveDriveFolderUseCase(
      ref.read(driveRepositoryProvider))(SaveDriveFolderParams(payload: payload, id: id));
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteDriveFolderUseCase(
      ref.read(driveRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

class DriveTrashListState extends Equatable {
  const DriveTrashListState({
    this.items = const <DriveTrashItem>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-deletedAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<DriveTrashItem> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  DriveTrashListState copyWith({
    List<DriveTrashItem>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      DriveTrashListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<DriveTrashListController, DriveTrashListState>
    driveTrashListControllerProvider =
    NotifierProvider<DriveTrashListController, DriveTrashListState>(
  DriveTrashListController.new,
);

class DriveTrashListController extends Notifier<DriveTrashListState> {
  @override
  DriveTrashListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const DriveTrashListState();
  }

  ListDriveTrashUseCase get _listUseCase =>
      ListDriveTrashUseCase(ref.read(driveRepositoryProvider));

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
}
