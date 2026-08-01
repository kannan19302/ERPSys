import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/advanced_hr.dart';
import '../providers/advanced_hr_providers.dart';

class LearningPathListPage extends ConsumerStatefulWidget {
  const LearningPathListPage({super.key});
  static const String routeName = 'learning-paths';
  static const String routePath = '/advanced-hr/learning-paths';
  @override
  ConsumerState<LearningPathListPage> createState() => _LearningPathListPageState();
}

class _LearningPathListPageState extends ConsumerState<LearningPathListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(learningPathListControllerProvider);
    final controller = ref.read(learningPathListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Learning Paths'),
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
                hintText: 'Search learning paths',
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
                    : '${state.meta.total} path${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(LearningPathListState state, LearningPathListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<LearningPath>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No learning paths',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Learning paths created in UniERP will appear here.',
      itemBuilder: (_, LearningPath path, __) => _PathTile(
        path: path,
      ),
    );
  }
}

class _PathTile extends StatelessWidget {
  const _PathTile({required this.path});
  final LearningPath path;

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
                child: Text(path.title,
                    style: Theme.of(context).textTheme.titleSmall,),
              ),
              UiStatusBadge(
                label: path.status,
                tone: path.status == 'ACTIVE' ? UiTone.success : UiTone.neutral,
              ),
            ],),
            const SizedBox(height: Spacing.x1),
            Text(path.category,
                style: TextStyle(color: t.textSecondary),),
            const SizedBox(height: Spacing.x1),
            Row(children: [
              Text('${path.estimatedHours}h',
                  style: Theme.of(context).textTheme.labelLarge,),
              const SizedBox(width: Spacing.x4),
              Text('${path.enrolledCount} enrolled',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),),
              const Spacer(),
              Text('${path.completionRate.toStringAsFixed(0)}% complete',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),),
            ],),
          ],
        ),
      ),
    );
  }
}
