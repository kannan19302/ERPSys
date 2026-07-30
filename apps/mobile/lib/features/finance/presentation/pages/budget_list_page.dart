import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class BudgetListPage extends ConsumerStatefulWidget {
  const BudgetListPage({super.key});

  static const String routeName = 'budgets';
  static const String routePath = '/finance/budgets';

  @override
  ConsumerState<BudgetListPage> createState() => _BudgetListPageState();
}

class _BudgetListPageState extends ConsumerState<BudgetListPage> {
  final TextEditingController _search = TextEditingController();
  String? _statusFilter;

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest',
    'createdAt': 'Oldest',
    'name': 'Name (A–Z)',
    '-name': 'Name (Z–A)',
    '-totalAmount': 'Highest budget',
  };

  static const Map<String, String> _statusFilters = <String, String>{
    'ACTIVE': 'Active',
    'CLOSED': 'Closed',
    'DRAFT': 'Draft',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final FinanceListState<Budget> state = ref.watch(budgetsProvider);
    final BudgetsController controller = ref.read(budgetsProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Budgets'),
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
                hintText: 'Search budget name',
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
                      : '${state.meta.total} budget${state.meta.total == 1 ? '' : 's'}',
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

  Widget _body(FinanceListState<Budget> state, BudgetsController controller) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Budget>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No budgets found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Budgets created in UniERP will appear here.',
      itemBuilder: (BuildContext context, Budget budget, _) =>
          _BudgetTile(
        budget: budget,
        onTap: () => context.pushNamed(
          'budget-detail',
          pathParameters: <String, String>{'id': budget.id},
        ),
      ),
    );
  }
}

class _BudgetTile extends StatelessWidget {
  const _BudgetTile({required this.budget, this.onTap});

  final Budget budget;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, UiTone tone) = switch (budget.status) {
      'ACTIVE' => ('Active', UiTone.success),
      'CLOSED' => ('Closed', UiTone.neutral),
      _ => ('Draft', UiTone.warning),
    };

    final double spentPct = budget.totalAmount > 0
        ? (budget.spentAmount / budget.totalAmount * 100).clamp(0, 100)
        : 0;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      budget.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    const SizedBox(height: Spacing.x0_5),
                    Text(
                      'FY ${budget.fiscalYear}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: t.textTertiary,
                        fontSize: TypeScale.xs,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: Spacing.x2),
              UiStatusBadge(label: statusLabel, tone: tone),
            ],
          ),
          const SizedBox(height: Spacing.x3),
          Row(
            children: <Widget>[
              Text(
                'Spent ${Formatters.currency(budget.spentAmount)}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
              const Spacer(),
              Text(
                'of ${Formatters.currency(budget.totalAmount)}',
                style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x1_5),
          ClipRRect(
            borderRadius: Radii.pill,
            child: LinearProgressIndicator(
              value: spentPct / 100,
              minHeight: 6,
              backgroundColor: t.bgSunken,
              valueColor: AlwaysStoppedAnimation<Color>(
                spentPct > 90 ? t.danger : t.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
