import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/datasources/crm_remote_data_source.dart';
import '../../data/repositories/crm_repository_impl.dart';
import '../../domain/entities/crm.dart';
import '../../domain/repositories/crm_repository.dart';
import '../../domain/usecases/crm_usecases.dart';

// ── Wiring ─────────────────────────────────────────────────────────────────

final Provider<CrmRemoteDataSource> crmRemoteDataSourceProvider =
    Provider<CrmRemoteDataSource>(
  (Ref ref) => CrmRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<CrmRepository> crmRepositoryProvider = Provider<CrmRepository>(
  (Ref ref) => CrmRepositoryImpl(
    remote: ref.watch(crmRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Shared state ───────────────────────────────────────────────────────────

class CrmListState<T extends Equatable> extends Equatable {
  const CrmListState({
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

  CrmListState<T> copyWith({
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
      CrmListState<T>(
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

// ── Customers ──────────────────────────────────────────────────────────────

final NotifierProvider<CustomersController, CrmListState<Customer>>
    customersProvider =
    NotifierProvider<CustomersController, CrmListState<Customer>>(
  CustomersController.new,
);

class CustomersController extends Notifier<CrmListState<Customer>> {
  Timer? _searchDebounce;

  @override
  CrmListState<Customer> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const CrmListState<Customer>();
  }

  ListCustomersUseCase get _list =>
      ListCustomersUseCase(ref.read(crmRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Customer>>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <Customer>[],
      ),
      (Cacheable<Paginated<Customer>> page) => state.copyWith(
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
    final Result<Cacheable<Paginated<Customer>>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Customer>> page) => state.copyWith(
        items: <Customer>[...state.items, ...page.value.data],
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
        await DeleteCustomerUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Customer>> save(Map<String, dynamic> payload, {String? id}) async {
    final Result<Customer> result =
        await SaveCustomerUseCase(ref.read(crmRepositoryProvider))(
      SaveCustomerParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Customer, String> customerDetailProvider =
    FutureProvider.family<Customer, String>((Ref ref, String id) async {
  final Result<Customer> result =
      await GetCustomerUseCase(ref.watch(crmRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Customer c) => c,
  );
});

// ── Contacts ───────────────────────────────────────────────────────────────

final NotifierProvider<ContactsController, CrmListState<Contact>>
    contactsProvider =
    NotifierProvider<ContactsController, CrmListState<Contact>>(
  ContactsController.new,
);

class ContactsController extends Notifier<CrmListState<Contact>> {
  Timer? _searchDebounce;

  @override
  CrmListState<Contact> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const CrmListState<Contact>();
  }

  ListContactsUseCase get _list =>
      ListContactsUseCase(ref.read(crmRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Contact>>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <Contact>[],
      ),
      (Cacheable<Paginated<Contact>> page) => state.copyWith(
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
    final Result<Cacheable<Paginated<Contact>>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Contact>> page) => state.copyWith(
        items: <Contact>[...state.items, ...page.value.data],
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
        await DeleteContactUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Contact>> save(Map<String, dynamic> payload, {String? id}) async {
    final Result<Contact> result =
        await SaveContactUseCase(ref.read(crmRepositoryProvider))(
      SaveCustomerParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Contact, String> contactDetailProvider =
    FutureProvider.family<Contact, String>((Ref ref, String id) async {
  final Result<Contact> result =
      await GetContactUseCase(ref.watch(crmRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Contact c) => c,
  );
});

// ── Leads ──────────────────────────────────────────────────────────────────

final NotifierProvider<LeadsController, CrmListState<Lead>>
    leadsProvider =
    NotifierProvider<LeadsController, CrmListState<Lead>>(
  LeadsController.new,
);

class LeadsController extends Notifier<CrmListState<Lead>> {
  Timer? _searchDebounce;

  @override
  CrmListState<Lead> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const CrmListState<Lead>();
  }

  ListLeadsUseCase get _list =>
      ListLeadsUseCase(ref.read(crmRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Cacheable<Paginated<Lead>>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <Lead>[],
      ),
      (Cacheable<Paginated<Lead>> page) => state.copyWith(
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
    final Result<Cacheable<Paginated<Lead>>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Cacheable<Paginated<Lead>> page) => state.copyWith(
        items: <Lead>[...state.items, ...page.value.data],
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
        await DeleteLeadUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Lead>> convert(String id) async {
    final Result<Lead> result =
        await ConvertLeadUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Lead>> qualify(String id) async {
    final Result<Lead> result =
        await QualifyLeadUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Lead>> disqualify(String id) async {
    final Result<Lead> result =
        await DisqualifyLeadUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<Lead>> save(Map<String, dynamic> payload, {String? id}) async {
    final Result<Lead> result =
        await SaveLeadUseCase(ref.read(crmRepositoryProvider))(
      SaveCustomerParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Lead, String> leadDetailProvider =
    FutureProvider.family<Lead, String>((Ref ref, String id) async {
  final Result<Lead> result =
      await GetLeadUseCase(ref.watch(crmRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Lead l) => l,
  );
});

// ── Activities ─────────────────────────────────────────────────────────────

final NotifierProvider<ActivitiesController, CrmListState<Activity>>
    activitiesProvider =
    NotifierProvider<ActivitiesController, CrmListState<Activity>>(
  ActivitiesController.new,
);

class ActivitiesController extends Notifier<CrmListState<Activity>> {
  Timer? _searchDebounce;

  @override
  CrmListState<Activity> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const CrmListState<Activity>();
  }

  ListActivitiesUseCase get _list =>
      ListActivitiesUseCase(ref.read(crmRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Paginated<Activity>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <Activity>[],
      ),
      (Paginated<Activity> page) => state.copyWith(
        items: page.data,
        meta: page.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Paginated<Activity>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Paginated<Activity> page) => state.copyWith(
        items: <Activity>[...state.items, ...page.data],
        meta: page.meta,
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

  Future<Result<Activity>> create(Map<String, dynamic> payload) async {
    final Result<Activity> result =
        await CreateActivityUseCase(ref.read(crmRepositoryProvider))(payload);
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteActivityUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<Activity, String> activityDetailProvider =
    FutureProvider.family<Activity, String>((Ref ref, String id) async {
  final Result<Activity> result =
      await GetActivityUseCase(ref.watch(crmRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (Activity a) => a,
  );
});

// ── Email Templates ────────────────────────────────────────────────────────

final NotifierProvider<EmailTemplatesController, CrmListState<EmailTemplate>>
    emailTemplatesProvider =
    NotifierProvider<EmailTemplatesController, CrmListState<EmailTemplate>>(
  EmailTemplatesController.new,
);

class EmailTemplatesController extends Notifier<CrmListState<EmailTemplate>> {
  Timer? _searchDebounce;

  @override
  CrmListState<EmailTemplate> build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const CrmListState<EmailTemplate>();
  }

  ListEmailTemplatesUseCase get _list =>
      ListEmailTemplatesUseCase(ref.read(crmRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Paginated<EmailTemplate>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <EmailTemplate>[],
      ),
      (Paginated<EmailTemplate> page) => state.copyWith(
        items: page.data,
        meta: page.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Paginated<EmailTemplate>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Paginated<EmailTemplate> page) => state.copyWith(
        items: <EmailTemplate>[...state.items, ...page.data],
        meta: page.meta,
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

  void applyFilters(Map<String, String> filters) {
    state = state.copyWith(
      query: state.query.copyWith(filters: filters, page: 1),
    );
    refresh();
  }

  Future<Result<EmailTemplate>> save(Map<String, dynamic> payload, {String? id}) async {
    final Result<EmailTemplate> result =
        await SaveEmailTemplateUseCase(ref.read(crmRepositoryProvider))(
      SaveCustomerParams(id: id, payload: payload),
    );
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteEmailTemplateUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}

final FutureProviderFamily<EmailTemplate, String> emailTemplateDetailProvider =
    FutureProvider.family<EmailTemplate, String>((Ref ref, String id) async {
  final Result<EmailTemplate> result =
      await GetEmailTemplateUseCase(ref.watch(crmRepositoryProvider))(id);
  return result.fold(
    (Failure failure) => throw failure,
    (EmailTemplate t) => t,
  );
});

// ── Lead Sources ───────────────────────────────────────────────────────────

final NotifierProvider<LeadSourcesController, CrmListState<LeadSource>>
    leadSourcesProvider =
    NotifierProvider<LeadSourcesController, CrmListState<LeadSource>>(
  LeadSourcesController.new,
);

class LeadSourcesController extends Notifier<CrmListState<LeadSource>> {
  @override
  CrmListState<LeadSource> build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const CrmListState<LeadSource>();
  }

  ListLeadSourcesUseCase get _list =>
      ListLeadSourcesUseCase(ref.read(crmRepositoryProvider));

  Future<void> refresh() async {
    final ListQuery query = state.query.copyWith(page: 1);
    state = state.copyWith(isLoading: true, clearFailures: true);

    final Result<Paginated<LeadSource>> result = await _list(query);

    state = result.fold(
      (Failure failure) => state.copyWith(
        isLoading: false, failure: failure, items: const <LeadSource>[],
      ),
      (Paginated<LeadSource> page) => state.copyWith(
        items: page.data,
        meta: page.meta,
        query: query,
        isLoading: false,
        clearFailures: true,
      ),
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final ListQuery next = state.query.copyWith(page: state.meta.page + 1);
    final Result<Paginated<LeadSource>> result = await _list(next);

    state = result.fold(
      (Failure failure) =>
          state.copyWith(isLoadingMore: false, loadMoreFailure: failure),
      (Paginated<LeadSource> page) => state.copyWith(
        items: <LeadSource>[...state.items, ...page.data],
        meta: page.meta,
        query: next,
        isLoadingMore: false,
        clearFailures: true,
      ),
    );
  }

  Future<Result<LeadSource>> create(String name) async {
    final Result<LeadSource> result =
        await CreateLeadSourceUseCase(ref.read(crmRepositoryProvider))(
      <String, dynamic>{'name': name},
    );
    if (result.isOk) await refresh();
    return result;
  }

  Future<Result<void>> delete(String id) async {
    final Result<void> result =
        await DeleteLeadSourceUseCase(ref.read(crmRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }
}
