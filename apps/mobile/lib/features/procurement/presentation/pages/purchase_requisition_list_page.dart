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

class PurchaseRequisitionListPage extends ConsumerStatefulWidget {
  const PurchaseRequisitionListPage({super.key});
  static const String routeName = 'purchase-requisitions';
  static const String routePath = '/procurement/purchase-requisitions';
  @override
  ConsumerState<PurchaseRequisitionListPage> createState() => _PurchaseRequisitionListPageState();
}

class _PurchaseRequisitionListPageState extends ConsumerState<PurchaseRequisitionListPage> {
  final _search = TextEditingController();
  String? _statusFilter;

  static const _statusFilters = <String, String>{
    'DRAFT': 'Draft', 'SUBMITTED': 'Submitted',
    'APPROVED': 'Approved', 'REJECTED': 'Rejected',
  };

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(purchaseRequisitionListControllerProvider);
    final controller = ref.read(purchaseRequisitionListControllerProvider.notifier);
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Purchase Requisitions')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('purchase-requisition-new'),
        icon: const Icon(Icons.add), label: const Text('New Requisition'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search, onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by number',
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
                state.isLoading ? 'Loading...' : '${state.meta.total} requisition${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
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

  Widget _body(PurchaseRequisitionListState state, PurchaseRequisitionListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<PurchaseRequisition>(
      items: state.items, meta: state.meta,
      isLoadingMore: state.isLoadingMore, loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh, onLoadMore: controller.loadMore,
      emptyTitle: 'No requisitions found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Purchase requisitions will appear here.',
      itemBuilder: (_, r, __) => Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => context.pushNamed('purchase-requisition-detail', pathParameters: {'id': r.id}),
          child: Padding(
            padding: const EdgeInsets.all(Spacing.x3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(child: Text(r.title, style: Theme.of(context).textTheme.titleSmall)),
                  UiStatusBadge(label: r.status, tone: _statusTone(r.status)),
                ]),
                const SizedBox(height: Spacing.x1),
                Text(r.department ?? '', style: TextStyle(color: context.tokens.textSecondary)),
                const SizedBox(height: Spacing.x1),
                Text('\$${r.totalEstimated.toStringAsFixed(2)}', style: TextStyle(fontSize: TypeScale.xs)),
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