import '../../../../core/error/exceptions.dart';
import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/healthcare_remote_data_source.dart';
import '../../data/repositories/healthcare_repository_impl.dart';
import '../../domain/entities/healthcare.dart';
import '../../domain/repositories/healthcare_repository.dart';
import '../../domain/usecases/healthcare_usecases.dart';

final Provider<HealthcareRemoteDataSource> healthcareRemoteDataSourceProvider =
    Provider<HealthcareRemoteDataSource>(
  (Ref ref) => HealthcareRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<HealthcareRepository> healthcareRepositoryProvider =
    Provider<HealthcareRepository>(
  (Ref ref) => HealthcareRepositoryImpl(
    remote: ref.watch(healthcareRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

class PatientListState extends Equatable {
  const PatientListState({
    this.items = const <Patient>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Patient> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  PatientListState copyWith({
    List<Patient>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      PatientListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<PatientListController, PatientListState>
    patientListControllerProvider =
    NotifierProvider<PatientListController, PatientListState>(
  PatientListController.new,
);

class PatientListController extends Notifier<PatientListState> {
  Timer? _searchDebounce;

  @override
  PatientListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const PatientListState();
  }

  ListPatientsUseCase get _listUseCase =>
      ListPatientsUseCase(ref.read(healthcareRepositoryProvider));

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
    final result = await DeletePatientUseCase(
      ref.read(healthcareRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Patient>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SavePatientUseCase(
      ref.read(healthcareRepositoryProvider))(
      SavePatientParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Patient, String> patientDetailProvider =
    FutureProvider.family<Patient, String>((Ref ref, String id) async {
  final result = await GetPatientUseCase(
    ref.watch(healthcareRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

class AppointmentListState extends Equatable {
  const AppointmentListState({
    this.items = const <Appointment>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-appointmentDate'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Appointment> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  AppointmentListState copyWith({
    List<Appointment>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      AppointmentListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<AppointmentListController, AppointmentListState>
    appointmentListControllerProvider =
    NotifierProvider<AppointmentListController, AppointmentListState>(
  AppointmentListController.new,
);

class AppointmentListController extends Notifier<AppointmentListState> {
  Timer? _searchDebounce;

  @override
  AppointmentListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const AppointmentListState();
  }

  ListAppointmentsUseCase get _listUseCase =>
      ListAppointmentsUseCase(ref.read(healthcareRepositoryProvider));

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
    final result = await DeleteAppointmentUseCase(
      ref.read(healthcareRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Appointment>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SaveAppointmentUseCase(
      ref.read(healthcareRepositoryProvider))(
      SaveAppointmentParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Appointment, String> appointmentDetailProvider =
    FutureProvider.family<Appointment, String>((Ref ref, String id) async {
  final result = await GetAppointmentUseCase(
    ref.watch(healthcareRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

Future<Result<void>> _saveAppointmentLogic(
    Ref ref, Map<String, dynamic> payload, String? id) async {
  final result = await SaveAppointmentUseCase(
    ref.read(healthcareRepositoryProvider))(
    SaveAppointmentParams(id: id, payload: payload),
  );
  return result;
}

final FutureProviderFamily<Prescription, String> prescriptionDetailProvider =
    FutureProvider.family<Prescription, String>((Ref ref, String id) async {
  final result = await GetPrescriptionUseCase(
    ref.watch(healthcareRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

class PrescriptionListState extends Equatable {
  const PrescriptionListState({
    this.items = const <Prescription>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-prescriptionDate'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Prescription> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  PrescriptionListState copyWith({
    List<Prescription>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      PrescriptionListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<PrescriptionListController, PrescriptionListState>
    prescriptionListControllerProvider =
    NotifierProvider<PrescriptionListController, PrescriptionListState>(
  PrescriptionListController.new,
);

class PrescriptionListController extends Notifier<PrescriptionListState> {
  Timer? _searchDebounce;

  @override
  PrescriptionListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const PrescriptionListState();
  }

  ListPrescriptionsUseCase get _listUseCase =>
      ListPrescriptionsUseCase(ref.read(healthcareRepositoryProvider));

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

  Future<Result<Prescription>> save(Map<String, dynamic> payload, {String? id}) async {
    final result = await SavePrescriptionUseCase(
      ref.read(healthcareRepositoryProvider))(
      SavePrescriptionParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<LabOrder, String> labOrderDetailProvider =
    FutureProvider.family<LabOrder, String>((Ref ref, String id) async {
  final result = await GetLabOrderUseCase(
    ref.watch(healthcareRepositoryProvider))(id);
  return result.fold((f) => throw f, (v) => v);
});

class LabOrderListState extends Equatable {
  const LabOrderListState({
    this.items = const <LabOrder>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<LabOrder> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  LabOrderListState copyWith({
    List<LabOrder>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      LabOrderListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure];
}

final NotifierProvider<LabOrderListController, LabOrderListState>
    labOrderListControllerProvider =
    NotifierProvider<LabOrderListController, LabOrderListState>(
  LabOrderListController.new,
);

class LabOrderListController extends Notifier<LabOrderListState> {
  Timer? _searchDebounce;

  @override
  LabOrderListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const LabOrderListState();
  }

  ListLabOrdersUseCase get _listUseCase =>
      ListLabOrdersUseCase(ref.read(healthcareRepositoryProvider));

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

  Future<Result<LabOrder>> save(Map<String, dynamic> payload) async {
    final result = await SaveLabOrderUseCase(
      ref.read(healthcareRepositoryProvider))(
      SaveLabOrderParams(id: null, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}
