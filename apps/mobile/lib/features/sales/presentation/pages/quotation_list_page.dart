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

class QuotationListPage extends ConsumerStatefulWidget {
  const QuotationListPage({super.key});

  static const String routeName = 'quotations';
  static const String routePath = '/sales/quotations';

  @override
  ConsumerState<QuotationListPage> createState() => _QuotationListPageState();
}

class _QuotationListPageState extends ConsumerState<QuotationListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Recently created',
    'customerName': 'Customer (A–Z)',
    '-customerName': 'Customer (Z–A)',
    '-totalAmount': 'Highest total',
    'totalAmount': 'Lowest total',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final SalesListState<Quotation> state = ref.watch(quotationsProvider);
    final QuotationsController controller =
        ref.read(quotationsProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quotations'),
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
          onPressed: () => context.pushNamed('quotation-new'),
          icon: const Icon(Icons.add),
          label: const Text('New quotation'),
        ),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4,
              Spacing.x3,
              Spacing.x4,
              Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search quotations',
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
                      : '${state.meta.total} quotation${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(SalesListState<Quotation> state, QuotationsController controller) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Quotation>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No quotations found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Quotations created in UniERP will appear here.',
      itemBuilder: (BuildContext context, Quotation quotation, _) =>
          _QuotationTile(
        quotation: quotation,
        onTap: () => context.pushNamed(
          'quotation-detail',
          pathParameters: <String, String>{'id': quotation.id},
        ),
      ),
    );
  }
}

class _QuotationTile extends StatelessWidget {
  const _QuotationTile({required this.quotation, this.onTap});

  final Quotation quotation;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  quotation.customerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x1),
                Text(
                  Formatters.currency(quotation.totalAmount),
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.sm,
                  ),
                ),
              ],
            ),
          ),
          UiStatusBadge(
            label: quotation.status,
            tone: _statusTone(quotation.status),
          ),
        ],
      ),
    );
  }

  static UiTone _statusTone(String status) => switch (status.toUpperCase()) {
        'DRAFT' => UiTone.neutral,
        'SUBMITTED' => UiTone.info,
        'ACCEPTED' => UiTone.success,
        'CONVERTED' => UiTone.success,
        _ => UiTone.neutral,
      };
}
