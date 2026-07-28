import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/ai.dart';
import '../providers/ai_providers.dart';

class AiPredictionListPage extends ConsumerStatefulWidget {
  const AiPredictionListPage({super.key});
  static const String routeName = 'ai-predictions';
  static const String routePath = '/ai/predictions';
  @override
  ConsumerState<AiPredictionListPage> createState() => _AiPredictionListPageState();
}

class _AiPredictionListPageState extends ConsumerState<AiPredictionListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    '-confidence': 'Highest confidence',
    'confidence': 'Lowest confidence',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiPredictionListControllerProvider);
    final controller = ref.read(aiPredictionListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Predictions'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value)))
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
                hintText: 'Search predictions',
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
                    : '${state.meta.total} prediction${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(AiPredictionListState state, AiPredictionListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<AiPrediction>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No predictions',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'AI predictions generated in UniERP will appear here.',
      itemBuilder: (_, AiPrediction pred, __) => _PredictionTile(
        prediction: pred,
        onTap: () {},
      ),
    );
  }
}

class _PredictionTile extends StatelessWidget {
  const _PredictionTile({required this.prediction, required this.onTap});
  final AiPrediction prediction;
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
                  child: Text(prediction.modelName ?? prediction.modelId ?? prediction.id,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                if (prediction.confidence != null)
                  UiStatusBadge(
                    label: '${(prediction.confidence! * 100).toStringAsFixed(0)}%',
                    tone: _confidenceTone(prediction.confidence!),
                  ),
              ]),
              const SizedBox(height: Spacing.x1),
              if (prediction.output != null)
                Text('${prediction.output}',
                    maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: t.textSecondary)),
              if (prediction.processingTime != null) ...[
                const SizedBox(height: Spacing.x1),
                Text('${prediction.processingTime!.toStringAsFixed(2)}s',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              ],
              if (prediction.createdAt != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(DateFormat.yMMMd().add_jm().format(prediction.createdAt!.toLocal()),
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  UiTone _confidenceTone(double confidence) => switch (confidence) {
        _ when confidence >= 0.8 => UiTone.success,
        _ when confidence >= 0.5 => UiTone.warning,
        _ => UiTone.danger,
      };
}
