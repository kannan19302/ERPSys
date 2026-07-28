import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/contracts/paginated.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../../notifications/domain/entities/notification.dart';
import '../../../notifications/presentation/providers/notifications_providers.dart';
import '../../data/datasources/communication_remote_data_source.dart';
import '../../data/repositories/communication_repository_impl.dart';
import '../../domain/entities/communication.dart';
import '../../domain/repositories/communication_repository.dart';
import '../../domain/usecases/communication_usecases.dart';

final Provider<CommunicationRemoteDataSource> communicationRemoteDataSourceProvider =
    Provider<CommunicationRemoteDataSource>(
  (Ref ref) => CommunicationRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final Provider<CommunicationRepository> communicationRepositoryProvider =
    Provider<CommunicationRepository>(
  (Ref ref) => CommunicationRepositoryImpl(
    remote: ref.watch(communicationRemoteDataSourceProvider),
    cache: ref.watch(responseCacheProvider),
    tenantId: ref.watch(activeTenantIdProvider),
  ),
);

// ── Channel List ───────────────────────────────────────────────────────────

class ChannelListState extends Equatable {
  const ChannelListState({
    this.items = const <Channel>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
    this.cachedAt,
  });

  final List<Channel> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;
  final DateTime? cachedAt;

  ChannelListState copyWith({
    List<Channel>? items,
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
      ChannelListState(
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

final NotifierProvider<ChannelListController, ChannelListState>
    channelListControllerProvider =
    NotifierProvider<ChannelListController, ChannelListState>(
  ChannelListController.new,
);

class ChannelListController extends Notifier<ChannelListState> {
  Timer? _searchDebounce;

  @override
  ChannelListState build() {
    ref.watch(activeTenantIdProvider);
    ref.onDispose(() => _searchDebounce?.cancel());
    Future<void>.microtask(refresh);
    return const ChannelListState();
  }

  ListChannelsUseCase get _listUseCase =>
      ListChannelsUseCase(ref.read(communicationRepositoryProvider));

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

  Future<Result<void>> deleteChannel(String id) async {
    final result = await DeleteChannelUseCase(
      ref.read(communicationRepositoryProvider))(id);
    if (result.isOk) await refresh();
    return result;
  }

  Future<void> joinChannel(String id) async {
    await JoinChannelUseCase(ref.read(communicationRepositoryProvider))(id);
    await refresh();
  }

  Future<void> leaveChannel(String id) async {
    await LeaveChannelUseCase(ref.read(communicationRepositoryProvider))(id);
    await refresh();
  }
}

// ── Message List ───────────────────────────────────────────────────────────

class MessageListState extends Equatable {
  const MessageListState({
    required this.channelId,
    this.items = const <Message>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-createdAt'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final String channelId;
  final List<Message> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  MessageListState copyWith({
    String? channelId,
    List<Message>? items,
    PaginationMeta? meta,
    ListQuery? query,
    bool? isLoading,
    bool? isLoadingMore,
    Failure? failure,
    Failure? loadMoreFailure,
    bool clearFailures = false,
  }) =>
      MessageListState(
        channelId: channelId ?? this.channelId,
        items: items ?? this.items,
        meta: meta ?? this.meta,
        query: query ?? this.query,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[
        channelId, items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure,
      ];
}

final NotifierProviderFamily<MessageListController, MessageListState, String>
    messageListControllerProvider =
    NotifierProviderFamily<MessageListController, MessageListState, String>(
  MessageListController.new,
);

class MessageListController extends FamilyNotifier<MessageListState, String> {
  @override
  MessageListState build(String arg) {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(() => _load(arg));
    return MessageListState(channelId: arg);
  }

  Future<void> _load(String channelId) async {
    final query = state.query.copyWith(page: 1);
    state = state.copyWith(channelId: channelId, isLoading: true, clearFailures: true);
    final result = await ListChannelMessagesUseCase(
      ref.read(communicationRepositoryProvider))(
      ListChannelMessagesParams(channelId: channelId, query: query));
    state = result.fold(
      (f) => state.copyWith(isLoading: false, failure: f),
      (page) => state.copyWith(
        items: page.value.data, meta: page.value.meta, query: query,
        isLoading: false, clearFailures: true,
      ),
    );
  }

  Future<void> refresh() => _load(state.channelId);

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.meta.hasMore) return;
    state = state.copyWith(isLoadingMore: true, clearFailures: true);
    final next = state.query.copyWith(page: state.meta.page + 1);
    final result = await ListChannelMessagesUseCase(
      ref.read(communicationRepositoryProvider))(
      ListChannelMessagesParams(channelId: state.channelId, query: next));
    state = result.fold(
      (f) => state.copyWith(isLoadingMore: false, loadMoreFailure: f),
      (page) => state.copyWith(
        items: [...state.items, ...page.value.data], meta: page.value.meta,
        query: next, isLoadingMore: false, clearFailures: true,
      ),
    );
  }

  Future<void> sendMessage(Map<String, dynamic> payload) async {
    final result = await SendMessageUseCase(
      ref.read(communicationRepositoryProvider))(payload);
    if (result.isOk) await refresh();
  }
}

// ── Meetings List ──────────────────────────────────────────────────────────

class MeetingListState extends Equatable {
  const MeetingListState({
    this.items = const <Meeting>[],
    this.meta = const PaginationMeta(page: 1, limit: 25, total: 0, totalPages: 0),
    this.query = const ListQuery(sort: '-startTime'),
    this.isLoading = true,
    this.isLoadingMore = false,
    this.failure,
    this.loadMoreFailure,
  });

  final List<Meeting> items;
  final PaginationMeta meta;
  final ListQuery query;
  final bool isLoading;
  final bool isLoadingMore;
  final Failure? failure;
  final Failure? loadMoreFailure;

  MeetingListState copyWith({
    List<Meeting>? items, PaginationMeta? meta, ListQuery? query,
    bool? isLoading, bool? isLoadingMore, Failure? failure,
    Failure? loadMoreFailure, bool clearFailures = false,
  }) =>
      MeetingListState(
        items: items ?? this.items, meta: meta ?? this.meta,
        query: query ?? this.query, isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        failure: clearFailures ? null : (failure ?? this.failure),
        loadMoreFailure: clearFailures ? null : (loadMoreFailure ?? this.loadMoreFailure),
      );

  @override
  List<Object?> get props => <Object?>[
        items, meta, query.cacheKey, isLoading, isLoadingMore, failure, loadMoreFailure,
      ];
}

final NotifierProvider<MeetingListController, MeetingListState>
    meetingListControllerProvider =
    NotifierProvider<MeetingListController, MeetingListState>(
  MeetingListController.new,
);

class MeetingListController extends Notifier<MeetingListState> {
  @override
  MeetingListState build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const MeetingListState();
  }

  ListMeetingsUseCase get _listUseCase =>
      ListMeetingsUseCase(ref.read(communicationRepositoryProvider));

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

  Future<void> endMeeting(String id) async {
    await EndMeetingUseCase(ref.read(communicationRepositoryProvider))(id);
    await refresh();
  }
}

final FutureProviderFamily<Channel, String> channelDetailProvider =
    FutureProvider.family<Channel, String>((Ref ref, String id) async {
  final result = await GetChannelUseCase(
    ref.watch(communicationRepositoryProvider))(id);
  return result.fold((f) => throw f, (c) => c);
});

final FutureProviderFamily<Message, String> messageDetailProvider =
    FutureProvider.family<Message, String>((Ref ref, String id) async {
  final result = await GetMessageUseCase(
    ref.watch(communicationRepositoryProvider))(id);
  return result.fold((f) => throw f, (m) => m);
});

final FutureProviderFamily<Meeting, String> meetingDetailProvider =
    FutureProvider.family<Meeting, String>((Ref ref, String id) async {
  final result = await GetMeetingUseCase(
    ref.watch(communicationRepositoryProvider))(id);
  return result.fold((f) => throw f, (m) => m);
});

// ── Notification List (delegates to notifications module) ──────────────────

final NotifierProvider<NotificationListController, AsyncValue<List<AppNotification>>>
    notificationListControllerProvider = NotifierProvider<NotificationListController,
        AsyncValue<List<AppNotification>>>(NotificationListController.new);

class NotificationListController extends Notifier<AsyncValue<List<AppNotification>>> {
  @override
  AsyncValue<List<AppNotification>> build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const AsyncValue<List<AppNotification>>.loading();
  }

  Future<void> refresh() async {
    state = const AsyncValue<List<AppNotification>>.loading();
    try {
      await ref.read(notificationsControllerProvider.notifier).refresh();
      state = ref.read(notificationsControllerProvider);
    } on Object catch (error, stackTrace) {
      state = AsyncValue<List<AppNotification>>.error(error, stackTrace);
    }
  }

  Future<void> markRead(String id) async {
    await ref.read(notificationsControllerProvider.notifier).markRead(id);
    state = ref.read(notificationsControllerProvider);
  }

  Future<void> markAllRead() async {
    await ref.read(notificationsControllerProvider.notifier).markAllRead();
    state = ref.read(notificationsControllerProvider);
  }
}
