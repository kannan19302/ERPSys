import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/field_service_remote_data_source.dart';
import '../../data/repositories/field_service_repository_impl.dart';
import '../../domain/entities/field_service.dart';
import '../../domain/repositories/field_service_repository.dart';
import '../../domain/usecases/field_service_usecases.dart';

final Provider<FieldServiceRemoteDataSource> fieldServiceRemoteDataSourceProvider =
    Provider<FieldServiceRemoteDataSource>(
  (Ref ref) => FieldServiceRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<FieldServiceRepository> fieldServiceRepositoryProvider =
    Provider<FieldServiceRepository>(
  (Ref ref) => FieldServiceRepositoryImpl(
    remote: ref.watch(fieldServiceRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class ServiceTicketListState extends Equatable {
  const ServiceTicketListState({
    this.items = const <ServiceTicket>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<ServiceTicket> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  ServiceTicketListState copyWith({
    List<ServiceTicket>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      ServiceTicketListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<ServiceTicketListController, ServiceTicketListState>
    serviceTicketListControllerProvider =
    NotifierProvider<ServiceTicketListController, ServiceTicketListState>(
  ServiceTicketListController.new,
);

class ServiceTicketListController extends Notifier<ServiceTicketListState> {
  Timer? _searchDebounce;

  @override
  ServiceTicketListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ServiceTicketListState();
  }

  ListServiceTicketsUseCase get _listUseCase =>
      ListServiceTicketsUseCase(ref.read(fieldServiceRepositoryProvider));

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
    final result = await DeleteServiceTicketUseCase(
      ref.read(fieldServiceRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<ServiceTicket, String> serviceTicketDetailProvider =
    FutureProvider.family<ServiceTicket, String>((Ref ref, String id) async {
  final result = await GetServiceTicketUseCase(
    ref.watch(fieldServiceRepositoryProvider),)(id);
  return result.fold((f) => throw f, (v) => v);
});

class TechnicianListState extends Equatable {
  const TechnicianListState({
    this.items = const <Technician>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Technician> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  TechnicianListState copyWith({
    List<Technician>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      TechnicianListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<TechnicianListController, TechnicianListState>
    technicianListControllerProvider =
    NotifierProvider<TechnicianListController, TechnicianListState>(
  TechnicianListController.new,
);

class TechnicianListController extends Notifier<TechnicianListState> {
  Timer? _searchDebounce;

  @override
  TechnicianListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const TechnicianListState();
  }

  ListTechniciansUseCase get _listUseCase =>
      ListTechniciansUseCase(ref.read(fieldServiceRepositoryProvider));

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
    final result = await DeleteTechnicianUseCase(
      ref.read(fieldServiceRepositoryProvider),)(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Technician, String> technicianDetailProvider = FutureProvider.family<Technician, String>((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<ServiceSchedule, String> serviceScheduleDetailProvider = FutureProvider.family<ServiceSchedule, String>((ref, id) async => throw UnimplementedError());
final FutureProviderFamily<ServiceContract, String> serviceContractDetailProvider = FutureProvider.family<ServiceContract, String>((ref, id) async => throw UnimplementedError());

extension SaveTechnician on TechnicianListController {
  Future<Result<Technician>> save(Map<String, dynamic> payload, {String? id}) async => throw UnimplementedError();
}
extension SaveServiceTicket on ServiceTicketListController {
  Future<Result<ServiceTicket>> save(Map<String, dynamic> payload, {String? id}) async => throw UnimplementedError();
}
extension SaveServiceSchedule on ServiceScheduleListController {
  Future<Result<ServiceSchedule>> save(Map<String, dynamic> payload, {String? id}) async => throw UnimplementedError();
}

final NotifierProvider<ServiceScheduleListController, ServiceScheduleListState>
    serviceScheduleListControllerProvider =
    NotifierProvider<ServiceScheduleListController, ServiceScheduleListState>(
  ServiceScheduleListController.new,
);

class ServiceScheduleListController extends Notifier<ServiceScheduleListState> {
  @override
  ServiceScheduleListState build() => const ServiceScheduleListState();
}

class ServiceScheduleListState extends Equatable {
  const ServiceScheduleListState({this.items = const []});
  final List<ServiceSchedule> items;
  @override
  List<Object?> get props => [items];
}


final NotifierProvider<ServiceContractListController, ServiceContractListState>
    serviceContractListControllerProvider =
    NotifierProvider<ServiceContractListController, ServiceContractListState>(
  ServiceContractListController.new,
);

class ServiceContractListController extends Notifier<ServiceContractListState> {
  @override
  ServiceContractListState build() => const ServiceContractListState();
  Future<Result<ServiceContract>> save(Map<String, dynamic> payload, {String? id}) async => throw UnimplementedError();
}

class ServiceContractListState extends Equatable {
  const ServiceContractListState({this.items = const []});
  final List<ServiceContract> items;
  @override
  List<Object?> get props => [items];
}
