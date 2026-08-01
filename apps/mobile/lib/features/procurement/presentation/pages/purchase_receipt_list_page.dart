import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class PurchaseReceiptListPage extends ConsumerStatefulWidget {
  const PurchaseReceiptListPage({super.key});
  static const String routeName = 'purchase-receipts';
  static const String routePath = '/procurement/purchase-receipts';
  @override
  ConsumerState<PurchaseReceiptListPage> createState() => _PurchaseReceiptListPageState();
}

class _PurchaseReceiptListPageState extends ConsumerState<PurchaseReceiptListPage> {
  final _search = TextEditingController();
  String? _statusFilter;

  static const _statusFilters = <String, String>{
    'DRAFT': 'Draft', 'RECEIVED': 'Received',
    'PARTIAL': 'Partial', 'CANCELLED': 'Cancelled',
  };

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(purchaseReceiptListControllerProvider);
    final controller = ref.read(purchaseReceiptListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Purchase Receipts')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('purchase-receipt-new'),
        icon: const Icon(Icons.add), label: const Text('New Receipt'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search, onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search receipt number',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(icon: const Icon(Icons.close), onPressed: () { _search.clear(); controller.search(''); }),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading ? 'Loading...' : '${state.meta.total} receipt${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs),
              ),
              const Spacer(),
              DropdownButton<String?>(
                value: _statusFilter, hint: const Text('Status'), underline: const SizedBox.shrink(),
                items: _statusFilters.entries
                    .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
                onChanged: (v) {
                  setState(() => _statusFilter = v);
                  controller.applyFilters(v == null ? const {} : {'status': v});
                },
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(PurchaseReceiptListState state, PurchaseReceiptListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<PurchaseReceipt>(
      items: state.items, meta: state.meta,
      isLoadingMore: state.isLoadingMore, loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh, onLoadMore: controller.loadMore,
      emptyTitle: 'No receipts found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Purchase receipts will appear here.',
      itemBuilder: (_, r, __) => Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => context.pushNamed('purchase-receipt-detail', pathParameters: {'id': r.id}),
          child: Padding(
            padding: const EdgeInsets.all(Spacing.x3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(child: Text(r.receiptNumber, style: Theme.of(context).textTheme.titleSmall)),
                  UiStatusBadge(label: r.status, tone: _statusTone(r.status)),
                ],),
                if (r.supplierName != null) ...[
                  const SizedBox(height: Spacing.x1),
                  Text(r.supplierName!, style: TextStyle(color: context.tokens.textSecondary)),
                ],
                if (r.poNumber != null) Text('PO: ${r.poNumber}', style: const TextStyle(fontSize: TypeScale.xs)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String s) => switch (s) {
        'DRAFT' => UiTone.neutral, 'RECEIVED' => UiTone.success,
        'PARTIAL' => UiTone.warning, 'CANCELLED' => UiTone.danger, _ => UiTone.neutral,
      };
}