import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class DemandForecastListPage extends ConsumerStatefulWidget {
  const DemandForecastListPage({super.key});
  static const String routeName = 'demand-forecasts';
  static const String routePath = '/supply-chain/demand-forecast';
  @override
  ConsumerState<DemandForecastListPage> createState() => _DemandForecastListPageState();
}

class _DemandForecastListPageState extends ConsumerState<DemandForecastListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(demandForecastListControllerProvider);
    final controller = ref.read(demandForecastListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Demand Forecast'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} forecast${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(DemandForecastListState state, DemandForecastListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<DemandForecast>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No forecasts',
      emptyMessage: 'Demand forecasts generated in UniERP will appear here.',
      itemBuilder: (_, DemandForecast forecast, __) => _ForecastTile(forecast: forecast),
    );
  }
}

class _ForecastTile extends StatelessWidget {
  const _ForecastTile({required this.forecast});
  final DemandForecast forecast;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(Spacing.x3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(
                child: Text(forecast.productName,
                    style: Theme.of(context).textTheme.titleSmall),
              ),
              UiStatusBadge(
                label: forecast.period,
                tone: UiTone.info,
              ),
            ]),
            const SizedBox(height: Spacing.x1),
            Row(children: [
              Text('Forecast: ',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              Text('${forecast.forecastQuantity}',
                  style: TextStyle(fontWeight: TypeScale.semibold)),
              if (forecast.actualQuantity != null) ...<Widget>[
                const SizedBox(width: Spacing.x3),
                Text('Actual: ',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                Text('${forecast.actualQuantity}',
                    style: TextStyle(fontWeight: TypeScale.semibold)),
              ],
            ]),
            if (forecast.accuracy != null) ...<Widget>[
              const SizedBox(height: Spacing.x0_5),
              Text('Accuracy: ${(forecast.accuracy! * 100).toStringAsFixed(1)}%',
                  style: TextStyle(color: t.success, fontSize: TypeScale.xs)),
            ],
          ],
        ),
      ),
    );
  }
}
