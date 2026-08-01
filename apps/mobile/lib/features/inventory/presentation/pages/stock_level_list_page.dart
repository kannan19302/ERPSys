import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/inventory.dart';
import '../providers/inventory_providers.dart';

class StockLevelListPage extends ConsumerStatefulWidget {
  const StockLevelListPage({super.key});

  static const String routeName = 'stock-levels';
  static const String routePath = '/inventory/stock-levels';

  @override
  ConsumerState<StockLevelListPage> createState() =>
      _StockLevelListPageState();
}

class _StockLevelListPageState extends ConsumerState<StockLevelListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final StockLevelListState state =
        ref.watch(stockLevelListControllerProvider);
    final StockLevelListController controller =
        ref.read(stockLevelListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Levels'),
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
                hintText: 'Search by product',
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
                      : '${state.meta.total} record${state.meta.total == 1 ? '' : 's'}',
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
    StockLevelListState state,
    StockLevelListController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<StockLevel>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No stock levels found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Stock levels will appear once products are added to warehouses.',
      itemBuilder: (BuildContext context, StockLevel level, _) =>
          _StockLevelTile(
        level: level,
        onTap: () => context.pushNamed(
          'stock-level-detail',
          pathParameters: <String, String>{'id': level.id},
        ),
      ),
    );
  }
}

class _StockLevelTile extends StatelessWidget {
  const _StockLevelTile({required this.level, this.onTap});

  final StockLevel level;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final UiTone stockTone = level.isLowStock
        ? UiTone.danger
        : level.availableQuantity <= level.reorderPoint * 1.5
            ? UiTone.warning
            : UiTone.success;

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
              Icons.inventory_2_outlined,
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
                  'Product ${level.productId.substring(0, 8)}…',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  'WH ${level.warehouseId.substring(0, 8)}…',
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
                Formatters.number(level.availableQuantity),
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: Spacing.x1),
              UiStatusBadge(
                label: level.isLowStock ? 'Low stock' : 'OK',
                tone: stockTone,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
