import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/service_management_remote_data_source.dart';
import '../../data/repositories/service_management_repository_impl.dart';
import '../../domain/entities/service_management.dart';
import '../../domain/repositories/service_management_repository.dart';
import '../../domain/usecases/service_management_usecases.dart';

final Provider<ServiceManagementRemoteDataSource> serviceManagementRemoteDataSourceProvider =
    Provider<ServiceManagementRemoteDataSource>(
  (Ref ref) => ServiceManagementRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<ServiceManagementRepository> serviceManagementRepositoryProvider =
    Provider<ServiceManagementRepository>(
  (Ref ref) => ServiceManagementRepositoryImpl(
    remote: ref.watch(serviceManagementRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class ServiceCatalogListState extends Equatable {
  const ServiceCatalogListState({
    this.items = const <ServiceCatalog>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ServiceCatalog> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ServiceCatalogListState copyWith({
    List<ServiceCatalog>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ServiceCatalogListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ServiceCatalogListController, ServiceCatalogListState>
    serviceCatalogListControllerProvider =
    NotifierProvider<ServiceCatalogListController, ServiceCatalogListState>(
  ServiceCatalogListController.new,
);

class ServiceCatalogListController extends Notifier<ServiceCatalogListState> {
  Timer? _searchDebounce;

  @override
  ServiceCatalogListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ServiceCatalogListState();
  }

  ListServiceCatalogsUseCase get _listUseCase =>
      ListServiceCatalogsUseCase(ref.read(serviceManagementRepositoryProvider));

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

  Future<Result<ServiceCatalog>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveServiceCatalogUseCase(ref.read(serviceManagementRepositoryProvider))(
      SaveServiceCatalogParams(payload: payload, id: id),);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteServiceCatalogUseCase(
      ref.read(serviceManagementRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

class ServiceRequestListState extends Equatable {
  const ServiceRequestListState({
    this.items = const <ServiceRequest>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ServiceRequest> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ServiceRequestListState copyWith({
    List<ServiceRequest>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ServiceRequestListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ServiceRequestListController, ServiceRequestListState>
    serviceRequestListControllerProvider =
    NotifierProvider<ServiceRequestListController, ServiceRequestListState>(
  ServiceRequestListController.new,
);

class ServiceRequestListController extends Notifier<ServiceRequestListState> {
  Timer? _searchDebounce;

  @override
  ServiceRequestListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ServiceRequestListState();
  }

  ListServiceRequestsUseCase get _listUseCase =>
      ListServiceRequestsUseCase(ref.read(serviceManagementRepositoryProvider));

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

  Future<Result<ServiceRequest>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveServiceRequestUseCase(ref.read(serviceManagementRepositoryProvider))(
      SaveServiceRequestParams(payload: payload, id: id),);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteServiceRequestUseCase(ref.read(serviceManagementRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

class ServiceContractListState extends Equatable {
  const ServiceContractListState({
    this.items = const <ServiceContract>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ServiceContract> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ServiceContractListState copyWith({
    List<ServiceContract>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ServiceContractListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ServiceContractListController, ServiceContractListState>
    serviceContractListControllerProvider =
    NotifierProvider<ServiceContractListController, ServiceContractListState>(
  ServiceContractListController.new,
);

class ServiceContractListController extends Notifier<ServiceContractListState> {
  Timer? _searchDebounce;

  @override
  ServiceContractListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ServiceContractListState();
  }

  ListServiceContractsUseCase get _listUseCase =>
      ListServiceContractsUseCase(ref.read(serviceManagementRepositoryProvider));

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

  Future<Result<ServiceLevelAgreement>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveServiceSlaUseCase(ref.read(serviceManagementRepositoryProvider))(
      SaveServiceSlaParams(payload: payload, id: id),);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final result = await DeleteServiceSlaUseCase(ref.read(serviceManagementRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ServiceCatalog, String> serviceCatalogDetailProvider =
    FutureProvider.family<ServiceCatalog, String>((Ref ref, String id) async {
  final result = await GetServiceCatalogUseCase(
    ref.watch(serviceManagementRepositoryProvider),)(id);
  return result.fold((f) => throw f, (c) => c);
});

final FutureProviderFamily<ServiceRequest, String> serviceRequestDetailProvider =
    FutureProvider.family<ServiceRequest, String>((Ref ref, String id) async {
  final result = await GetServiceRequestUseCase(
    ref.watch(serviceManagementRepositoryProvider),)(id);
  return result.fold((f) => throw f, (r) => r);
});

final FutureProviderFamily<ServiceLevelAgreement, String> serviceSlaDetailProvider =
    FutureProvider.family<ServiceLevelAgreement, String>((Ref ref, String id) async {
  final result = await GetServiceSlaUseCase(
    ref.watch(serviceManagementRepositoryProvider),)(id);
  return result.fold((f) => throw f, (s) => s);
});

class ServiceSlaListState extends Equatable {
  const ServiceSlaListState({
    this.items = const <ServiceLevelAgreement>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ServiceLevelAgreement> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ServiceSlaListState copyWith({
    List<ServiceLevelAgreement>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ServiceSlaListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ServiceSlaListController, ServiceSlaListState>
    serviceSlaListControllerProvider =
    NotifierProvider<ServiceSlaListController, ServiceSlaListState>(
  ServiceSlaListController.new,
);

class ServiceSlaListController extends Notifier<ServiceSlaListState> {
  Timer? _searchDebounce;

  @override
  ServiceSlaListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ServiceSlaListState();
  }

  ListServiceSlasUseCase get _listUseCase =>
      ListServiceSlasUseCase(ref.read(serviceManagementRepositoryProvider));

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