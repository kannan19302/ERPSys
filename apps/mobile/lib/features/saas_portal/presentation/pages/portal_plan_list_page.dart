import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/saas_portal.dart';
import '../providers/saas_portal_providers.dart';

class PortalPlanListPage extends ConsumerStatefulWidget {
  const PortalPlanListPage({super.key});
  static const String routeName = 'portal-plans';
  static const String routePath = '/saas-portal/plans';
  @override
  ConsumerState<PortalPlanListPage> createState() => _PortalPlanListPageState();
}

class _PortalPlanListPageState extends ConsumerState<PortalPlanListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(portalPlanListControllerProvider);
    final controller = ref.read(portalPlanListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Plans')),
      body: _body(state, controller, t),
    );
  }

  Widget _body(PortalPlanListState state, PortalPlanListController controller, Palette t) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<PortalPlan>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No plans available',
      emptyMessage: 'Portal plans will appear here.',
      itemBuilder: (_, PortalPlan plan, __) => Card(
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
                if (plan.isPopular)
                  const UiStatusBadge(label: 'POPULAR', tone: UiTone.success),
              ],),
              const SizedBox(height: Spacing.x1),
              Text('\$${plan.price.toStringAsFixed(2)} / ${plan.billingInterval}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.lg),),
              if (plan.description != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(plan.description!,
                    style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),),
              ],
              if (plan.features.isNotEmpty) ...[
                const SizedBox(height: Spacing.x2),
                ...plan.features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: Spacing.x1),
                  child: Row(children: [
                    Icon(Icons.check, size: TypeScale.sm, color: t.success),
                    const SizedBox(width: Spacing.x1),
                    Text(f, style: const TextStyle(fontSize: TypeScale.xs)),
                  ],),
                ),),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
