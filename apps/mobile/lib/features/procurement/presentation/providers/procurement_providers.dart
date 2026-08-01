import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/procurement_remote_data_source.dart';
import '../../data/repositories/procurement_repository_impl.dart';
import '../../domain/entities/procurement.dart';
import '../../domain/repositories/procurement_repository.dart';
import '../../domain/usecases/procurement_usecases.dart';

final Provider<ProcurementRemoteDataSource> procurementRemoteDataSourceProvider =
    Provider<ProcurementRemoteDataSource>(
  (Ref ref) => ProcurementRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<ProcurementRepository> procurementRepositoryProvider =
    Provider<ProcurementRepository>(
  (Ref ref) => ProcurementRepositoryImpl(
    remote: ref.watch(procurementRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class PurchaseOrderListState extends Equatable {
  const PurchaseOrderListState({
    this.items = const <PurchaseOrder>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<PurchaseOrder> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  PurchaseOrderListState copyWith({
    List<PurchaseOrder>? items,
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
      PurchaseOrderListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
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

final NotifierProvider<PurchaseOrderListController, PurchaseOrderListState>
    purchaseOrderListControllerProvider =
    NotifierProvider<PurchaseOrderListController, PurchaseOrderListState>(
  PurchaseOrderListController.new,
);

class PurchaseOrderListController extends Notifier<PurchaseOrderListState> {
  Timer? _searchDebounce;

  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async {
    final result = await SavePurchaseOrderUseCase(
      ref.read(procurementRepositoryProvider),
    )(SavePurchaseOrderParams(payload: data, id: id));
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  @override
  PurchaseOrderListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const PurchaseOrderListState();
  }

  ListPurchaseOrdersUseCase get _listUseCase =>
      ListPurchaseOrdersUseCase(ref.read(procurementRepositoryProvider));

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
    final result = await DeletePurchaseOrderUseCase(
      ref.read(procurementRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<PurchaseOrder, String> purchaseOrderDetailProvider =
    FutureProvider.family<PurchaseOrder, String>((Ref ref, String id) async {
  final result = await GetPurchaseOrderUseCase(
    ref.watch(procurementRepositoryProvider),)(id);
  return result.fold((f) => throw f, (po) => po);
});

class VendorListState extends Equatable {
  const VendorListState({
    this.items = const <Vendor>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Vendor> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  VendorListState copyWith({
    List<Vendor>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      VendorListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<VendorListController, VendorListState>
    vendorListControllerProvider =
    NotifierProvider<VendorListController, VendorListState>(
  VendorListController.new,
);

class VendorListController extends Notifier<VendorListState> {
  void applySort(String s) {}

  Timer? _searchDebounce;

  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async {
    final result = await SaveVendorUseCase(
      ref.read(procurementRepositoryProvider),
    )(SaveVendorParams(payload: data, id: id));
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  @override
  VendorListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const VendorListState();
  }

  ListVendorsUseCase get _listUseCase =>
      ListVendorsUseCase(ref.read(procurementRepositoryProvider));

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
    final result = await DeleteVendorUseCase(
      ref.read(procurementRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Vendor, String> vendorDetailProvider =
    FutureProvider.family<Vendor, String>((Ref ref, String id) async {
  final result = await GetVendorUseCase(
    ref.watch(procurementRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

final NotifierProvider<PurchaseReceiptListController, PurchaseReceiptListState> purchaseReceiptListControllerProvider = NotifierProvider<PurchaseReceiptListController, PurchaseReceiptListState>(PurchaseReceiptListController.new);

class PurchaseReceiptListState extends Equatable {
  const PurchaseReceiptListState({
    this.items = const <PurchaseReceipt>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<PurchaseReceipt> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  PurchaseReceiptListState copyWith({
    List<PurchaseReceipt>? items,
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
      PurchaseReceiptListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => [
        items,
        meta,
        query,
        isLoading,
        isLoadingMore,
        failure,
        loadMoreFailure,
        cachedAt,
      ];
}

class PurchaseReceiptListController extends Notifier<PurchaseReceiptListState> {
  Timer? _searchDebounce;

  @override
  PurchaseReceiptListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const PurchaseReceiptListState();
  }

  ListPurchaseReceiptsUseCase get _listUseCase =>
      ListPurchaseReceiptsUseCase(ref.read(procurementRepositoryProvider));

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

  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async {
    final result = await SavePurchaseReceiptUseCase(
      ref.read(procurementRepositoryProvider),
    )(SavePurchaseReceiptParams(payload: data, id: id));
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> submit(String id) async => throw UnimplementedError();
  Future<Result<void>> approve(String id) async => throw UnimplementedError();
  Future<Result<void>> post(String id) async => throw UnimplementedError();
}


final NotifierProvider<PurchaseRequisitionListController, PurchaseRequisitionListState> purchaseRequisitionListControllerProvider = NotifierProvider<PurchaseRequisitionListController, PurchaseRequisitionListState>(PurchaseRequisitionListController.new);

class PurchaseRequisitionListState extends Equatable {
  const PurchaseRequisitionListState({
    this.items = const <PurchaseRequisition>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<PurchaseRequisition> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  PurchaseRequisitionListState copyWith({
    List<PurchaseRequisition>? items,
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
      PurchaseRequisitionListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => [
        items,
        meta,
        query,
        isLoading,
        isLoadingMore,
        failure,
        loadMoreFailure,
        cachedAt,
      ];
}

class PurchaseRequisitionListController extends Notifier<PurchaseRequisitionListState> {
  Timer? _searchDebounce;

  @override
  PurchaseRequisitionListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const PurchaseRequisitionListState();
  }

  ListPurchaseRequisitionsUseCase get _listUseCase =>
      ListPurchaseRequisitionsUseCase(ref.read(procurementRepositoryProvider));

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

  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async {
    final result = await SavePurchaseRequisitionUseCase(
      ref.read(procurementRepositoryProvider),
    )(SavePurchaseRequisitionParams(payload: data, id: id));
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  Future<Result<void>> approve(String id) async {
    final result = await ApprovePurchaseRequisitionUseCase(
      ref.read(procurementRepositoryProvider),
    )(id);
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> submit(String id) async => throw UnimplementedError();
  Future<Result<void>> post(String id) async => throw UnimplementedError();
}


final NotifierProvider<RFQListController, RFQListState> rfqListControllerProvider = NotifierProvider<RFQListController, RFQListState>(RFQListController.new);

class RFQListState extends Equatable {
  const RFQListState({
    this.items = const <RFQ>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<RFQ> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  RFQListState copyWith({
    List<RFQ>? items,
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
      RFQListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => [
        items,
        meta,
        query,
        isLoading,
        isLoadingMore,
        failure,
        loadMoreFailure,
        cachedAt,
      ];
}

class RFQListController extends Notifier<RFQListState> {
  Timer? _searchDebounce;

  @override
  RFQListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const RFQListState();
  }

  ListRFQsUseCase get _listUseCase =>
      ListRFQsUseCase(ref.read(procurementRepositoryProvider));

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

  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async {
    final result = await SaveRFQUseCase(
      ref.read(procurementRepositoryProvider),
    )(SaveRFQParams(payload: data, id: id));
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  Future<Result<void>> submit(String id) async {
    final result = await SubmitRFQUseCase(
      ref.read(procurementRepositoryProvider),
    )(id);
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> approve(String id) async => throw UnimplementedError();
  Future<Result<void>> post(String id) async => throw UnimplementedError();
}


final NotifierProvider<SupplierContractListController, SupplierContractListState> supplierContractListControllerProvider = NotifierProvider<SupplierContractListController, SupplierContractListState>(SupplierContractListController.new);

class SupplierContractListState extends Equatable {
  const SupplierContractListState({
    this.items = const <SupplierContract>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<SupplierContract> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  SupplierContractListState copyWith({
    List<SupplierContract>? items,
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
      SupplierContractListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => [
        items,
        meta,
        query,
        isLoading,
        isLoadingMore,
        failure,
        loadMoreFailure,
        cachedAt,
      ];
}

class SupplierContractListController extends Notifier<SupplierContractListState> {
  Timer? _searchDebounce;

  @override
  SupplierContractListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const SupplierContractListState();
  }

  ListSupplierContractsUseCase get _listUseCase =>
      ListSupplierContractsUseCase(ref.read(procurementRepositoryProvider));

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

  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async {
    final result = await SaveSupplierContractUseCase(
      ref.read(procurementRepositoryProvider),
    )(SaveSupplierContractParams(payload: data, id: id));
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteSupplierContractUseCase(
      ref.read(procurementRepositoryProvider),
    )(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> submit(String id) async => throw UnimplementedError();
  Future<Result<void>> approve(String id) async => throw UnimplementedError();
  Future<Result<void>> post(String id) async => throw UnimplementedError();
}


final NotifierProvider<SupplierQuotationListController, SupplierQuotationListState> supplierQuotationListControllerProvider = NotifierProvider<SupplierQuotationListController, SupplierQuotationListState>(SupplierQuotationListController.new);

class SupplierQuotationListState extends Equatable {
  const SupplierQuotationListState({
    this.items = const <SupplierQuotation>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<SupplierQuotation> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  SupplierQuotationListState copyWith({
    List<SupplierQuotation>? items,
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
      SupplierQuotationListState(
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
        cachedAt: clearCachedAt ? null : (cachedAt ?? this.cachedAt),
      );

  @override
  List<Object?> get props => [
        items,
        meta,
        query,
        isLoading,
        isLoadingMore,
        failure,
        loadMoreFailure,
        cachedAt,
      ];
}

class SupplierQuotationListController extends Notifier<SupplierQuotationListState> {
  Timer? _searchDebounce;

  @override
  SupplierQuotationListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const SupplierQuotationListState();
  }

  ListSupplierQuotationsUseCase get _listUseCase =>
      ListSupplierQuotationsUseCase(ref.read(procurementRepositoryProvider));

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

  Future<Result<void>> save(Map<String, dynamic> data, {String? id}) async {
    final result = await SaveSupplierQuotationUseCase(
      ref.read(procurementRepositoryProvider),
    )(SaveSupplierQuotationParams(payload: data, id: id));
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  Future<Result<void>> approve(String id) async {
    final result = await ApproveSupplierQuotationUseCase(
      ref.read(procurementRepositoryProvider),
    )(id);
    if (result.isOk) await refresh();
    return result.fold(
      (f) => Result<void>.err(f),
      (_) => const Result<void>.ok(null),
    );
  }

  Future<Result<void>> delete(String id) async => throw UnimplementedError();
  Future<Result<void>> submit(String id) async => throw UnimplementedError();
  Future<Result<void>> post(String id) async => throw UnimplementedError();
}
final FutureProvider<ProcurementDashboardStats> procurementDashboardProvider = FutureProvider((ref) async => throw UnimplementedError());
final FutureProviderFamily<RFQ, String> rfqDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<PurchaseReceipt, String> purchaseReceiptDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<PurchaseRequisition, String> purchaseRequisitionDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<SupplierContract, String> supplierContractDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<SupplierQuotation, String> supplierQuotationDetailProvider = FutureProvider.family((ref, id) async => throw UnimplementedError());
