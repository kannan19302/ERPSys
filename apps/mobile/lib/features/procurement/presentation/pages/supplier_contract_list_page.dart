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

class SupplierContractListPage extends ConsumerStatefulWidget {
  const SupplierContractListPage({super.key});
  static const String routeName = 'supplier-contracts';
  static const String routePath = '/procurement/contracts';
  @override
  ConsumerState<SupplierContractListPage> createState() => _SupplierContractListPageState();
}

class _SupplierContractListPageState extends ConsumerState<SupplierContractListPage> {
  final _search = TextEditingController();
  String? _statusFilter;

  static const _statusFilters = <String, String>{
    'DRAFT': 'Draft', 'ACTIVE': 'Active',
    'EXPIRED': 'Expired', 'TERMINATED': 'Terminated',
  };

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(supplierContractListControllerProvider);
    final controller = ref.read(supplierContractListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Supplier Contracts')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('supplier-contract-new'),
        icon: const Icon(Icons.add), label: const Text('New Contract'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search, onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by supplier',
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
                state.isLoading ? 'Loading...' : '${state.meta.total} contract${state.meta.total == 1 ? '' : 's'}',
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

  Widget _body(SupplierContractListState state, SupplierContractListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<SupplierContract>(
      items: state.items, meta: state.meta,
      isLoadingMore: state.isLoadingMore, loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh, onLoadMore: controller.loadMore,
      emptyTitle: 'No contracts found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Supplier contracts will appear here.',
      itemBuilder: (_, c, __) => Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => context.pushNamed('supplier-contract-detail', pathParameters: {'id': c.id}),
          child: Padding(
            padding: const EdgeInsets.all(Spacing.x3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(child: Text(c.supplierName, style: Theme.of(context).textTheme.titleSmall)),
                  UiStatusBadge(label: c.status, tone: _statusTone(c.status)),
                ]),
                const SizedBox(height: Spacing.x1),
                Text(c.type, style: TextStyle(color: context.tokens.textSecondary)),
                Text('\$${c.value.toStringAsFixed(2)}', style: TextStyle(fontSize: TypeScale.xs)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String s) => switch (s) {
        'DRAFT' => UiTone.neutral, 'ACTIVE' => UiTone.success,
        'EXPIRED' => UiTone.warning, 'TERMINATED' => UiTone.danger, _ => UiTone.neutral,
      };
}