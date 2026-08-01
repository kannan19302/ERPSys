import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/analytics.dart';
import '../providers/analytics_providers.dart';

class PipelineListPage extends ConsumerStatefulWidget {
  const PipelineListPage({super.key});
  static const String routeName = 'analytics-pipelines';
  static const String routePath = '/analytics/pipelines';
  @override
  ConsumerState<PipelineListPage> createState() => _PipelineListPageState();
}

class _PipelineListPageState extends ConsumerState<PipelineListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    '-totalValue': 'Highest value',
    'totalValue': 'Lowest value',
    'name': 'Name',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pipelineListControllerProvider);
    final controller = ref.read(pipelineListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pipelines'),
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
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search pipelines',
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
                    : '${state.meta.total} pipeline${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(PipelineListState state, PipelineListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<AnalyticsPipeline>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No pipelines',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Pipelines created in UniERP will appear here.',
      itemBuilder: (_, AnalyticsPipeline p, __) => _PipelineTile(
        pipeline: p,
        onTap: () {},
      ),
    );
  }
}

class _PipelineTile extends StatelessWidget {
  const _PipelineTile({required this.pipeline, required this.onTap});
  final AnalyticsPipeline pipeline;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(pipeline.name,
                      style: Theme.of(context).textTheme.titleSmall,),
                ),
                UiStatusBadge(
                  label: pipeline.status,
                  tone: _statusTone(pipeline.status),
                ),
              ],),
              const SizedBox(height: Spacing.x1),
              Text('\$${pipeline.totalValue.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.labelLarge,),
              const SizedBox(height: Spacing.x1),
              Text('${pipeline.stages.length} stage${pipeline.stages.length == 1 ? '' : 's'}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success,
        'INACTIVE' => UiTone.neutral,
        'ARCHIVED' => UiTone.neutral,
        _ => UiTone.neutral,
      };
}
