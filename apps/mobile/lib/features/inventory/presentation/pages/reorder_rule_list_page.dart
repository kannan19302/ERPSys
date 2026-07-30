import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/inventory.dart';
import '../providers/inventory_providers.dart';

class ReorderRuleListPage extends ConsumerStatefulWidget {
  const ReorderRuleListPage({super.key});

  static const String routeName = 'reorder-rules';
  static const String routePath = '/inventory/reorder-rules';

  @override
  ConsumerState<ReorderRuleListPage> createState() =>
      _ReorderRuleListPageState();
}

class _ReorderRuleListPageState extends ConsumerState<ReorderRuleListPage> {
  @override
  Widget build(BuildContext context) {
    final ReorderRuleListState state =
        ref.watch(reorderRuleListControllerProvider);
    final ReorderRuleListController controller =
        ref.read(reorderRuleListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reorder Rules'),
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('reorder-rule-new'),
          icon: const Icon(Icons.add),
          label: const Text('New rule'),
        ),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: Row(
              children: <Widget>[
                Text(
                  state.isLoading
                      ? 'Loading…'
                      : '${state.meta.total} rule${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(
    ReorderRuleListState state,
    ReorderRuleListController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ReorderRule>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No reorder rules found',
      emptyMessage: 'Reorder rules will appear once configured.',
      itemBuilder: (BuildContext context, ReorderRule rule, _) =>
          _ReorderRuleTile(
        rule: rule,
        onTap: () => context.pushNamed(
          'reorder-rule-detail',
          pathParameters: <String, String>{'id': rule.id},
        ),
      ),
    );
  }
}

class _ReorderRuleTile extends StatelessWidget {
  const _ReorderRuleTile({required this.rule, this.onTap});

  final ReorderRule rule;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Container(
            height: Spacing.x10,
            width: Spacing.x10,
            decoration: BoxDecoration(
              color: t.bgSunken,
              borderRadius: Radii.control,
            ),
            alignment: Alignment.center,
            child: Icon(
              Icons.rule_outlined,
              size: TypeScale.xl,
              color: t.textSecondary,
            ),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Product ${rule.productId.substring(0, 8)}…',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  'WH ${rule.warehouseId.substring(0, 8)}…',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: t.textTertiary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              Text(
                '${Formatters.number(rule.minStock)} – ${Formatters.number(rule.maxStock)}',
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: Spacing.x1),
              UiStatusBadge(
                label: rule.isActive ? 'Active' : 'Inactive',
                tone: rule.isActive ? UiTone.success : UiTone.neutral,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
