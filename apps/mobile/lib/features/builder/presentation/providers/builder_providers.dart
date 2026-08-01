import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/builder_remote_data_source.dart';
import '../../data/repositories/builder_repository_impl.dart';
import '../../domain/entities/builder.dart';
import '../../domain/repositories/builder_repository.dart';
import '../../domain/usecases/builder_usecases.dart';

final Provider<BuilderRemoteDataSource> builderRemoteDataSourceProvider =
    Provider<BuilderRemoteDataSource>(
  (Ref ref) => BuilderRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<BuilderRepository> builderRepositoryProvider =
    Provider<BuilderRepository>(
  (Ref ref) => BuilderRepositoryImpl(
    remote: ref.watch(builderRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class BuilderFormListState extends Equatable {
  const BuilderFormListState({
    this.items = const <BuilderForm>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<BuilderForm> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  BuilderFormListState copyWith({
    List<BuilderForm>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      BuilderFormListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<BuilderFormListController, BuilderFormListState>
    builderFormListControllerProvider =
    NotifierProvider<BuilderFormListController, BuilderFormListState>(
  BuilderFormListController.new,
);

class BuilderFormListController extends Notifier<BuilderFormListState> {
  Timer? _searchDebounce;

  @override
  BuilderFormListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const BuilderFormListState();
  }

  ListBuilderFormsUseCase get _listUseCase =>
      ListBuilderFormsUseCase(ref.read(builderRepositoryProvider));

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

  void applySort(String sort) {
    state = state.copyWith(query: state.query.copyWith(sort: sort, page: 1));
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteBuilderFormUseCase(
      ref.read(builderRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<BuilderForm>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveBuilderFormUseCase(
      ref.read(builderRepositoryProvider),)(
      SaveBuilderFormParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<BuilderForm, String> builderFormDetailProvider =
    FutureProvider.family<BuilderForm, String>((Ref ref, String id) async {
  final result = await GetBuilderFormUseCase(
    ref.watch(builderRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

class BuilderPageListState extends Equatable {
  const BuilderPageListState({
    this.items = const <BuilderPage>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<BuilderPage> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  BuilderPageListState copyWith({
    List<BuilderPage>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      BuilderPageListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<BuilderPageListController, BuilderPageListState>
    builderPageListControllerProvider =
    NotifierProvider<BuilderPageListController, BuilderPageListState>(
  BuilderPageListController.new,
);

class BuilderPageListController extends Notifier<BuilderPageListState> {
  Timer? _searchDebounce;

  @override
  BuilderPageListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const BuilderPageListState();
  }

  ListBuilderPagesUseCase get _listUseCase =>
      ListBuilderPagesUseCase(ref.read(builderRepositoryProvider));

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
    final result = await DeleteBuilderPageUseCase(
      ref.read(builderRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<BuilderPage>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveBuilderPageUseCase(
      ref.read(builderRepositoryProvider),)(
      SaveBuilderPageParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<BuilderPage, String> builderPageDetailProvider =
    FutureProvider.family<BuilderPage, String>((Ref ref, String id) async {
  final result = await GetBuilderPageUseCase(
    ref.watch(builderRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

class BuilderWorkflowListState extends Equatable {
  const BuilderWorkflowListState({
    this.items = const <BuilderWorkflow>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<BuilderWorkflow> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  BuilderWorkflowListState copyWith({
    List<BuilderWorkflow>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      BuilderWorkflowListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<BuilderWorkflowListController, BuilderWorkflowListState>
    builderWorkflowListControllerProvider =
    NotifierProvider<BuilderWorkflowListController, BuilderWorkflowListState>(
  BuilderWorkflowListController.new,
);

class BuilderWorkflowListController extends Notifier<BuilderWorkflowListState> {
  Timer? _searchDebounce;

  @override
  BuilderWorkflowListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const BuilderWorkflowListState();
  }

  ListBuilderWorkflowsUseCase get _listUseCase =>
      ListBuilderWorkflowsUseCase(ref.read(builderRepositoryProvider));

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
    final result = await DeleteBuilderWorkflowUseCase(
      ref.read(builderRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

class BuilderTemplateListState extends Equatable {
  const BuilderTemplateListState({
    this.items = const <BuilderTemplate>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<BuilderTemplate> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  BuilderTemplateListState copyWith({
    List<BuilderTemplate>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      BuilderTemplateListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<BuilderTemplateListController, BuilderTemplateListState>
    builderTemplateListControllerProvider =
    NotifierProvider<BuilderTemplateListController, BuilderTemplateListState>(
  BuilderTemplateListController.new,
);

class BuilderTemplateListController extends Notifier<BuilderTemplateListState> {
  Timer? _searchDebounce;

  @override
  BuilderTemplateListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const BuilderTemplateListState();
  }

  ListBuilderTemplatesUseCase get _listUseCase =>
      ListBuilderTemplatesUseCase(ref.read(builderRepositoryProvider));

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
    final result = await DeleteBuilderTemplateUseCase(
      ref.read(builderRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}