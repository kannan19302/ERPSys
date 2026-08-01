import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/inventory.dart';
import '../providers/inventory_providers.dart';

class WarehouseListPage extends ConsumerStatefulWidget {
  const WarehouseListPage({super.key});

  static const String routeName = 'warehouses';
  static const String routePath = '/inventory/warehouses';

  @override
  ConsumerState<WarehouseListPage> createState() => _WarehouseListPageState();
}

class _WarehouseListPageState extends ConsumerState<WarehouseListPage> {
  final TextEditingController _search = TextEditingController();
  bool? _activeFilter;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final WarehouseListState state = ref.watch(warehouseListControllerProvider);
    final WarehouseListController controller =
        ref.read(warehouseListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Warehouses'),
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('warehouse-new'),
          icon: const Icon(Icons.add),
          label: const Text('New warehouse'),
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
                hintText: 'Search warehouses',
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
                      : '${state.meta.total} warehouse${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
                const Spacer(),
                DropdownButton<String?>(
                  value: _activeFilter == null
                      ? null
                      : (_activeFilter! ? 'true' : 'false'),
                  hint: const Text('Status'),
                  underline: const SizedBox.shrink(),
                  items: const <DropdownMenuItem<String?>>[
                    DropdownMenuItem<String?>(value: null, child: Text('All')),
                    DropdownMenuItem<String?>(value: 'true', child: Text('Active')),
                    DropdownMenuItem<String?>(value: 'false', child: Text('Inactive')),
                  ],
                  onChanged: (String? value) {
                    setState(() {
                      _activeFilter = value == null ? null : value == 'true';
                    });
                    if (value == null) {
                      controller.applyFilters(const <String, String>{});
                    } else {
                      controller.applyFilters(<String, String>{'isActive': value});
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
    WarehouseListState state,
    WarehouseListController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Warehouse>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No warehouses found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Warehouses created in UniERP will appear here.',
      itemBuilder: (BuildContext context, Warehouse warehouse, _) =>
          _WarehouseTile(
        warehouse: warehouse,
        onTap: () => context.pushNamed(
          'warehouse-detail',
          pathParameters: <String, String>{'id': warehouse.id},
        ),
      ),
    );
  }
}

class _WarehouseTile extends StatelessWidget {
  const _WarehouseTile({required this.warehouse, this.onTap});

  final Warehouse warehouse;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final double util = warehouse.utilizationPercent;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
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
                  Icons.warehouse_outlined,
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
                      warehouse.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    if (warehouse.city != null)
                      Text(
                        warehouse.city!,
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
              UiStatusBadge(
                label: warehouse.isActive ? 'Active' : 'Inactive',
                tone: warehouse.isActive ? UiTone.success : UiTone.neutral,
              ),
            ],
          ),
          if (warehouse.capacity > 0) ...<Widget>[
            const SizedBox(height: Spacing.x3),
            ClipRRect(
              borderRadius: Radii.pill,
              child: LinearProgressIndicator(
                value: (util / 100).clamp(0.0, 1.0),
                minHeight: 6,
                backgroundColor: t.bgSunken,
                valueColor: AlwaysStoppedAnimation<Color>(
                  util > 90 ? t.danger : util > 70 ? t.warning : t.success,
                ),
              ),
            ),
            const SizedBox(height: Spacing.x1),
            Text(
              '${util.toStringAsFixed(0)}% used (${warehouse.usedCapacity.toStringAsFixed(0)} / ${warehouse.capacity.toStringAsFixed(0)})',
              style: TextStyle(
                color: t.textTertiary,
                fontSize: TypeScale.xs,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
