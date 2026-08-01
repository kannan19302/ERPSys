import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/supply_chain.dart';
import '../providers/supply_chain_providers.dart';

class TrackingEventListPage extends ConsumerStatefulWidget {
  const TrackingEventListPage({this.shipmentId, super.key});
  static const String routeName = 'tracking-events';
  static const String routePath = '/supply-chain/tracking-events';
  final String? shipmentId;
  @override
  ConsumerState<TrackingEventListPage> createState() => _TrackingEventListPageState();
}

class _TrackingEventListPageState extends ConsumerState<TrackingEventListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(trackingEventListControllerProvider);
    final controller = ref.read(trackingEventListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Tracking Events')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(state.isLoading ? 'Loading...' : '${state.meta.total} event${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(TrackingEventListState state, TrackingEventListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<TrackingEvent>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No events',
      emptyMessage: 'Tracking events will appear here.',
      itemBuilder: (_, TrackingEvent event, __) => _EventTile(event: event),
    );
  }
}

class _EventTile extends StatelessWidget {
  const _EventTile({required this.event});
  final TrackingEvent event;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(Spacing.x3),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: Spacing.x4,
              width: Spacing.x4,
              decoration: BoxDecoration(
                color: t.infoLight,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.circle, size: Spacing.x2_5, color: t.info),
            ),
            const SizedBox(width: Spacing.x3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.status ?? 'Update',
                      style: Theme.of(context).textTheme.titleSmall,),
                  if (event.location != null) ...[
                    const SizedBox(height: Spacing.x0_5),
                    Text(event.location!,
                        style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),),
                  ],
                  if (event.description != null) ...[
                    const SizedBox(height: Spacing.x0_5),
                    Text(event.description!,
                        style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),),
                  ],
                  if (event.timestamp != null) ...[
                    const SizedBox(height: Spacing.x0_5),
                    Text(Formatters.dateTime(event.timestamp!),
                        style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}