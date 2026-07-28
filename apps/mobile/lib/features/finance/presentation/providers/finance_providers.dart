import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/finance_remote_data_source.dart';
import '../../data/repositories/finance_repository_impl.dart';
import '../../domain/entities/finance.dart';
import '../../domain/repositories/finance_repository.dart';
import '../../domain/usecases/finance_usecases.dart';

// ── Wiring ─────────────────────────────────────────────────────────────────

final Provider<FinanceRemoteDataSource> financeRemoteDataSourceProvider =
    Provider<FinanceRemoteDataSource>(
  (Ref ref) => FinanceRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<FinanceRepository> financeRepositoryProvider =
    Provider<FinanceRepository>(
  (Ref ref) => FinanceRepositoryImpl(
    remote: ref.watch(financeRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Shared state ───────────────────────────────────────────────────────────

class FinanceListState<T extends Equatable> extends Equatable {
  const FinanceListState({
    this.items = const <Never>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<T> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  FinanceListState<T> copyWith({
    List<T>? items,
    PaginationMeta? meta,
    ListQuery? query,
    bool? isLoading,
    bool? isLoadingMore,
    Failure? failure,
    Failure? loadMoreFailure,
    DateTime? cachedAt,
    bool clearFailures = false,
    bool clearCachedAt = false,
  }) =>
      FinanceListState<T>(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure:
            clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => <Object?>[
        items,
        meta,
        query.cacheKey,
        isLoading,
        isLoadingMore,
        failure,
        loadMoreFailure,
        cachedAt,
      ];
}

// ── Invoices ────────────────────────────────────────────────────────────────

final NotifierProvider<InvoicesController, FinanceListState<Invoice>>
    invoicesProvider =
    NotifierProvider<InvoicesController, FinanceListState<Invoice>>(
  InvoicesController.new,
);

class InvoicesController extends Notifier<FinanceListState<Invoice>> {
  Timer? _searchDebounce;

  @override
  FinanceListState<Invoice> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const FinanceListState<Invoice>();
  }

  ListInvoicesUseCase get _list =>
      ListInvoicesUseCase(ref.read(financeRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Invoice>>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <Invoice>[],
      ),
      (Cacheable<Paginated<Invoice>> page) => state.copyWith(
        items: page.value.data,
        meta: page.value.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
        cachedAt: page.cachedAt,
        clearCachedAt: !page.isFromCache,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Cacheable<Paginated<Invoice>>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Invoice>> page) => state.copyWith(
        items: <Invoice>[...state.items, ...page.value.data],
        meta: page.value.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(
        query: state.query.copyWith(search: term, page: 1),
      );
      refresh();
    });
  }

  void applySort(String sort) {
    state = state.copyWith(query: state.query.copyWith(sort: sort, page: 1));
    refresh();
  }

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(
      query: state.query.copyWith(filters: filters, page: 1),
    );
    refresh();
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteInvoiceUseCase(ref.read(financeRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Invoice>> submit(String id) async {
    final Result<Invoice> result =
        await SubmitInvoiceUseCase(ref.read(financeRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Invoice>> cancel(String id) async {
    final Result<Invoice> result =
        await CancelInvoiceUseCase(ref.read(financeRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Invoice, String> invoiceDetailProvider =
    FutureProvider.family<Invoice, String>((Ref ref, String id) async {
  final Result<Invoice> result =
      await GetInvoiceUseCase(ref.watch(financeRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Invoice i) => i,
  );
});

// ── Payments ────────────────────────────────────────────────────────────────

final NotifierProvider<PaymentsController, FinanceListState<Payment>>
    paymentsProvider =
    NotifierProvider<PaymentsController, FinanceListState<Payment>>(
  PaymentsController.new,
);

class PaymentsController extends Notifier<FinanceListState<Payment>> {
  Timer? _searchDebounce;

  @override
  FinanceListState<Payment> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const FinanceListState<Payment>();
  }

  ListPaymentsUseCase get _list =>
      ListPaymentsUseCase(ref.read(financeRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Payment>>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <Payment>[],
      ),
      (Cacheable<Paginated<Payment>> page) => state.copyWith(
        items: page.value.data,
        meta: page.value.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
        cachedAt: page.cachedAt,
        clearCachedAt: !page.isFromCache,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Cacheable<Paginated<Payment>>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Payment>> page) => state.copyWith(
        items: <Payment>[...state.items, ...page.value.data],
        meta: page.value.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

  void search(String term) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      state = state.copyWith(
        query: state.query.copyWith(search: term, page: 1),
      );
      refresh();
    });
  }
}

// ── Credit Notes ────────────────────────────────────────────────────────────

final FutureProvider<Paginated<CreditNote>> creditNotesProvider =
    FutureProvider<Paginated<CreditNote>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<Paginated<CreditNote>> result =
      await ListCreditNotesUseCase(ref.watch(financeRepositoryProvider))(
    const ListQuery(limit: 50, sort: '-createdAt'),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (Paginated<CreditNote> page) => page,
  );
});

// ── Budgets ─────────────────────────────────────────────────────────────────

final FutureProvider<Paginated<Budget>> budgetsProvider =
    FutureProvider<Paginated<Budget>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<Paginated<Budget>> result =
      await ListBudgetsUseCase(ref.watch(financeRepositoryProvider))(
    const ListQuery(limit: 50, sort: '-createdAt'),
  );
  return result.fold(
    (Failure failure) => throw failure,
    (Paginated<Budget> page) => page,
  );
});

// ── Reports ─────────────────────────────────────────────────────────────────

final FutureProvider<Map<String, dynamic>> arAgingProvider =
    FutureProvider<Map<String, dynamic>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<Map<String, dynamic>> result =
      await ref.read(financeRepositoryProvider).getArAgingReport();
  return result.fold(
    (Failure failure) => throw failure,
    (Map<String, dynamic> data) => data,
  );
});

final FutureProvider<Map<String, dynamic>> pnlProvider =
    FutureProvider<Map<String, dynamic>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<Map<String, dynamic>> result =
      await ref.read(financeRepositoryProvider).getPnlReport();
  return result.fold(
    (Failure failure) => throw failure,
    (Map<String, dynamic> data) => data,
  );
});

final FutureProvider<Map<String, dynamic>> balanceSheetProvider =
    FutureProvider<Map<String, dynamic>>((Ref ref) async {
  ref.watch(activeTenantIdProvider);
  final Result<Map<String, dynamic>> result =
      await ref.read(financeRepositoryProvider).getBalanceSheet();
  return result.fold(
    (Failure failure) => throw failure,
    (Map<String, dynamic> data) => data,
  );
});
