import '../../../../core/error/exceptions.dart';
import '../../../../core/usecase/result.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/blockchain_remote_data_source.dart';
import '../../data/repositories/blockchain_repository_impl.dart';
import '../../domain/entities/blockchain.dart';
import '../../domain/repositories/blockchain_repository.dart';
import '../../domain/usecases/blockchain_usecases.dart';

final Provider<BlockchainRemoteDataSource> blockchainRemoteDataSourceProvider =
    Provider<BlockchainRemoteDataSource>(
  (Ref ref) => BlockchainRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<BlockchainRepository> blockchainRepositoryProvider =
    Provider<BlockchainRepository>(
  (Ref ref) => BlockchainRepositoryImpl(
    remote: ref.watch(blockchainRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class BlockchainTransactionListState extends Equatable {
  const BlockchainTransactionListState({
    this.items = const <BlockchainTransaction>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<BlockchainTransaction> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  BlockchainTransactionListState copyWith({
    List<BlockchainTransaction>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, DateTime? cachedAt,
    bool clearFailures = false, bool clearCachedAt = false,
  }) =>
      BlockchainTransactionListState(
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

final NotifierProvider<BlockchainTransactionListController, BlockchainTransactionListState>
    blockchainTransactionListControllerProvider =
    NotifierProvider<BlockchainTransactionListController, BlockchainTransactionListState>(
  BlockchainTransactionListController.new,
);

class BlockchainTransactionListController extends Notifier<BlockchainTransactionListState> {
  Timer? _searchDebounce;

  @override
  BlockchainTransactionListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const BlockchainTransactionListState();
  }

  ListBlockchainTransactionsUseCase get _listUseCase =>
      ListBlockchainTransactionsUseCase(ref.read(blockchainRepositoryProvider));

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
}

class BlockchainContractListState extends Equatable {
  const BlockchainContractListState({
    this.items = const <BlockchainContract>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<BlockchainContract> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  BlockchainContractListState copyWith({
    List<BlockchainContract>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      BlockchainContractListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<BlockchainContractListController, BlockchainContractListState>
    blockchainContractListControllerProvider =
    NotifierProvider<BlockchainContractListController, BlockchainContractListState>(
  BlockchainContractListController.new,
);

class BlockchainContractListController extends Notifier<BlockchainContractListState> {
  Timer? _searchDebounce;

  @override
  BlockchainContractListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const BlockchainContractListState();
  }

  ListBlockchainContractsUseCase get _listUseCase =>
      ListBlockchainContractsUseCase(ref.read(blockchainRepositoryProvider));

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

final FutureProviderFamily<BlockchainTransaction, String> blockchainTransactionDetailProvider =
    FutureProvider.family<BlockchainTransaction, String>((Ref ref, String id) async {
  final result = await GetBlockchainTransactionUseCase(
    ref.watch(blockchainRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

final FutureProviderFamily<BlockchainContract, String> blockchainContractDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
extension SaveBlockchainContract on BlockchainContractListController { Future<Result<BlockchainContract>> save(Map<String, dynamic> payload, {String? id}) async => throw UnimplementedError(); }
