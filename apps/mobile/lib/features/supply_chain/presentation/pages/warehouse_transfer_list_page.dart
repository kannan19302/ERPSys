import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class WarehouseTransferListPage extends ConsumerStatefulWidget {
  const WarehouseTransferListPage({super.key});
  static const String routeName = 'warehouse-transfers';
  static const String routePath = '/supply-chain/warehouse-transfers';
  @override
  ConsumerState<WarehouseTransferListPage> createState() => _WarehouseTransferListPageState();
}

class _WarehouseTransferListPageState extends ConsumerState<WarehouseTransferListPage> {
  final TextEditingController _search = TextEditingController();
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
  };

  static const Map<String, String> _statusFilters = <String, String>{
    'PENDING': 'Pending',
    'APPROVED': 'Approved',
    'IN_TRANSIT': 'In Transit',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(warehouseTransferListControllerProvider);
    final controller = ref.read(warehouseTransferListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Warehouse Transfers'),
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
        onPressed: () => context.pushNamed('warehouse-transfer-new'),
        icon: const Icon(Icons.add),
        label: const Text('New Transfer'),
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
                hintText: 'Search reference',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty ? null : IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () { _search.clear(); controller.search(''); },
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(state.isLoading ? 'Loading...' : '${state.meta.total} transfer${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              const Spacer(),
              DropdownButton<String?>(
                value: _statusFilter,
                hint: const Text('Status'),
                underline: const SizedBox.shrink(),
                items: [
                  const DropdownMenuItem(value: null, child: Text('All')),
                  ..._statusFilters.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))),
                ],
                onChanged: (v) {
                  setState(() => _statusFilter = v);
                  if (v == null) { controller.applyFilters({}); }
                  else { controller.applyFilters({'status': v}); }
                },
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(WarehouseTransferListState state, WarehouseTransferListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<WarehouseTransfer>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No transfers',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Warehouse transfers in UniERP will appear here.',
      itemBuilder: (_, WarehouseTransfer transfer, __) => _TransferTile(
        transfer: transfer,
        onTap: () => context.pushNamed('warehouse-transfer-detail',
          pathParameters: <String, String>{'id': transfer.id}),
      ),
    );
  }
}

class _TransferTile extends StatelessWidget {
  const _TransferTile({required this.transfer, required this.onTap});
  final WarehouseTransfer transfer;
  final VoidCallback onTap;

  UiTone _statusTone(String status) => switch (status) {
    'PENDING' => UiTone.warning,
    'APPROVED' => UiTone.info,
    'IN_TRANSIT' => UiTone.info,
    'COMPLETED' => UiTone.success,
    'CANCELLED' => UiTone.danger,
    _ => UiTone.neutral,
  };

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
                Expanded(child: Text(transfer.reference ?? 'Transfer',
                    style: Theme.of(context).textTheme.titleSmall)),
                UiStatusBadge(label: transfer.status, tone: _statusTone(transfer.status)),
              ]),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                Icon(Icons.arrow_back, size: TypeScale.sm, color: t.textTertiary),
                const SizedBox(width: Spacing.x1),
                Expanded(child: Text(transfer.fromWarehouseName ?? '—',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs))),
              ]),
              Row(children: [
                Icon(Icons.arrow_forward, size: TypeScale.sm, color: t.textTertiary),
                const SizedBox(width: Spacing.x1),
                Expanded(child: Text(transfer.toWarehouseName ?? '—',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs))),
              ]),
              const SizedBox(height: Spacing.x0_5),
              Text('${transfer.productName ?? 'Product'} × ${transfer.quantity}',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
            ],
          ),
        ),
      ),
    );
  }
}