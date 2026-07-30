import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../notifications/domain/entities/notification.dart';
import '../providers/communication_providers.dart';

class NotificationListPage extends ConsumerStatefulWidget {
  const NotificationListPage({super.key});
  static const String routeName = 'notifications';
  static const String routePath = '/communication/notifications';
  @override
  ConsumerState<NotificationListPage> createState() => _NotificationListPageState();
}

class _NotificationListPageState extends ConsumerState<NotificationListPage> {
  @override
  Widget build(BuildContext context) {
    final asyncState = ref.watch(notificationListControllerProvider);
    final controller = ref.read(notificationListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          asyncState.maybeWhen(
            data: (items) => items.any((n) => n.isUnread)
                ? TextButton(
                    onPressed: controller.markAllRead,
                    child: const Text('Mark all read'),
                  )
                : const SizedBox.shrink(),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: asyncState.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : _toFailure(error),
          onRetry: controller.refresh,
        ),
        data: (items) => _body(items, controller, t),
      ),
    );
  }

  Widget _body(List<AppNotification> items, NotificationListController controller, Palette t) {
    if (items.isEmpty) {
      return RefreshIndicator(
        onRefresh: controller.refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(
              height: 400,
              child: EmptyView(
                title: 'No notifications',
                message: 'You\'re all caught up!',
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: controller.refresh,
      child: ListView.separated(
        padding: const EdgeInsets.all(Spacing.x4),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: Spacing.x2),
        itemBuilder: (_, int index) {
          final notification = items[index];
          return UiCard(
            padding: const EdgeInsets.all(Spacing.x3),
            child: InkWell(
              onTap: notification.isUnread
                  ? () => controller.markRead(notification.id)
                  : null,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    _iconForType(notification.type),
                    size: TypeScale.xl,
                    color: notification.isUnread ? t.primary : t.textTertiary,
                  ),
                  const SizedBox(width: Spacing.x3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          notification.title,
                          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            fontWeight: notification.isUnread
                                ? TypeScale.semibold
                                : TypeScale.normal,
                          ),
                        ),
                        const SizedBox(height: Spacing.x1),
                        Text(
                          notification.content,
                          style: TextStyle(
                            color: t.textSecondary,
                            fontSize: TypeScale.sm,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: Spacing.x2),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (notification.isUnread)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: t.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      const SizedBox(height: Spacing.x1),
                      Text(
                        Formatters.relative(notification.createdAt),
                        style: TextStyle(
                          color: t.textTertiary,
                          fontSize: TypeScale.xs,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  IconData _iconForType(String type) => switch (type) {
        'MESSAGE' => Icons.chat_bubble_outline,
        'MENTION' => Icons.alternate_email,
        'TASK' => Icons.check_circle_outline,
        'APPROVAL' => Icons.how_to_vote_outlined,
        'SYSTEM' => Icons.info_outline,
        _ => Icons.notifications_outlined,
      };

  Failure _toFailure(Object error) => ServerFailure(
    error.toString(),
    code: 'NOTIFICATION_ERROR',
  );
}
