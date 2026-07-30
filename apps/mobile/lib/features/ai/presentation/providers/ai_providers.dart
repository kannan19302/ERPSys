import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/ai_remote_data_source.dart';
import '../../data/repositories/ai_repository_impl.dart';
import '../../domain/entities/ai.dart';
import '../../domain/repositories/ai_repository.dart';
import '../../domain/usecases/ai_usecases.dart';

final Provider<AiRemoteDataSource> aiRemoteDataSourceProvider =
    Provider<AiRemoteDataSource>(
  (Ref ref) => AiRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<AiRepository> aiRepositoryProvider =
    Provider<AiRepository>(
  (Ref ref) => AiRepositoryImpl(
    remote: ref.watch(aiRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class AiModelListState extends Equatable {
  const AiModelListState({
    this.items = const <AiModel>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<AiModel> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  AiModelListState copyWith({
    List<AiModel>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) =>
      AiModelListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure, cachedAt,
      ];
}

final NotifierProvider<AiModelListController, AiModelListState>
    aiModelListControllerProvider =
    NotifierProvider<AiModelListController, AiModelListState>(
  AiModelListController.new,
);

class AiModelListController extends Notifier<AiModelListState> {
  Timer? _searchDebounce;

  @override
  AiModelListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AiModelListState();
  }

  ListAiModelsUseCase get _listUseCase =>
      ListAiModelsUseCase(ref.read(aiRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
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

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(query: state.query.copyWith(filters: filters, page: 1));
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteAiModelUseCase(
      ref.read(aiRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<AiModel>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveAiModelUseCase(
      ref.read(aiRepositoryProvider))(
      SaveAiModelParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AiModel, String> aiModelDetailProvider =
    FutureProvider.family<AiModel, String>((Ref ref, String id) async {
  final result = await GetAiModelUseCase(
    ref.watch(aiRepositoryProvider))(id);
  return result.fold((f) => throw f, (m) => m);
});

class AiPromptListState extends Equatable {
  const AiPromptListState({
    this.items = const <AiPrompt>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AiPrompt> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AiPromptListState copyWith({
    List<AiPrompt>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AiPromptListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AiPromptListController, AiPromptListState>
    aiPromptListControllerProvider =
    NotifierProvider<AiPromptListController, AiPromptListState>(
  AiPromptListController.new,
);

class AiPromptListController extends Notifier<AiPromptListState> {
  Timer? _searchDebounce;

  @override
  AiPromptListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AiPromptListState();
  }

  ListAiPromptsUseCase get _listUseCase =>
      ListAiPromptsUseCase(ref.read(aiRepositoryProvider));

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
    final result = await DeleteAiPromptUseCase(
      ref.read(aiRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<AiPrompt>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveAiPromptUseCase(
      ref.read(aiRepositoryProvider))(
      SaveAiPromptParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AiPrompt, String> aiPromptDetailProvider =
    FutureProvider.family<AiPrompt, String>((Ref ref, String id) async {
  final result = await GetAiPromptUseCase(
    ref.watch(aiRepositoryProvider))(id);
  return result.fold((f) => throw f, (p) => p);
});

class AiTrainingDataListState extends Equatable {
  const AiTrainingDataListState({
    this.items = const <AiTrainingData>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AiTrainingData> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AiTrainingDataListState copyWith({
    List<AiTrainingData>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AiTrainingDataListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AiTrainingDataListController, AiTrainingDataListState>
    aiTrainingDataListControllerProvider =
    NotifierProvider<AiTrainingDataListController, AiTrainingDataListState>(
  AiTrainingDataListController.new,
);

class AiTrainingDataListController extends Notifier<AiTrainingDataListState> {
  Timer? _searchDebounce;

  @override
  AiTrainingDataListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AiTrainingDataListState();
  }

  ListAiTrainingDataUseCase get _listUseCase =>
      ListAiTrainingDataUseCase(ref.read(aiRepositoryProvider));

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
    final result = await DeleteAiTrainingDataUseCase(
      ref.read(aiRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<AiTrainingData>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveAiTrainingDataUseCase(
      ref.read(aiRepositoryProvider))(
      payload,
    );
    if (result.isOk) await refresh();
    return result;
  }
}

class AiPredictionListState extends Equatable {
  const AiPredictionListState({
    this.items = const <AiPrediction>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<AiPrediction> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AiPredictionListState copyWith({
    List<AiPrediction>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AiPredictionListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AiPredictionListController, AiPredictionListState>
    aiPredictionListControllerProvider =
    NotifierProvider<AiPredictionListController, AiPredictionListState>(
  AiPredictionListController.new,
);

class AiPredictionListController extends Notifier<AiPredictionListState> {
  Timer? _searchDebounce;

  @override
  AiPredictionListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AiPredictionListState();
  }

  ListAiPredictionsUseCase get _listUseCase =>
      ListAiPredictionsUseCase(ref.read(aiRepositoryProvider));

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

  void applySort(String sort) {
    state = state.copyWith(query: state.query.copyWith(sort: sort, page: 1));
    refresh();
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(query: state.query.copyWith(search: term, page: 1));
      refresh();
    });
  }

  Future<Result<AiPrediction>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveAiPredictionUseCase(
      ref.read(aiRepositoryProvider))(
      payload,
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<AiPrediction, String> aiPredictionDetailProvider =
    FutureProvider.family<AiPrediction, String>((Ref ref, String id) async {
  final result = await GetAiPredictionUseCase(
    ref.watch(aiRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

final FutureProviderFamily<AiTrainingData, String> aiTrainingDataDetailProvider =
    FutureProvider.family<AiTrainingData, String>((Ref ref, String id) async {
  final result = await GetAiTrainingDataUseCase(
    ref.watch(aiRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});
