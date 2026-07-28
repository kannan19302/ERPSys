import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/localization_remote_data_source.dart';
import '../../data/repositories/localization_repository_impl.dart';
import '../../domain/entities/localization.dart';
import '../../domain/repositories/localization_repository.dart';
import '../../domain/usecases/localization_usecases.dart';

final Provider<LocalizationRemoteDataSource> localizationRemoteDataSourceProvider =
    Provider<LocalizationRemoteDataSource>(
  (Ref ref) => LocalizationRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<LocalizationRepository> localizationRepositoryProvider =
    Provider<LocalizationRepository>(
  (Ref ref) => LocalizationRepositoryImpl(
    remote: ref.watch(localizationRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class TranslationListState extends Equatable {
  const TranslationListState({
    this.items = const <LocalizationTranslation>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<LocalizationTranslation> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  TranslationListState copyWith({
    List<LocalizationTranslation>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      TranslationListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<TranslationListController, TranslationListState>
    translationListControllerProvider =
    NotifierProvider<TranslationListController, TranslationListState>(
  TranslationListController.new,
);

class TranslationListController extends Notifier<TranslationListState> {
  Timer? _searchDebounce;

  @override
  TranslationListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const TranslationListState();
  }

  ListTranslationsUseCase get _listUseCase =>
      ListTranslationsUseCase(ref.read(localizationRepositoryProvider));

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

class LanguageListState extends Equatable {
  const LanguageListState({
    this.items = const <LocalizationLanguage>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: 'name'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<LocalizationLanguage> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  LanguageListState copyWith({
    List<LocalizationLanguage>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      LanguageListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<LanguageListController, LanguageListState>
    languageListControllerProvider =
    NotifierProvider<LanguageListController, LanguageListState>(
  LanguageListController.new,
);

class LanguageListController extends Notifier<LanguageListState> {
  @override
  LanguageListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const LanguageListState();
  }

  ListLanguagesUseCase get _listUseCase =>
      ListLanguagesUseCase(ref.read(localizationRepositoryProvider));

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

final FutureProviderFamily<LocalizationLanguage, String> languageDetailProvider =
    FutureProvider.family<LocalizationLanguage, String>((Ref ref, String id) async {
  throw UnimplementedError('Language detail API not available');
});
