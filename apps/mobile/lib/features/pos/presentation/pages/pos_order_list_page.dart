import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/pos.dart';
import '../providers/pos_providers.dart';

class PosOrderListPage extends ConsumerStatefulWidget {
  const PosOrderListPage({super.key});

  static const String routeName = 'pos-orders';
  static const String routePath = '/pos/orders';

  @override
  ConsumerState<PosOrderListPage> createState() => _PosOrderListPageState();
}

class _PosOrderListPageState extends ConsumerState<PosOrderListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Recently created',
    '-totalAmount': 'Highest total',
    'totalAmount': 'Lowest total',
    'orderNumber': 'Order number',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final PosListState<PosOrder> state = ref.watch(posOrdersProvider);
    final PosOrdersController controller = ref.read(posOrdersProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('POS Orders'),
        actions: <Widget>[
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((MapEntry<String, String> entry) => PopupMenuItem<String>(
                      value: entry.key,
                      child: Text(entry.value),
                    ))
                .toList(),
          ),
        ],
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search order number or customer',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
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
                      ? 'Loading...'
                      : '${state.meta.total} order${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(PosListState<PosOrder> state, PosOrdersController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<PosOrder>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No POS orders',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Orders placed through POS terminals will appear here.',
      itemBuilder: (BuildContext context, PosOrder order, _) => _PosOrderTile(
        order: order,
        onTap: () => context.pushNamed(
          'pos-order-detail',
          pathParameters: <String, String>{'id': order.id},
        ),
      ),
    );
  }
}

class _PosOrderTile extends StatelessWidget {
  const _PosOrderTile({required this.order, this.onTap});

  final PosOrder order;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(children: <Widget>[
            Expanded(
              child: Text(order.orderNumber,
                  style: Theme.of(context).textTheme.titleSmall),
            ),
            UiStatusBadge(
              label: order.status,
              tone: _statusTone(order.status),
            ),
          ]),
          const SizedBox(height: Spacing.x1),
          if (order.customerName != null)
            Text(order.customerName!,
                style: TextStyle(color: t.textSecondary)),
          const SizedBox(height: Spacing.x1),
          Text(Formatters.currency(order.totalAmount),
              style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'DRAFT' => UiTone.neutral,
        'CONFIRMED' => UiTone.info,
        'COMPLETED' => UiTone.success,
        'VOID' || 'VOIDED' || 'CANCELLED' => UiTone.danger,
        'HOLD' || 'ON_HOLD' => UiTone.warning,
        _ => UiTone.neutral,
      };
}