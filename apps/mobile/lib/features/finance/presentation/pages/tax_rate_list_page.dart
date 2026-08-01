import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/finance.dart';
import '../providers/finance_providers.dart';

class TaxRateListPage extends ConsumerStatefulWidget {
  const TaxRateListPage({super.key});

  static const String routeName = 'tax-rates';
  static const String routePath = '/finance/tax-rates';

  @override
  ConsumerState<TaxRateListPage> createState() => _TaxRateListPageState();
}

class _TaxRateListPageState extends ConsumerState<TaxRateListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest',
    'name': 'Name (A–Z)',
    '-name': 'Name (Z–A)',
    'rate': 'Rate (asc)',
    '-rate': 'Rate (desc)',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final FinanceListState<TaxRate> state = ref.watch(taxRatesProvider);
    final TaxRatesController controller = ref.read(taxRatesProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tax Rates'),
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
                hintText: 'Search tax name',
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
                      : '${state.meta.total} tax rate${state.meta.total == 1 ? '' : 's'}',
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

  Widget _body(FinanceListState<TaxRate> state, TaxRatesController controller) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<TaxRate>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No tax rates found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Tax rates configured in UniERP will appear here.',
      itemBuilder: (BuildContext context, TaxRate tax, _) =>
          _TaxRateTile(
        taxRate: tax,
        onTap: () => context.pushNamed(
          'tax-rate-detail',
          pathParameters: <String, String>{'id': tax.id},
        ),
      ),
    );
  }
}

class _TaxRateTile extends StatelessWidget {
  const _TaxRateTile({required this.taxRate, this.onTap});

  final TaxRate taxRate;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Container(
            height: Spacing.x10,
            width: Spacing.x10,
            decoration: BoxDecoration(
              color: t.bgSunken,
              borderRadius: Radii.control,
            ),
            alignment: Alignment.center,
            child: Icon(
              Icons.percent_outlined,
              size: TypeScale.xl,
              color: t.textSecondary,
            ),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  taxRate.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  taxRate.type,
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
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              Text(
                '${taxRate.rate}%',
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: Spacing.x1),
              UiStatusBadge(
                label: taxRate.isActive ? 'Active' : 'Inactive',
                tone: taxRate.isActive ? UiTone.success : UiTone.neutral,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
