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

class InventoryAdjustmentListPage extends ConsumerStatefulWidget {
  const InventoryAdjustmentListPage({super.key});

  static const String routeName = 'inventory-adjustments';
  static const String routePath = '/inventory/adjustments';

  @override
  ConsumerState<InventoryAdjustmentListPage> createState() =>
      _InventoryAdjustmentListPageState();
}

class _InventoryAdjustmentListPageState
    extends ConsumerState<InventoryAdjustmentListPage> {
  final TextEditingController _search = TextEditingController();
  String? _typeFilter;

  static const Map<String, String> _typeFilters = <String, String>{
    'POSITIVE': 'Positive',
    'NEGATIVE': 'Negative',
    'ADJUST': 'Adjust',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final InventoryAdjustmentListState state =
        ref.watch(inventoryAdjustmentListControllerProvider);
    final InventoryAdjustmentListController controller =
        ref.read(inventoryAdjustmentListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Adjustments'),
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('inventory-adjustment-new'),
          icon: const Icon(Icons.add),
          label: const Text('New adjustment'),
        ),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search adjustments',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        tooltip: 'Clear search',
                        onPressed: () {
                          _search.clear();
                          controller.search('');
                        },
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(
              children: <Widget>[
                Text(
                  state.isLoading
                      ? 'Loading…'
                      : '${state.meta.total} adjustment${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
                const Spacer(),
                DropdownButton<String?>(
                  value: _typeFilter,
                  hint: const Text('Type'),
                  underline: const SizedBox.shrink(),
                  items: _typeFilters.entries
                      .map(
                        (MapEntry<String, String> e) =>
                            DropdownMenuItem<String>(
                          value: e.key,
                          child: Text(e.value),
                        ),
                      )
                      .toList(),
                  onChanged: (String? value) {
                    setState(() => _typeFilter = value);
                    if (value == null) {
                      controller.applyFilters(const <String, String>{});
                    } else {
                      controller.applyFilters(<String, String>{'type': value});
                    }
                  },
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
    InventoryAdjustmentListState state,
    InventoryAdjustmentListController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<InventoryAdjustment>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No adjustments found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Inventory adjustments will appear here.',
      itemBuilder: (BuildContext context, InventoryAdjustment adjustment, _) =>
          _AdjustmentTile(
        adjustment: adjustment,
        onTap: () => context.pushNamed(
          'inventory-adjustment-detail',
          pathParameters: <String, String>{'id': adjustment.id},
        ),
      ),
    );
  }
}

class _AdjustmentTile extends StatelessWidget {
  const _AdjustmentTile({required this.adjustment, this.onTap});

  final InventoryAdjustment adjustment;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (IconData icon, Color color, String label) =
        switch (adjustment.type) {
      'POSITIVE' => (Icons.add_circle_outline, t.success, 'Positive'),
      'NEGATIVE' => (Icons.remove_circle_outline, t.danger, 'Negative'),
      'ADJUST' => (Icons.tune_outlined, t.info, 'Adjust'),
      _ => (Icons.help_outline, t.textSecondary, adjustment.type),
    };

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Container(
            height: Spacing.x10,
            width: Spacing.x10,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: Radii.control,
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: TypeScale.xl, color: color),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                if (adjustment.reason != null)
                  Text(
                    adjustment.reason!,
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
          Text(
            Formatters.number(adjustment.quantity),
            style: Theme.of(context).textTheme.labelLarge,
          ),
        ],
      ),
    );
  }
}
