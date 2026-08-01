import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/subscriptions.dart';
import '../providers/subscriptions_providers.dart';

class SubscriptionPlanListPage extends ConsumerStatefulWidget {
  const SubscriptionPlanListPage({super.key});
  static const String routeName = 'subscription-plans';
  static const String routePath = '/subscriptions/plans';
  @override
  ConsumerState<SubscriptionPlanListPage> createState() => _SubscriptionPlanListPageState();
}

class _SubscriptionPlanListPageState extends ConsumerState<SubscriptionPlanListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(subscriptionPlanListControllerProvider);
    final controller = ref.read(subscriptionPlanListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Subscription Plans')),
      body: _body(state, controller, t),
    );
  }

  Widget _body(SubscriptionPlanListState state, SubscriptionPlanListController controller, Palette t) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<SubscriptionPlan>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No plans',
      emptyMessage: 'Subscription plans will appear here.',
      itemBuilder: (_, SubscriptionPlan plan, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(plan.name,
                      style: Theme.of(context).textTheme.titleSmall,),
                ),
                UiStatusBadge(
                  label: plan.isActive ? 'ACTIVE' : 'INACTIVE',
                  tone: plan.isActive ? UiTone.success : UiTone.neutral,
                ),
              ],),
              const SizedBox(height: Spacing.x1),
              Text('\$${plan.price.toStringAsFixed(2)} / ${plan.interval}',
                  style: TextStyle(color: t.textSecondary),),
              Row(children: [
                if (plan.trialDays > 0)
                  Text('${plan.trialDays}-day trial',
                      style: TextStyle(fontSize: TypeScale.xs, color: t.textTertiary),),
                const Spacer(),
                Text('#${plan.sortOrder}',
                    style: TextStyle(fontSize: TypeScale.xs, color: t.textTertiary),),
              ],),
            ],
          ),
        ),
      ),
    );
  }
}
