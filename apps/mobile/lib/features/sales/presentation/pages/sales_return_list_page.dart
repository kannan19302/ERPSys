import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class SalesReturnListPage extends ConsumerStatefulWidget {
  const SalesReturnListPage({super.key});

  static const String routeName = 'sales-returns';
  static const String routePath = '/sales/returns';

  @override
  ConsumerState<SalesReturnListPage> createState() => _SalesReturnListPageState();
}

class _SalesReturnListPageState extends ConsumerState<SalesReturnListPage> {
  final TextEditingController _search = TextEditingController();
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Recently created',
    'customerName': 'Customer (A–Z)',
    '-totalAmount': 'Highest amount',
    'totalAmount': 'Lowest amount',
  };

  static const Map<String, String> _statusFilters = <String, String>{
    'PENDING': 'Pending',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final SalesListState<SalesReturn> state = ref.watch(salesReturnsProvider);
    final SalesReturnsController controller =
        ref.read(salesReturnsProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Returns'),
        actions: <Widget>[
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map(
                  (MapEntry<String, String> entry) => PopupMenuItem<String>(
                    value: entry.key,
                    child: Text(entry.value),
                  ),
                )
                .toList(),
          ),
        ],
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('sales-return-new'),
          icon: const Icon(Icons.add),
          label: const Text('New return'),
        ),
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by number or customer',
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
                      : '${state.meta.total} return${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
                const Spacer(),
                DropdownButton<String?>(
                  value: _statusFilter,
                  hint: const Text('Status'),
                  underline: const SizedBox.shrink(),
                  items: _statusFilters.entries
                      .map(
                        (MapEntry<String, String> e) => DropdownMenuItem<String>(
                          value: e.key,
                          child: Text(e.value),
                        ),
                      )
                      .toList(),
                  onChanged: (String? value) {
                    setState(() => _statusFilter = value);
                    if (value == null) {
                      controller.applyFilters(const <String, String>{});
                    } else {
                      controller.applyFilters(<String, String>{'status': value});
                    }
                  },
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
    SalesListState<SalesReturn> state,
    SalesReturnsController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<SalesReturn>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No sales returns found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Sales returns created in UniERP will appear here.',
      itemBuilder: (BuildContext context, SalesReturn ret, _) =>
          _SalesReturnTile(
        ret: ret,
        onTap: () => context.pushNamed(
          'sales-return-detail',
          pathParameters: <String, String>{'id': ret.id},
        ),
      ),
    );
  }
}

class _SalesReturnTile extends StatelessWidget {
  const _SalesReturnTile({required this.ret, this.onTap});

  final SalesReturn ret;
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
          Row(
            children: <Widget>[
              Expanded(
                child: Text(
                  ret.customerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
              ),
              UiStatusBadge(
                label: ret.status,
                tone: _statusTone(ret.status),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x1),
          Row(
            children: <Widget>[
              Text(
                Formatters.currency(ret.totalAmount),
                style: TextStyle(
                  color: t.textSecondary,
                  fontSize: TypeScale.sm,
                ),
              ),
              const SizedBox(width: Spacing.x2),
              Text(
                ret.reason,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: t.textTertiary,
                  fontSize: TypeScale.xs,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'PENDING' => UiTone.warning,
        'APPROVED' => UiTone.success,
        'REJECTED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
