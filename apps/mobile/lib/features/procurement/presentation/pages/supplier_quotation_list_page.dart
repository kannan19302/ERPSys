import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class SupplierQuotationListPage extends ConsumerStatefulWidget {
  const SupplierQuotationListPage({super.key});
  static const String routeName = 'supplier-quotations';
  static const String routePath = '/procurement/supplier-quotations';
  @override
  ConsumerState<SupplierQuotationListPage> createState() => _SupplierQuotationListPageState();
}

class _SupplierQuotationListPageState extends ConsumerState<SupplierQuotationListPage> {
  final _search = TextEditingController();
  String? _statusFilter;

  static const _sortOptions = <String, String>{
    '-createdAt': 'Newest first', 'createdAt': 'Oldest first',
    '-totalAmount': 'Highest amount', 'totalAmount': 'Lowest amount',
  };

  static const _statusFilters = <String, String>{
    'DRAFT': 'Draft', 'SUBMITTED': 'Submitted',
    'APPROVED': 'Approved', 'REJECTED': 'Rejected',
  };

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(supplierQuotationListControllerProvider);
    final controller = ref.read(supplierQuotationListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Supplier Quotations'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert), tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem(value: e.key, child: Text(e.value))).toList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('supplier-quotation-new'),
        icon: const Icon(Icons.add), label: const Text('New Quotation'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search, onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by number or supplier',
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
                state.isLoading ? 'Loading...' : '${state.meta.total} quotation${state.meta.total == 1 ? '' : 's'}',
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
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(SupplierQuotationListState state, SupplierQuotationListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<SupplierQuotation>(
      items: state.items, meta: state.meta,
      isLoadingMore: state.isLoadingMore, loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh, onLoadMore: controller.loadMore,
      emptyTitle: 'No quotations found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Supplier quotations will appear here.',
      itemBuilder: (_, q, __) => Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => context.pushNamed('supplier-quotation-detail', pathParameters: {'id': q.id}),
          child: Padding(
            padding: const EdgeInsets.all(Spacing.x3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(child: Text(q.vendorName ?? 'Quotation', style: Theme.of(context).textTheme.titleSmall)),
                  UiStatusBadge(label: q.status, tone: _statusTone(q.status)),
                ]),
                const SizedBox(height: Spacing.x1),
                Text('\$${q.totalAmount.toStringAsFixed(2)}', style: TextStyle(color: context.tokens.textSecondary)),
                if (q.rfqNumber != null) Text('RFQ: ${q.rfqNumber}', style: TextStyle(fontSize: TypeScale.xs)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String s) => switch (s) {
        'DRAFT' => UiTone.neutral, 'SUBMITTED' => UiTone.info,
        'APPROVED' => UiTone.success, 'REJECTED' => UiTone.danger, _ => UiTone.neutral,
      };
}