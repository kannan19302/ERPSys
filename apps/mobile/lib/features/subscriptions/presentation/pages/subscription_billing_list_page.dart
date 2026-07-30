import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/subscriptions.dart';
import '../providers/subscriptions_providers.dart';

class SubscriptionBillingListPage extends ConsumerStatefulWidget {
  const SubscriptionBillingListPage({super.key});
  static const String routeName = 'subscription-billing';
  static const String routePath = '/subscriptions/billing';
  @override
  ConsumerState<SubscriptionBillingListPage> createState() => _SubscriptionBillingListPageState();
}

class _SubscriptionBillingListPageState extends ConsumerState<SubscriptionBillingListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(subscriptionBillingCycleListControllerProvider);
    final controller = ref.read(subscriptionBillingCycleListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Billing Cycles')),
      body: _body(state, controller, t),
    );
  }

  Widget _body(SubscriptionBillingCycleListState state, SubscriptionBillingCycleListController controller, Palette t) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<SubscriptionBillingCycle>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No billing cycles',
      emptyMessage: 'Billing cycles will appear here.',
      itemBuilder: (_, SubscriptionBillingCycle cycle, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text('${cycle.periodStart.toString().substring(0, 10)} - ${cycle.periodEnd.toString().substring(0, 10)}',
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: cycle.status,
                  tone: cycle.status == 'PAID' ? UiTone.success : UiTone.warning,
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              Text('\$${cycle.amount.toStringAsFixed(2)} ${cycle.currency}',
                  style: TextStyle(color: t.textSecondary)),
              if (cycle.paidAt != null) ...[
                const SizedBox(height: Spacing.x1),
                Text('Paid ${_formatDate(cycle.paidAt!)}',
                    style: TextStyle(fontSize: TypeScale.xs, color: t.textTertiary)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
