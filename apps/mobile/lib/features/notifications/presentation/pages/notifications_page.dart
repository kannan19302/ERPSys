import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/notification.dart';
import '../providers/notifications_providers.dart';

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  static const String routeName = 'notifications';
  static const String routePath = '/notifications';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<List<AppNotification>> state =
        ref.watch(notificationsControllerProvider);
    final NotificationsController controller =
        ref.read(notificationsControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: <Widget>[
          TextButton(
            onPressed: controller.markAllRead,
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: state.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load notifications.'),
          onRetry: controller.refresh,
        ),
        data: (List<AppNotification> items) {
          if (items.isEmpty) {
            return const EmptyView(
              title: 'You’re all caught up',
              message: 'New notifications will show up here.',
              icon: Icons.notifications_none_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: controller.refresh,
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (BuildContext context, int index) {
                final AppNotification item = items[index];
                return _NotificationRow(
                  notification: item,
                  onTap: () {
                    if (item.isUnread) controller.markRead(item.id);
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListTile(
      onTap: onTap,
      leading: CircleAvatar(
        backgroundColor: notification.isUnread ? t.primaryLight : t.bgSunken,
        child: Icon(
          _iconForType(notification.type),
          color: notification.isUnread ? t.primary : t.textTertiary,
          size: TypeScale.lg,
        ),
      ),
      title: Text(
        notification.title,
        style: TextStyle(
          fontWeight: notification.isUnread ? TypeScale.semibold : TypeScale.normal,
        ),
      ),
      subtitle: Text(
        notification.content,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Text(
        Formatters.relative(notification.createdAt),
        style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
      ),
    );
  }

  static IconData _iconForType(String type) => switch (type) {
        'ALERT' => Icons.warning_amber_outlined,
        'APPROVAL' => Icons.fact_check_outlined,
        'MESSAGE' => Icons.chat_bubble_outline,
        _ => Icons.notifications_outlined,
      };
}
