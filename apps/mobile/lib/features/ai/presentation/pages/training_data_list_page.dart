import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/ai.dart';
import '../providers/ai_providers.dart';

class AiTrainingDataListPage extends ConsumerStatefulWidget {
  const AiTrainingDataListPage({super.key});
  static const String routeName = 'ai-training-data';
  static const String routePath = '/ai/training';
  @override
  ConsumerState<AiTrainingDataListPage> createState() => _AiTrainingDataListPageState();
}

class _AiTrainingDataListPageState extends ConsumerState<AiTrainingDataListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiTrainingDataListControllerProvider);
    final controller = ref.read(aiTrainingDataListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Training Data'),
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
                hintText: 'Search datasets',
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
                    : '${state.meta.total} dataset${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(AiTrainingDataListState state, AiTrainingDataListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<AiTrainingData>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No training data',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Training datasets uploaded to UniERP will appear here.',
      itemBuilder: (_, AiTrainingData td, __) => _TrainingDataTile(
        data: td,
        onTap: () {},
      ),
    );
  }
}

class _TrainingDataTile extends StatelessWidget {
  const _TrainingDataTile({required this.data, required this.onTap});
  final AiTrainingData data;
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
                  child: Text(data.name,
                      style: Theme.of(context).textTheme.titleSmall,),
                ),
                UiStatusBadge(
                  label: data.status,
                  tone: _statusTone(data.status),
                ),
              ],),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                if (data.dataType != null)
                  Text(data.dataType!,
                      style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),),
                const SizedBox(width: Spacing.x2),
                Text('${data.recordsCount} records',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.sm),),
              ],),
              if (data.createdAt != null) ...[
                const SizedBox(height: Spacing.x1),
                Text(DateFormat.yMMMd().format(data.createdAt!.toLocal()),
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),),
              ],
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'COMPLETED' => UiTone.success,
        'PROCESSING' => UiTone.warning,
        'PENDING' => UiTone.info,
        'FAILED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
