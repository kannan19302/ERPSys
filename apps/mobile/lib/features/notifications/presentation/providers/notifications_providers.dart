import '../../../../core/error/exceptions.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/providers.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../auth/presentation/providers/auth_providers.dart';
import '../../data/notifications_remote_datasource.dart';
import '../../domain/entities/notification.dart';

final Provider<NotificationsRemoteDataSource>
    notificationsRemoteDataSourceProvider =
    Provider<NotificationsRemoteDataSource>(
  (Ref ref) => NotificationsRemoteDataSourceImpl(ref.watch(apiClientProvider)),
);

final NotifierProvider<NotificationsController, AsyncValue<List<AppNotification>>>
    notificationsControllerProvider = NotifierProvider<NotificationsController,
        AsyncValue<List<AppNotification>>>(NotificationsController.new);

/// Badge count for the shell's bottom-nav icon.
final Provider<int> unreadNotificationCountProvider = Provider<int>((Ref ref) {
  final AsyncValue<List<AppNotification>> state =
      ref.watch(notificationsControllerProvider);
  return state.maybeWhen(
    data: (List<AppNotification> items) =>
        items.where((AppNotification n) => n.isUnread).length,
    orElse: () => 0,
  );
});

class NotificationsController extends Notifier<AsyncValue<List<AppNotification>>> {
  @override
  AsyncValue<List<AppNotification>> build() {
    ref.watch(activeTenantIdProvider);
    Future<void>.microtask(refresh);
    return const AsyncValue<List<AppNotification>>.loading();
  }

  NotificationsRemoteDataSource get _remote =>
      ref.read(notificationsRemoteDataSourceProvider);

  Future<void> refresh() async {
    state = const AsyncValue<List<AppNotification>>.loading();
    try {
      state = AsyncValue<List<AppNotification>>.data(await _remote.list());
    } on Object catch (error, stackTrace) {
      state = AsyncValue<List<AppNotification>>.error(
        mapExceptionToFailure(error),
        stackTrace,
      );
    }
  }

  Future<void> markRead(String id) async {
    final AsyncValue<List<AppNotification>> previous = state;
    final List<AppNotification>? items = previous.valueOrNull;
    if (items == null) return;

    // Optimistic update — the feed feels instant; a failure below reverts it.
    state = AsyncValue<List<AppNotification>>.data(
      items
          .map(
            (AppNotification n) => n.id == id
                ? AppNotification(
                    id: n.id,
                    title: n.title,
                    content: n.content,
                    type: n.type,
                    status: 'READ',
                    link: n.link,
                    createdAt: n.createdAt,
                  )
                : n,
          )
          .toList(growable: false),
    );

    try {
      await _remote.markStatus(id, read: true);
    } on Object {
      state = previous;
    }
  }

  Future<void> markAllRead() async {
    final List<AppNotification>? items = state.valueOrNull;
    if (items == null) return;
    for (final AppNotification n in items.where((AppNotification n) => n.isUnread)) {
      await markRead(n.id);
    }
  }
}
