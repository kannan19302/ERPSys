import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/ecommerce.dart';
import '../providers/ecommerce_providers.dart';

class EcommerceProductListPage extends ConsumerStatefulWidget {
  const EcommerceProductListPage({super.key});
  static const String routeName = 'ecommerce-products';
  static const String routePath = '/ecommerce/products';
  @override
  ConsumerState<EcommerceProductListPage> createState() => _EcommerceProductListPageState();
}

class _EcommerceProductListPageState extends ConsumerState<EcommerceProductListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    '-price': 'Highest price',
    'price': 'Lowest price',
    'name': 'Name A-Z',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ecommerceProductListControllerProvider);
    final controller = ref.read(ecommerceProductListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search products...',
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
                    : '${state.meta.total} product${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(EcommerceProductListState state, EcommerceProductListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<EcommerceProduct>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No products found',
      emptyMessage: 'Products added to the store will appear here.',
      itemBuilder: (_, EcommerceProduct p, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(p.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: p.status,
                  tone: p.status == 'ACTIVE' ? UiTone.success : UiTone.neutral,
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              if (p.sku != null)
                Text('SKU: ${p.sku}',
                    style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs)),
              Row(children: [
                Text('\$${p.price.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.labelLarge),
                if (p.comparePrice != null && p.comparePrice! > 0) ...[
                  const SizedBox(width: Spacing.x2),
                  Text('\$${p.comparePrice!.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontSize: TypeScale.xs,
                        color: palette.textSecondary,
                        decoration: TextDecoration.lineThrough,
                      )),
                ],
                const Spacer(),
                Text('${p.inventory} in stock',
                    style: TextStyle(fontSize: TypeScale.xs, color: p.inventory > 0 ? palette.textSecondary : Colors.red)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}

class EcommerceOrderListPage extends ConsumerStatefulWidget {
  const EcommerceOrderListPage({super.key});
  static const String routeName = 'ecommerce-orders';
  static const String routePath = '/ecommerce/orders';
  @override
  ConsumerState<EcommerceOrderListPage> createState() => _EcommerceOrderListPageState();
}

class _EcommerceOrderListPageState extends ConsumerState<EcommerceOrderListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ecommerceOrderListControllerProvider);
    final controller = ref.read(ecommerceOrderListControllerProvider.notifier);
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search order number...',
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
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(EcommerceOrderListState state, EcommerceOrderListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    final palette = context.tokens;
    return PaginatedListView<EcommerceOrder>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No orders found',
      emptyMessage: 'Customer orders will appear here.',
      itemBuilder: (_, EcommerceOrder o, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(o.orderNumber,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(label: o.status, tone: _orderStatusTone(o.status)),
              ]),
              if (o.customerName != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(o.customerName!,
                    style: TextStyle(color: palette.textSecondary)),
              ],
              const SizedBox(height: Spacing.x1),
              Text('\$${o.totalAmount.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.labelLarge),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _orderStatusTone(String status) => switch (status) {
        'PENDING' => UiTone.warning,
        'CONFIRMED' => UiTone.info,
        'PROCESSING' => UiTone.info,
        'SHIPPED' => UiTone.success,
        'DELIVERED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}