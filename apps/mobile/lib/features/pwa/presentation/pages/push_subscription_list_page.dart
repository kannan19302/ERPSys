import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/pwa.dart';
import '../providers/pwa_providers.dart';

class PushSubscriptionListPage extends ConsumerStatefulWidget {
  const PushSubscriptionListPage({super.key});
  static const String routeName = 'push-subscriptions';
  static const String routePath = '/pwa/push-subscriptions';
  @override
  ConsumerState<PushSubscriptionListPage> createState() => _PushSubscriptionListPageState();
}

class _PushSubscriptionListPageState extends ConsumerState<PushSubscriptionListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pushSubscriptionListControllerProvider);
    final controller = ref.read(pushSubscriptionListControllerProvider.notifier);
    final palette = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Push Subscriptions')),
      body: _body(state, controller, palette),
    );
  }

  Widget _body(PushSubscriptionListState state, PushSubscriptionListController controller, Palette palette) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<PwaPushSubscription>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No push subscriptions',
      emptyMessage: 'Devices subscribed to push notifications will appear here.',
      itemBuilder: (_, PwaPushSubscription s, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(s.browser ?? s.deviceType ?? 'Unknown device',
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                Text(s.platform ?? '', style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
              ]),
              const SizedBox(height: Spacing.x1),
              Text(s.status, style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
            ],
          ),
        ),
      ),
    );
  }
}
