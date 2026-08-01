import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/advanced_finance.dart';
import '../providers/advanced_finance_providers.dart';

class MultiCurrencyRateListPage extends ConsumerStatefulWidget {
  const MultiCurrencyRateListPage({super.key});
  static const String routeName = 'multi-currency-rates';
  static const String routePath = '/advanced-finance/currency-rates';
  @override
  ConsumerState<MultiCurrencyRateListPage> createState() => _MultiCurrencyRateListPageState();
}

class _MultiCurrencyRateListPageState extends ConsumerState<MultiCurrencyRateListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    '-rate': 'Highest rate',
    'rate': 'Lowest rate',
    'fromCurrency': 'From currency',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(multiCurrencyRateListControllerProvider);
    final controller = ref.read(multiCurrencyRateListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Currency Rates'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value),),)
                .toList(),
          ),
        ],
      ),
      body: Column(
        children: [
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by currency',
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
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} rate${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(MultiCurrencyRateListState state, MultiCurrencyRateListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<MultiCurrencyRate>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No currency rates',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Exchange rates configured in UniERP will appear here.',
      itemBuilder: (_, MultiCurrencyRate rate, __) => _RateTile(
        rate: rate,
      ),
    );
  }
}

class _RateTile extends StatelessWidget {
  const _RateTile({required this.rate});
  final MultiCurrencyRate rate;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(Spacing.x3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text('${rate.fromCurrency} / ${rate.toCurrency}',
                    style: Theme.of(context).textTheme.titleSmall,),
              ),
              UiStatusBadge(
                label: rate.source ?? 'MANUAL',
                tone: UiTone.info,
              ),
            ],),
            const SizedBox(height: Spacing.x1),
            Text(rate.rate.toStringAsFixed(6),
                style: Theme.of(context).textTheme.labelLarge,),
            if (rate.rateDate != null) ...[
              const SizedBox(height: Spacing.x1),
              Text(Formatters.date(rate.rateDate!),
                  style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs),),
            ],
          ],
        ),
      ),
    );
  }
}
