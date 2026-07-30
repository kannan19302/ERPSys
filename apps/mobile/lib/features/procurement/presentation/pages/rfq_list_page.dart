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

class RFQListPage extends ConsumerStatefulWidget {
  const RFQListPage({super.key});
  static const String routeName = 'rfqs';
  static const String routePath = '/procurement/rfqs';
  @override
  ConsumerState<RFQListPage> createState() => _RFQListPageState();
}

class _RFQListPageState extends ConsumerState<RFQListPage> {
  final _search = TextEditingController();
  String? _statusFilter;

  static const _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    '-responseDeadline': 'Deadline soon',
    'responseDeadline': 'Deadline far',
  };

  static const _statusFilters = <String, String>{
    'DRAFT': 'Draft',
    'SENT': 'Sent',
    'CLOSED': 'Closed',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(rfqListControllerProvider);
    final controller = ref.read(rfqListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(
        title: const Text('RFQs'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem(value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('rfq-new'),
        icon: const Icon(Icons.add),
        label: const Text('New RFQ'),
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
                hintText: 'Search RFQ number or vendor',
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
                state.isLoading ? 'Loading...' : '${state.meta.total} RFQ${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs),
              ),
              const Spacer(),
              DropdownButton<String?>(
                value: _statusFilter,
                hint: const Text('Status'),
                underline: const SizedBox.shrink(),
                items: _statusFilters.entries
                    .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                    .toList(),
                onChanged: (v) {
                  setState(() => _statusFilter = v);
                  if (v == null) {
                    controller.applyFilters(const {});
                  } else {
                    controller.applyFilters({'status': v});
                  }
                },
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(RFQListState state, RFQListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<RFQ>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No RFQs found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Request for Quotations created in UniERP will appear here.',
      itemBuilder: (_, rfq, __) => Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => context.pushNamed('rfq-detail', pathParameters: {'id': rfq.id}),
          child: Padding(
            padding: const EdgeInsets.all(Spacing.x3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(child: Text(rfq.rfqNumber, style: Theme.of(context).textTheme.titleSmall)),
                  UiStatusBadge(label: rfq.status, tone: _statusTone(rfq.status)),
                ]),
                const SizedBox(height: Spacing.x1),
                Text(rfq.vendorName ?? rfq.id, style: TextStyle(color: context.tokens.textSecondary)),
                const SizedBox(height: Spacing.x1),
                Text('${rfq.vendorCount} vendor${rfq.vendorCount == 1 ? '' : 's'}', style: TextStyle(fontSize: TypeScale.xs)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'DRAFT' => UiTone.neutral, 'SENT' => UiTone.info,
        'CLOSED' => UiTone.success, _ => UiTone.neutral,
      };
}