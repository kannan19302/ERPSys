import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class SupplyChainRouteListPage extends ConsumerStatefulWidget {
  const SupplyChainRouteListPage({super.key});
  static const String routeName = 'supply-chain-routes';
  static const String routePath = '/supply-chain/routes';
  @override
  ConsumerState<SupplyChainRouteListPage> createState() => _SupplyChainRouteListPageState();
}

class _SupplyChainRouteListPageState extends ConsumerState<SupplyChainRouteListPage> {
  final TextEditingController _search = TextEditingController();
  bool? _activeFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'name': 'Name (A–Z)',
    '-transitTime': 'Longest transit',
    'transitTime': 'Shortest transit',
    '-cost': 'Highest cost',
    'cost': 'Lowest cost',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(routeListControllerProvider);
    final controller = ref.read(routeListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Routes'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('supply-chain-route-new'),
        icon: const Icon(Icons.add),
        label: const Text('New Route'),
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
                hintText: 'Search route name',
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
                state.isLoading ? 'Loading...' : '${state.meta.total} route${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
              const Spacer(),
              DropdownButton<bool?>(
                value: _activeFilter,
                hint: const Text('Status'),
                underline: const SizedBox.shrink(),
                items: const [
                  DropdownMenuItem(value: null, child: Text('All')),
                  DropdownMenuItem(value: true, child: Text('Active')),
                  DropdownMenuItem(value: false, child: Text('Inactive')),
                ],
                onChanged: (v) {
                  setState(() => _activeFilter = v);
                  if (v == null) {
                    controller.applyFilters({});
                  } else {
                    controller.applyFilters({'isActive': v.toString()});
                  }
                },
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(RouteListState state, RouteListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<SupplyChainRoute>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No routes',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Supply chain routes configured in UniERP will appear here.',
      itemBuilder: (_, SupplyChainRoute route, __) => _RouteTile(
        route: route,
        onTap: () => context.pushNamed(
          'supply-chain-route-detail',
          pathParameters: <String, String>{'id': route.id},
        ),
      ),
    );
  }
}

class _RouteTile extends StatelessWidget {
  const _RouteTile({required this.route, required this.onTap});
  final SupplyChainRoute route;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(route.name, style: Theme.of(context).textTheme.titleSmall)),
                UiStatusBadge(
                  label: route.isActive ? 'Active' : 'Inactive',
                  tone: route.isActive ? UiTone.success : UiTone.neutral,
                ),
              ],),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Icon(Icons.trip_origin, size: TypeScale.sm, color: t.textTertiary),
                const SizedBox(width: Spacing.x1),
                Text(route.origin, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                const SizedBox(width: Spacing.x1),
                Icon(Icons.arrow_forward, size: TypeScale.sm, color: t.textTertiary),
                const SizedBox(width: Spacing.x1),
                Icon(Icons.location_on, size: TypeScale.sm, color: t.textTertiary),
                const SizedBox(width: Spacing.x1),
                Expanded(child: Text(route.destination, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs))),
              ],),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                if (route.carrierName != null)
                  Text(route.carrierName!, style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                const Spacer(),
                Text('\$${route.cost.toStringAsFixed(2)}', style: const TextStyle(fontWeight: TypeScale.semibold)),
                if (route.transitTime != null) ...[
                  const SizedBox(width: Spacing.x2),
                  Text('${route.transitTime}d', style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                ],
              ],),
            ],
          ),
        ),
      ),
    );
  }
}