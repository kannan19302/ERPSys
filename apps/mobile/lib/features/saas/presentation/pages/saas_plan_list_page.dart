import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/saas.dart';
import '../providers/saas_providers.dart';

class SaasPlanListPage extends ConsumerStatefulWidget {
  const SaasPlanListPage({super.key});
  static const String routeName = 'saas-plans';
  static const String routePath = '/saas/plans';
  @override
  ConsumerState<SaasPlanListPage> createState() => _SaasPlanListPageState();
}

class _SaasPlanListPageState extends ConsumerState<SaasPlanListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(saasPlanListControllerProvider);
    final controller = ref.read(saasPlanListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('SaaS Plans')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search plans',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () { _search.clear(); controller.search(''); },
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} plan${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(SaasPlanListState state, SaasPlanListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<SaasPlan>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No plans found',
      emptyMessage: 'SaaS plans created in UniERP will appear here.',
      itemBuilder: (_, SaasPlan plan, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(plan.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: plan.isActive ? 'ACTIVE' : 'INACTIVE',
                  tone: plan.isActive ? UiTone.success : UiTone.neutral,
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              Text('\$${plan.price.toStringAsFixed(2)} / ${plan.billingInterval}',
                  style: TextStyle(color: palette.textSecondary)),
              if (plan.maxUsers != null) ...[
                const SizedBox(height: Spacing.x1),
                Text('Max ${plan.maxUsers} users',
                    style: TextStyle(fontSize: TypeScale.xs, color: palette.textTertiary)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
